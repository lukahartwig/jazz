import React from "react";
import { Button } from "./button.js";
import { PageInfo } from "./types.js";

interface BreadcrumbsProps {
  path: PageInfo[];
  onBreadcrumbClick: (index: number) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  path,
  onBreadcrumbClick,
}) => {
  return (
    <div className="relative z-20 flex-1 flex gap-2 items-center">
      <Button variant="plain" onClick={() => onBreadcrumbClick(-1)}>
        Home
      </Button>
      {path.map((page, index) => {
        return (
          <span
            key={index}
            className={`inline-block ${index === 0 ? "pl-1" : "pl-0"} ${
              index === path.length - 1 ? "pr-1" : "pr-0"
            }`}
          >
            {index === 0 ? null : (
              <span className="text-blue-600/30">{" / "}</span>
            )}
            <Button variant="tertiary" onClick={() => onBreadcrumbClick(index)}>
              {index === 0 ? page.name || "Root" : page.name}
            </Button>
          </span>
        );
      })}
    </div>
  );
};
