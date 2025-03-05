"use client";

import { Button } from "./ui/button";
import { useWeb3 } from "@/context";
import { Loader2 } from "lucide-react";

export function WalletConnect() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWeb3();

  return (
    <Button
      variant="outline"
      onClick={() => (isConnected ? disconnect() : connect())}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isConnected ? (
        `${address?.slice(0, 6)}...${address?.slice(-4)}`
      ) : (
        "Connect Wallet"
      )}
    </Button>
  );
}
