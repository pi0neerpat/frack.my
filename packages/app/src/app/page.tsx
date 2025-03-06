"use client";

import { RotatingText } from "@/components/hero/RotatingText";
import { OilPool } from "@/components/oil-pool/OilPool";
import { DrillCarousel } from "@/components/carousel/DrillCarousel";
import { motion } from "framer-motion";

// User's active drills
const userDrills = [
  {
    id: "real-1",
    fluidId: "eth",
    amount: 3.2,
    yieldRate: 4.85,
    totalEarned: 234.56,
    startTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
    isActive: true,
  },
  {
    id: "real-2",
    fluidId: "wsteth",
    amount: 5.7,
    yieldRate: 5.12,
    totalEarned: 445.89,
    startTime: Date.now() - 5 * 24 * 60 * 60 * 1000,
    isActive: true,
  },
];

// Example drills that show possibilities
const exampleDrills = [
  {
    id: "example-1",
    fluidId: "reth",
    amount: 8.7,
    yieldRate: 4.92,
    totalEarned: 987.32,
    startTime: Date.now() - 14 * 24 * 60 * 60 * 1000,
    isActive: false,
  },
  {
    id: "example-2",
    fluidId: "btc",
    amount: 0.45,
    yieldRate: 3.85,
    totalEarned: 567.12,
    startTime: Date.now() - 10 * 24 * 60 * 60 * 1000,
    isActive: false,
  },
];

export default function Home() {
  const handleShutdown = (id: string) => {
    console.log("Shutting down drill:", id);
    // Implement shutdown logic
  };

  return (
    <>
      <div className="min-h-[75vh] flex flex-col items-center pt-20">
        <motion.h1
          className="text-6xl font-bold text-center mb-10 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Frack My <RotatingText />
        </motion.h1>

        <motion.p
          className="text-xl text-muted-foreground text-center max-w-[600px] mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Build your drill, collect the yield, and watch your USDC flow.
        </motion.p>

        <DrillCarousel
          userDrills={userDrills}
          exampleDrills={exampleDrills}
          onShutdown={handleShutdown}
        />
      </div>

      <OilPool />
    </>
  );
}
