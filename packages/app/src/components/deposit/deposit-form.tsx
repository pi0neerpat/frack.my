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
import { FLUIDS } from "@/config/fluids";
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
        <h2 className="text-2xl font-bold mb-2">Drill Successfully Built!</h2>
        <p className="text-muted-foreground">Redirecting to your drills...</p>
      </div>
    </div>
  );
};

interface DepositFormProps {
  assetType: string;
}

export function DepositForm({ assetType }: DepositFormProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState(100);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [justApproved, setJustApproved] = useState(false);

  // Get asset information
  const asset = FLUIDS.find(
    (fluid) => fluid.id.toLowerCase() === assetType.toLowerCase()
  );

  // For testing purposes, if the vault address and underlying asset address are the same,
  // we'll use a different address for the vault to simulate the approval flow
  const vaultAddressToUse =
    asset?.underlyingAssetAddress === asset?.vaultAddress
      ? "0x1111111111111111111111111111111111111111" // Dummy address for testing
      : asset?.vaultAddress;

  // Get user balance
  const { data: balanceData, isLoading: isLoadingBalance } = useBalance({
    address,
    token: asset?.underlyingAssetAddress,
  });

  // Calculate min and max values
  const minAmount = 0.01;
  const maxAmount = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals))
    : 0;

  // Initialize amount when maxAmount is available
  useEffect(() => {
    if (maxAmount > 0) {
      // Set initial amount to 100% of maxAmount (since sliderValue defaults to 100)
      setAmount(maxAmount.toFixed(4));
    }
  }, [maxAmount]);

  // Calculate parsed amount early so it can be used in hooks
  const parsedAmount = amount
    ? parseUnits(amount, balanceData?.decimals || 18)
    : BigInt(0);

  // Log asset and address information for debugging
  useEffect(() => {
    if (asset && address) {
      console.log("Allowance check parameters:", {
        tokenAddress: asset.underlyingAssetAddress,
        owner: address,
        spender: vaultAddressToUse,
        tokenAbi: ERC20_ABI,
        enabled:
          !!address && !!asset.underlyingAssetAddress && !!vaultAddressToUse,
      });
    }
  }, [asset, address, vaultAddressToUse]);

  // Get current allowance - explicitly check all parameters are defined
  const {
    data: allowance,
    refetch: refetchAllowance,
    isLoading: isLoadingAllowance,
    error: allowanceError,
    status: allowanceStatus,
  } = useReadContract({
    address: asset?.underlyingAssetAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      address && asset?.underlyingAssetAddress && vaultAddressToUse
        ? [address, vaultAddressToUse]
        : undefined,
  });

  // Log allowance results for debugging
  useEffect(() => {
    console.log("Allowance result:", {
      allowance: allowance ? allowance.toString() : "undefined",
      error: allowanceError,
      status: allowanceStatus,
      args:
        address && asset?.underlyingAssetAddress && vaultAddressToUse
          ? [address, vaultAddressToUse]
          : "undefined args",
      underlyingAssetAddress: asset?.underlyingAssetAddress,
      vaultAddressToUse,
    });

    // If allowance is undefined, try to debug why
    if (
      allowance === undefined &&
      address &&
      asset?.underlyingAssetAddress &&
      vaultAddressToUse
    ) {
      console.log("Debugging allowance issue:", {
        tokenContract: asset.underlyingAssetAddress,
        isValidTokenAddress:
          asset.underlyingAssetAddress.startsWith("0x") &&
          asset.underlyingAssetAddress.length === 42,
        isValidSpender:
          vaultAddressToUse.startsWith("0x") && vaultAddressToUse.length === 42,
        isValidOwner: address.startsWith("0x") && address.length === 42,
      });
    }
  }, [
    allowance,
    allowanceError,
    allowanceStatus,
    address,
    asset?.underlyingAssetAddress,
    vaultAddressToUse,
  ]);

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

  // Check if approval is needed - with fallback for undefined allowance
  const hasEnoughAllowance = allowance ? parsedAmount <= allowance : false;

  // Force approval button if allowance is undefined or 0
  const shouldShowApproveButton = !allowance || allowance === BigInt(0);

  // Contract write hooks
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApproving,
    isError: isApproveError,
    error: approveError,
  } = useWriteContract();

  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositing,
    isError: isDepositError,
    error: depositError,
  } = useWriteContract();

  // Log errors
  useEffect(() => {
    if (isApproveError && approveError) {
      console.error("Approval error:", approveError);
      setError(`Failed to approve token: ${approveError.message}`);
    }
  }, [isApproveError, approveError]);

  useEffect(() => {
    if (isDepositError && depositError) {
      console.error("Deposit error:", depositError);
      setError(`Failed to create drill: ${depositError.message}`);
    }
  }, [isDepositError, depositError]);

  // Transaction receipts
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  // Effect to refetch allowance after approval transaction is confirmed
  useEffect(() => {
    if (isApproveSuccess) {
      console.log("Approval transaction successful, refetching allowance");
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  const { isLoading: isDepositLoading, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });

  // Effect to show success and redirect after deposit transaction is confirmed
  useEffect(() => {
    if (isDepositSuccess) {
      console.log("Deposit transaction successful");
      setShowSuccess(true);
      const timer = setTimeout(() => {
        router.push("/");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isDepositSuccess, router]);

  // Periodically refresh allowance
  useEffect(() => {
    if (address && asset?.underlyingAssetAddress && vaultAddressToUse) {
      // Initial fetch
      refetchAllowance();

      // Set up interval to refresh every 5 seconds
      const intervalId = setInterval(() => {
        console.log("Auto-refreshing allowance");
        refetchAllowance();
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [
    address,
    asset?.underlyingAssetAddress,
    vaultAddressToUse,
    refetchAllowance,
  ]);

  // Validation
  const isAmountValid =
    Number(amount) >= minAmount && balanceData && Number(amount) <= maxAmount;

  // Debug allowance information
  useEffect(() => {
    console.log("Allowance information:", {
      allowance: allowance ? allowance.toString() : "undefined",
      parsedAmount: parsedAmount.toString(),
      hasEnoughAllowance,
      decimals: balanceData?.decimals,
      vaultAddressToUse,
    });
  }, [
    allowance,
    parsedAmount,
    hasEnoughAllowance,
    balanceData?.decimals,
    vaultAddressToUse,
  ]);

  // Handle manual refresh of allowance
  const handleRefreshAllowance = () => {
    console.log("Manually refreshing allowance");
    refetchAllowance();
  };

  // Handle approve
  const handleApprove = async () => {
    if (
      !address ||
      !asset?.underlyingAssetAddress ||
      !vaultAddressToUse ||
      !isAmountValid
    ) {
      console.error("Cannot approve: missing required parameters");
      return;
    }

    setError("");

    try {
      console.log("Approving token:", {
        tokenAddress: asset.underlyingAssetAddress,
        spender: vaultAddressToUse,
        amount: parsedAmount.toString(),
      });

      writeApprove({
        address: asset.underlyingAssetAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [vaultAddressToUse, parsedAmount],
      });
    } catch (error) {
      console.error("Approval error:", error);
      setError("Failed to approve token. Please try again.");
    }
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!address || !vaultAddressToUse || !isAmountValid) return;

    setError("");

    try {
      console.log("Depositing:", {
        vaultAddress: vaultAddressToUse,
        amount: parsedAmount.toString(),
      });

      writeDeposit({
        address: vaultAddressToUse,
        abi: YIELD_BOX_ABI,
        functionName: "deposit",
        args: [parsedAmount],
      });
    } catch (error) {
      console.error("Deposit error:", error);
      setError("Failed to create drill. Please try again.");
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

  // Combined loading state
  const isLoading =
    isApproveLoading || isDepositLoading || isApproving || isDepositing;

  return (
    <>
      {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} />}

      <Card>
        <CardHeader>
          <CardTitle>Deposit {asset.name}</CardTitle>
          <CardDescription>Start fracking with {asset.name}</CardDescription>
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
                  disabled={isLoading || isLoadingBalance || isLoadingAllowance}
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
                      isLoading ||
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

            {/* Allowance information */}
            {!isLoadingAllowance && (
              <div className="text-sm text-muted-foreground flex flex-col">
                <div className="flex items-center justify-between">
                  <span>
                    Current Allowance:{" "}
                    {allowance !== undefined
                      ? formatUnits(allowance, balanceData?.decimals || 18)
                      : "0"}{" "}
                    {asset.symbol}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshAllowance}
                    disabled={isLoadingAllowance}
                    className="h-6 px-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={isLoadingAllowance ? "animate-spin" : ""}
                    >
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                      <path d="M16 21h5v-5"></path>
                    </svg>
                  </Button>
                </div>
                {allowanceError && (
                  <div className="text-red-500 mt-1 text-xs">
                    Error: {allowanceError.message}
                  </div>
                )}
              </div>
            )}

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
          ) : shouldShowApproveButton ? (
            <Button
              onClick={handleApprove}
              disabled={!isAmountValid || isApproving || isApproveLoading}
              className="w-full bg-purple-700 hover:bg-purple-600"
            >
              {isApproving || isApproveLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                `Approve ${asset.symbol}`
              )}
            </Button>
          ) : (
            <Button
              onClick={handleDeposit}
              disabled={!isAmountValid || isDepositing || isDepositLoading}
              className="w-full bg-purple-700 hover:bg-purple-600"
            >
              {isDepositing || isDepositLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Drill...
                </>
              ) : (
                "Create Drill"
              )}
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.back()}
            disabled={
              isApproving ||
              isApproveLoading ||
              isDepositing ||
              isDepositLoading
            }
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
