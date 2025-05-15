import { pipeline } from "@huggingface/transformers";
import {
  Account,
  CoValue,
  CoValueClass,
  ID,
  RefsToResolve,
  RefsToResolveStrict,
  subscribeToCoValue,
} from "jazz-tools";

import {
  AutoProcessor,
  AutoTokenizer,
  TextStreamer,
  WhisperForConditionalGeneration,
  full,
} from "@huggingface/transformers";
import { activeAccountContext } from "jazz-tools";

const localInstructPromise = pipeline(
  "text-generation",
  "onnx-community/Llama-3.2-1B-Instruct-q4f16",
  {
    // progress_callback: (progress) => {
    //   console.log(progress);
    // },
    device: "webgpu",
  },
);

export function chatLikeGenerate<
  I extends CoValue,
  R extends RefsToResolve<I>,
  O extends CoValue,
>(
  Schema: CoValueClass<I>,
  id: ID<CoValue>,
  options: {
    resolve: RefsToResolveStrict<I, R>;
    prompt: string;
    onResponseStart: (parent: I, response: string) => O;
    onResponseUpdate: (response: string, existing: O) => void;
    agentAccount: Account;
    mapToChat: (
      update: I,
    ) => { role: "user" | "assistant"; name?: string; content: string }[];
  },
) {
  let responding = false;

  return subscribeToCoValue(
    Schema,
    id,
    { resolve: options.resolve, loadAs: options.agentAccount },
    async (update) => {
      if (responding) {
        return;
      }

      responding = true;

      console.log("update", update, options.mapToChat(update));

      const localInstruct = await localInstructPromise;

      const t = performance.now();

      let containerValue: O | null;
      let text = "";

      const streamer = new TextStreamer(localInstruct.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (chunk) => {
          if (chunk === "NOOP") {
            console.log("noop");
            return;
          }

          text += chunk;

          const prevAccount = activeAccountContext.maybeGet();

          activeAccountContext.set(options.agentAccount);

          console.log("activeAccountContext", activeAccountContext.maybeGet());

          if (!containerValue) {
            // containerValue = true;
            console.log("start", text);
            containerValue = options.onResponseStart(update, text);
          } else {
            console.log("update", chunk);
            options.onResponseUpdate(text, containerValue);
          }

          activeAccountContext.set(prevAccount);
        },
      });

      const result = await localInstruct(
        [
          {
            role: "system",
            content: `You are a helpful assistant who reacts to the user the following app-specific prompt.
              If it seems like you already responded, no action is needed or the user hasn't said anything yet, just say NOOP and nothing else.
              APP-SPECIFIC PROMPT: ${options.prompt}`,
          },
          ...options.mapToChat(update),
        ],
        {
          max_new_tokens: 50,
          streamer,
        },
      );

      console.log("full result", result);

      const dt = performance.now() - t;

      console.log("dt", dt);

      setTimeout(() => {
        responding = false;
      }, 1000);
    },
  );
}

const whisperModel = "onnx-community/whisper-base"; //"onnx-community/whisper-base_timestamped"; //

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

const RECORD_MAX_NEW_TOKENS = 64;
const WHISPER_SAMPLING_RATE = 16_000;
const MAX_AUDIO_LENGTH = 30; // seconds
const MAX_SAMPLES = WHISPER_SAMPLING_RATE * MAX_AUDIO_LENGTH;

export async function record<C extends CoValue>({
  onNewChunk,
  onChunkEdited,
}: {
  onNewChunk: (text: string) => C;
  onChunkEdited: (newText: string, chunk: C) => void;
}) {
  const transcribeLocal = {
    model: await transcribeLocalPromise.model,
    tokenizer: await transcribeLocalPromise.tokenizer,
    processor: await transcribeLocalPromise.processor,
  };

  // Run model with dummy input to compile shaders
  await transcribeLocal.model.generate({
    input_features: full([1, 80, 3000], 0.0) as any,
    max_new_tokens: 1,
    language: "en",
  });

  let chunks: Uint8Array[] = [];

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

        const outputs = await transcribeLocal.model.generate({
          ...inputs,
          max_new_tokens: RECORD_MAX_NEW_TOKENS,
          language: "en",
          // return_timestamps: "word",
          // chunk_length_s: 30,
          streamer,
        });

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
