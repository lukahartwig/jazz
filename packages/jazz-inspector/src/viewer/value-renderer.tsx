import { CoID, JsonValue, LocalNode, RawCoValue } from "cojson";
import { styled } from "goober";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button.js";
import { Icon } from "../ui/icon.js";
import { Text } from "../ui/text.js";
import {
  isBrowserImage,
  resolveCoValue,
  useResolvedCoValue,
} from "./use-resolve-covalue.js";

const UndefinedText = styled("span")`
  color: #a8a29e;
`;

const NullText = styled("span")`
  color: #a8a29e;
`;

const LinkContainer = styled("span")`
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
`;

const LinkButton = styled(Button)`
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
`;

const StringText = styled("span")`
  color: #166534;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  @media (prefers-color-scheme: dark) {
    color: #4ade80;
  }
`;

const NumberText = styled("span")`
  color: #6b21a8;
  @media (prefers-color-scheme: dark) {
    color: #c084fc;
  }
`;

const BooleanText = styled("span")<{ value: boolean }>`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  display: inline-block;
  padding: 0.125rem 0.25rem;
  border-radius: 0.125rem;
  ${(props) =>
    props.value
      ? `
    color: #166534;
    background-color: rgba(22, 101, 52, 0.05);
  `
      : `
    color: #92400e;
    background-color: rgba(245, 158, 11, 0.05);
  `}
`;

const ObjectContainer = styled("span")`
  display: inline-block;
  max-width: 16rem;
`;

const ObjectType = styled("span")`
  color: #57534e;
`;

const ObjectContent = styled("pre")`
  margin-top: 0.375rem;
  font-size: 0.875rem;
  white-space: pre-wrap;
`;

const ShowMoreButton = styled("button")`
  margin-top: 0.375rem;
  font-size: 0.875rem;
`;

const PreviewContainer = styled("div")`
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
`;

const PreviewGrid = styled("div")`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem;
`;

const PreviewMoreText = styled(Text)`
  text-align: left;
  margin-top: 0.5rem;
`;

const ImagePreviewContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const PreviewImage = styled("img")`
  width: 2rem;
  height: 2rem;
  border: 2px solid white;
  box-shadow: var(--j-shadow-sm);
  margin: 0.5rem 0;
`;

const ImageSizeText = styled(Text)`
  display: inline;
  font-size: 0.875rem;
`;

const RecordText = styled("div")`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ListText = styled("div")`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

// Is there a chance we can pass the actual CoValue here?
export function ValueRenderer({
  json,
  onCoIDClick,
}: {
  json: JsonValue | undefined;
  onCoIDClick?: (childNode: CoID<RawCoValue>) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (typeof json === "undefined" || json === undefined) {
    return <UndefinedText>undefined</UndefinedText>;
  }

  if (json === null) {
    return <NullText>null</NullText>;
  }

  if (typeof json === "string" && json.startsWith("co_")) {
    const content = (
      <>
        {json}
        {onCoIDClick && <Icon name="link" />}
      </>
    );

    if (onCoIDClick) {
      return (
        <LinkButton
          onClick={() => {
            onCoIDClick?.(json as CoID<RawCoValue>);
          }}
          variant="link"
        >
          {content}
        </LinkButton>
      );
    }

    return <LinkContainer>{content}</LinkContainer>;
  }

  if (typeof json === "string") {
    return <StringText>{json}</StringText>;
  }

  if (typeof json === "number") {
    return <NumberText>{json}</NumberText>;
  }

  if (typeof json === "boolean") {
    return <BooleanText value={json}>{json.toString()}</BooleanText>;
  }

  if (typeof json === "object") {
    return (
      <ObjectContainer title={JSON.stringify(json, null, 2)}>
        <ObjectType>
          {Array.isArray(json) ? <>Array ({json.length})</> : <>Object</>}
        </ObjectType>
        <ObjectContent>
          {isExpanded
            ? JSON.stringify(json, null, 2)
            : JSON.stringify(json, null, 2).split("\n").slice(0, 3).join("\n") +
              (Object.keys(json).length > 2 ? "\n..." : "")}
        </ObjectContent>
        <ShowMoreButton onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? "Show less" : "Show more"}
        </ShowMoreButton>
      </ObjectContainer>
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
      <div
        style={{
          borderRadius: "0.25rem",
          backgroundColor: "var(--j-foreground)",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          whiteSpace: "pre",
          width: "6rem",
        }}
      >
        {" "}
      </div>
    );
  }

  if (snapshot === "unavailable" && !value) {
    return (
      <Text inline muted>
        Unavailable
      </Text>
    );
  }

  if (extendedType === "image" && isBrowserImage(snapshot)) {
    return (
      <ImagePreviewContainer>
        <PreviewImage src={snapshot.placeholderDataURL} />
        <ImageSizeText inline small muted>
          {snapshot.originalSize[0]} x {snapshot.originalSize[1]}
        </ImageSizeText>
      </ImagePreviewContainer>
    );
  }

  if (extendedType === "record") {
    return (
      <RecordText>
        Record{" "}
        <Text inline muted>
          ({Object.keys(snapshot).length})
        </Text>
      </RecordText>
    );
  }

  if (type === "colist") {
    return (
      <ListText>
        List{" "}
        <Text inline muted>
          ({(snapshot as unknown as []).length})
        </Text>
      </ListText>
    );
  }

  return (
    <PreviewContainer>
      <PreviewGrid>
        {Object.entries(snapshot)
          .slice(0, limit)
          .map(([key, value]) => (
            <React.Fragment key={key}>
              <Text strong>{key}: </Text>
              <Text inline>
                <ValueRenderer json={value} />
              </Text>
            </React.Fragment>
          ))}
      </PreviewGrid>
      {Object.entries(snapshot).length > limit && (
        <PreviewMoreText muted small>
          {Object.entries(snapshot).length - limit} more
        </PreviewMoreText>
      )}
    </PreviewContainer>
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

  if (onClick) {
    return (
      <Button variant="link" onClick={() => onClick(displayName)}>
        {displayText}
      </Button>
    );
  }

  return (
    <Text muted inline>
      {displayText}
    </Text>
  );
}
