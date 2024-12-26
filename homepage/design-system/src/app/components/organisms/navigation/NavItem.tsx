"use client";

import {
  CloseButton,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../../atoms/Icon";
import { NavLink } from "./NavLink";
import { NavLinkLogo } from "./NavLinkLogo";
import { NavItemProps } from "./types";

interface NavItemComponentProps {
  item: NavItemProps;
  className?: string;
}

export function NavItem({ item, className }: NavItemComponentProps) {
  const { href, icon, title, items, firstOnRight } = item;
  const path = usePathname();

  if (!items?.length) {
    if (item.icon) {
      return (
        <NavLinkLogo className="px-3" {...item}>
          <Icon name={item.icon} />
          <span className="sr-only">{title}</span>
        </NavLinkLogo>
      );
    }

    return (
      <NavLink
        className={clsx(
          className,
          "text-sm px-2 lg:px-4 py-3",
          firstOnRight && "ml-auto",
          path === href ? "text-black dark:text-white" : "",
        )}
        {...item}
      >
        {title}
      </NavLink>
    );
  }

  return (
    <Popover className={clsx("relative", className, firstOnRight && "ml-auto")}>
      <PopoverButton
        className={clsx(
          "flex items-center gap-1.5 text-sm px-2 lg:px-4 py-3 max-sm:w-full text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white transition-colors hover:transition-none focus-visible:outline-none",
          path === href ? "text-black dark:text-white" : "",
        )}
      >
        <span>{title}</span>
        <Icon name="chevronDown" size="xs" />
      </PopoverButton>

      <PopoverPanel
        transition
        className="absolute left-1/2 -translate-x-1/2 z-10 flex w-screen max-w-[24rem] mt-5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <div className="flex-auto overflow-hidden rounded-lg ring-1 ring-stone-300/60 bg-white/90 backdrop-blur-lg shadow-lg dark:ring-stone-800/50 dark:bg-stone-925/90">
          <div className="p-3 grid">
            {items.map(({ href, title, description, icon }) => (
              <CloseButton
                className="p-3 rounded-md flex gap-3 hover:bg-stone-100/80 dark:hover:bg-stone-900/80 transition-colors"
                href={href}
                aria-label={title}
                as={Link}
                key={href}
              >
                {icon && (
                  <Icon
                    className="stroke-blue dark:stroke-blue-500 shrink-0"
                    size="sm"
                    name={icon}
                  />
                )}
                <div className="grid gap-1.5 mt-px">
                  <p className="text-sm font-medium text-stone-900 dark:text-white">
                    {title}
                  </p>
                  <p className="text-sm leading-relaxed">{description}</p>
                </div>
              </CloseButton>
            ))}
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  );
}
