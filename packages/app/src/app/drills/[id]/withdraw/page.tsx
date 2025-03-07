"use client";

import React from "react";
import { useParams } from "next/navigation";
import { WithdrawForm } from "@/components/withdraw/withdraw-form";

export default function WithdrawPage() {
  const params = useParams();
  const drillId = params.id as string;

  // In a real app, we would fetch the drill details here
  // For now, we'll just extract the asset type from the drill ID
  // Assuming drill IDs are in the format "assetType-uniqueId"
  const assetType = drillId.split("-")[0];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Shutdown Drill</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column: Form */}
        <div className="bg-card rounded-lg p-6 shadow-md">
          <WithdrawForm assetType={assetType} drillId={drillId} />
        </div>

        {/* Right column: Animation */}
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-64 h-64 bg-red-900/30 rounded-full flex items-center justify-center">
                <span className="text-4xl">🛢️</span>
              </div>
            </div>
            <p className="text-lg">
              Shutting down this drill will return your assets to your wallet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
