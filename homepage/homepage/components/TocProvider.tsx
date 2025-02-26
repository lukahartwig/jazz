"use client";

import { TocContext } from "@/lib/TocContext";
import type { Toc } from "@stefanprobst/rehype-extract-toc";
import { useState } from "react";

export function TocProvider({ children }: { children: React.ReactNode }) {
  const [tocItems, setTocItems] = useState<Toc[0]["children"]>();

  return (
    <TocContext.Provider value={{ tocItems, setTocItems }}>
      {children}
    </TocContext.Provider>
  );
}
