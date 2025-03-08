"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DepositForm } from "@/components/deposit/deposit-form";
import { AssetAnimation } from "@/components/deposit/asset-animation";
import { FLUIDS } from "@/config/fluids";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import Link from "next/link";

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Start Fracking</h1>
        <Link href={`/vaults/${assetType}/stats`} passHref>
          <Button variant="outline" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>View Vault Stats</span>
          </Button>
        </Link>
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
