"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DepositForm } from "@/components/deposit/deposit-form";
import { AssetAnimation } from "@/components/deposit/asset-animation";
import { FLUIDS } from "@/config/fluids";

export default function DepositPage() {
  const params = useParams();
  const router = useRouter();
  const assetType = params.asset as string;

  // Check if the asset exists in our fluids list
  useEffect(() => {
    if (!assetType) return;

    const assetExists = FLUIDS.some(
      (fluid) => fluid.id.toLowerCase() === assetType.toLowerCase()
    );

    if (!assetExists) {
      console.log(`Asset ${assetType} not found in fluids list`);
    }
  }, [assetType]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Start Fracking</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column: Form */}
        <div className="bg-card rounded-lg p-6 shadow-md">
          <DepositForm assetType={assetType} />
        </div>

        {/* Right column: Animation */}
        <div className="flex items-center justify-center">
          <AssetAnimation assetType={assetType} />
        </div>
      </div>
    </div>
  );
}
