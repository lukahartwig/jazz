import { pipeline } from "@huggingface/transformers";
import {
  Account,
  CoList,
  CoMap,
  CoPlainText,
  CoValue,
  CoValueClass,
  ID,
  RefsToResolve,
  RefsToResolveStrict,
  subscribeToCoValue,
} from "jazz-tools";

import { InferenceClient } from "@huggingface/inference";
import {
  AutoProcessor,
  AutoTokenizer,
  TextStreamer,
  WhisperForConditionalGeneration,
  full,
} from "@huggingface/transformers";
import { activeAccountContext } from "jazz-tools";

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

export function collaborate<C extends CoValue, R extends RefsToResolve<C>>(
  Schema: CoValueClass<C>,
  id: ID<C>,
  options: {
    resolve: RefsToResolveStrict<C, R>;
    agentAccount: Account;
    prompt: string;
    apiKey: string;
  },
) {
  let responding = false;
  let timeout: NodeJS.Timeout | null = null;

  const client = new InferenceClient(options.apiKey, {
    billTo: "garden-co",
  });

  return subscribeToCoValue(
    Schema,
    id,
    { resolve: options.resolve, loadAs: options.agentAccount },
    async (update) => {
      if (responding) {
        return;
      }

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        doRespond(update);
      }, 100);
    },
  );

  async function doRespond(update: C) {
    if (responding) {
      return;
    }

    responding = true;

    const systemPrompt = `You're a helpful assistant who mutates app state using the provided tools and and app-specific prompt.
You can only respond using one of the provided tools to mutate the app state - do not directly respond to the user.

Even though the app state is given to you in the "user" message, only pay attention to the "createdBy" fields inside the app state.
The objects that you create yourself will have a createdBy field of "Agent" - also use this as your name when asked.
Any other full names refer to other users in the app.
Interpret the app-specific prompt in the context of the app state as such.
Important: You never have to specify the createdBy field in your response, this will be auto-populated.

Important: You cannot make up new VAL_ ids not seen in the app state supplied by the user, in newly created objects, use "VAL_NEW" as the id.
When applying tools to existing objects, use the existing VAL_ ids.

TOOLS (use by returning JSON conforming to this schema - make sure it's valid JSON!):
\`\`\`ts
{"tool": "push", "valID": string, "newItems": any[]}
| {"tool": "splice", "valID": string, "start": number, "deleteCount": number}
| {"tool": "doNothing", "reason": string}
\`\`\`

For example: \`{"tool": "push", "id": "VAL_13", "newItems": [{"count": 5, "color": "red"}]}\`

APP-SPECIFIC PROMPT: "${options.prompt}"
APP STATE SCHEMA:
\`\`\`ts
const Message = co.map({
  text: z.string();
});

const Chat = co.list(Message);

const AppState = Chat;
\`\`\`

USERS: ["Anselm"]

APP STATE: ${JSON.stringify(await toSimplifiedAppState(update), null, 2)}
`;

    const simplifiedAppState = JSON.stringify(
      await toSimplifiedAppState(update),
      null,
      2,
    );

    console.log("systemPrompt", systemPrompt);
    console.log("simplifiedAppState", simplifiedAppState);

    const chatCompletion = await client.chatCompletion({
      provider: "cerebras",
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
    });

    const message = chatCompletion.choices[0]?.message;

    console.log(message);

    if (message && message.content) {
      const parsedCall = JSON.parse(
        message.content.split(/(?={"tool)/).at(-1)!,
      );

      if (parsedCall.tool === "push") {
        const newItems = parsedCall.newItems;
        const shortId = parsedCall.valID;

        console.log(`push ${shortId}/${id} ${JSON.stringify(newItems)}`);

        const fullId = getFullId(shortId);

        const Schema = fullIdsToSchema.get(fullId);

        if (!Schema) {
          throw new Error(`Schema not found for ${fullId}`);
        }

        const list = (Schema as typeof CoList).fromRaw(
          options.agentAccount._raw.core.node
            .expectCoValueLoaded(fullId)
            .getCurrentContent() as any,
        );

        // console.log("list with new items", [...list, ...newItems]);

        list.applyDiff([
          ...list,
          ...newItems.map((itemInit) => deepCreate(itemInit)),
        ]);
      } else if (parsedCall.tool === "splice") {
        const shortId = parsedCall.valID;

        console.log(
          `splice ${shortId}/${id} ${parsedCall.start}/${parsedCall.deleteCount}`,
        );

        const fullId = getFullId(shortId);

        const Schema = fullIdsToSchema.get(fullId);

        if (!Schema) {
          throw new Error(`Schema not found for ${fullId}`);
        }

        const list = (Schema as typeof CoList).fromRaw(
          options.agentAccount._raw.core.node
            .expectCoValueLoaded(fullId)
            .getCurrentContent() as any,
        );

        list.splice(parsedCall.start, parsedCall.deleteCount);
      } else {
        console.warn("Invalid call", parsedCall);
      }
    }

    responding = false;
  }
}

function deepCreate(init: any): CoValue {
  const Schema = schemasByName.get(init.schema);

  if (!Schema) {
    throw new Error(`Schema not found for ${init.schema}`);
  }

  const ownerID = shortIdsToFullIds.get(init.owner.replace("GROUP_", "VAL_"));

  if (!ownerID) {
    throw new Error(`Owner not found for ${init.owner}`);
  }

  const owner = fullIdsToCoValue.get(ownerID);

  if (!owner) {
    throw new Error(`Owner not found for ${init.owner}`);
  }

  if (Schema.prototype instanceof CoMap) {
    const createdInit = Object.fromEntries(
      Object.entries(init.value).map(([key, value]) => [
        key,
        deepCreate(value),
      ]),
    );

    return (Schema as typeof CoMap).create(createdInit, owner);
  } else if (Schema === CoPlainText) {
    return (Schema as typeof CoPlainText).create(init.value, {
      owner,
    });
  } else {
    throw new Error(`Unsupported schema type for deepCreate: ${Schema.name}`);
  }
}

const fullIdsToShortIds = new Map<string, string>();
const fullIdsToSchema = new Map<
  string,
  CoValueClass & { fromRaw: (raw: any) => CoValue }
>();
const fullIdsToCoValue = new Map<string, CoValue>();
const schemasByName = new Map<
  string,
  CoValueClass & { fromRaw: (raw: any) => CoValue }
>();
const shortIdsToFullIds = new Map<string, string>();
let shortIdCounter = 0;

function register(value: CoMap | CoList) {
  fullIdsToSchema.set(
    value.id,
    value.constructor as CoValueClass & { fromRaw: (raw: any) => CoValue },
  );
  schemasByName.set(
    value.constructor.name,
    value.constructor as CoValueClass & { fromRaw: (raw: any) => CoValue },
  );
  fullIdsToCoValue.set(value.id, value);
  return getShortId(value.id);
}

function getShortId(fullId: string): string {
  if (fullIdsToShortIds.has(fullId)) {
    return fullIdsToShortIds.get(fullId)!;
  }

  const shortId = `VAL_${shortIdCounter++}`;

  fullIdsToShortIds.set(fullId, shortId);
  shortIdsToFullIds.set(shortId, fullId);
  return shortId;
}

function getFullId(shortId: string): string {
  return shortIdsToFullIds.get(shortId)!;
}

async function toSimplifiedAppState<C extends CoValue>(
  value: C,
  addIndex?: number,
): Promise<object> {
  if (value instanceof CoPlainText) {
    return {
      schema: value.constructor.name,
      id: register(value),
      value: value.toString(),
      owner: register(value._owner).replace("VAL_", "GROUP_"),
    };
  } else if (value instanceof CoList) {
    return {
      schema: value.constructor.name,
      id: register(value),
      items: await Promise.all(
        value.map((i, index) => toSimplifiedAppState(i, index)),
      ),
      owner: register(value._owner).replace("VAL_", "GROUP_"),
    };
  } else if (value instanceof CoMap) {
    const lastEditorID = value._raw.lastEditAt(
      Object.keys(value._edits)[0]!,
    )?.by;
    const lastEditorName =
      lastEditorID &&
      (await Account.load(lastEditorID, { resolve: { profile: true } }))
        ?.profile.name;

    return {
      schema: value.constructor.name,
      id: register(value),
      createdBy: lastEditorName,
      value: Object.fromEntries(
        await Promise.all(
          Object.entries(value).map(async ([key, value]) => [
            key,
            await toSimplifiedAppState(value),
          ]),
        ),
      ),
      owner: register(value._owner).replace("VAL_", "GROUP_"),
      ...(addIndex !== undefined ? { index: addIndex } : {}),
    };
  }

  return JSON.stringify(value);
}

const whisperModel = "onnx-community/whisper-base"; //"onnx-community/whisper-base_timestamped"; //

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
