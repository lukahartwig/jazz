import { CoFeedEntry, co } from "jazz-tools";
import { CursorMoveEvent, useCanvas } from "../hooks/useCanvas";
import { Cursor as CursorType, ViewBox } from "../types";
import { centerOfBounds } from "../utils/centerOfBounds";
import { Boundary } from "./Boundary";
import { CanvasBackground } from "./CanvasBackground";
import { CanvasDemoContent } from "./CanvasDemoContent";
import { SessionCursors } from "./Container.tsx";
import { Cursor } from "./Cursor";

const DEBUG = import.meta.env.VITE_DEBUG === "true";

// For debugging purposes, we can set a fixed bounds
const debugBounds: ViewBox = {
  x: 320,
  y: 320,
  width: 640,
  height: 640,
};

interface CanvasProps {
  remoteCursors: CoFeedEntry<co<CursorType>>[];
  sessionCursors: SessionCursors;
  onCursorMove: (move: CursorMoveEvent) => void;
  name: string;
}

function Canvas({ sessionCursors, onCursorMove, name }: CanvasProps) {
  const {
    svgProps,
    isDragging,
    isMouseOver,
    mousePosition,
    bgPosition,
    dottedGridSize,
    viewBox,
  } = useCanvas({ onCursorMove });

  const bounds = DEBUG ? debugBounds : viewBox;
  const center = centerOfBounds(bounds);

  return (
    <svg width="100%" height="100%" {...svgProps}>
      <CanvasBackground
        bgPosition={bgPosition}
        dottedGridSize={dottedGridSize}
      />

      <CanvasDemoContent />
      {DEBUG && <Boundary bounds={bounds} />}

      {sessionCursors.map(
        ({ entry, isCurrentSession, name, age, color }) =>
          !isCurrentSession && (
            <Cursor
              key={entry.tx.sessionID}
              position={entry.value.position}
              color={color}
              isDragging={false}
              isRemote={true}
              name={name}
              age={age}
              centerOfBounds={center}
              bounds={bounds}
            />
          ),
      )}

      {isMouseOver ? (
        <Cursor
          position={mousePosition}
          color="#FF69B4"
          isDragging={isDragging}
          isRemote={false}
          name={name}
          centerOfBounds={center}
          bounds={bounds}
        />
      ) : null}
    </svg>
  );
}

export default Canvas;
