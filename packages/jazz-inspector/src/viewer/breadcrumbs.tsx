import React from "react";
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
    <div className="relative z-20 bg-indigo-400/10 backdrop-blur-sm rounded-lg inline-flex px-2 py-1 whitespace-pre transition-all items-center gap-1 min-h-[2.5rem]">
      <button
        onClick={() => onBreadcrumbClick(-1)}
        className="flex items-center justify-center p-1 rounded-sm transition-colors hover:bg-indigo-600/10"
        aria-label="Go to home"
      >
        Start
      </button>
      {path.map((page, index) => {
        return (
          <span
            key={index}
            className={`inline-block ${index === 0 ? "pl-1" : "pl-0"} ${
              index === path.length - 1 ? "pr-1" : "pr-0"
            }`}
          >
            {index === 0 ? null : (
              <span className="text-indigo-600/30">{" / "}</span>
            )}
            <button
              onClick={() => onBreadcrumbClick(index)}
              className="text-indigo-800 hover:underline"
              onMouseOver={(e) =>
                (e.currentTarget.style.textDecoration = "underline")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.textDecoration = "none")
              }
            >
              {index === 0 ? page.name || "Root" : page.name}
            </button>
          </span>
        );
      })}
    </div>
  );
};
