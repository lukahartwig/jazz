import { CoRichText, CoRichTextDebug, Group, Marks } from "jazz-tools";
import { createJazzTestAccount } from "jazz-tools/testing";
import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { describe, expect, it } from "vitest";
import {
  applyDocumentToRichText,
  applyRichTextToTransaction,
  extractMarksFromProsemirror,
} from "../lib/plugin.js";

const account = await createJazzTestAccount();
const group = Group.create({ owner: account });

describe("ProseMirror transform functions", () => {
  describe("applyRichTextToTransaction", () => {
    it("should create a transaction that updates the document content", () => {
      // Create initial state
      const state = EditorState.create({
        schema,
        doc: schema.node("doc", undefined, [
          schema.node("paragraph", undefined, [schema.text("Initial text")]),
        ]),
      });

      // Create CoRichText with new content
      const text = CoRichText.createFromPlainTextAndMark(
        "New content",
        Marks.Paragraph,
        {
          tag: "paragraph",
        },
        {
          owner: group,
        },
      );

      // Apply transformation
      const transaction = applyRichTextToTransaction(state, text);
      expect(transaction).toBeDefined();

      const newState = state.apply(transaction!);
      expect(newState.doc.textContent).toBe("New content");
    });
  });

  describe("applyDocumentToRichText", () => {
    it("should update CoRichText content based on document", () => {
      // Create document
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, [schema.text("Updated content")]),
      ]);

      // Create CoRichText
      const text = CoRichText.createFromPlainText("Initial content", {
        owner: group,
      });

      // Apply transformation
      applyDocumentToRichText(doc, text, group);

      expect(text.text?.toString()).toBe("Updated content");
    });

    it("should update CoRichText marks and text when document changes", () => {
      // Create document
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, [schema.text("Updated content")]),
      ]);

      // Create CoRichText
      const text = CoRichText.createFromPlainText("Initial content", {
        owner: group,
      });

      // Apply transformation
      applyDocumentToRichText(doc, text, group);

      CoRichTextDebug.log(text);

      expect(text.text?.toString()).toBe("Updated content");
      const resolvedMarks = text.resolveMarks();
      expect(resolvedMarks.length).toBe(1);
      const firstMark = resolvedMarks[0];
      expect(firstMark).toBeDefined();
      expect(firstMark!.sourceMark.tag).toBe("paragraph");
    });
  });

  describe.only("extractMarksFromProsemirror", () => {
    it("should extract marks from a ProseMirror node", () => {
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, [schema.text("Hello")]),
        schema.node("paragraph", null, [schema.text("World")]),
      ]);

      const { fullText, marks } = extractMarksFromProsemirror(doc);
      expect(fullText).toBe("Hello\nWorld");
      expect(marks.length).toBe(2);
      expect(marks[0]?.markType).toBe("paragraph");
      expect(marks[1]?.markType).toBe("paragraph");
    });
  });
});
