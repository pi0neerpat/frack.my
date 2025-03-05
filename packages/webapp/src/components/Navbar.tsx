"use client";

import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Droplets, Menu } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { WalletConnect } from "./WalletConnect";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Root Page" },
    { href: "/page1", label: "Page 1" },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            Home
          </Link>
          <Link href="/pools" className="mr-6">
            Pools
          </Link>
          <Link href="/rewards" className="mr-6">
            Rewards
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
}
