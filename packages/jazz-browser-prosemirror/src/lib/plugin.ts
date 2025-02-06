import { Account, CoRichText, CoRichTextDebug, Group } from "jazz-tools";
import { Node } from "prosemirror-model";
import { EditorState, Plugin, PluginKey, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { createMark, richTextToProsemirrorDoc } from "./document.js";

export const jazzPluginKey = new PluginKey("jazz");

// The update model is asymmetric, we can apply a CoRichText to a ProseMirror transaction, but we apply the ProseMirror document to CoRichText and let it work out what's changed
// This is because the CoRichText is a mutable object, and the ProseMirror transaction is an immutable object.
/*
 * Update cycle between ProseMirror and CoRichText:
 *
 *                 ┌─────────────────┐
 *                 │   ProseMirror   │
 *                 └────────┬────────┘
 *                          │
 *                     Transaction
 *                          │
 *                          ▼
 *                 ┌────────────────┐
 *                 │  CoRichText    │
 *                 └────────┬───────┘
 *                          │
 *                      Changes
 *                          │
 *                          ▼
 *                 ┌────────────────┐
 *                 │   ProseMirror  │
 *                 └────────────────┘
 *
 * 1. User makes edit in ProseMirror
 * 2. ProseMirror creates Transaction
 * 3. Transaction applied to CoRichText
 * 4. CoRichText emits changes
 * 5. Changes applied back to ProseMirror
 */

/**
 * Apply CoRichText to a ProseMirror transaction
 * Naively replaces the entire document content with the CoRichText content and marks
 * @param state - The current editor state
 * @param text - CoRichText to apply
 * @returns The transaction with the CoRichText applied
 */
export function applyRichTextToTransaction(
  state: EditorState,
  text: CoRichText,
): Transaction | undefined {
  // Convert CoRichText to ProseMirror doc (including marks)
  const doc = richTextToProsemirrorDoc(text);
  if (!doc) return;

  // Create transaction and replace entire document
  const tr = state.tr;

  // Replace the entire document with new content
  // This will preserve marks since they're part of the doc's content
  tr.replaceRangeWith(0, tr.doc.content.size, doc);

  return tr;
}

// /**
//  * Apply a ProseMirror transaction to a CoRichText
//  * @param tr - ProseMirror transaction
//  * @param text - CoRichText to apply
//  */
// export function applyDocumentToRichText(doc: Node, text: CoRichText) {
//   text?.text?.applyDiff(doc.textBetween(0, doc.content.size, "\n"));
//   text?.marks?.applyDiff([
//     Marks.Strong.create({
//       startAfter: text.posAfter(0)!,
//       startBefore: text.posBefore(0)!,
//       endAfter: text.posAfter(doc.content.size)!,
//       endBefore: text.posBefore(doc.content.size)!,
//       tag: "strong",
//     }),
//   ]);

//   console.log("text", JSON.parse(JSON.stringify(text)));
// }

/**
 * Extract marks from a ProseMirror node
 * @param node - The ProseMirror node to extract marks from
 * @returns The extracted marks
 */
export function extractMarksFromProsemirror(node: Node) {
  let fullText = "";
  const marks: {
    from: number;
    to: number;
    markType: string;
    attrs: Record<string, any>;
  }[] = [];
  let offset = 0;

  function traverse(node: Node) {
    if (node.type.name === "text" && node.text) {
      const text = node.text;
      fullText += text;

      node.marks?.forEach((mark) => {
        marks.push({
          from: offset,
          to: offset + text.length,
          markType: mark.type.name,
          attrs: mark.attrs || {},
        });
      });
      offset += text.length;
    } else if (node.content) {
      node.content.forEach(traverse);
    }
  }

  traverse(node);

  return { fullText, marks };
}

/**
 * Apply a ProseMirror document to a CoRichText
 * @param doc - The ProseMirror document to apply from
 * @param text - The CoRichText to apply to
 * @param owner - The owner of the CoRichText
 */
export function applyDocumentToRichText(
  doc: Node,
  text: CoRichText,
  owner: Account | Group,
) {
  // Extract text and marks from ProseMirror doc
  const { fullText, marks } = extractMarksFromProsemirror(doc);

  // Create Marks
  const marksToApply = marks
    .map((mark) => {
      return createMark(mark.markType, mark, owner);
    })
    .filter((mark) => mark !== null);

  // Apply the diffs
  text?.text?.applyDiff(fullText);
  text?.marks?.applyDiff(marksToApply);
}

/**
 * Create a ProseMirror plugin that applies a CoRichText to the editor
 * Updates CoRichText when ProseMirror document changes
 * Updates ProseMirror when CoRichText changes
 * @param text - The CoRichText to apply
 * @param owner - The owner of the CoRichText
 * @returns The ProseMirror plugin
 */
export function createJazzPlugin(
  text: CoRichText | undefined,
  owner: Account | Group,
) {
  let view: EditorView | undefined;
  let isUpdating = false;

  // Update ProseMirror when CoRichText changes
  text?.subscribe({ text: [], marks: [{}] }, (text) => {
    if (!view) return;
    isUpdating = true;
    const tr = applyRichTextToTransaction(view.state, text);
    if (tr) {
      view.dispatch(tr);
    }
    isUpdating = false;
  });

  return new Plugin({
    key: jazzPluginKey,

    // Initialize the plugin with ProseMirror view
    view(editorView) {
      view = editorView;
      return {
        destroy() {
          view = undefined;
        },
      };
    },

    state: {
      // Initialize the plugin with CoRichText
      init() {
        return {
          text,
        };
      },

      // Update CoRichText when ProseMirror document changes
      apply(tr, value) {
        if (tr.docChanged && !isUpdating && text) {
          applyDocumentToRichText(tr.doc, text, owner);
          CoRichTextDebug.log(text);
        }
        return value;
      },
    },
  });
}
