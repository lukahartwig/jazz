import { CoID, LocalNode, RawCoValue } from "cojson";
import { JsonObject } from "cojson";
import { styled } from "goober";
import { ResolveIcon } from "./type-icon.js";
import { PageInfo, isCoId } from "./types.js";
import { CoMapPreview, ValueRenderer } from "./value-renderer.js";

import { Badge } from "../ui/badge.js";
import { Text } from "../ui/text.js";

const GridContainer = styled("div")`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1280px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const GridItem = styled(
  ({
    isCoId,
    ...rest
  }: { isCoId: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...rest} />
  ),
)`
  padding: 0.75rem;
  text-align: left;
  border-radius: var(--j-radius-lg);
  overflow: hidden;
  transition: background-color 0.2s;
  cursor: ${(props) => (props.isCoId ? "pointer" : "default")};

  ${(props) =>
    props.isCoId
      ? `
    border: 1px solid var(--j-border-color);
    box-shadow: var(--j-shadow-sm);
  `
      : `
    background-color: var(--j-foreground);
  `}
`;

const TitleContainer = styled("h3")`
  display: flex;
  justify-content: space-between;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--j-text-color-strong);
`;

const ContentContainer = styled("div")`
  margin-top: 0.5rem;
  font-size: 0.875rem;
`;

export function GridView({
  data,
  onNavigate,
  node,
}: {
  data: JsonObject;
  onNavigate: (pages: PageInfo[]) => void;
  node: LocalNode;
}) {
  const entries = Object.entries(data);

  return (
    <GridContainer>
      {entries.map(([key, child], childIndex) => (
        <GridItem
          key={childIndex}
          isCoId={isCoId(child)}
          onClick={() =>
            isCoId(child) &&
            onNavigate([{ coId: child as CoID<RawCoValue>, name: key }])
          }
        >
          <TitleContainer>
            {isCoId(child) ? (
              <>
                <Text strong>{key}</Text>
                <Badge>
                  <ResolveIcon coId={child as CoID<RawCoValue>} node={node} />
                </Badge>
              </>
            ) : (
              <Text strong>{key}</Text>
            )}
          </TitleContainer>
          <ContentContainer>
            {isCoId(child) ? (
              <CoMapPreview coId={child as CoID<RawCoValue>} node={node} />
            ) : (
              <ValueRenderer
                json={child}
                onCoIDClick={(coId) => {
                  onNavigate([{ coId, name: key }]);
                }}
              />
            )}
          </ContentContainer>
        </GridItem>
      ))}
    </GridContainer>
  );
}
