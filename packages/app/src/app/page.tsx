"use client";

import { RotatingText } from "@/components/hero/RotatingText";
import { OilPool } from "@/components/oil-pool/OilPool";
import { motion } from "framer-motion";
import { DrillCarousel } from "@/components/carousel/DrillCarousel";

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
      {/* CSS for background animation */}
      <style jsx global>{`
        @keyframes panBackground {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      <div className="relative min-h-[75vh] flex flex-col items-center pt-20">
        {/* Background Image with animation */}
        <div
          className="absolute inset-0 z-0 w-full h-full"
          style={{
            backgroundImage: `url('/images/rig-background.png')`,
            backgroundSize: "120% auto", // Slightly larger to allow room for movement
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.4,
            filter: "brightness(0.7)",
            animation: "panBackground 60s ease-in-out infinite", // 60 second animation cycle
          }}
        />

        {/* Content (with higher z-index to appear above the background) */}
        <div className="relative z-10 flex flex-col items-center w-full">
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

          {/* Original Drill Carousel */}
          <div className="w-full max-w-7xl mx-auto mb-8">
            <h2 className="text-3xl font-bold mb-6">Available Fluids</h2>
            <DrillCarousel
              userDrills={[]}
              exampleDrills={exampleDrills}
              onShutdown={handleShutdown}
            />
          </div>
        </div>
      </div>

      <OilPool />
    </>
  );
}
