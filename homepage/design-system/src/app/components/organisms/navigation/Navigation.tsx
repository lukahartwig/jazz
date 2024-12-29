import { BackToTopButton } from "../BackToTopButton";
import { MobileNav } from "./MobileNav";
import { NavBar } from "./NavBar";
import { NavProps } from "./types";

export function Navigation(props: NavProps) {
  return (
    <>
      <MobileNav className="md:hidden" {...props} />
      <NavBar className="hidden md:flex" {...props} />
      <BackToTopButton />
    </>
  );
}
