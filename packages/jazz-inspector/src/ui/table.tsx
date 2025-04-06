import { styled } from "goober";

const StyledTable = styled("table")`
  width: 100%;
`;

const StyledThead = styled("thead")`
  text-align: left;
  border-bottom: 1px solid var(--j-border-color);
  background-color: var(--j-neutral-100);

  @media (prefers-color-scheme: dark) {
    background-color: var(--j-neutral-925);
  }
`;

const StyledTbody = styled("tbody")`
  tr {
    border-bottom: 1px solid var(--j-border-color);

    &:last-child {
      border-bottom: none;
    }
  }
`;

const StyledTh = styled("th")`
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  color: var(--j-text-color-strong);
`;

const StyledTd = styled("td")`
  padding: 0.5rem 0.75rem;
`;

export function Table({ children }: React.PropsWithChildren<{}>) {
  return <StyledTable>{children}</StyledTable>;
}

export function TableHead({ children }: React.PropsWithChildren<{}>) {
  return <StyledThead>{children}</StyledThead>;
}

export function TableBody({ children }: React.PropsWithChildren<{}>) {
  return <StyledTbody>{children}</StyledTbody>;
}

export function TableRow({ children }: React.PropsWithChildren<{}>) {
  return <tr>{children}</tr>;
}

export function TableHeader({ children }: React.PropsWithChildren<{}>) {
  return <StyledTh>{children}</StyledTh>;
}

export function TableCell({ children }: React.PropsWithChildren<{}>) {
  return <StyledTd>{children}</StyledTd>;
}
