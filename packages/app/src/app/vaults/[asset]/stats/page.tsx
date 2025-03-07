"use client";

import React from "react";
import { useParams } from "next/navigation";
import { VaultStats } from "@/components/vault/vault-stats";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";

export default function VaultStatsPage() {
  const params = useParams();
  const assetType = params.asset as string;

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href={`/fluids/${assetType}`} passHref>
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vault
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex items-center">
          <BarChart3 className="h-8 w-8 mr-2 text-purple-500" />
          Vault Statistics
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <VaultStats assetType={assetType} />

        <div className="bg-card rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4">Vault Activity</h2>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {i % 2 === 0 ? "Deposit" : "Withdrawal"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(
                          Date.now() - i * 24 * 60 * 60 * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${i % 2 === 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {i % 2 === 0 ? "+" : "-"}
                        {(Math.random() * 5).toFixed(4)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(Math.random() * 10000).toFixed(2)} USD
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Harvest History</h3>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium">Harvest #{3 - i}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(
                          Date.now() - i * 3 * 24 * 60 * 60 * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-500">
                        +{(Math.random() * 0.5).toFixed(4)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(Math.random() * 1000).toFixed(2)} USD
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
