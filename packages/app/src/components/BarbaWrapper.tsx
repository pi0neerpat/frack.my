"use client";

import { useEffect } from "react";
import barba from "@barba/core";

export function BarbaWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    barba.init({
      transitions: [
        {
          name: "opacity-transition",
          leave(data) {
            return new Promise((resolve) => {
              data.current.container.style.opacity = "0";
              setTimeout(resolve, 300);
            });
          },
          enter(data) {
            return new Promise((resolve) => {
              data.next.container.style.opacity = "1";
              setTimeout(resolve, 300);
            });
          },
        },
      ],
    });
  }, []);

  return <div data-barba="wrapper">{children}</div>;
}
