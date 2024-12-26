"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  newTab?: boolean;
}

export function NavLink({
  href,
  className,
  children,
  onClick,
  newTab,
}: NavLinkProps) {
  const path = usePathname();

  return (
    <Link
      href={href}
      className={clsx(
        "text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white transition-colors hover:transition-none",
        className,
      )}
      onClick={onClick}
      target={newTab ? "_blank" : undefined}
    >
      {children}
      {newTab ? (
        <span className="inline-block text-stone-300 dark:text-stone-700 relative -top-0.5 -left-0.5 -mr-2">
          ⌝
        </span>
      ) : (
        ""
      )}
    </Link>
  );
}
