"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
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
import { gdav1Forwarder } from "@/lib/contracts/GDAv1Forwarder";

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
        <h2 className="text-2xl font-bold mb-2">All Steps Completed!</h2>
        <p className="text-muted-foreground">
          Your fluid is now deposited and connected to the yield stream.
        </p>
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
  const publicClient = usePublicClient();

  // Form state
  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState(100); // Default to 100%
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Step tracking
  const [currentStep, setCurrentStep] = useState<
    "approve" | "deposit" | "connect" | "complete"
  >("approve");

  // Pool state
  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [isConnectingPool, setIsConnectingPool] = useState(false);
  const [connectPoolError, setConnectPoolError] = useState<string | null>(null);

  // Get asset information
  const asset = FLUIDS.find((f) => f.id === assetType);

  // Get user's balance
  const { data: balanceData, isLoading: isLoadingBalance } = useBalance({
    address,
    token: asset?.underlyingAssetAddress as `0x${string}`,
  });

  // Calculate min and max amount
  const minAmount = 0.01; // Minimum deposit amount
  const maxAmount = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals))
    : 0;

  // Initialize amount when maxAmount is available
  useEffect(() => {
    if (maxAmount > 0) {
      // Set initial amount to 100% of maxAmount
      setAmount(maxAmount.toFixed(4));
      setSliderValue(100);
    }
  }, [maxAmount]);

  // Check if amount is valid
  const parsedAmount = amount
    ? parseUnits(amount, balanceData?.decimals || 18)
    : BigInt(0);
  const isAmountValid =
    parseFloat(amount) >= minAmount && parseFloat(amount) <= maxAmount;

  // Determine which vault address to use
  const vaultAddressToUse =
    asset?.underlyingAssetAddress === asset?.vaultAddress
      ? asset?.underlyingAssetAddress
      : asset?.vaultAddress;

  // Log asset and address information for debugging
  useEffect(() => {
    if (asset && address) {
      console.log("Asset and address information:", {
        asset,
        address,
        vaultAddressToUse,
      });
    }
  }, [asset, address, vaultAddressToUse]);

  // Get allowance
  const {
    data: allowance,
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
    error: allowanceError,
  } = useReadContract({
    address: asset?.underlyingAssetAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      address && asset?.underlyingAssetAddress && vaultAddressToUse
        ? [address, vaultAddressToUse]
        : undefined,
    query: {
      enabled:
        !!address && !!asset?.underlyingAssetAddress && !!vaultAddressToUse,
    },
  });

  // Log allowance results for debugging
  useEffect(() => {
    if (allowance !== undefined) {
      console.log("Allowance:", {
        allowance: allowance.toString(),
        parsedAmount: parsedAmount.toString(),
      });
    }
  }, [allowance, parsedAmount]);

  // If allowance is undefined, try to debug why
  useEffect(() => {
    if (
      address &&
      asset?.underlyingAssetAddress &&
      vaultAddressToUse &&
      allowance === undefined &&
      !isLoadingAllowance
    ) {
      console.log("Debugging allowance issue:", {
        address,
        underlyingAssetAddress: asset.underlyingAssetAddress,
        vaultAddressToUse,
        isAddressValid: address.startsWith("0x") && address.length === 42,
        isAssetAddressValid:
          asset.underlyingAssetAddress.startsWith("0x") &&
          asset.underlyingAssetAddress.length === 42,
        isVaultAddressValid:
          vaultAddressToUse.startsWith("0x") && vaultAddressToUse.length === 42,
      });
    }
  }, [address, asset, vaultAddressToUse, allowance, isLoadingAllowance]);

  // Determine if we need to show the approve button
  const shouldShowApproveButton =
    allowance !== undefined && parsedAmount > allowance;

  // Write contract for approval
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApproving,
    isError: isApproveError,
    error: approveError,
  } = useWriteContract();

  // Wait for approval transaction
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  // Effect to handle approval errors
  useEffect(() => {
    if (isApproveError && approveError) {
      console.error("Approval error:", approveError);
      setError(`Failed to approve token: ${approveError.message}`);
    }
  }, [isApproveError, approveError]);

  // Effect to handle approval success
  useEffect(() => {
    if (isApproveSuccess) {
      console.log("Approval transaction successful");
      refetchAllowance();
      setCurrentStep("deposit");
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Write contract for deposit
  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositing,
    isError: isDepositError,
    error: depositError,
  } = useWriteContract();

  // Wait for deposit transaction
  const { isLoading: isDepositLoading, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });

  // Effect to handle deposit errors
  useEffect(() => {
    if (isDepositError && depositError) {
      console.error("Deposit error:", depositError);
      setError(`Failed to deposit fluid: ${depositError.message}`);
    }
  }, [isDepositError, depositError]);

  // Effect to handle deposit success
  useEffect(() => {
    if (isDepositSuccess) {
      console.log("Deposit transaction successful");
      setCurrentStep("connect");

      // Fetch pool address if not already fetched
      if (!poolAddress) {
        fetchPoolAddress();
      }
    }
  }, [isDepositSuccess]);

  // Fetch the distribution pool address
  const fetchPoolAddress = async () => {
    if (!vaultAddressToUse || !publicClient) {
      console.error(
        "Cannot fetch pool address: missing vault address or public client"
      );
      setConnectPoolError("Missing vault address or client connection");
      return;
    }

    try {
      console.log(
        "Fetching distribution pool address for vault:",
        vaultAddressToUse
      );

      // Ensure the vault address is properly formatted
      const formattedVaultAddress = vaultAddressToUse as `0x${string}`;

      // Log the contract call parameters for debugging
      console.log("Contract call parameters:", {
        address: formattedVaultAddress,
        abi: YIELD_BOX_ABI,
        functionName: "distributionPool",
      });

      const pool = await publicClient.readContract({
        address: formattedVaultAddress,
        abi: YIELD_BOX_ABI,
        functionName: "distributionPool",
      });

      console.log("Distribution pool address fetched:", pool);

      if (!pool || pool === "0x0000000000000000000000000000000000000000") {
        console.error("Invalid pool address returned:", pool);
        setConnectPoolError(
          "Invalid distribution pool address returned from contract"
        );
        return;
      }

      setPoolAddress(pool as string);
    } catch (error: any) {
      console.error("Error fetching distribution pool address:", error);

      // Provide more detailed error message
      const errorMessage = error?.message || "Unknown error";
      setConnectPoolError(
        `Failed to fetch distribution pool address: ${errorMessage}`
      );

      // For debugging purposes, log the error details
      if (error?.cause) {
        console.error("Error cause:", error.cause);
      }
    }
  };

  // Write contract for connecting to the pool
  const {
    writeContract: writeConnectPool,
    data: connectPoolHash,
    isPending: isConnectPoolPending,
    isError: isConnectPoolError,
    error: connectPoolErrorData,
  } = useWriteContract();

  // Wait for connect pool transaction
  const { isLoading: isConnectPoolLoading, isSuccess: isConnectPoolSuccess } =
    useWaitForTransactionReceipt({
      hash: connectPoolHash,
    });

  // Effect to handle connect pool errors
  useEffect(() => {
    if (isConnectPoolError && connectPoolErrorData) {
      console.error("Connect pool error:", connectPoolErrorData);
      setConnectPoolError(
        `Failed to connect to pool: ${connectPoolErrorData.message}`
      );
      setIsConnectingPool(false);
    }
  }, [isConnectPoolError, connectPoolErrorData]);

  // Effect to handle connect pool success
  useEffect(() => {
    if (isConnectPoolSuccess) {
      console.log("Connect output flow transaction successful");
      setCurrentStep("complete");
      setShowSuccess(true);
    }
  }, [isConnectPoolSuccess]);

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
    if (maxAmount > 0) {
      const newAmount = ((value[0] / 100) * maxAmount).toFixed(4);
      setAmount(newAmount);
    }
  };

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    if (maxAmount > 0 && parseFloat(value) > 0) {
      const percentage = Math.min(100, (parseFloat(value) / maxAmount) * 100);
      setSliderValue(percentage);
    } else {
      setSliderValue(0);
    }
  };

  // Handle refresh allowance
  const handleRefreshAllowance = () => {
    refetchAllowance();
  };

  // Handle approve
  const handleApprove = async () => {
    if (
      !address ||
      !asset?.underlyingAssetAddress ||
      !vaultAddressToUse ||
      !isAmountValid
    )
      return;

    setError("");

    try {
      console.log("Approving:", {
        token: asset.underlyingAssetAddress,
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
      setError("Failed to deposit fluid. Please try again.");
    }
  };

  // Handle connect to pool
  const handleConnectPool = async () => {
    if (!address || !asset) return;

    setConnectPoolError(null);
    setIsConnectingPool(true);

    try {
      // If we don't have a pool address yet, try to fetch it
      if (!poolAddress) {
        console.log("No distribution pool address available, fetching it now");
        await fetchPoolAddress();

        // If we still don't have a pool address after fetching, return
        if (!poolAddress) {
          console.error("Failed to get distribution pool address");
          setIsConnectingPool(false);
          return;
        }
      }

      console.log("Connecting output flow:", {
        forwarderAddress: gdav1Forwarder.address,
        poolAddress: poolAddress,
        vaultAddress: asset.vaultAddress,
      });

      // Ensure addresses are properly formatted
      const formattedVaultAddress = asset.vaultAddress as `0x${string}`;
      const formattedPoolAddress = poolAddress as `0x${string}`;

      writeConnectPool({
        address: gdav1Forwarder.address,
        abi: gdav1Forwarder.abi,
        functionName: "connectPool",
        args: [formattedVaultAddress, formattedPoolAddress, "0x"],
      });
    } catch (error: any) {
      console.error("Connect output flow error:", error);
      const errorMessage = error?.message || "Unknown error";
      setConnectPoolError(`Failed to connect output flow: ${errorMessage}`);
      setIsConnectingPool(false);
    }
  };

  // Handle success completion
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

  // Combined loading state for current step
  const isLoading =
    (currentStep === "approve" && (isApproveLoading || isApproving)) ||
    (currentStep === "deposit" && (isDepositLoading || isDepositing)) ||
    (currentStep === "connect" &&
      (isConnectPoolLoading || isConnectPoolPending));

  return (
    <>
      {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} />}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Deposit Fluid</CardTitle>
          <CardDescription>
            Deposit {asset?.name} to start earning yield
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error display */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step indicator */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <div
                className={`text-sm font-medium ${currentStep === "approve" || currentStep === "deposit" || currentStep === "connect" || currentStep === "complete" ? "text-purple-600" : "text-gray-400"}`}
              >
                1. Approve
              </div>
              <div
                className={`text-sm font-medium ${currentStep === "deposit" || currentStep === "connect" || currentStep === "complete" ? "text-purple-600" : "text-gray-400"}`}
              >
                2. Deposit
              </div>
              <div
                className={`text-sm font-medium ${currentStep === "connect" || currentStep === "complete" ? "text-purple-600" : "text-gray-400"}`}
              >
                3. Connect Flow
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full"
                style={{
                  width:
                    currentStep === "approve"
                      ? "33%"
                      : currentStep === "deposit"
                        ? "66%"
                        : "100%",
                }}
              ></div>
            </div>
          </div>

          {/* Connect pool error */}
          {connectPoolError && currentStep === "connect" && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{connectPoolError}</AlertDescription>
            </Alert>
          )}

          {/* Step content */}
          {currentStep === "approve" && (
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
                      isLoading || isLoadingBalance || isLoadingAllowance
                    }
                    className="flex-1 text-black"
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
                      defaultValue={[100]}
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
                        <span className="text-muted-foreground">
                          Selected:{" "}
                        </span>
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
                    {(
                      Number(amount || 0) *
                      (asset.yieldRate / 100 / 12)
                    ).toFixed(4)}{" "}
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
            </div>
          )}

          {currentStep === "deposit" && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="deposit-amount" className="mb-2 block">
                  Amount to Deposit
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="deposit-amount"
                    type="number"
                    value={amount}
                    disabled={true}
                    className="flex-1 text-black"
                  />
                  <span className="text-sm font-medium">{asset.symbol}</span>
                </div>
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
                    {(
                      Number(amount || 0) *
                      (asset.yieldRate / 100 / 12)
                    ).toFixed(4)}{" "}
                    USDC
                  </span>
                </div>
              </div>

              <div className="p-4 border border-purple-200 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Ready to Deposit Fluid
                </h3>
                <p className="text-sm text-white mb-4">
                  You've approved {amount} {asset.symbol}. Now deposit your
                  fluid to start earning yield.
                </p>

                {isDepositLoading || isDepositing ? (
                  <div className="flex items-center justify-center p-2 bg-purple-100 rounded">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin text-purple-600" />
                    <span className="text-purple-700">Depositing fluid...</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {currentStep === "connect" && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="connect-amount" className="mb-2 block">
                  Deposited Amount
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="connect-amount"
                    type="number"
                    value={amount}
                    disabled={true}
                    className="flex-1 text-black"
                  />
                  <span className="text-sm font-medium">{asset.symbol}</span>
                </div>
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
                    {(
                      Number(amount || 0) *
                      (asset.yieldRate / 100 / 12)
                    ).toFixed(4)}{" "}
                    USDC
                  </span>
                </div>
              </div>

              <div className="p-4 border border-purple-200 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Fluid Deposited Successfully!
                </h3>
                <p className="text-sm text-white mb-4">
                  To start receiving yield, you need to connect to the output
                  flow.
                </p>

                {connectPoolError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 mb-2">
                      {connectPoolError}
                    </p>
                    <Button
                      onClick={fetchPoolAddress}
                      variant="outline"
                      size="sm"
                      className="bg-purple-50 hover:bg-purple-100 border-purple-200"
                    >
                      Retry Fetching Distribution Pool
                    </Button>
                  </div>
                )}

                {isConnectPoolLoading || isConnectPoolPending ? (
                  <div className="flex items-center justify-center p-2 bg-purple-100 rounded">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin text-purple-600" />
                    <span className="text-purple-700">
                      Connecting to output flow...
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {currentStep === "approve" && (
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
          )}

          {currentStep === "deposit" && (
            <Button
              onClick={handleDeposit}
              disabled={isDepositing || isDepositLoading}
              className="w-full bg-purple-700 hover:bg-purple-600"
            >
              {isDepositing || isDepositLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Depositing Fluid...
                </>
              ) : (
                "Deposit Fluid"
              )}
            </Button>
          )}

          {currentStep === "connect" && (
            <Button
              onClick={handleConnectPool}
              disabled={
                !poolAddress || isConnectPoolLoading || isConnectPoolPending
              }
              className="w-full bg-purple-700 hover:bg-purple-600"
            >
              {isConnectPoolLoading || isConnectPoolPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting Output Flow...
                </>
              ) : (
                "Connect Output Flow"
              )}
            </Button>
          )}

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
