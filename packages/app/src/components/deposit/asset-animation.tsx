"use client";

import React from "react";
import Image from "next/image";
import { FLUIDS } from "@/config/fluids";

interface AssetAnimationProps {
  assetType: string;
}

export function AssetAnimation({ assetType }: AssetAnimationProps) {
  const asset = FLUIDS.find(
    (fluid) => fluid.id.toLowerCase() === assetType.toLowerCase()
  );

  if (!asset) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">Asset Not Found</h3>
          <p className="text-muted-foreground">
            Could not find asset with ID: "{assetType}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative w-96 h-96 bg-purple-900/20 rounded-lg overflow-hidden flex items-center justify-center">
        {/* Oil rig image */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* New rig image */}
          <div className="absolute inset-0 w-full h-full">
            <Image
              src="/images/new-rig2.png"
              alt="Oil Rig"
              fill
              className="object-contain p-4"
              priority
            />
          </div>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Fracking with {asset.name}</h3>
        <p className="text-muted-foreground max-w-md">
          Your {asset.symbol} will be deposited and start generating yield
          immediately. The yield will be streamed back to your wallet as USDC.
        </p>
      </div>
    </div>
  );
}
