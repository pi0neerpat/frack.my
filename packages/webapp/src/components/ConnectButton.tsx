"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { formatAddress } from "@/lib/utils";
import { Loader2, Wallet, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ConnectButton() {
  const { isConnecting, isReconnecting } = useAccount();
  const { isConnected, address: address_ } = useAppKitAccount();
  const { open } = useAppKit();

  const isLoading = isConnecting || isReconnecting;

  return isConnected && address_ ? (
    <ConnectedButton address={address_} />
  ) : (
    <Button
      className="min-w-[140px] bg-pink-500 hover:bg-pink-600 text-white"
      onClick={() => {
        if (!isLoading) {
          open({
            view: "Connect",
          });
        }
      }}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}

function ConnectedButton(props: { address: string }) {
  const { open } = useAppKit();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[140px]">
          <Wallet className="mr-2 h-4 w-4" />
          {formatAddress(props.address)}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => open({ view: "Account" })}>
          Account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open({ view: "Connect" })}>
          Switch Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
