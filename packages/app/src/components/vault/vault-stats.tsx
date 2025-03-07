"use client";

import React, { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { YIELD_BOX_ABI, FRACKING_ADDRESS } from "@/config/contracts";
import { FLUIDS } from "@/config/fluids";
import { formatCurrency } from "@/lib/utils";

interface VaultStatsProps {
  assetType: string;
}

export function VaultStats({ assetType }: VaultStatsProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Get asset information
  const asset = FLUIDS.find(
    (fluid) => fluid.id.toLowerCase() === assetType.toLowerCase()
  );

  // Get vault statistics
  const { data: totalDepositedAssets, isLoading: isLoadingDeposits } =
    useReadContract({
      address: FRACKING_ADDRESS,
      abi: YIELD_BOX_ABI,
      functionName: "totalDepositedAssets",
      args: [],
    });

  const { data: underlyingVaultAssets, isLoading: isLoadingVaultAssets } =
    useReadContract({
      address: FRACKING_ADDRESS,
      abi: YIELD_BOX_ABI,
      functionName: "underlyingVaultAssets",
      args: [],
    });

  const { data: lastHarvestTimestamp, isLoading: isLoadingHarvest } =
    useReadContract({
      address: FRACKING_ADDRESS,
      abi: YIELD_BOX_ABI,
      functionName: "lastHarvestTimestamp",
      args: [],
    });

  // Calculate time since last harvest
  const timeSinceLastHarvest = lastHarvestTimestamp
    ? Math.floor((Date.now() / 1000 - Number(lastHarvestTimestamp)) / 60) // minutes
    : 0;

  // Format time since last harvest
  const formatTimeSinceHarvest = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (minutes < 24 * 60) {
      return `${Math.floor(minutes / 60)} hours ago`;
    } else {
      return `${Math.floor(minutes / (24 * 60))} days ago`;
    }
  };

  // Calculate yield generated
  const yieldGenerated =
    underlyingVaultAssets && totalDepositedAssets
      ? Number(underlyingVaultAssets) - Number(totalDepositedAssets)
      : 0;

  // Format yield as percentage
  const yieldPercentage =
    underlyingVaultAssets &&
    totalDepositedAssets &&
    Number(totalDepositedAssets) > 0
      ? ((Number(underlyingVaultAssets) - Number(totalDepositedAssets)) /
          Number(totalDepositedAssets)) *
        100
      : 0;

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!asset) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <h3 className="text-xl font-bold mb-2 text-red-500">
              Asset Not Found
            </h3>
            <p className="text-muted-foreground">
              Could not find asset with ID: "{assetType}"
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isDataLoading =
    isLoading || isLoadingDeposits || isLoadingVaultAssets || isLoadingHarvest;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{asset.name} Vault Statistics</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Total Value Locked
              </h3>
              {isDataLoading ? (
                <Skeleton className="h-7 w-32" />
              ) : (
                <p className="text-xl font-bold">
                  {totalDepositedAssets
                    ? `${formatUnits(totalDepositedAssets, 18)} ${asset.symbol}`
                    : "0"}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (
                    {formatCurrency(
                      Number(
                        formatUnits(totalDepositedAssets || BigInt(0), 18)
                      ) * asset.price
                    )}
                    )
                  </span>
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Current Vault Assets
              </h3>
              {isDataLoading ? (
                <Skeleton className="h-7 w-32" />
              ) : (
                <p className="text-xl font-bold">
                  {underlyingVaultAssets
                    ? `${formatUnits(underlyingVaultAssets, 18)} ${asset.symbol}`
                    : "0"}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (
                    {formatCurrency(
                      Number(
                        formatUnits(underlyingVaultAssets || BigInt(0), 18)
                      ) * asset.price
                    )}
                    )
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Yield Generated
              </h3>
              {isDataLoading ? (
                <Skeleton className="h-7 w-32" />
              ) : (
                <p className="text-xl font-bold text-green-500">
                  {yieldGenerated > 0
                    ? `${formatUnits(BigInt(yieldGenerated), 18)} ${asset.symbol}`
                    : `0 ${asset.symbol}`}
                  <span className="text-sm font-normal ml-2">
                    ({yieldPercentage.toFixed(2)}%)
                  </span>
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Last Harvest
              </h3>
              {isDataLoading ? (
                <Skeleton className="h-7 w-32" />
              ) : (
                <p className="text-xl font-bold">
                  {lastHarvestTimestamp
                    ? formatTimeSinceHarvest(timeSinceLastHarvest)
                    : "Never"}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Vault Performance
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current APY</p>
              <p className="text-lg font-bold text-purple-500">
                {asset.yieldRate}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Protocol</p>
              <p className="text-lg font-bold">{asset.protocol}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
