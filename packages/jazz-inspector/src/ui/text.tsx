import { styled } from "goober";
import React from "react";

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  muted?: boolean;
  strong?: boolean;
  small?: boolean;
  inline?: boolean;
}

const BaseText = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ muted, strong, small, inline, ...rest }, ref) => <p ref={ref} {...rest} />,
);

const StyledText = styled(BaseText)<TextProps>`
  ${(props) =>
    props.muted &&
    `
    color: var(--j-neutral-500);
  `}

  ${(props) =>
    props.strong &&
    `
    font-weight: 500;
    color: var(--j-text-color-strong);
  `}

  ${(props) =>
    props.small &&
    `
    font-size: 0.875rem;
  `}

  ${(props) =>
    props.inline &&
    `
    display: inline;
  `}
`;

export function Text({
  children,
  className,
  muted,
  strong,
  inline,
  small,
}: React.PropsWithChildren<{
  className?: string;
  muted?: boolean;
  strong?: boolean;
  inline?: boolean;
  small?: boolean;
}>) {
  return (
    <StyledText
      className={className}
      muted={muted}
      strong={strong}
      inline={inline}
      small={small}
    >
      {children}
    </StyledText>
  );
}
