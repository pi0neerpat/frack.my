"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { FRACKING_ABI, FRACKING_ADDRESS, ERC20_ABI } from "@/config/contracts";
import { FLUIDS } from "@/config/fluids";
import { SuccessAnimation } from "./success-animation";
import { formatCurrency } from "@/lib/utils";

interface DepositFormProps {
  assetType: string;
}

export function DepositForm({ assetType }: DepositFormProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState(0);
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  // Get asset information
  const asset = FLUIDS.find(
    (fluid) => fluid.id.toLowerCase() === assetType.toLowerCase()
  );

  // Get user balance
  const { data: balanceData, isLoading: isLoadingBalance } = useBalance({
    address,
    token: asset?.contractAddress,
  });

  // Calculate min and max values
  const minAmount = 0.01;
  const maxAmount = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals))
    : 0;

  // Update amount when slider changes
  const handleSliderChange = (value: number[]) => {
    const percentage = value[0];
    setSliderValue(percentage);

    if (maxAmount > 0) {
      // Calculate amount based on percentage between min and max
      const range = maxAmount - minAmount;
      const calculatedAmount = minAmount + range * (percentage / 100);

      // Format to 4 decimal places
      setAmount(calculatedAmount.toFixed(4));
    }
  };

  // Update slider when amount changes manually
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);

    if (maxAmount > minAmount) {
      const numAmount = parseFloat(newAmount);
      if (
        !isNaN(numAmount) &&
        numAmount >= minAmount &&
        numAmount <= maxAmount
      ) {
        // Calculate percentage
        const range = maxAmount - minAmount;
        const percentage = ((numAmount - minAmount) / range) * 100;
        setSliderValue(percentage);
      }
    }
  };

  // Get current allowance - using custom hook or direct contract call would be better
  // This is a simplified version for the demo
  const [allowance, setAllowance] = useState("0");
  const [isLoadingAllowance, setIsLoadingAllowance] = useState(false);

  // Simulate allowance check
  useEffect(() => {
    if (!address || !asset?.contractAddress || !isConnected) return;

    setIsLoadingAllowance(true);

    // Simulate API call
    setTimeout(() => {
      setAllowance("0"); // Start with 0 allowance
      setIsLoadingAllowance(false);
    }, 1000);
  }, [address, asset?.contractAddress, isConnected]);

  const hasEnoughAllowance = Number(allowance) >= Number(amount || "0");

  // Refetch allowance function
  const refetchAllowance = async () => {
    setIsLoadingAllowance(true);

    // Simulate API call
    setTimeout(() => {
      setAllowance(amount); // After approval, set allowance to amount
      setIsLoadingAllowance(false);
    }, 1000);
  };

  // Contract write hooks
  const { writeContractAsync: approveToken } = useWriteContract();
  const { writeContractAsync: deposit } = useWriteContract();

  // Validation
  const isAmountValid =
    Number(amount) >= minAmount && balanceData && Number(amount) <= maxAmount;

  // Handle approve
  const handleApprove = async () => {
    if (!address || !asset?.contractAddress) return;

    setIsApproving(true);
    setError("");

    try {
      // Simulate approval
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await refetchAllowance();
    } catch (error) {
      console.error("Approval error:", error);
      setError("Failed to approve token. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!address || !asset?.contractAddress || !isAmountValid) return;

    setIsDepositing(true);
    setError("");

    try {
      // Simulate deposit
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setShowSuccess(true);
    } catch (error) {
      console.error("Deposit error:", error);
      setError("Failed to create drill. Please try again.");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleSuccessComplete = () => {
    router.push("/");
  };

  if (!asset) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <h3 className="text-xl font-bold mb-2 text-red-500">
              Asset Not Found
            </h3>
            <p className="text-muted-foreground mb-4">
              Could not find asset with ID: "{assetType}"
            </p>
            <Button onClick={() => router.push("/fluids")}>
              Return to Fluids List
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground">
              Please connect your wallet to continue.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} />}

      <Card>
        <CardHeader>
          <CardTitle>Deposit {asset.name}</CardTitle>
          <CardDescription>
            Build a new drill using {asset.name} as fracking fluid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="amount" className="mb-2 block">
                Amount to Deposit
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  min={minAmount}
                  max={maxAmount}
                  step="0.01"
                  disabled={
                    isApproving ||
                    isDepositing ||
                    isLoadingBalance ||
                    isLoadingAllowance
                  }
                  className="flex-1"
                />
                <span className="text-sm font-medium">{asset.symbol}</span>
              </div>

              {isLoadingBalance ? (
                <div className="flex items-center justify-center mt-4">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading balance...
                  </span>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>
                      Min: {minAmount} {asset.symbol}
                    </span>
                    <span>
                      Max: {maxAmount.toFixed(4)} {asset.symbol}
                    </span>
                  </div>

                  <Slider
                    defaultValue={[0]}
                    value={[sliderValue]}
                    onValueChange={handleSliderChange}
                    max={100}
                    step={1}
                    disabled={
                      isApproving ||
                      isDepositing ||
                      isLoadingBalance ||
                      isLoadingAllowance ||
                      maxAmount <= 0
                    }
                  />

                  <div className="flex justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Selected: </span>
                      <span className="font-medium">{sliderValue}%</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Amount: </span>
                      <span className="font-medium">
                        {amount} {asset.symbol}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Estimated yield information */}
            <div className="bg-purple-900/10 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Estimated Yield</h4>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">APY:</span>
                <span className="font-medium text-purple-500">
                  {asset.yieldRate}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Yield:</span>
                <span className="font-medium text-purple-500">
                  {(Number(amount || 0) * (asset.yieldRate / 100 / 12)).toFixed(
                    4
                  )}{" "}
                  USDC
                </span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {isLoadingAllowance ? (
            <Button disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking allowance...
            </Button>
          ) : !hasEnoughAllowance ? (
            <Button
              onClick={handleApprove}
              disabled={!isAmountValid || isApproving}
              className="w-full"
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                `Approve ${asset.symbol}`
              )}
            </Button>
          ) : null}

          <Button
            onClick={handleDeposit}
            disabled={
              !isAmountValid ||
              !hasEnoughAllowance ||
              isDepositing ||
              isLoadingAllowance
            }
            className="w-full"
          >
            {isDepositing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Drill...
              </>
            ) : (
              "Create Drill"
            )}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
