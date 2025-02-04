import { CoRichText } from "jazz-tools";
import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { richTextToProsemirrorDoc } from "./document.js";
import { debugDoc } from "./utils/debug.js";

export const jazzPluginKey = new PluginKey("jazz");

export function createJazzPlugin(text: CoRichText | undefined) {
  let view: EditorView | undefined;
  let isUpdating = false;

  if (text) {
    text.subscribe({ text: [], marks: [{}] }, (text) => {
      if (!view || isUpdating) return;

      const doc = richTextToProsemirrorDoc(text);
      if (!doc) return;

      isUpdating = true;
      try {
        if (text.text.toString() !== view.state.doc.textContent) {
          const tr = view.state.tr.replaceWith(
            0,
            view.state.doc.content.size,
            doc.content,
          );
          view.dispatch(tr);
        }
      } finally {
        isUpdating = false;
      }
    });
  }

  return new Plugin({
    key: jazzPluginKey,

    view(editorView) {
      view = editorView;
      return {
        destroy() {
          view = undefined;
        },
      };
    },

    state: {
      init() {
        return {
          text,
        };
      },
      apply(tr, value) {
        if (
          tr.docChanged &&
          !isUpdating &&
          tr.doc.textContent !== text?.text?.toString()
        ) {
          debugDoc(tr.doc, "After transaction");
          console.log("doc changed extra", value);
          text?.text?.applyDiff(tr.doc.textContent);
        }
        return value;
      },
    },
  });
}
