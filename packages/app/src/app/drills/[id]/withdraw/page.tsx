"use client";

import React from "react";
import { useParams } from "next/navigation";
import { WithdrawForm } from "@/components/withdraw/withdraw-form";
import Image from "next/image";
import { FLUIDS } from "@/config/fluids";

export default function WithdrawPage() {
  const params = useParams();
  const drillId = params.id as string;

  // In a real app, we would fetch the drill details here
  // For now, we'll just extract the asset type from the drill ID
  // Assuming drill IDs are in the format "assetType-uniqueId"
  const assetType = drillId.split("-")[0];

  // Find the asset in our fluids list
  const asset = FLUIDS.find(
    (fluid) => fluid.id.toLowerCase() === assetType.toLowerCase()
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Shutdown Drill</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column: Form */}
        <div className="bg-card rounded-lg p-6 shadow-md">
          <WithdrawForm assetType={assetType} drillId={drillId} />
        </div>

        {/* Right column: Animation - Matching the deposit page style */}
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-96 h-96 bg-purple-900/20 rounded-lg overflow-hidden flex items-center justify-center">
              {/* Oil rig image */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* New rig image */}
                <div className="absolute inset-0 w-full h-full">
                  <Image
                    src="/images/withdraw.png"
                    alt="Oil Rig"
                    fill
                    className="object-contain p-4"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">
                Shutting Down {asset?.name || assetType.toUpperCase()} Drill
              </h3>
              <p className="text-muted-foreground max-w-md">
                Your assets will be returned to your wallet when you shut down
                this drill. Any unclaimed yield will be harvested automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
