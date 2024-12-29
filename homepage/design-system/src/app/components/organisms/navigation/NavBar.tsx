import { PopoverGroup } from "@headlessui/react";
import { clsx } from "clsx";
import { SocialLinks } from "../SocialLinks";
import { NavItem } from "./NavItem";
import { NavLinkLogo } from "./NavLinkLogo";
import { NavProps } from "./types";

export function NavBar({ className, mainLogo, items, cta, socials }: NavProps) {
  return (
    <nav
      className={clsx(
        "flex items-center gap-3 container sticky top-0 z-50 bg-white dark:bg-stone-950",
        className,
      )}
    >
      <NavLinkLogo prominent href="/">
        {mainLogo}
      </NavLinkLogo>
      <PopoverGroup className="flex items-center flex-auto gap-3">
        {items.map((item, i) => (
          <NavItem key={i} item={item} />
        ))}
      </PopoverGroup>
      {socials && <SocialLinks className="gap-2 mx-2" {...socials} />}
      {cta}
    </nav>
  );
}
