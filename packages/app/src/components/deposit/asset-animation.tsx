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
        {/* Oil drill animation */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-4 h-64 bg-gray-700 left-1/2 transform -translate-x-1/2"></div>
          <div className="absolute w-48 h-8 bg-gray-800 top-16 left-1/2 transform -translate-x-1/2 rounded"></div>
          <div className="absolute w-8 h-16 bg-gray-600 top-24 left-1/2 transform -translate-x-1/2 animate-bounce"></div>
          <div className="absolute bottom-0 w-full h-24 bg-purple-900/50 rounded-t-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl font-bold text-purple-200">
                {asset.symbol}
              </div>
            </div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxkZWZzPgogICAgPHBhdHRlcm4gaWQ9IndhdmUiIHg9IjAiIHk9IjAiIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHBhdGggZmlsbD0icmdiYSgxMDIsIDUxLCAxNTMsIDAuMykiIGQ9Ik0wIDI1YzIwIDAgMjAgMTUgNDAgMTVzMjAgLTE1IDQwIC0xNSAyMCAxNSA0MCAxNSAyMCAtMTUgNDAgLTE1IDIwIDE1IDQwIDE1IHYxNWgtMjAweiI+CiAgICAgICAgPGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJ0cmFuc2xhdGUiIGZyb209IjAgMCIgdG89Ii0yMDAgMCIgZHVyPSIxMHMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+CiAgICAgIDwvcGF0aD4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCN3YXZlKSIvPgo8L3N2Zz4=')]"></div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Fracking with {asset.name}</h3>
        <p className="text-muted-foreground max-w-md">
          Your {asset.symbol} will be deposited and start generating yield
          immediately. The yield will be streamed back to your wallet as USDC.
        </p>

        <div className="mt-4 p-4 bg-purple-900/20 rounded-lg">
          <div className="flex justify-between mb-2">
            <span>Current APY:</span>
            <span className="font-bold text-purple-400">
              {asset.yieldRate}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Strategy:</span>
            <span>{asset.strategy}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
