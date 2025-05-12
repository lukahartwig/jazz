import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WasmCrypto } from "cojson/crypto/WasmCrypto";
import {
  Account,
  AnonymousJazzAgent,
  ID,
  createAnonymousJazzContext,
  createJazzContextFromExistingCredentials,
  randomSessionProvider,
} from "jazz-tools";
import { z } from "zod";

const accountID = process.env.JAZZ_ACCOUNT_ID;
const accountSecret = process.env.JAZZ_ACCOUNT_SECRET;

let accountContext: { agent: Account | AnonymousJazzAgent | undefined } = {
  agent: undefined,
};

async function setupAccountContext() {
  const crypto = await WasmCrypto.create();
  if (accountID && accountSecret) {
    // Owner mode: ensure the secret is the correct type (cast if necessary)
    const ctx = await createJazzContextFromExistingCredentials({
      credentials: {
        accountID: accountID as ID<Account>,
        secret: accountSecret as any, // Ensure this is the actual agent secret string
      },
      peersToLoadFrom: [], // TODO: Do we need to load peers?
      crypto,
      sessionProvider: randomSessionProvider,
    });
    accountContext.agent = ctx.account;
  } else {
    // Guest mode: use the proper guest context
    const guestCtx = await createAnonymousJazzContext({
      peersToLoadFrom: [],
      crypto,
    });
    accountContext.agent = guestCtx.agent;
  }
}

// Create server instance
const server = new McpServer({
  name: "jazz",
  version: "0.0.1",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "load-account",
  "Load a Jazz account",
  {
    accountID: z.string(),
  },
  async ({ accountID }) => {
    // Wait for context to be ready if not already
    if (!accountContext.agent) {
      await setupAccountContext();
    }
    let account;
    try {
      account = await Account.load(accountID as ID<Account>, {
        loadAs: accountContext.agent,
      });
      if (!account) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Account with ID ${accountID} not found or not accessible.`,
            },
          ],
        };
      }
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error loading account: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `Account loaded: ${JSON.stringify(account.toJSON())}`,
        },
      ],
    };
  },
);

async function main() {
  await setupAccountContext();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Jazz MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
