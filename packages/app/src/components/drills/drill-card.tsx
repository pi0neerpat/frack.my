"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FLUIDS } from "@/config/fluids";
import { formatCurrency } from "@/lib/utils";

interface DrillCardProps {
  id: string;
  assetType: string;
  amount: number;
  depositDate: Date;
  yieldEarned: number;
}

export function DrillCard({
  id,
  assetType,
  amount,
  depositDate,
  yieldEarned,
}: DrillCardProps) {
  const router = useRouter();

  // Get asset information
  const asset = FLUIDS.find(
    (fluid) => fluid.id.toLowerCase() === assetType.toLowerCase()
  );

  if (!asset) {
    return null;
  }

  // Calculate time active
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - depositDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  // Format time active
  const timeActive =
    diffDays > 0 ? `${diffDays}d ${diffHours}h` : `${diffHours}h`;

  // Calculate monthly yield
  const monthlyYield = (amount * asset.yieldRate) / 100 / 12;

  // Handle shutdown click
  const handleShutdown = () => {
    router.push(`/drills/${id}/withdraw`);
  };

  return (
    <Card className="overflow-hidden border-purple-800/30 hover:border-purple-800/60 transition-colors">
      <div className="bg-gradient-to-r from-purple-900/20 to-purple-800/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-700 rounded-full flex items-center justify-center">
              <span className="text-sm">🛢️</span>
            </div>
            <div>
              <h3 className="font-bold">{asset.name} Drill</h3>
              <p className="text-xs text-muted-foreground">{asset.protocol}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-green-500">Active</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Deposited:</span>
            <span className="text-sm font-medium">
              {amount.toFixed(6)} {asset.symbol}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Value:</span>
            <span className="text-sm font-medium">
              {formatCurrency(amount * asset.price)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">APY:</span>
            <span className="text-sm font-medium text-purple-500">
              {asset.yieldRate}%
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              Monthly Yield:
            </span>
            <span className="text-sm font-medium text-purple-500">
              {monthlyYield.toFixed(4)} USDC
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Time Active:</span>
            <span className="text-sm font-medium">{timeActive}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Yield Earned:</span>
            <span className="text-sm font-medium text-green-500">
              {yieldEarned.toFixed(4)} USDC
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleShutdown}
        >
          Shutdown Drill
        </Button>
      </CardFooter>
    </Card>
  );
}
