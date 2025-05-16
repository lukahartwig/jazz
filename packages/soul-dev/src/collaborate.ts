import { InferenceClient } from "@huggingface/inference";
import { RawCoID } from "cojson";
import {
  Account,
  CoList,
  CoMap,
  CoPlainText,
  CoValue,
  CoValueClass,
  Group,
  ID,
  RefsToResolve,
  RefsToResolveStrict,
  cojsonInternals,
  subscribeToCoValue,
} from "jazz-tools";

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
            .expectCoValueLoaded(fullId as RawCoID)
            .getCurrentContent() as any,
        );

        // console.log("list with new items", [...list, ...newItems]);
        list.applyDiff([
          ...list,
          ...newItems.map((itemInit: any) => deepCreate(itemInit)),
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
            .expectCoValueLoaded(fullId as RawCoID)
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

    return (Schema as typeof CoMap).create(
      createdInit,
      owner as Group | Account,
    );
  } else if (Schema === CoPlainText) {
    return (Schema as typeof CoPlainText).create(init.value, {
      owner: owner as Group | Account,
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
function register(value: CoMap | CoList | Account | Group | CoPlainText) {
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
      cojsonInternals.isAccountID(lastEditorID) &&
      (
        await Account.load(lastEditorID as unknown as ID<Account>, {
          resolve: { profile: true },
        })
      )?.profile.name;

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

  return value;
}
