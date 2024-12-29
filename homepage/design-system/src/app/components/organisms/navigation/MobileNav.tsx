"use client";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
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

export function MobileNav({
  className,
  mainLogo,
  items,
  socials,
  themeToggle: ThemeToggle,
}: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)}>
        <DialogBackdrop
          transition
          className="fixed inset-0 top-[55.26px] z-40 bg-zinc-400/20 backdrop-blur-sm data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in dark:bg-black/40"
        />

        <div className="fixed left-0 w-full top-[55.26px] z-50 h-auto  overflow-y-auto">
          <DialogPanel
            transition
            className="p-3 bg-white dark:bg-stone-950 duration-200 data-[enter]:ease-out data-[leave]:ease-in data-[closed]:translate-y-[-100%]"
          >
            <div className="flex flex-col">
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
            <div className="flex items-center justify-between px-1 py-3">
              <SocialLinks className="gap-2" {...socials} />
              <ThemeToggle />
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
