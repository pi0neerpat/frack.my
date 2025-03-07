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
      {/* CSS for animations and gradients */}
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

        /* Gradient overlay for the transition effect */
        .underground-fade {
          background: linear-gradient(
            to bottom,
            transparent 0%,
            transparent 65%,
            rgba(5, 5, 9, 0.6) 80%,
            rgba(5, 5, 9, 0.9) 90%,
            rgba(5, 5, 9, 1) 100%
          );
          pointer-events: none;
        }

        /* App background gradient */
        body {
          background: linear-gradient(
            to bottom,
            #0a0a14 0%,
            #121225 40%,
            #141432 70%,
            #1a1a30 90%,
            #1e1e35 100%
          );
        }
      `}</style>

      {/* Page content container with top padding */}
      <div className="min-h-screen">
        {/* Background container */}
        <div className="relative">
          {/* Background Image with animation */}
          <div
            className="absolute inset-0 h-[90vh] w-full z-0"
            style={{
              backgroundImage: `url('/images/rig-background.png')`,
              backgroundSize: "120% auto",
              backgroundPosition: "center center",
              backgroundRepeat: "no-repeat",
              opacity: 0.7,
              filter: "brightness(0.85)",
              animation: "panBackground 60s ease-in-out infinite",
            }}
          />

          {/* Gradient overlay that creates the "going underground" effect */}
          <div className="absolute inset-0 h-[90vh] w-full z-0 underground-fade" />

          {/* Main content */}
          <div className="relative z-10 pt-20 flex flex-col items-center">
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
            <div className="w-full max-w-7xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-6">Available Fluids</h2>
              <DrillCarousel
                userDrills={[]}
                exampleDrills={exampleDrills}
                onShutdown={handleShutdown}
              />
            </div>
          </div>
        </div>

        {/* OilPool positioned to appear as if it's underground */}
        <div className="relative z-10 mt-10">
          <OilPool />
        </div>
      </div>
    </>
  );
}
