import { useAccount, useCoState } from "jazz-react";
import { ID } from "jazz-tools";
import { CoFeedEntry, co } from "jazz-tools";
import { useMemo, useState } from "react";
import { CursorFeed } from "../schema";
import { Cursor as CursorType } from "../types";
import { getColor } from "../utils/getColor.ts";
import { getName } from "../utils/getName";
import Canvas from "./Canvas";

const OLD_CURSOR_AGE_SECONDS = Number(
  import.meta.env.VITE_OLD_CURSOR_AGE_SECONDS,
);

export type SessionCursors = Array<{
  name: string;
  initial: string;
  color: string;
  age: number;
  entry: CoFeedEntry<co<CursorType>>;
  isCurrentSession: boolean;
}>;

function Avatar({
  initial,
  color,
  title,
}: { title?: string; initial: string; color: string }) {
  return (
    <span
      title={title}
      className="size-6 text-xs font-medium bg-white inline-flex items-center justify-center rounded-full border-2"
      style={{ color, borderColor: color }}
    >
      {initial}
    </span>
  );
}

/** A higher order component that wraps the canvas. */
function Container({ cursorFeedID }: { cursorFeedID: ID<CursorFeed> }) {
  const { me } = useAccount();
  const cursors = useCoState(CursorFeed, cursorFeedID, { resolve: true });
  const [showAllAvatars, setShowAllAvatars] = useState(false);

  const sessionCursors: SessionCursors = useMemo(
    () =>
      Object.values(cursors?.perSession ?? {})
        // remove stale cursors
        .filter(
          (entry) =>
            entry.tx.sessionID === me?.sessionID ||
            (OLD_CURSOR_AGE_SECONDS &&
              entry.madeAt <
                new Date(Date.now() - 1000 * OLD_CURSOR_AGE_SECONDS)),
        )
        // set names and colors
        .map((entry) => {
          const [name, initial] = getName(
            entry.by?.profile?.name,
            entry.tx.sessionID,
          );
          const color = getColor(entry.tx.sessionID);
          const age = new Date().getTime() - new Date(entry.madeAt).getTime();

          return {
            name,
            initial,
            color,
            age,
            entry,
            isCurrentSession: entry.tx.sessionID === me?.sessionID,
          };
        })
        .sort((a, b) => {
          if (a.entry.by?.isMe) return -1;
          if (b.entry.by?.isMe) return 1;
          return a.age - b.age;
        }),
    [cursors],
  );

  const sessionAvatars = useMemo(
    () => sessionCursors.slice(0, 5),
    [sessionCursors],
  );
  const hiddenSessionAvatars = useMemo(
    () => sessionCursors.slice(5),
    [sessionCursors],
  );

  return (
    <>
      <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow">
        <div className="flex items-center gap-1">
          {sessionAvatars.map(({ name, initial, color, entry }) => (
            <Avatar
              key={entry.tx.sessionID}
              title={name}
              initial={initial}
              color={color}
            />
          ))}

          {hiddenSessionAvatars.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAllAvatars(!showAllAvatars)}
              className="text-stone-500 bg-white px-2 rounded hover:bg-stone-100"
            >
              show {showAllAvatars ? "less" : "more"}
            </button>
          )}
        </div>

        {showAllAvatars && (
          <ul className="space-y-1 mt-2">
            {sessionCursors.map(({ name, initial, color, entry }) => (
              <li
                style={{ color }}
                key={entry.tx.sessionID}
                className="text-sm flex gap-1"
              >
                <Avatar
                  key={entry.tx.sessionID}
                  initial={initial}
                  color={color}
                />
                {name} {entry.by?.isMe ? "(you)" : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Canvas
        onCursorMove={(move) => {
          if (!(cursors && me)) return;

          cursors.push({
            position: {
              x: move.position.x,
              y: move.position.y,
            },
          });
        }}
        remoteCursors={Object.values(cursors?.perSession ?? {})}
        sessionCursors={sessionCursors}
        name={getName(me?.profile?.name, me?.sessionID)[0]}
      />
    </>
  );
}

export default Container;
