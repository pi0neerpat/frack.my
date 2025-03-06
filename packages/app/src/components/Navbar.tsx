"use client";

import { ConnectButton } from "./ConnectButton";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const isFluidPath = pathname.startsWith("/fluids");

  return (
    <div className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="container h-[80px] mx-auto"
      >
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-bold text-purple-500 hover:text-purple-400 transition-colors"
              >
                Frack.My
              </motion.div>
            </Link>

            <Link
              href="/fluids"
              className={`text-sm font-medium transition-colors hover:text-purple-400 ${
                isFluidPath ? "text-purple-500" : "text-foreground"
              }`}
            >
              Fluids
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ConnectButton />
            <ThemeToggle />
          </div>
        </div>
      </motion.nav>
    </div>
  );
}
