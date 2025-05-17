import {
  AutoProcessor,
  AutoTokenizer,
  Tensor,
  TextStreamer,
  WhisperForConditionalGeneration,
  full,
} from "@huggingface/transformers";
import { MicVAD } from "@ricky0123/vad-web";
import { CoValue } from "jazz-tools";

// Define types for the transcription status and controller
export type TranscriptionState =
  | "idle"
  | "loading"
  | "listening"
  | "processing"
  | "error"
  | "speech_detected";

export interface TranscriptionStatus {
  state: TranscriptionState;
  message: string;
  error?: any;
}

export interface TranscriptionController {
  stop: () => void;
  isListening: () => boolean;
}

const whisperModel = "onnx-community/whisper-base";

const RECORD_MAX_NEW_TOKENS = 64;
const WHISPER_SAMPLING_RATE = 16000;
const MAX_AUDIO_LENGTH = 30; // seconds - whisper's limit
const MAX_SAMPLES = WHISPER_SAMPLING_RATE * MAX_AUDIO_LENGTH;

// VAD configuration with sensitivity
const VAD_CONFIG = {
  positiveSpeechThreshold: 0.45, // Lower threshold to detect more speech
  minSpeechFrames: 2, // Fewer frames to confirm speech
  redemptionFrames: 15, // Wait longer before ending speech
  preSpeechPadFrames: 2, // Keep more audio before speech begins
};

// Configuration for deduplication
const SIMILARITY_THRESHOLD = 0.7;

// Simple helper for string similarity
function simpleSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  // Count matching characters
  let matches = 0;
  const maxLen = Math.max(a.length, b.length);
  const minLen = Math.min(a.length, b.length);

  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) matches++;
  }

  return matches / maxLen;
}

export async function record<C extends CoValue>({
  onNewChunk,
  onStatusChange,
}: {
  onNewChunk: (text: string) => C;
  onStatusChange?: (status: TranscriptionStatus) => void;
}): Promise<TranscriptionController> {
  // Start timer for logging elapsed time
  const startTime = Date.now();

  const getElapsedTime = () => {
    const elapsedMs = Date.now() - startTime;
    return (elapsedMs / 1000).toFixed(2);
  };

  // Helper function to update status
  const setStatus = (status: TranscriptionStatus) => {
    if (onStatusChange) onStatusChange(status);
  };

  console.log(`[DEBUG][TIME: 0.00s] Transcription started`);

  // Set initial status
  setStatus({ state: "loading", message: "Loading models..." });

  // Load Whisper model, tokenizer, and processor
  const transcribeLocalPromise = {
    model: WhisperForConditionalGeneration.from_pretrained(whisperModel, {
      dtype: {
        encoder_model: "fp32",
        decoder_model_merged: "q4",
      },
      device: "webgpu",
    }),
    tokenizer: AutoTokenizer.from_pretrained(whisperModel, {}),
    processor: AutoProcessor.from_pretrained(whisperModel, {}),
  };

  const transcribeLocal = {
    model: await transcribeLocalPromise.model,
    tokenizer: await transcribeLocalPromise.tokenizer,
    processor: await transcribeLocalPromise.processor,
  };

  console.log(`[DEBUG][TIME: ${getElapsedTime()}s] Models loaded`);

  // Run model with dummy input to compile shaders
  await transcribeLocal.model.generate({
    input_features: full([1, 80, 3000], 0.0),
    max_new_tokens: 1,
    language: "en",
  } as any);

  console.log(`[DEBUG][TIME: ${getElapsedTime()}s] Shaders compiled`);

  let longSpeechBuffer: Float32Array | null = null;
  let isProcessingLongSpeech = false;
  let createdPieces: { text: string; coValue: C }[] = [];

  // Function to process audio with Whisper
  async function processAudioWithWhisper(audioData: Float32Array) {
    console.log(
      `[DEBUG][TIME: ${getElapsedTime()}s] Processing audio segment of ${audioData.length / WHISPER_SAMPLING_RATE}s`,
    );

    // Update status to processing
    setStatus({ state: "processing", message: "Transcribing speech..." });

    // Check if audio is longer than Whisper's limit
    if (audioData.length > MAX_SAMPLES) {
      // Process in chunks with overlap
      console.log(
        `[DEBUG][TIME: ${getElapsedTime()}s] Long speech detected (${audioData.length / WHISPER_SAMPLING_RATE}s), chunking`,
      );

      // Store in buffer for long speech processing
      longSpeechBuffer = audioData;
      processLongSpeech();
      return;
    }

    // Process the audio segment
    const processingStartTime = Date.now();

    try {
      // Process the audio chunk
      const inputs = await transcribeLocal.processor(audioData);

      // Disable streamer output to reduce console noise
      const streamer = new TextStreamer(transcribeLocal.tokenizer, {
        skip_prompt: true,
        callback_function: () => {},
      });

      // Generate with timestamps
      const outputs = (await transcribeLocal.model.generate({
        ...inputs,
        max_new_tokens: RECORD_MAX_NEW_TOKENS,
        language: "en",
        return_timestamps: true,
        streamer,
      })) as Tensor;

      const processingTime = (Date.now() - processingStartTime) / 1000;

      console.log(
        `[DEBUG][TIME: ${getElapsedTime()}s] Model inference completed in ${processingTime.toFixed(2)}s`,
      );

      const outputText = transcribeLocal.tokenizer.batch_decode(outputs, {
        skip_special_tokens: true,
      });

      // Process the transcription
      const transcription = outputText.join("").trim();

      console.log(
        `[DEBUG][TIME: ${getElapsedTime()}s] Raw transcription: "${transcription}"`,
      );

      if (transcription) {
        processTranscription(transcription);
      }

      // Set status back to listening after processing is complete
      if (isActive && vadInstance) {
        setStatus({ state: "listening", message: "Listening..." });
      }
    } catch (error) {
      console.error(`[ERROR][TIME: ${getElapsedTime()}s]`, error);
      setStatus({
        state: "error",
        message: "Error transcribing speech",
        error,
      });
    }
  }

  // Clean timestamps and extract segments
  function cleanTranscription(transcription: string): string[] {
    // Remove all timestamp markers
    const cleanText = transcription.replace(/<\|\d+\.\d+\|>/g, "");

    console.log(
      `[DEBUG][TIME: ${getElapsedTime()}s] Clean text: "${cleanText}"`,
    );

    // Split into sentences
    return cleanText
      .replaceAll(". ", ".\n")
      .replaceAll("? ", "?\n")
      .replaceAll("! ", "!\n")
      .split("\n")
      .map((l) => l.trim())
      .filter(
        (l) =>
          l.length > 0 &&
          !l.match(/^\(\w+\)$/) && // Remove sound effects like "(bells)"
          !l.match(/^\s*-\s*$/) && // Remove lone hyphens
          !l.match(/^[A-Za-z],\s*$/) && // Remove single letter sequences
          !l.match(/^[A-Za-z],\s*[A-Za-z],\s*$/), // Remove letter sequences like "A, B,"
      );
  }

  // Process transcription and extract new sentences
  function processTranscription(transcription: string) {
    if (!transcription) return;

    // Clean up the transcription and get proper segments
    const currentPieces = cleanTranscription(transcription);

    const newPieces: string[] = [];

    for (const piece of currentPieces) {
      newPieces.push(piece);
    }

    console.log(
      `[DEBUG][TIME: ${getElapsedTime()}s] New unique sentences: ${newPieces.length} of ${currentPieces.length}`,
    );

    if (newPieces.length > 0) {
      console.log(
        `[TIME: ${getElapsedTime()}s] New transcriptions:`,
        newPieces,
      );

      // Create CoValues only for new pieces
      for (const piece of newPieces) {
        createdPieces.push({
          text: piece,
          coValue: onNewChunk(piece),
        });
      }
    }
  }

  // Handle long speech that exceeds Whisper's limit
  async function processLongSpeech() {
    if (isProcessingLongSpeech || !longSpeechBuffer) return;

    isProcessingLongSpeech = true;
    const buffer = longSpeechBuffer;

    try {
      // Process chunks with overlap
      const totalChunks = Math.ceil(buffer.length / MAX_SAMPLES);

      console.log(
        `[DEBUG][TIME: ${getElapsedTime()}s] Processing long speech in ${totalChunks} chunks`,
      );

      // Process each 30-second chunk with 3-second overlap
      const overlapSamples = 3 * WHISPER_SAMPLING_RATE;

      for (let i = 0; i < totalChunks; i++) {
        const chunkStart = Math.max(
          0,
          i * MAX_SAMPLES - (i > 0 ? overlapSamples : 0),
        );
        const chunkEnd = Math.min(buffer.length, (i + 1) * MAX_SAMPLES);
        const chunk = buffer.slice(chunkStart, chunkEnd);

        console.log(
          `[DEBUG][TIME: ${getElapsedTime()}s] Processing chunk ${i + 1}/${totalChunks}: ${chunk.length / WHISPER_SAMPLING_RATE}s`,
        );

        // Process this chunk
        await processAudioWithWhisper(chunk);
      }
    } catch (error) {
      console.error(
        `[ERROR][TIME: ${getElapsedTime()}s] Error processing long speech:`,
        error,
      );
      setStatus({
        state: "error",
        message: "Error processing long speech",
        error,
      });
    } finally {
      isProcessingLongSpeech = false;
      longSpeechBuffer = null;
    }
  }

  // Control variables for the VAD
  let vadInstance: MicVAD | null = null;
  let isActive = true;

  // Initialize and start the VAD
  try {
    // First check microphone permissions
    setStatus({ state: "loading", message: "Requesting microphone access..." });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release immediately, VAD will request it again
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.error(
        `[ERROR][TIME: ${getElapsedTime()}s] Microphone permission error:`,
        error,
      );
      const errorMessage = (error as Error).toString().toLowerCase();
      if (
        errorMessage.includes("permission") ||
        errorMessage.includes("denied")
      ) {
        setStatus({
          state: "error",
          message:
            "Microphone access denied. Please allow microphone access in your browser settings.",
          error,
        });
      } else {
        setStatus({
          state: "error",
          message: "Failed to access microphone",
          error,
        });
      }
      throw error; // Re-throw to prevent further initialization
    }

    setStatus({
      state: "loading",
      message: "Initializing speech detection...",
    });

    const vad = await MicVAD.new({
      ...VAD_CONFIG,
      onSpeechStart: () => {
        console.log(`[DEBUG][TIME: ${getElapsedTime()}s] Speech started`);

        // Update status to indicate speech detected
        if (isActive && onStatusChange) {
          onStatusChange({
            state: "speech_detected",
            message: "Speech detected",
          });
        }
      },
      onSpeechEnd: async (audio) => {
        if (!isActive) return; // Don't process if we've stopped

        console.log(
          `[DEBUG][TIME: ${getElapsedTime()}s] Speech ended, length: ${audio.length / WHISPER_SAMPLING_RATE}s`,
        );

        // Update status back to listening
        if (onStatusChange) {
          onStatusChange({
            state: "processing",
            message: "Processing speech...",
          });
        }

        // Process the complete speech segment with Whisper
        await processAudioWithWhisper(audio);

        // After processing, if still active, go back to listening
        if (isActive && onStatusChange && vadInstance) {
          onStatusChange({
            state: "listening",
            message: "Listening...",
          });
        }
      },
      onVADMisfire: () => {
        console.log(
          `[DEBUG][TIME: ${getElapsedTime()}s] VAD misfire (false positive)`,
        );
      },
    });

    vadInstance = vad;

    console.log(`[DEBUG][TIME: ${getElapsedTime()}s] VAD initialized`);

    vad.start();
    setStatus({ state: "listening", message: "Listening..." });

    console.log(
      `[DEBUG][TIME: ${getElapsedTime()}s] VAD started, listening for speech`,
    );
  } catch (error) {
    console.error(
      `[ERROR][TIME: ${getElapsedTime()}s] Failed to initialize VAD:`,
      error,
    );
    if (!onStatusChange) {
      setStatus({
        state: "error",
        message: "Failed to initialize speech recognition",
        error,
      });
    }
    throw error;
  }

  // Return controller object for external control
  return {
    stop: () => {
      if (!isActive) return;
      isActive = false;

      if (vadInstance) {
        vadInstance.pause();
        vadInstance = null;
        setStatus({ state: "idle", message: "Recording stopped" });
      }
    },

    isListening: () => {
      return isActive && vadInstance !== null;
    },
  };
}
