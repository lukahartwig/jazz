"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function SideNavItem({
  href,
  children,
  className = "",
}: {
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  const classes = clsx(
    className,
    "py-1.5 px-2 rounded-md flex items-center  transition-colors",
  );
  const path = usePathname();

  if (href) {
    return (
      <Link
        href={href}
        className={clsx(
          classes,
          href && "hover:text-stone-900 dark:hover:text-stone-200",
          {
            "text-stone-900  bg-stone-100 dark:text-white": path === href,
          },
        )}
      >
        {children}
      </Link>
    );
  }

  return <p className={classes}>{children}</p>;
}
