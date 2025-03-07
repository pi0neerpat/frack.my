"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { DrillCard } from "./drill-card";
import { YIELD_BOX_ABI, FRACKING_ADDRESS } from "@/config/contracts";
import { FLUIDS } from "@/config/fluids";

// Mock data for demonstration purposes
// In a real app, this would come from the blockchain
const MOCK_DRILLS = [
  {
    id: "eth-1",
    assetType: "eth",
    amount: 1.25,
    depositDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    yieldEarned: 0.0125,
  },
  {
    id: "wsteth-1",
    assetType: "wsteth",
    amount: 2.5,
    depositDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    yieldEarned: 0.0235,
  },
  {
    id: "reth-1",
    assetType: "reth",
    amount: 0.75,
    depositDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    yieldEarned: 0.0062,
  },
];

export function DrillList() {
  const { address, isConnected } = useAccount();
  const [drills, setDrills] = useState(MOCK_DRILLS);
  const [isLoading, setIsLoading] = useState(true);

  // In a real app, we would fetch the user's drills from the blockchain
  // For now, we'll just use the mock data
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground">Loading your drills...</p>
      </div>
    );
  }

  if (drills.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">No Active Drills</h2>
        <p className="text-muted-foreground mb-4">
          You don't have any active drills yet. Start by creating a new drill.
        </p>
        <a
          href="/fluids"
          className="inline-block px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-md transition-colors"
        >
          Create New Drill
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {drills.map((drill) => (
        <DrillCard
          key={drill.id}
          id={drill.id}
          assetType={drill.assetType}
          amount={drill.amount}
          depositDate={drill.depositDate}
          yieldEarned={drill.yieldEarned}
        />
      ))}
    </div>
  );
}
