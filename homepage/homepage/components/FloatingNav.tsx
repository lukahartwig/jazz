"use client";

import { clsx } from "clsx";
import React, { useEffect, useState } from "react";

export const FloatingNav = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 500) {
        setVisible(currentScrollY < lastScrollY);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div
      style={{
        transition: "transform 0.2s, opacity 0.2s",
      }}
      className={clsx(
        className,
        "fixed top-0 left-0 right-0 z-[35] m-auto w-full",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-[-100px]",
      )}
    >
      {children}
    </div>
  );
};
