"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "../../atoms/Icon";
import { SocialLinks } from "../SocialLinks";
import { NavLink } from "./NavLink";
import { NavLinkLogo } from "./NavLinkLogo";
import { NavItemProps, NavProps } from "./types";

function MobileNavItem({
  item,
  onClick,
}: { item: NavItemProps; onClick?: () => void }) {
  if (item.items) {
    return (
      <>
        {item.items.map((child) => (
          <MobileNavItem key={child.href} item={child} onClick={onClick} />
        ))}
      </>
    );
  }

  return (
    <NavLink
      className="py-2 px-1 text-stone-900 dark:text-white"
      href={item.href}
      onClick={onClick}
      newTab={item.newTab}
    >
      {item.title}
    </NavLink>
  );
}

interface MobileNavProps extends NavProps {
  className?: string;
}

export function MobileNav({
  className,
  mainLogo,
  items,
  socials,
  themeToggle: ThemeToggle,
  onNavOpen,
  onClose,
}: MobileNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      onNavOpen();
    } else {
      onClose();
    }
  }, [menuOpen]);

  return (
    <div className={clsx(className, "bg-white dark:bg-stone-950")}>
      <div className="flex items-center self-stretch dark:text-white border-b px-4">
        <NavLinkLogo prominent href="/" className="mr-auto">
          {mainLogo}
        </NavLinkLogo>
        <button
          className="flex gap-2 p-3 -mr-3 rounded-xl items-center text-stone-900 dark:text-white"
          onMouseDown={() => setMenuOpen((o) => !o)}
          aria-label="Open menu"
        >
          <Icon name="menu" size="lg" />
        </button>
      </div>
      <nav
        className={clsx(
          "border-b -mt-px transition-all overflow-hidden",
          menuOpen ? "max-h-screen duration-500" : "max-h-0 duration-800",
        )}
      >
        <div className="flex flex-col p-3">
          {items
            .filter((item) => !("icon" in item))
            .map((item, i) => (
              <MobileNavItem
                key={i}
                onClick={() => setMenuOpen(false)}
                item={item}
              />
            ))}
        </div>
        <div className="flex items-center justify-between px-5 pb-5">
          <SocialLinks className="gap-2" {...socials} />
          <ThemeToggle />
        </div>
      </nav>
    </div>
  );
}
