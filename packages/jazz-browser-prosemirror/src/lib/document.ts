import { Account, CoRichText, Group, TreeLeaf, TreeNode } from "jazz-tools";
import { Marks } from "jazz-tools";
import {
  Mark as ProsemirrorMark,
  Node as ProsemirrorNode,
} from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { MARK_TYPE_LOOKUP, NODE_TYPE_LOOKUP } from "./types.js";

export function createMark(
  markType: string,
  markData: any,
  owner: Account | Group,
) {
  const init = {
    tag: markType,
    startAfter: markData.from - 1,
    startBefore: markData.from,
    endAfter: markData.to,
    endBefore: markData.to + 1,
    ...markData.attrs,
  };

  switch (markType) {
    case "strong":
      return Marks.Strong.create(init, { owner });
    case "em":
      return Marks.Em.create(init, { owner });
    default:
      console.warn(`Unsupported mark type: ${markType}`);
      return null;
  }
}

// function resolveMark(mark: ProsemirrorMark): typeof Marks.Strong | typeof Marks.Em | typeof Marks.Paragraph {
//   switch (mark.type) {
//     case schema.marks.strong:
//       return Marks.Strong;
//     case schema.marks.em:
//       return Marks.Em;
//     case schema.marks.paragraph:
//       return Marks.Paragraph;
//     default:
//       throw new Error(`Unsupported mark type: ${mark.type}`);
//   }
// }

// function resolvedMarks(marks: ProsemirrorMark[]): ResolvedMark[] {
//   return marks.map((mark) => {
//     const resolvedMark = resolveMark(mark);

//     return {
//       startAfter: mark.,
//       startBefore: 0,
//       endAfter: 0,
//       endBefore: 0,
//       tag: resolvedMark.tag,
//   });
// };

// /**
//  * Extracts text content and marks from a ProseMirror document.
//  * Processes each paragraph node and its inline content, collecting text and mark information.
//  *
//  * @param prosemirrorDoc - The ProseMirror document node to process
//  * @returns An object containing the extracted text and an array of mark positions and types
//  */
// export function doTheBartThing(prosemirrorDoc: ProsemirrorNode) {
//   let fullText = "";
//   const marks: Mark[] = [];
//   let offset = 0;

//   prosemirrorDoc.content.forEach((node) => {
//     if (node.type.name === "paragraph") {
//       node.content.forEach((inlineNode) => {
//         if (inlineNode.isText) {
//           const text = inlineNode.text;
//           if (!text) {
//             throw new Error("Text is undefined");
//           }
//           fullText += text;

//           inlineNode.marks.forEach((mark) => {
//             marks.push({
//               startAfter: offset,
//               startBefore: offset,
//               endAfter: offset + text.length,
//               endBefore: offset + text.length,
//               tag: mark.type.name,
//               attrs: mark.attrs,
//             });
//           });
//           offset += text.length;
//         }
//       });
//       fullText += "\n"; // Add newline between paragraphs
//       offset += 1;
//     }
//   });

//   return { text: fullText, marks };
// }

// /**
//  * Recursively collects text and marks from a ProseMirror document node.
//  * Handles leaf nodes (plain text) and mark nodes (strong, em).
//  *
//  * @param node - Current node being processed
//  * @param currentText - Accumulated text from parent nodes
//  * @param currentMarks - Accumulated marks from parent nodes
//  * @returns An object containing the accumulated text and marks
//  */
// export function collectTextAndMarks(
//   node: ProsemirrorNode,
//   currentText: string,
//   currentMarks: ProsemirrorMark[] = [],
// ): { text: string; marks: ResolvedMark[] } {
//   if (node.type === "text") {
//     return { text: currentText + node.text, marks: currentMarks };
//   }

//   if (node.type === "paragraph") {
//     return node.children.reduce(
//       (acc, child) => {
//         return collectTextAndMarks(child, acc.text, acc.marks);
//       },
//       { text: "", marks: [] },
//     );
//   }

//   return { text: currentText, marks: currentMarks };
// }

/**
 * Recursively collects inline marks from a CoRichText tree node.
 * Handles leaf nodes (plain text) and mark nodes (strong, em).
 *
 * @param fullString - The complete document text
 * @param node - Current tree node being processed
 * @param currentMarks - Accumulated marks from parent nodes
 * @returns A ProseMirror text node with appropriate marks
 */
export function collectInlineMarks(
  fullString: string,
  node: TreeNode | TreeLeaf,
  currentMarks: ProsemirrorMark[],
): ProsemirrorNode {
  if (node.type === "leaf") {
    return schema.text(
      fullString.slice(node.start, node.end + 1), // +1 to include the end character as slice is end-exclusive and end is inclusive
      currentMarks,
    );
  } else {
    if (!node.children[0]) {
      throw new Error("Node children must be non-empty");
    }

    // Skip paragraph nodes in mark collection since they're handled at a higher level
    if (node.tag === "paragraph") {
      return collectInlineMarks(fullString, node.children[0], currentMarks);
    }

    if (!(node.tag in MARK_TYPE_LOOKUP)) {
      throw new Error(`Unsupported tag '${node.tag}'`);
    }

    const schemaMark = schema.mark(node.tag);
    const newMarks = currentMarks.concat(schemaMark);

    // If this node has multiple children, combine their text since they share the same marks
    if (node.children.length > 1) {
      const text = node.children
        .map((child) => fullString.slice(child.start, child.end + 1)) // +1 to include the end character as slice is end-exclusive and end is inclusive
        .join("");
      return schema.text(text, newMarks);
    }

    return collectInlineMarks(fullString, node.children[0], newMarks);
  }
}

/**
 * Converts a CoRichText document to a ProseMirror document node.
 * Currently supports basic inline marks (strong, em) within paragraphs.
 *
 * @param text - The CoRichText document to convert
 * @returns A ProseMirror document node, or undefined if conversion fails
 */
export function richTextToProsemirrorDoc(
  text: CoRichText,
): ProsemirrorNode | undefined {
  if (!text) {
    return;
  }

  const asString = text.toString();

  // Include both mark and node types in precedence list, with paragraph first
  const tagPrecedence = [
    ...Object.keys(NODE_TYPE_LOOKUP),
    ...Object.keys(MARK_TYPE_LOOKUP),
  ];

  const tree = text.toTree(tagPrecedence);

  // Process each child of the root node
  const content =
    asString.length === 0
      ? []
      : tree.children.map((child) => {
          if (child.type === "node" && child.tag === "paragraph") {
            // For paragraph nodes, process their children
            if (!child.children[0]) {
              throw new Error("Node children must be non-empty");
            }
            return collectInlineMarks(asString, child.children[0], []);
          }
          // For other nodes (marks), collect them recursively
          return collectInlineMarks(asString, child, []);
        });

  // Create the document with a single paragraph containing all content
  return schema.node("doc", {}, [schema.node("paragraph", {}, content)]);
}
