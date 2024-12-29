import { ComponentType, ReactNode } from "react";
import { SocialLinksProps } from "../SocialLinks";

export interface NavItemProps {
  href: string;
  icon?: string;
  title: string;
  firstOnRight?: boolean;
  newTab?: boolean;
  items?: NavItemProps[];
  description?: string;
}

export interface NavProps {
  mainLogo: ReactNode;
  items: NavItemProps[];
  cta?: ReactNode;
  socials?: SocialLinksProps;
  themeToggle: ComponentType<{ className?: string }>;
  className?: string;
}
