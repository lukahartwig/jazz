import { PopoverGroup } from "@headlessui/react";
import { clsx } from "clsx";
import { SocialLinks } from "../SocialLinks";
import { NavItem } from "./NavItem";
import { NavLinkLogo } from "./NavLinkLogo";
import { NavProps } from "./types";

interface NavBarProps extends NavProps {
  className?: string;
}

export function NavBar({
  className,
  mainLogo,
  items,
  cta,
  socials,
  themeToggle: ThemeToggle,
}: NavBarProps) {
  return (
    <nav
      className={clsx(
        "flex items-center px-4 border-b sticky top-0 z-50 bg-white dark:bg-stone-950",
        className,
      )}
    >
      <NavLinkLogo prominent href="/" className="mr-6">
        {mainLogo}
      </NavLinkLogo>
      <PopoverGroup className="flex items-center flex-auto">
        {items.map((item, i) => (
          <NavItem key={i} item={item} />
        ))}
      </PopoverGroup>
      {socials && <SocialLinks className="gap-2 mx-2" {...socials} />}
      <ThemeToggle className="ml-2" />
      {cta}
    </nav>
  );
}
