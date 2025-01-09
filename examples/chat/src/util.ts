// This is only for demo purposes for https://jazz.tools
// This is NOT needed to make the chat work

import { Chat } from "@/schema.ts";

/**
 * TODO25
 * check method chat.waitForSync()
 * @param chat
 */
export function onChatLoad(chat: Chat) {
  if (window.parent) {
    chat.waitForSync().then(() => {
      window.parent.postMessage(
        { type: "chat-load", id: "/chat/" + chat.id },
        "*",
      );
    });
  }
}

export const inIframe = window.self !== window.top;
