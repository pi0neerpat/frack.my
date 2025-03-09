"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Loader2 } from "lucide-react";
import { YIELD_BOX_ABI, FRACKING_ADDRESS } from "@/config/contracts";
import { FLUIDS } from "@/config/fluids";
import { DrillCard } from "@/components/carousel/DrillCard";
import { NewDrillCard } from "@/components/carousel/NewDrillCard";

export function UserDrills() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [userDrills, setUserDrills] = useState<any[]>([]);

  // Get user's deposited assets
  const { data: userAssets, isLoading: isLoadingUserAssets } = useReadContract({
    address: FRACKING_ADDRESS,
    abi: YIELD_BOX_ABI,
    functionName: "userAssets",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Get user's deposit timestamp
  const { data: depositTimestamp, isLoading: isLoadingDepositTimestamp } =
    useReadContract({
      address: FRACKING_ADDRESS,
      abi: YIELD_BOX_ABI,
      functionName: "userDepositTimestamp",
      args: address ? [address] : undefined,
      query: {
        enabled: isConnected && !!address,
      },
    });

  // Process user's drill data
  useEffect(() => {
    if (isConnected && userAssets && depositTimestamp) {
      // For now, we're assuming a single drill per user
      // In a real app, you would fetch all user drills

      // Find the first fluid with a non-zero balance
      const fluid = FLUIDS[0]; // Default to first fluid if none found

      const depositAmount = parseFloat(formatUnits(userAssets, 18)); // Assuming 18 decimals

      if (depositAmount > 0) {
        // Calculate time active
        const depositTime = Number(depositTimestamp) * 1000; // Convert to milliseconds
        const now = Date.now();
        const diffTime = Math.abs(now - depositTime);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(
          (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const duration =
          diffDays > 0 ? `${diffDays}d ${diffHours}h` : `${diffHours}h`;

        // Calculate earned yield (simplified for demo)
        const monthsSinceDeposit = diffTime / (1000 * 60 * 60 * 24 * 30);
        const monthlyYield = (depositAmount * fluid.yieldRate) / 100 / 12;
        const totalEarned = monthlyYield * monthsSinceDeposit;

        // Create drill object
        const drill = {
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
    } else if (!isLoadingUserAssets && !isLoadingDepositTimestamp) {
      setIsLoading(false);
    }
  }, [
    isConnected,
    userAssets,
    depositTimestamp,
    isLoadingUserAssets,
    isLoadingDepositTimestamp,
  ]);

  // Handle shutdown
  const handleShutdown = (id: string) => {
    console.log("Shutting down drill:", id);
    // Navigate to withdrawal page
    window.location.href = `/drills/${id}/withdraw`;
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground">
          Please connect your wallet to view your active drills.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <span className="ml-2">Loading your drills...</span>
      </div>
    );
  }

  return (
    <div className="flex gap-6 pb-4 overflow-x-auto scrollbar-hide">
      <div className="w-[320px] flex-shrink-0">
        <NewDrillCard />
      </div>

      {userDrills.length > 0 ? (
        userDrills.map((drill) => (
          <div key={drill.id} className="w-[320px] flex-shrink-0">
            <DrillCard
              fluidId={drill.fluidId}
              amount={drill.amount}
              yieldRate={drill.yieldRate}
              totalEarned={drill.totalEarned}
              duration={
                typeof drill.startTime === "number"
                  ? calculateDuration(drill.startTime)
                  : "0h"
              }
              isActive={drill.isActive}
              onShutdown={() => handleShutdown(drill.id)}
            />
          </div>
        ))
      ) : (
        <div className="flex items-center justify-center w-full py-8">
          <p className="text-muted-foreground">
            You don't have any active drills. Create one to get started!
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate duration
function calculateDuration(startTime: number): string {
  const diff = Date.now() - startTime;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}
