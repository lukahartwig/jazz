import { SideNavHeader } from "@/components/SideNavHeader";
import { SideNavItem } from "@/components/SideNavItem";
import { Framework } from "@/lib/framework";
import { clsx } from "clsx";
import React from "react";

interface SideNavItem {
  name: string;
  href?: string;
  done?:
    | number
    | {
        [key in Framework]: number;
      };
  items?: SideNavItem[];
}
export function SideNav({
  items,
  children,
  footer,
  className,
}: {
  items: SideNavItem[];
  className?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className={clsx(className, "text-sm h-full pt-3 md:pt-8 flex flex-col gap-4 px-2")}>
      {children}

      <div className="flex-1 relative overflow-y-auto px-2 -mx-2">
        {items.map(({ name, href, items }) => (
          <React.Fragment key={name}>
            <SideNavHeader href={href}>{name}</SideNavHeader>
            {items &&
              items.map(({ name, href, items, done }) => (
                <ul key={name}>
                  <li>
                    <SideNavItem href={href}>
                      <span
                        className={
                          done === 0 ? "text-stone-400 dark:text-stone-600" : ""
                        }
                      >
                        {name}
                      </span>
                    </SideNavItem>
                  </li>

                  {items && items?.length > 0 && (
                    <ul className="pl-4">
                      {items.map(({ name, href }) => (
                        <li key={href}>
                          <SideNavItem href={href}>{name}</SideNavItem>
                        </li>
                      ))}
                    </ul>
                  )}
                </ul>
              ))}
          </React.Fragment>
        ))}

        {footer}

        <div
          aria-hidden
          className={clsx(
          "h-12 right-0 sticky bottom-0 left-0",
          "bg-gradient-to-t from-white  to-transparent",
            "dark:from-stone-950",
            "hidden md:block"
        )}/>
      </div>
    </div>
  );
}
