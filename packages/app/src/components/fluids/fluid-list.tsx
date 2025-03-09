"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowUpDown, Search } from "lucide-react";
import { FLUIDS } from "@/config/fluids";
import { formatCurrency } from "@/lib/utils";

type SortField = "name" | "yieldRate" | "tvl" | "protocol";
type SortDirection = "asc" | "desc";

export function FluidList() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [protocolFilter, setProtocolFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("yieldRate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Get unique protocols for filter
  const protocols = [
    "all",
    ...Array.from(new Set(FLUIDS.map((fluid) => fluid.protocol))),
  ];

  // Filter fluids based on search term and protocol filter
  const filteredFluids = FLUIDS.filter((fluid) => {
    const matchesSearch =
      fluid.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fluid.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fluid.protocol.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProtocol =
      protocolFilter === "all" || fluid.protocol === protocolFilter;

    return matchesSearch && matchesProtocol;
  });

  // Sort fluids based on sort field and direction
  const sortedFluids = [...filteredFluids].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "yieldRate":
        comparison = a.yieldRate - b.yieldRate;
        break;
      case "tvl":
        comparison = a.globalStats.tvl - b.globalStats.tvl;
        break;
      case "protocol":
        comparison = a.protocol.localeCompare(b.protocol);
        break;
      default:
        comparison = 0;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Toggle sort direction or change sort field
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Handle fluid selection
  const handleSelectFluid = (fluidId: string) => {
    router.push(`/fluids/${fluidId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fluids..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={protocolFilter}
          onValueChange={(value) => setProtocolFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by protocol" />
          </SelectTrigger>
          <SelectContent>
            {protocols.map((protocol) => (
              <SelectItem key={protocol} value={protocol}>
                {protocol === "all" ? "All Protocols" : protocol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1 font-medium"
                >
                  Asset
                  <ArrowUpDown
                    className={`h-3 w-3 ${
                      sortField === "name" ? "opacity-100" : "opacity-40"
                    }`}
                  />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Symbol</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("yieldRate")}
                  className="flex items-center gap-1 font-medium"
                >
                  APY
                  <ArrowUpDown
                    className={`h-3 w-3 ${
                      sortField === "yieldRate" ? "opacity-100" : "opacity-40"
                    }`}
                  />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("tvl")}
                  className="flex items-center gap-1 font-medium"
                >
                  TVL
                  <ArrowUpDown
                    className={`h-3 w-3 ${
                      sortField === "tvl" ? "opacity-100" : "opacity-40"
                    }`}
                  />
                </Button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("protocol")}
                  className="flex items-center gap-1 font-medium"
                >
                  Protocol
                  <ArrowUpDown
                    className={`h-3 w-3 ${
                      sortField === "protocol" ? "opacity-100" : "opacity-40"
                    }`}
                  />
                </Button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                Your Balance
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFluids.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No fluids found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              sortedFluids.map((fluid) => (
                <FluidRow
                  key={fluid.id}
                  fluid={fluid}
                  onSelect={() => handleSelectFluid(fluid.id)}
                  userAddress={address}
                  isConnected={isConnected}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface FluidRowProps {
  fluid: (typeof FLUIDS)[0];
  onSelect: () => void;
  userAddress?: `0x${string}`;
  isConnected: boolean;
}

function FluidRow({
  fluid,
  onSelect,
  userAddress,
  isConnected,
}: FluidRowProps) {
  // Get user's balance of this fluid
  const { data: balance } = useBalance({
    address: userAddress,
    token: fluid.underlyingAssetAddress,
    query: {
      enabled: isConnected && !!userAddress,
    },
  });

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">{fluid.name}</TableCell>
      <TableCell className="hidden md:table-cell">{fluid.symbol}</TableCell>
      <TableCell className="text-green-500 font-medium">
        {fluid.yieldRate.toFixed(2)}%
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {formatCurrency(fluid.globalStats.tvl)}
      </TableCell>
      <TableCell className="hidden lg:table-cell">{fluid.protocol}</TableCell>
      <TableCell className="hidden lg:table-cell">
        {isConnected
          ? balance
            ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(6)} ${
                fluid.symbol
              }`
            : "0"
          : "Connect wallet"}
      </TableCell>
      <TableCell className="text-right">
        <Button onClick={onSelect} size="sm">
          Select
        </Button>
      </TableCell>
    </TableRow>
  );
}
