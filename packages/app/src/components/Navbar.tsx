"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { WalletConnect } from "@/components/WalletConnect";

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <a href="/" className="font-bold text-xl text-purple-400">
            Frack.My
          </a>
        </div>
        <div className="flex items-center gap-2">
          <WalletConnect />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
