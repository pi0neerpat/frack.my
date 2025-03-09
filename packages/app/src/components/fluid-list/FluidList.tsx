"use client";

import { useFluids } from "@/context/fluids-context";
import { Icon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  ArrowUpDown,
  Coins,
  Wallet,
  LineChart,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

type SortField = "yieldRate" | "drillCount" | "flowRate" | "tvl";

export function FluidList() {
  const { fluids, loading, error } = useFluids();
  const [sortBy, setSortBy] = useState<SortField>("yieldRate");
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  // Get unique asset types from fluids
  const assetTypes = [...new Set(fluids.map((f) => f.symbol))];

  // Filter and sort fluids
  const filteredFluids = fluids.filter(
    (fluid) => selectedAssets.size === 0 || selectedAssets.has(fluid.symbol)
  );

  const sortedFluids = [...filteredFluids].sort((a, b) => {
    let aValue = sortBy === "yieldRate" ? a.yieldRate : a.globalStats[sortBy];
    let bValue = sortBy === "yieldRate" ? b.yieldRate : b.globalStats[sortBy];
    return sortDesc ? bValue - aValue : aValue - bValue;
  });

  const toggleAsset = (symbol: string) => {
    const newAssets = new Set(selectedAssets);
    if (newAssets.has(symbol)) {
      newAssets.delete(symbol);
    } else {
      newAssets.add(symbol);
    }
    setSelectedAssets(newAssets);
  };

  const formatFlowRate = (rate: number) => {
    return `$${rate.toLocaleString()}/mo`;
  };

  if (loading) {
    return <div className="text-center">Loading available fluids...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error loading fluids: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex justify-between items-center gap-4">
        {/* Asset Type Filters - Scrollable */}
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-min pr-4">
            {assetTypes.map((symbol) => (
              <Button
                key={symbol}
                variant={selectedAssets.has(symbol) ? "default" : "outline"}
                className="flex-shrink-0 gap-2"
                onClick={() => toggleAsset(symbol)}
              >
                <div className="w-5 h-5">
                  <Icon
                    name={symbol.toLowerCase()}
                    tokenAddress={
                      fluids.find((f) => f.symbol === symbol)?.contractAddress
                    }
                  />
                </div>
                <span>{symbol}</span>
                <span className="text-xs text-muted-foreground">
                  ({fluids.filter((f) => f.symbol === symbol).length})
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border" />

        {/* Sort Controls */}
        <div className="flex gap-2 flex-shrink-0">
          {[
            { key: "yieldRate", label: "APY" },
            { key: "drillCount", label: "Drills" },
            { key: "flowRate", label: "Flow Rate" },
            { key: "tvl", label: "TVL" },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={sortBy === key ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (sortBy === key) {
                  setSortDesc(!sortDesc);
                } else {
                  setSortBy(key as SortField);
                  setSortDesc(true);
                }
              }}
            >
              {label}
              {sortBy === key && (
                <ArrowUpDown
                  className={`ml-2 h-4 w-4 ${sortDesc ? "rotate-180" : ""}`}
                />
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedFluids.length} fluids
        {selectedAssets.size > 0 &&
          ` filtered by ${Array.from(selectedAssets).join(", ")}`}
      </div>

      {/* Fluid Cards Grid */}
      <div className="grid gap-4">
        {sortedFluids.map((fluid, i) => (
          <Link href={`/fluids/${fluid.id}`} key={fluid.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Left section: Icon, Name, Protocol, Drills & Strategy */}
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12">
                        <Icon
                          name={fluid.id}
                          tokenAddress={fluid.contractAddress}
                        />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{fluid.name}</h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-purple-400">
                            {fluid.strategy}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {fluid.protocol}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span className="font-semibold">
                              {fluid.globalStats.drillCount}
                            </span>
                            <span className="text-muted-foreground">
                              drills
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right section: Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-500">
                          {fluid.yieldRate}%
                        </p>
                        <p className="text-sm text-muted-foreground">APY</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-purple-400">
                          {formatFlowRate(fluid.globalStats.flowRate)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Flow Rate
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          ${fluid.globalStats.tvl.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">TVL</p>
                      </div>
                      <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
