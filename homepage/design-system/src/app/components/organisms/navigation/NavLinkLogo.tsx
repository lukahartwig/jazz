import clsx from "clsx";
import { ReactNode } from "react";
import { NavLink } from "./NavLink";

interface NavLinkLogoProps {
  href: string;
  className?: string;
  children: ReactNode;
  prominent?: boolean;
  onClick?: () => void;
  newTab?: boolean;
}

export function NavLinkLogo({
  href,
  className,
  children,
  prominent,
  onClick,
  newTab,
}: NavLinkLogoProps) {
  return (
    <NavLink
      href={href}
      className={clsx(
        "flex items-center py-3",
        prominent ? "text-black dark:text-white" : "",
        className,
      )}
      onClick={onClick}
      newTab={newTab}
    >
      {children}
    </NavLink>
  );
}
