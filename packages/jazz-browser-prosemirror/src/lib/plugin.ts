import { CoRichText } from "jazz-tools";
import { Plugin, PluginKey } from "prosemirror-state";
import { debugDoc } from "./utils/debug.js";

export const jazzPluginKey = new PluginKey("jazz");

export function createJazzPlugin(text: CoRichText | undefined) {
  console.log("creating plugin", text);

  return new Plugin({
    key: jazzPluginKey,

    state: {
      init() {
        return {
          text,
        };
      },
      apply(tr, value) {
        // Apply any changes from ProseMirror to Jazz
        if (tr.docChanged) {
          debugDoc(tr.doc, "After transaction");
        }
        return value;
      },
    },
  });
}
