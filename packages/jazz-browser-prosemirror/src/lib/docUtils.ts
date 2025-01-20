import { CoRichText, ResolvedMark } from "jazz-tools";
import { Mark, Node } from "prosemirror-model";

/**
 * Creates a visual tree representation of a ProseMirror document with position indexes
 * @param node The ProseMirror node to visualize
 * @param pos Current position in the document
 * @param depth Current indentation depth
 * @param isLast Whether this is the last child of its parent
 * @returns A tuple of [visualization string, next position]
 */
function visualizeDocWithPos(
  node: Node,
  pos: number = 0,
  depth: number = 0,
  isLast: boolean = true,
): [string, number] {
  const indent = "  ".repeat(depth);
  const prefix = depth === 0 ? "" : isLast ? "└─ " : "├─ ";

  // Calculate positions
  const startPos = pos;
  const endPos = pos + node.nodeSize;

  // Build the node representation
  let result = `${indent}${prefix}${node.type.name} (${startPos}:${endPos})`;

  // Add marks if present
  if (node.marks.length > 0) {
    const markStr = node.marks.map((mark: Mark) => mark.type.name).join(", ");
    result += ` [${markStr}]`;
  }

  // Add text content if it's a text node
  if (node.isText) {
    // Replace newlines with visible symbol
    const visibleText = (node.text || "").replace(/\n/g, "↵");
    result += `: "${visibleText}"`;
  }

  result += "\n";

  // Recursively process child nodes
  let currentPos = pos + 1; // Add 1 to account for the opening token
  const children = node.content.content;

  children.forEach((child: Node, index: number) => {
    const [childStr, nextPos] = visualizeDocWithPos(
      child,
      currentPos,
      depth + 1,
      index === children.length - 1,
    );
    result += childStr;
    currentPos = nextPos;
  });

  return [result, endPos];
}

/**
 * Creates a visual tree representation of a ProseMirror document with positions
 * @param node The ProseMirror node to visualize
 * @returns A string representation of the document tree
 */
export function visualizeDoc(node: Node): string {
  return visualizeDocWithPos(node)[0];
}

/**
 * Logs a visual representation of a ProseMirror document to the console
 * @param doc The ProseMirror document to visualize
 * @param label Optional label for the visualization
 */
export function debugDoc(doc: Node, label?: string): void {
  console.log(`\nDocument Structure${label ? ` (${label})` : ""}:`);
  console.log(visualizeDoc(doc));
}

/**
 * Creates a compact debug string for a position in the document
 * @param doc The ProseMirror document
 * @param pos The position to debug
 * @returns A string describing the position context
 */
export function debugPosition(doc: Node, pos: number): string {
  const resolvedPos = doc.resolve(pos);
  const parentNode = resolvedPos.parent;
  const parentOffset = resolvedPos.parentOffset;

  let context = "";
  if (parentNode.isText) {
    const text = parentNode.text || "";
    const start = Math.max(0, parentOffset - 10);
    const end = Math.min(text.length, parentOffset + 10);
    context = text.slice(start, end);
    if (start > 0) context = "..." + context;
    if (end < text.length) context = context + "...";
    context = `"${context}"`;
    const pointer = " ".repeat(start > 0 ? 13 : 10) + "^";
    context += `\n${pointer}`;
  }

  return `Position ${pos}: ${resolvedPos.depth} levels deep, offset ${parentOffset} in ${parentNode.type.name}\n${context}`;
}

/**
 * Creates a visual representation of a CoRichText instance
 * @param text The CoRichText instance to visualize
 * @returns A string representation showing text content and marks
 */
export function visualizeCoRichText(text: CoRichText): string {
  const content = text.toString();
  const marks = text.resolveMarks();

  // Create the text line with visible newlines
  const textLine = `Content: "${content.replace(/\n/g, "↵")}" (length: ${text.length})\n`;

  // Create mark visualization
  let markLines = "Marks:\n";
  if (marks.length === 0) {
    markLines += "  (no marks)\n";
  } else {
    marks.forEach((mark: ResolvedMark) => {
      const markRange = content.substring(mark.startBefore, mark.endAfter + 1);
      markLines += `  ${mark.sourceMark.tag} (${mark.startBefore}:${mark.endAfter}): "${markRange.replace(/\n/g, "↵")}"\n`;
    });
  }

  // Create a visual representation of marks coverage
  let coverageMap = "Coverage:\n";
  if (content.length > 0) {
    // Create number scale
    let scale = "  ";
    for (let i = 0; i < content.length; i++) {
      scale += i % 10 === 0 ? String(Math.floor(i / 10)) : " ";
    }
    coverageMap += scale + "\n  ";
    for (let i = 0; i < content.length; i++) {
      coverageMap += i % 10;
    }
    coverageMap += "\n  ";

    // Create text line with visible newlines
    for (let i = 0; i < content.length; i++) {
      coverageMap += content[i] === "\n" ? "↵" : content[i];
    }
    coverageMap += "\n";

    // Create mark coverage lines
    const markTypes = [...new Set(marks.map((m) => m.sourceMark.tag))];
    markTypes.forEach((tag) => {
      const relevantMarks = marks.filter((m) => m.sourceMark.tag === tag);
      coverageMap += `  `;
      for (let i = 0; i < content.length; i++) {
        const hasMarkAtPos = relevantMarks.some(
          (m) => i >= m.startBefore && i <= m.endAfter,
        );
        coverageMap += hasMarkAtPos ? "─" : " ";
      }
      coverageMap += ` ${tag}\n`;
    });
  }

  return `\n${textLine}\n${markLines}\n${coverageMap}`;
}

/**
 * Logs a visual representation of a CoRichText instance to the console
 * @param text The CoRichText instance to visualize
 * @param label Optional label for the visualization
 */
export function debugCoRichText(text: CoRichText, label?: string): void {
  console.log(
    `CoRichText Structure${label ? ` (${label})` : ""}:${visualizeCoRichText(text)}`,
  );
}
