"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Power, ExternalLink } from "lucide-react";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface DrillCardProps {
  fluidId: string;
  amount: number;
  yieldRate: number;
  totalEarned: number;
  duration: string;
  isActive: boolean;
  onShutdown: () => void;
  isExample?: boolean;
  asset?: {
    underlyingAssetAddress?: `0x${string}`;
    contractAddress?: `0x${string}`;
  };
  symbol?: string;
}

export function DrillCard({
  fluidId,
  amount,
  yieldRate,
  totalEarned,
  duration,
  isActive,
  onShutdown,
  isExample = false,
  asset,
  symbol = "TOKEN",
}: DrillCardProps) {
  const router = useRouter();

  // Debug log the asset data
  console.log(`DrillCard for ${fluidId}:`, {
    asset,
    underlyingAssetAddress: asset?.underlyingAssetAddress,
    contractAddress: asset?.contractAddress,
    component: "DrillCard",
  });

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-opacity",
        isExample ? "opacity-90" : "hover:border-purple-500/50"
      )}
    >
      <motion.div
        className={cn(
          "absolute top-3 right-3 h-2 w-2 rounded-full",
          isActive ? "bg-green-500" : "bg-yellow-500"
        )}
        animate={isExample ? undefined : { scale: isActive ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8">
              <Icon
                name={fluidId.toLowerCase() as any}
                tokenAddress={asset?.underlyingAssetAddress}
                contractAddress={asset?.contractAddress}
                size={32}
              />
            </div>
            <h3 className="text-xl font-bold">{fluidId.toUpperCase()}</h3>
          </div>
          {!isExample && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="text-muted-foreground hover:text-purple-400"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onShutdown}
                className="text-muted-foreground hover:text-red-400"
              >
                <Power className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount Deposited</span>
            <span>
              {amount.toFixed(0)} {symbol}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Yield</span>
            <span className="text-green-500">{yieldRate.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Earned</span>
            <span className="text-purple-400">${totalEarned.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Active Duration</span>
            <span>{duration}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
