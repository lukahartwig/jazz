import { useAccount } from "jazz-react";
import { CoFeedEntry, co } from "jazz-tools";
import { CursorMoveEvent, useCanvas } from "../hooks/useCanvas";
import { Cursor as CursorType } from "../types";
import { getColor } from "../utils/getColor";
import { getName } from "../utils/getName";
import { CanvasBackground } from "./CanvasBackground";
import { CanvasDemoContent } from "./CanvasDemoContent";
import { Cursor } from "./Cursor";

const OLD_CURSOR_AGE_SECONDS = Number(
  import.meta.env.VITE_OLD_CURSOR_AGE_SECONDS,
);

interface CanvasProps {
  remoteCursors: CoFeedEntry<co<CursorType>>[];
  onCursorMove: (move: CursorMoveEvent) => void;
  name: string;
}

function Canvas({ remoteCursors, onCursorMove, name }: CanvasProps) {
  const { me } = useAccount();

  const {
    svgProps,
    isDragging,
    isMouseOver,
    mousePosition,
    bgPosition,
    dottedGridSize,
  } = useCanvas({ onCursorMove });

  return (
    <svg width="100%" height="100%" {...svgProps}>
      <CanvasBackground
        bgPosition={bgPosition}
        dottedGridSize={dottedGridSize}
      />

      <CanvasDemoContent />

      {remoteCursors.map((entry) => {
        if (
          entry.tx.sessionID === me?.sessionID ||
          (OLD_CURSOR_AGE_SECONDS &&
            entry.madeAt < new Date(Date.now() - 1000 * OLD_CURSOR_AGE_SECONDS))
        ) {
          return null;
        }

        return (
          <Cursor
            key={entry.tx.sessionID}
            position={entry.value.position}
            color={getColor(entry.tx.sessionID)}
            isDragging={false}
            isRemote={true}
            name={getName(entry.by?.profile?.name, entry.tx.sessionID)}
          />
        );
      })}

      {isMouseOver ? (
        <Cursor
          position={mousePosition}
          color="#FF69B4"
          isDragging={isDragging}
          isRemote={false}
          name={name}
        />
      ) : null}
    </svg>
  );
}

export default Canvas;
