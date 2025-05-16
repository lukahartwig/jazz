import {
  AutoProcessor,
  AutoTokenizer,
  Tensor,
  TextStreamer,
  WhisperForConditionalGeneration,
  full,
} from "@huggingface/transformers";
import { CoValue } from "jazz-tools";

const whisperModel = "onnx-community/whisper-base"; //"onnx-community/whisper-base_timestamped"; //

const RECORD_MAX_NEW_TOKENS = 64;
const WHISPER_SAMPLING_RATE = 16000;
const MAX_AUDIO_LENGTH = 30; // seconds

const MAX_SAMPLES = WHISPER_SAMPLING_RATE * MAX_AUDIO_LENGTH;

export async function record<C extends CoValue>({
  onNewChunk,
  onChunkEdited,
}: {
  onNewChunk: (text: string) => C;
  onChunkEdited: (newText: string, chunk: C) => void;
}) {
  const transcribeLocalPromise = {
    model: WhisperForConditionalGeneration.from_pretrained(whisperModel, {
      dtype: {
        encoder_model: "fp32", // 'fp16' works too
        decoder_model_merged: "q4", // or 'fp32' ('fp16' is broken)
      },
      device: "webgpu",
      // progress_callback: (progress) => {
      //   console.log("progress", progress);
      // },
    }),
    tokenizer: AutoTokenizer.from_pretrained(whisperModel, {
      // progress_callback: (progress) => {
      //   console.log("progress", progress);
      // },
    }),
    processor: AutoProcessor.from_pretrained(whisperModel, {
      // progress_callback: (progress) => {
      //   console.log("progress", progress);
      // },
    }),
  };

  const transcribeLocal = {
    model: await transcribeLocalPromise.model,
    tokenizer: await transcribeLocalPromise.tokenizer,
    processor: await transcribeLocalPromise.processor,
  };

  // Run model with dummy input to compile shaders
  await transcribeLocal.model.generate({
    input_features: full([1, 80, 3000], 0.0),
    max_new_tokens: 1,
    language: "en",
  } as any);

  let chunks: Blob[] = [];

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    const recorder = new MediaRecorder(stream);
    const audioCtx = new AudioContext({ sampleRate: WHISPER_SAMPLING_RATE });

    recorder.addEventListener("dataavailable", async (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);

        recorder.requestData();
      } else {
        // Empty chunk received, so we request new data after a short timeout
        setTimeout(() => {
          recorder.requestData();
        }, 25);
      }
    });

    recorder.start();
    recorder.requestData();

    let lastChunkLength = 0;
    let lastOutputText = "";

    let createdPieces: { text: string; coValue: C }[] = [];

    function doTranscribe() {
      if (chunks.length === lastChunkLength) {
        setTimeout(doTranscribe, 100);
        return;
      }

      lastChunkLength = chunks.length;

      const blob = new Blob(chunks, { type: recorder.mimeType });

      const fileReader = new FileReader();

      fileReader.onloadend = async () => {
        const arrayBuffer = fileReader.result;
        if (!arrayBuffer) {
          throw new Error("No audio data array buffer");
        }
        if (typeof arrayBuffer === "string") {
          throw new Error("Audio data is a string");
        }
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        let audio = decoded.getChannelData(0);
        if (audio.length > MAX_SAMPLES) {
          // Get last MAX_SAMPLES
          audio = audio.slice(-MAX_SAMPLES);
        }

        const streamer = new TextStreamer(transcribeLocal.tokenizer, {
          skip_prompt: true,
          // skip_special_tokens: true,
          callback_function(arg0) {
            // console.log(arg0);
          },
        });

        const inputs = await transcribeLocal.processor(audio);

        const outputs = (await transcribeLocal.model.generate({
          ...inputs,
          max_new_tokens: RECORD_MAX_NEW_TOKENS,
          language: "en",
          // return_timestamps: "word",
          // chunk_length_s: 30,
          streamer,
        })) as Tensor;

        const outputText = transcribeLocal.tokenizer.batch_decode(outputs, {
          skip_special_tokens: true,
        });

        if (outputText.join("") !== lastOutputText) {
          lastOutputText = outputText.join("");

          const currentPieces = outputText
            .join("")
            .replaceAll(". ", ".\n")
            .replaceAll("? ", "?\n")
            .replaceAll("! ", "!\n")
            .split("\n")
            .map((l) => l.trim());
          // .join("")
          // .replaceAll("|><|", "|>\n<|")
          // .split("\n")
          // .map((l) => l.replace(/<\|\d+\.\d+\|>/g, "").trim());
          console.log(currentPieces);
          console.log(createdPieces);

          for (let i = 0; i < currentPieces.length; i++) {
            const alreadyCreated = createdPieces[i];
            if (!alreadyCreated) {
              createdPieces[i] = {
                text: currentPieces[i]!,
                coValue: onNewChunk(currentPieces[i]!),
              };
            } else {
              onChunkEdited(currentPieces[i]!, alreadyCreated.coValue);
              alreadyCreated.text = currentPieces[i]!;
            }
          }
        }

        setTimeout(doTranscribe, 25);
      };

      fileReader.readAsArrayBuffer(blob);
    }

    doTranscribe();
  });
}
