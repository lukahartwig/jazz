"use client";

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
        transform: `translateY(${visible ? "0" : "-100px"})`,
        opacity: visible ? "1" : "0",
        transition: "transform 0.2s, opacity 0.2s",
        position: "fixed",
        top: "0",
        left: "0",
        right: "0",
        zIndex: 5000,
        margin: "0 auto",
        width: "100%",
      }}
      className={className}
    >
      {children}
    </div>
  );
};
