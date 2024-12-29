"use client";

import { Toc } from "@stefanprobst/rehype-extract-toc";
import { usePathname } from "next/navigation";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

export type NavigationState = "main" | "side" | "toc" | null;

interface NavigationContextType {
  activeMenu: NavigationState;
  setActiveMenu: Dispatch<SetStateAction<NavigationState>>;
  toc: Toc | null;
  setToc: Dispatch<SetStateAction<Toc | null>>;
}

export const NavigationContext = createContext<NavigationContextType>({
  activeMenu: null,
  setActiveMenu: () => {},
  toc: null,
  setToc: () => {},
});

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeMenu, setActiveMenu] = useState<NavigationState>(null);
  const [toc, setToc] = useState<Toc | null>(null);
  const pathname = usePathname();

  const isDocs = useMemo(
    () => pathname.startsWith("/docs") || pathname.startsWith("/api-reference"),
    [pathname],
  );

  return (
    <NavigationContext.Provider
      value={{ activeMenu, setActiveMenu, toc, setToc, isDocs }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
