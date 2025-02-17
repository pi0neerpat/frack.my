"use client";

import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Droplets, Menu } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Root Page" },
    { href: "/page1", label: "Page 1" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-1 basis-0">
            <Link
              href="/"
              className="text-xl font-semibold hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2 font-bold">
                <Droplets className="h-8 w-8 text-pink-500" />
                <span className="text-pink-500">Web3 Dapp Template</span>
              </div>
            </Link>
          </div>
          <div className="hidden md:flex flex-1 justify-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors px-4 py-2 mx-2"
              >
                {item.label}
                {pathname === item.href && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500"
                    layoutId="underline"
                    initial={false}
                  />
                )}
              </Link>
            ))}
          </div>
          <div className="flex-1 basis-0 flex justify-end items-center">
            <ThemeToggle />
            <div className="w-4" /> {/* Spacer */}
            <ConnectButton />
            <button
              className="ml-4 p-2 rounded-md md:hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
