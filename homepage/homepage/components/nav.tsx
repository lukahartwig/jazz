import { ThemeToggle } from "@/components/ThemeToggle";
import { socials } from "@/lib/socials";
import { useFramework } from "@/lib/use-framework";
import { JazzLogo } from "gcmp-design-system/src/app/components/atoms/logos/JazzLogo";
import { Nav } from "gcmp-design-system/src/app/components/organisms/Nav";
import { DocNav } from "./docs/nav";

export function JazzNav() {
  return (
    <Nav
      mainLogo={<JazzLogo className="w-24" />}
      themeToggle={ThemeToggle}
      items={[
        { title: "Jazz Cloud", href: "/cloud" },
        {
          title: "Docs",
          href: "/docs",
          items: [],
        },
        {
          title: "Examples",
          href: "/examples",
        },
        {
          title: "API ref",
          href: "/api-reference",
        },
        {
          title: "Built with Jazz",
          href: "/showcase",
        },
        {
          title: "Blog",
          href: "https://garden.co/news",
          firstOnRight: true,
          newTab: true,
        },
        {
          title: "Releases",
          href: "https://github.com/garden-co/jazz/releases",
          newTab: true,
        },
        {
          title: "Status",
          href: "/status",
        },
      ]}
      socials={socials}
      docNav={<DocNav className="block h-auto" />}
    />
  );
}
