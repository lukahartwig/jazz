import { CoRichText, CoRichTextDebug, Group, Marks } from "jazz-tools";
import { createJazzTestAccount } from "jazz-tools/testing";
import { schema } from "prosemirror-schema-basic";
import {
  AllSelection,
  EditorState,
  NodeSelection,
  TextSelection,
} from "prosemirror-state";
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
      applyDocumentToRichText(doc, text);

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
      applyDocumentToRichText(doc, text);

      CoRichTextDebug.log(text);

      expect(text.text?.toString()).toBe("Updated content");
      const resolvedMarks = text.resolveMarks();
      expect(resolvedMarks.length).toBe(1);
      const firstMark = resolvedMarks[0];
      expect(firstMark).toBeDefined();
      expect(firstMark!.sourceMark.tag).toBe("paragraph");
    });
  });

  describe("extractMarksFromProsemirror", () => {
    it("should extract marks from a ProseMirror node", () => {
      // Create a document with actual marks (strong and em)
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, [
          schema.text("Hello", [schema.marks.strong.create()]),
        ]),
        schema.node("paragraph", null, [
          schema.text("World", [schema.marks.em.create()]),
        ]),
      ]);

      const { fullText, marks } = extractMarksFromProsemirror(doc);
      expect(fullText).toBe("Hello\nWorld");
      // Should have 2 paragraph marks and 2 text style marks
      expect(marks.length).toBe(4);

      // Check paragraph marks
      const paragraphMarks = marks.filter((m) => m.markType === "paragraph");
      expect(paragraphMarks.length).toBe(2);
      expect(paragraphMarks[0]!.from).toBe(0); // First paragraph starts at 0
      expect(paragraphMarks[0]!.to).toBe(5); // "Hello" length
      expect(paragraphMarks[1]!.from).toBe(6); // After newline
      expect(paragraphMarks[1]!.to).toBe(11); // End of "World"

      // Check text style marks
      const styleMarks = marks.filter((m) => m.markType !== "paragraph");
      expect(styleMarks.length).toBe(2);
      expect(styleMarks[0]!.markType).toBe("strong");
      expect(styleMarks[0]!.from).toBe(0);
      expect(styleMarks[0]!.to).toBe(5);
      expect(styleMarks[1]!.markType).toBe("em");
      expect(styleMarks[1]!.from).toBe(6);
      expect(styleMarks[1]!.to).toBe(11);
    });

    it("should handle explicit line breaks between paragraphs", () => {
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, [schema.text("First line")]),
        schema.node("paragraph", null, [schema.text("Second line")]),
        schema.node("paragraph", null, [schema.text("Third line")]),
      ]);

      const { fullText, marks } = extractMarksFromProsemirror(doc);
      expect(fullText).toBe("First line\nSecond line\nThird line");

      // Should have 3 paragraph marks
      const paragraphMarks = marks.filter((m) => m.markType === "paragraph");
      expect(paragraphMarks.length).toBe(3);

      // Verify paragraph positions accounting for newlines
      expect(paragraphMarks[0]!.from).toBe(0);
      expect(paragraphMarks[0]!.to).toBe(10); // "First line" length
      expect(paragraphMarks[1]!.from).toBe(11); // After first newline
      expect(paragraphMarks[1]!.to).toBe(22); // End of "Second line"
      expect(paragraphMarks[2]!.from).toBe(23); // After second newline
      expect(paragraphMarks[2]!.to).toBe(33); // End of "Third line"
    });

    it("should handle empty paragraphs", () => {
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, [
          schema.text("hello there! This seems to be working better? ni i"),
        ]),
        schema.node("paragraph", null, []), // empty paragraph
      ]);

      const { fullText, marks } = extractMarksFromProsemirror(doc);
      expect(fullText).toBe(
        "hello there! This seems to be working better? ni i\n",
      );

      // Should have 2 paragraph marks
      const paragraphMarks = marks.filter((m) => m.markType === "paragraph");
      expect(paragraphMarks.length).toBe(2);

      // First paragraph should cover the text content
      expect(paragraphMarks[0]!.from).toBe(0);
      expect(paragraphMarks[0]!.to).toBe(53);

      // Second paragraph should be empty but still have a mark
      expect(paragraphMarks[1]!.from).toBe(54); // After newline
      expect(paragraphMarks[1]!.to).toBe(54); // Empty paragraph, same position
    });

    it("should preserve newlines when typing after empty paragraphs", () => {
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, [schema.text("First paragraph")]),
        schema.node("paragraph", null, []), // empty paragraph
        schema.node("paragraph", null, [
          schema.text("Text after empty paragraph"),
        ]),
      ]);

      const { fullText, marks } = extractMarksFromProsemirror(doc);
      expect(fullText).toBe("First paragraph\n\nText after empty paragraph");

      // Should have 3 paragraph marks
      const paragraphMarks = marks.filter((m) => m.markType === "paragraph");
      expect(paragraphMarks.length).toBe(3);

      // First paragraph
      expect(paragraphMarks[0]!.from).toBe(0);
      expect(paragraphMarks[0]!.to).toBe(14); // "First paragraph" length

      // Empty paragraph - should maintain its own newline
      expect(paragraphMarks[1]!.from).toBe(15); // After first newline
      expect(paragraphMarks[1]!.to).toBe(15); // Empty paragraph

      // Third paragraph - should start after TWO newlines
      expect(paragraphMarks[2]!.from).toBe(16); // After both newlines
      expect(paragraphMarks[2]!.to).toBe(41); // End of final text
    });

    it("should preserve newlines when typing after them", () => {
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, [schema.text("First line")]),
        schema.node("paragraph", null, []), // empty paragraph
        schema.node("paragraph", null, [schema.text("typing more")]), // text after empty paragraph
      ]);

      const { fullText, marks } = extractMarksFromProsemirror(doc);
      expect(fullText).toBe("First line\n\ntyping more");

      // Should have 3 paragraph marks
      const paragraphMarks = marks.filter((m) => m.markType === "paragraph");
      expect(paragraphMarks.length).toBe(3);

      // First paragraph
      expect(paragraphMarks[0]!.from).toBe(0);
      expect(paragraphMarks[0]!.to).toBe(10); // "First line" length

      // Empty paragraph - should be zero-width but preserve its position
      expect(paragraphMarks[1]!.from).toBe(11); // After first newline
      expect(paragraphMarks[1]!.to).toBe(11); // Empty paragraph

      // Third paragraph - should start after both newlines
      expect(paragraphMarks[2]!.from).toBe(12); // After both newlines
      expect(paragraphMarks[2]!.to).toBe(23); // End of "typing more"
    });
  });

  describe.only("Selection", () => {
    it("should maintain text selection after transaction", () => {
      const state = EditorState.create({
        schema,
        doc: schema.node("doc", null, [
          schema.node("paragraph", null, [schema.text("Initial content")]),
        ]),
      });

      // Set initial selection at position 5 using TextSelection and apply it
      const selectionTr = state.tr.setSelection(
        TextSelection.create(state.doc, 5, 8), // Create a range selection from 5 to 8
      );
      const stateWithSelection = state.apply(selectionTr);

      // Create CoRichText with modified content
      const text = CoRichText.createFromPlainText("Modified content", {
        owner: group,
      });

      // Apply transformation
      const transaction = applyRichTextToTransaction(stateWithSelection, text);
      const newState = stateWithSelection.apply(transaction!);

      // Verify selection was properly mapped
      expect(newState.selection.from).toBe(5);
      expect(newState.selection.to).toBe(8);
      expect(newState.selection instanceof TextSelection).toBe(true);
    });

    it("should maintain node selection after transaction", () => {
      // Create a document with multiple paragraphs for node selection
      const state = EditorState.create({
        schema,
        doc: schema.node("doc", null, [
          schema.node("paragraph", null, [schema.text("First paragraph")]),
          schema.node("paragraph", null, [schema.text("Second paragraph")]),
        ]),
      });

      // Select the first paragraph node
      const pos = 1; // Position of the first paragraph
      const selectionTr = state.tr.setSelection(
        NodeSelection.create(state.doc, pos),
      );
      const stateWithSelection = state.apply(selectionTr);

      // Create CoRichText with modified content that preserves multiple paragraphs
      const text = CoRichText.createFromPlainTextAndMark(
        "New first paragraph\nNew second paragraph",
        Marks.Paragraph,
        { tag: "paragraph" },
        { owner: group },
      );

      // Apply transformation
      const transaction = applyRichTextToTransaction(stateWithSelection, text);
      const newState = stateWithSelection.apply(transaction!);

      // Verify selection was properly mapped
      expect(newState.selection.from).toBe(1);
      expect(newState.selection instanceof NodeSelection).toBe(true);
    });

    it("should maintain all selection after transaction", () => {
      const state = EditorState.create({
        schema,
        doc: schema.node("doc", null, [
          schema.node("paragraph", null, [schema.text("Initial content")]),
        ]),
      });

      // Create an AllSelection
      const selectionTr = state.tr.setSelection(new AllSelection(state.doc));
      const stateWithSelection = state.apply(selectionTr);

      // Create CoRichText with modified content
      const text = CoRichText.createFromPlainText("Modified content", {
        owner: group,
      });

      // Apply transformation
      const transaction = applyRichTextToTransaction(stateWithSelection, text);
      const newState = stateWithSelection.apply(transaction!);

      // Verify selection spans entire document
      expect(newState.selection.from).toBe(0);
      expect(newState.selection.to).toBe(newState.doc.content.size - 1);
      // AllSelection gets converted to TextSelection during transactions
      expect(newState.selection.$anchor.pos).toBe(0);
      expect(newState.selection.$head.pos).toBe(newState.doc.content.size - 1);
    });

    it("should maintain selection position through document changes", () => {
      // Create initial document state
      const initialState = EditorState.create({
        schema,
        doc: schema.node("doc", null, [
          schema.node("paragraph", null, [schema.text("Initial content")]),
        ]),
      });

      // Set initial selection at position 7 ("Initial content" has 15 chars)
      const tr = initialState.tr.setSelection(
        TextSelection.create(initialState.doc, 7),
      );
      const stateWithSelection = initialState.apply(tr);

      // Create transaction that modifies content
      const text = CoRichText.createFromPlainText("Modified content", {
        owner: group,
      });
      const newTr = applyRichTextToTransaction(stateWithSelection, text);

      // Apply and verify selection
      const newState = stateWithSelection.apply(newTr!);
      expect(newState.selection.from).toBe(7); // Position should map correctly
    });
  });
});
