"use client";

import { ReactNode, createContext, useContext, useState } from "react";

export type NavigationState = "main" | "side" | "toc" | null;

interface NavigationContextType {
  activeMenu: NavigationState;
  setActiveMenu: (state: NavigationState) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeMenu, setActiveMenu] = useState<NavigationState>(null);

  return (
    <NavigationContext.Provider value={{ activeMenu, setActiveMenu }}>
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
