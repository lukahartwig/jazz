"use client";

import { useTocItems } from "@/lib/TocContext";
import type { Toc } from "@stefanprobst/rehype-extract-toc";
import { useEffect } from "react";

export function TocItemsSetter({
  items,
}: { items: Toc[0]["children"] | undefined }) {
  const { setTocItems } = useTocItems();

  useEffect(() => {
    setTocItems(items);
  }, [items, setTocItems]);

  return null;
}
