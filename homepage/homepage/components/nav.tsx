"use client";

import { FloatingNav } from "@/components/FloatingNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNavigation } from "@/components/docs/MobileNavigation";
import { useNavigation } from "@/components/navigation-context";
import { socials } from "@/lib/socials";
import { JazzLogo } from "gcmp-design-system/src/app/components/atoms/logos/JazzLogo";
import { Navigation } from "gcmp-design-system/src/app/components/organisms/navigation";
import React from "react";

export function JazzNav() {
  const { setActiveMenu, toc, isDocs } = useNavigation();

  return (
    <>
      <FloatingNav>
        <Navigation
          mainLogo={<JazzLogo className="w-20 md:w-24" />}
          themeToggle={ThemeToggle}
          items={[
            { title: "Jazz Cloud", href: "/cloud" },
            {
              title: "Documentation",
              href: "/docs",
              items: [
                {
                  icon: "docs",
                  title: "Documentation",
                  href: "/docs",
                  description:
                    "Get started with using Jazz by learning the core concepts, and going through guides.",
                },
                {
                  icon: "code",
                  title: "Example apps",
                  href: "/examples",
                  description:
                    "Demo and source code for example apps built with Jazz.",
                },
                {
                  icon: "package",
                  title: "API reference",
                  href: "/api-reference",
                  description:
                    "API references for packages like jazz-tools, jazz-react, and more.",
                },
              ],
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
          ]}
          socials={socials}
          onNavOpen={() => setActiveMenu("main")}
          onClose={() => setActiveMenu(null)}
        />
        {isDocs && <MobileNavigation tableOfContents={toc || undefined} />}
      </FloatingNav>
    </>
  );
}
