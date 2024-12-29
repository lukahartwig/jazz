import { TableOfContents } from "@/components/docs/TableOfContents";
import { Toc } from "@stefanprobst/rehype-extract-toc";
import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";
import { NavDrawer } from "gcmp-design-system/src/app/components/organisms/navigation/NavDrawer";
import { useState } from "react";

export function DocsMobileNav({
  tableOfContents,
  children,
}: { tableOfContents?: Toc; children: React.ReactNode }) {
  const [active, setActive] = useState<"main" | "toc" | null>(null);

  return (
    <div className="md:hidden sticky top-0 z-30 w-full border-b bg-white dark:bg-stone-950">
      <div className="container px-0 flex justify-between text-stone-900 dark:text-white">
        <button
          type="button"
          className="py-3.5 px-3 inline-flex text-sm items-center gap-1"
          onClick={() => setActive("main")}
        >
          Menu <Icon size="xs" name="chevronRight" />
        </button>

        {tableOfContents && (
          <button
            type="button"
            className="py-3 px-4 mr-1"
            onClick={() => setActive("toc")}
          >
            <span className="sr-only">Table of contents</span>
            <Icon name="tableOfContents" size="sm" />
          </button>
        )}
      </div>

      <NavDrawer
        from="left"
        isOpen={active === "main"}
        onClose={() => setActive(null)}
        title="Documentation"
      >
        {children}
      </NavDrawer>

      <NavDrawer
        from="right"
        isOpen={active === "toc"}
        onClose={() => setActive(null)}
        title="Table of contents"
      >
        {tableOfContents && (
          <TableOfContents className="text-sm" items={tableOfContents} />
        )}
      </NavDrawer>
    </div>
  );
}
