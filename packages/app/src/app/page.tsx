"use client";

import { RotatingText } from "@/components/hero/RotatingText";
import { OilPool } from "@/components/oil-pool/OilPool";
import { motion } from "framer-motion";
import { DrillCarousel } from "@/components/carousel/DrillCarousel";
import { useState, useEffect, useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Loader2 } from "lucide-react";
import { YIELD_BOX_ABI, FRACKING_ADDRESS } from "@/config/contracts";
import { useFluids } from "@/context/fluids-context";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import Head from "next/head";

// Define the drill type
interface Drill {
  id: string;
  fluidId: string;
  amount: number;
  yieldRate: number;
  totalEarned: number;
  startTime: number;
  isActive: boolean;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [userDrills, setUserDrills] = useState<Drill[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const { fluids, loading: fluidsLoading } = useFluids();

  // Convert fluids to example drills
  const exampleDrills = useMemo(() => {
    // Get the list of fluid IDs the user is already drilling with
    const userDrillFluidIds = new Set(userDrills.map((drill) => drill.fluidId));

    // Filter out fluids the user is already drilling with
    return fluids
      .filter((fluid) => !userDrillFluidIds.has(fluid.id)) // Only include fluids not already being drilled
      .map((fluid, index) => ({
        id: `example-${fluid.id}`,
        fluidId: fluid.id,
        amount: 1 + Math.random() * 5, // Random amount between 1-6
        yieldRate: fluid.yieldRate,
        totalEarned: 100 + Math.random() * 900, // Random earnings
        startTime: Date.now() - (7 + index * 3) * 24 * 60 * 60 * 1000, // Staggered start times
        isActive: false,
      }));
  }, [fluids, userDrills]);

  // Get user's deposited assets
  const { data: userAssets, isLoading: isLoadingUserAssets } = useReadContract({
    address: FRACKING_ADDRESS,
    abi: YIELD_BOX_ABI,
    functionName: "userAssets",
    args: address ? [address] : undefined,
  });

  // Get user's deposit timestamp
  const { data: userDepositTimestamp, isLoading: isLoadingTimestamp } =
    useReadContract({
      address: FRACKING_ADDRESS,
      abi: YIELD_BOX_ABI,
      functionName: "userDepositTimestamp",
      args: address ? [address] : undefined,
    });

  // Process user's drill data
  useEffect(() => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }

    if (userAssets && userDepositTimestamp && fluids.length > 0) {
      // For now, we're assuming a single drill per user
      // In a real app, you would fetch all user drills

      // Find the first fluid with a non-zero balance
      const fluid = fluids[0]; // Default to first fluid if none found

      const depositAmount = parseFloat(formatUnits(userAssets, 18)); // Assuming 18 decimals

      if (depositAmount > 0) {
        // Calculate time active
        const depositTime = Number(userDepositTimestamp) * 1000; // Convert to milliseconds
        const now = Date.now();
        const diffTime = Math.abs(now - depositTime);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(
          (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );

        // Calculate earned yield (simplified for demo)
        const monthsSinceDeposit = diffTime / (1000 * 60 * 60 * 24 * 30);
        const monthlyYield = (depositAmount * fluid.yieldRate) / 100 / 12;
        const totalEarned = monthlyYield * monthsSinceDeposit;

        // Create drill object
        const drill: Drill = {
          id: `${fluid.id}-1`,
          fluidId: fluid.id,
          amount: depositAmount,
          yieldRate: fluid.yieldRate,
          totalEarned,
          startTime: depositTime,
          isActive: true,
        };

        setUserDrills([drill]);
      } else {
        setUserDrills([]);
      }

      setIsLoading(false);
    } else if (!isLoadingUserAssets && !isLoadingTimestamp && !fluidsLoading) {
      setIsLoading(false);
    }
  }, [
    isConnected,
    userAssets,
    userDepositTimestamp,
    isLoadingUserAssets,
    isLoadingTimestamp,
    fluids,
    fluidsLoading,
  ]);

  const handleShutdown = (id: string) => {
    console.log("Shutting down drill:", id);
    // Navigate to withdrawal page
    window.location.href = `/drills/${id}/withdraw`;
  };

  // Get unique asset types from all drills and fluids
  const assetTypes = useMemo(() => {
    const types = new Set<string>();

    // Add all fluid types
    fluids.forEach((fluid) => types.add(fluid.id));

    // Add user drill asset types (in case they have a type not in fluids)
    userDrills.forEach((drill) => types.add(drill.fluidId));

    return Array.from(types);
  }, [userDrills, fluids]);

  // Toggle asset selection
  const toggleAsset = (symbol: string) => {
    const newAssets = new Set(selectedAssets);
    if (newAssets.has(symbol)) {
      newAssets.delete(symbol);
    } else {
      newAssets.add(symbol);
    }
    setSelectedAssets(newAssets);
  };

  // Filter drills based on selected assets
  const filteredUserDrills = useMemo(() => {
    if (selectedAssets.size === 0) return userDrills;
    return userDrills.filter((drill) => selectedAssets.has(drill.fluidId));
  }, [userDrills, selectedAssets]);

  const filteredExampleDrills = useMemo(() => {
    if (selectedAssets.size === 0) return exampleDrills;
    return exampleDrills.filter((drill) => selectedAssets.has(drill.fluidId));
  }, [exampleDrills, selectedAssets]);

  return (
    <>
      {/* Preload background image to prevent layout shift */}
      <Head>
        <link
          rel="preload"
          href="/images/rig-background.png"
          as="image"
          type="image/png"
        />
      </Head>

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
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        /* Prevent background image layout shift */
        .bg-image-container {
          background-color: #0a0a14; /* Match initial background color */
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0;
        }

        /* Main content container */
        .content-container {
          position: relative;
          z-index: 10;
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}</style>

      {/* Background Image with animation - fixed to cover entire viewport */}
      <div
        className="bg-image-container"
        style={{
          backgroundImage: `url('/images/rig-background.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          opacity: 0.7,
          filter: "brightness(0.85)",
          animation: "panBackground 120s ease-in-out infinite", // Slowed down from 60s to 120s
        }}
      />

      {/* Gradient overlay that creates the "going underground" effect - fixed to cover viewport */}
      <div className="fixed inset-0 w-full h-full z-0 underground-fade" />

      {/* Main content */}
      <div className="content-container pt-20">
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

        {/* Combined Carousel with User Drills and Example Drills */}
        <div className="w-full max-w-7xl mx-auto px-4 mb-16">
          <div className="flex flex-col space-y-6">
            {/* Asset Type Filters */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-min pr-4 pb-4">
                {assetTypes.map((symbol) => (
                  <Button
                    key={symbol}
                    variant={selectedAssets.has(symbol) ? "default" : "outline"}
                    className="flex-shrink-0 gap-2"
                    onClick={() => toggleAsset(symbol)}
                  >
                    <div className="w-5 h-5">
                      <Icon name={symbol.toLowerCase()} />
                    </div>
                    <span>{symbol.toUpperCase()}</span>
                  </Button>
                ))}
              </div>
            </div>

            {isLoading || fluidsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <span className="ml-2">Loading fluids...</span>
              </div>
            ) : (
              <DrillCarousel
                userDrills={filteredUserDrills}
                exampleDrills={filteredExampleDrills}
                onShutdown={handleShutdown}
              />
            )}
          </div>
        </div>

        {/* OilPool positioned at the bottom */}
        <div className="w-full mt-auto">
          <OilPool />
        </div>
      </div>
    </>
  );
}
