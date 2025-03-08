"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
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
import { YIELD_BOX_ABI, FRACKING_ADDRESS, ERC20_ABI } from "@/config/contracts";
import { FLUIDS, Fluid } from "@/config/fluids";
import { formatCurrency } from "@/lib/utils";

// Success animation component
const SuccessAnimation = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="text-center">
        <div className="w-24 h-24 bg-purple-600 rounded-full mx-auto mb-4 animate-pulse flex items-center justify-center">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">
          Drill Successfully Shutdown!
        </h2>
        <p className="text-muted-foreground">
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
};

interface WithdrawFormProps {
  assetType: string;
  drillId?: string;
}

export function WithdrawForm({ assetType, drillId }: WithdrawFormProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState(100); // Default to 100% (full withdrawal)
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  // Get asset information
  const asset = FLUIDS.find(
    (fluid) => fluid.id.toLowerCase() === assetType.toLowerCase()
  );

  // Get user's deposited balance
  const { data: userAssets, isLoading: isLoadingUserAssets } = useReadContract({
    address: FRACKING_ADDRESS,
    abi: YIELD_BOX_ABI,
    functionName: "userAssets",
    args: address ? [address] : undefined,
  });

  // Calculate min and max values
  const maxAmount = userAssets
    ? parseFloat(formatUnits(userAssets, 18)) // Assuming 18 decimals
    : 0;
  const minAmount = 0.000001; // Minimum withdrawal amount

  // Initialize amount when maxAmount is available
  useEffect(() => {
    if (maxAmount > 0) {
      // Set initial amount to 100% of maxAmount (since sliderValue defaults to 100)
      setAmount(maxAmount.toFixed(6));
    }
  }, [maxAmount]);

  // Update amount when slider changes
  const handleSliderChange = (value: number[]) => {
    const percentage = value[0];
    setSliderValue(percentage);

    if (maxAmount > 0) {
      // Calculate amount based on percentage of max
      const calculatedAmount = (maxAmount * percentage) / 100;

      // Format to 6 decimal places
      setAmount(calculatedAmount.toFixed(6));
    }
  };

  // Update slider when amount changes manually
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);

    if (maxAmount > 0) {
      const numAmount = parseFloat(newAmount);
      if (!isNaN(numAmount) && numAmount >= 0 && numAmount <= maxAmount) {
        // Calculate percentage
        const percentage = (numAmount / maxAmount) * 100;
        setSliderValue(percentage);
      }
    }
  };

  // Contract write hooks
  const {
    writeContract: writeWithdraw,
    data: withdrawHash,
    isPending: isWithdrawing,
    isError: isWithdrawError,
    error: withdrawError,
  } = useWriteContract();

  // Log errors
  useEffect(() => {
    if (isWithdrawError && withdrawError) {
      console.error("Withdrawal error:", withdrawError);
      setError(`Failed to withdraw: ${withdrawError.message}`);
    }
  }, [isWithdrawError, withdrawError]);

  // Transaction receipts
  const { isLoading: isWithdrawLoading, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({
      hash: withdrawHash,
    });

  // Effect to show success and redirect after withdrawal transaction is confirmed
  useEffect(() => {
    if (isWithdrawSuccess) {
      console.log("Withdrawal transaction successful");
      setShowSuccess(true);
    }
  }, [isWithdrawSuccess]);

  // Validation
  const isAmountValid = Number(amount) > 0 && Number(amount) <= maxAmount;

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!address || !asset?.vaultAddress || !isAmountValid) return;

    setError("");

    try {
      console.log("Withdrawing:", {
        amount: amount,
        parsedAmount: parseUnits(amount, 18).toString(), // Assuming 18 decimals
      });

      writeWithdraw({
        address: FRACKING_ADDRESS,
        abi: YIELD_BOX_ABI,
        functionName: "withdraw",
        args: [parseUnits(amount, 18)], // Assuming 18 decimals
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
      setError("Failed to withdraw. Please try again.");
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
            <Button onClick={() => router.push("/")}>
              Return to Dashboard
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

  // Combined loading state
  const isLoading = isWithdrawLoading || isWithdrawing;

  return (
    <>
      {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} />}

      <Card>
        <CardHeader>
          <CardTitle>Shutdown Drill</CardTitle>
          <CardDescription>
            Withdraw your {asset.name} from this drill
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="amount" className="mb-2 block">
                Amount to Withdraw
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  min={0}
                  max={maxAmount}
                  step="0.000001"
                  disabled={isLoading || isLoadingUserAssets}
                  className="flex-1"
                />
                <span className="text-sm font-medium">{asset.symbol}</span>
              </div>

              {isLoadingUserAssets ? (
                <div className="flex items-center justify-center mt-4">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading balance...
                  </span>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>

                  <Slider
                    defaultValue={[100]}
                    value={[sliderValue]}
                    onValueChange={handleSliderChange}
                    max={100}
                    step={1}
                    disabled={
                      isLoading || isLoadingUserAssets || maxAmount <= 0
                    }
                  />

                  <div className="flex justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Selected: </span>
                      <span className="font-medium">
                        {sliderValue.toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Available: </span>
                      <span className="font-medium">
                        {maxAmount.toFixed(6)} {asset.symbol}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Withdrawal value information */}
            <div className="bg-purple-900/10 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Withdrawal Value</h4>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">
                  {amount} {asset.symbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Value:</span>
                <span className="font-medium text-purple-500">
                  {formatCurrency(Number(amount || 0) * asset.price)}
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
          <Button
            onClick={handleWithdraw}
            disabled={!isAmountValid || isLoading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isWithdrawing || isWithdrawLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Shutting Down Drill...
              </>
            ) : (
              "Shutdown Drill"
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
