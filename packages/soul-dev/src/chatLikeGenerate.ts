import { TextStreamer, pipeline } from "@huggingface/transformers";
import {
  Account,
  CoValue,
  CoValueClass,
  ID,
  RefsToResolve,
  RefsToResolveStrict,
  activeAccountContext,
  subscribeToCoValue,
} from "jazz-tools";

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
