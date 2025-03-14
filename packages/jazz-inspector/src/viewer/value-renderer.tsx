import { CoID, JsonValue, LocalNode, RawCoValue } from "cojson";
import React, { useEffect, useState } from "react";
import { LinkIcon } from "../link-icon.js";
import {
  isBrowserImage,
  resolveCoValue,
  useResolvedCoValue,
} from "./use-resolve-covalue.js";

// Is there a chance we can pass the actual CoValue here?
export function ValueRenderer({
  json,
  compact,
  onCoIDClick,
}: {
  json: JsonValue | undefined;
  compact?: boolean;
  onCoIDClick?: (childNode: CoID<RawCoValue>) => void;
}) {
  if (typeof json === "undefined" || json === undefined) {
    return <span className="text-gray-400">undefined</span>;
  }

  if (json === null) {
    return <span className="text-gray-400">null</span>;
  }

  if (typeof json === "string" && json.startsWith("co_")) {
    const linkClasses = onCoIDClick
      ? "text-blue-500 cursor-pointer inline-flex gap-1 items-center"
      : "inline-flex gap-1 items-center";

    return (
      <span
        className={linkClasses}
        onClick={() => {
          onCoIDClick?.(json as CoID<RawCoValue>);
        }}
      >
        {json}
        {onCoIDClick && <LinkIcon />}
      </span>
    );
  }

  if (typeof json === "string") {
    return (
      <span className="text-teal-900 font-mono dark:text-teal-200">{json}</span>
    );
  }

  if (typeof json === "number") {
    return <span className="text-purple-500 dark:text-purple-200">{json}</span>;
  }

  if (typeof json === "boolean") {
    return (
      <span
        className={`inline-block py-0.5 px-1 rounded ${
          json ? "text-green-700 bg-green-50" : "text-amber-700 bg-amber-50"
        } font-mono`}
      >
        {json.toString()}
      </span>
    );
  }

  if (Array.isArray(json)) {
    return (
      <span title={JSON.stringify(json)}>
        Array <span className="text-gray-500">({json.length})</span>
      </span>
    );
  }

  if (typeof json === "object") {
    return (
      <span
        title={JSON.stringify(json, null, 2)}
        className="inline-block max-w-64 overflow-hidden text-ellipsis whitespace-nowrap"
      >
        {compact ? (
          <span>
            Object{" "}
            <span className="text-gray-500">({Object.keys(json).length})</span>
          </span>
        ) : (
          JSON.stringify(json, null, 2)
        )}
      </span>
    );
  }

  return <span>{String(json)}</span>;
}

export const CoMapPreview = ({
  coId,
  node,
  limit = 6,
}: {
  coId: CoID<RawCoValue>;
  node: LocalNode;
  limit?: number;
}) => {
  const { value, snapshot, type, extendedType } = useResolvedCoValue(
    coId,
    node,
  );

  if (!snapshot) {
    return (
      <div className="rounded bg-gray-100 animate-pulse whitespace-pre w-24">
        {" "}
      </div>
    );
  }

  if (snapshot === "unavailable" && !value) {
    return <div className="text-gray-500">Unavailable</div>;
  }

  if (extendedType === "image" && isBrowserImage(snapshot)) {
    return (
      <div>
        <img
          src={snapshot.placeholderDataURL}
          className="w-8 h-8 border-2 border-white shadow my-2"
        />
        <span className="text-gray-500 text-sm">
          {snapshot.originalSize[0]} x {snapshot.originalSize[1]}
        </span>
      </div>
    );
  }

  if (extendedType === "record") {
    return (
      <div>
        Record{" "}
        <span className="text-gray-500">({Object.keys(snapshot).length})</span>
      </div>
    );
  }

  if (type === "colist") {
    return (
      <div>
        List{" "}
        <span className="text-gray-500">
          ({(snapshot as unknown as []).length})
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[auto_1fr] gap-2">
        {Object.entries(snapshot)
          .slice(0, limit)
          .map(([key, value]) => (
            <React.Fragment key={key}>
              <span className="font-bold">{key}: </span>
              <span>
                <ValueRenderer json={value} />
              </span>
            </React.Fragment>
          ))}
      </div>
      {Object.entries(snapshot).length > limit && (
        <div className="text-left text-sm text-gray-500">
          {Object.entries(snapshot).length - limit} more
        </div>
      )}
    </div>
  );
};

export function AccountOrGroupPreview({
  coId,
  node,
  showId = false,
  onClick,
}: {
  coId: CoID<RawCoValue>;
  node: LocalNode;
  showId?: boolean;
  onClick?: (name?: string) => void;
}) {
  const { snapshot, extendedType } = useResolvedCoValue(coId, node);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (extendedType === "account") {
      resolveCoValue(
        (snapshot as unknown as { profile: CoID<RawCoValue> }).profile,
        node,
      ).then(({ snapshot }) => {
        if (
          typeof snapshot === "object" &&
          "name" in snapshot &&
          typeof snapshot.name === "string"
        ) {
          setName(snapshot.name);
        }
      });
    }
  }, [snapshot, node, extendedType]);

  if (!snapshot) return <span>Loading...</span>;
  if (extendedType !== "account" && extendedType !== "group") {
    return <span>CoID is not an account or group</span>;
  }

  const displayName = extendedType === "account" ? name || "Account" : "Group";
  const displayText = showId ? `${displayName} (${coId})` : displayName;

  const className = onClick
    ? "text-blue cursor-pointer underline dark:text-blue-400"
    : "text-gray-500";

  return (
    <span className={className} onClick={() => onClick?.(displayName)}>
      {displayText}
    </span>
  );
}
