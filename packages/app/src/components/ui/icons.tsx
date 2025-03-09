import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState, useEffect } from "react";

interface IconProps {
  name: string;
  className?: string;
  tokenAddress?: string; // Token address for dynamic path
  chainId?: string | number; // Chain ID, defaults to 8453 (Base)
}

export function Icon({
  name,
  className,
  tokenAddress,
  chainId = "8453",
}: IconProps) {
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [iconError, setIconError] = useState(false);
  const assetName = name.toLowerCase();

  useEffect(() => {
    // Reset error state when props change
    setIconError(false);

    // Use the token address to construct the dynamic path
    if (tokenAddress) {
      const dynamicPath = `/icons/${chainId}/${tokenAddress}/logo.svg`;
      setIconSrc(dynamicPath);
    } else {
      // If no token address is provided, use a default unknown token icon
      setIconSrc(`/icons/unknown-token.svg`);
    }
  }, [tokenAddress, chainId]);

  // Handle image load error
  const handleError = () => {
    setIconError(true);
    setIconSrc(`/icons/unknown-token.svg`);
  };

  return (
    <div className={cn("w-full h-full relative", className)}>
      {iconSrc ? (
        <Image
          src={iconSrc}
          alt={`${assetName} icon`}
          fill
          className="object-contain"
          onError={handleError}
          unoptimized={true} // Don't optimize dynamic paths
        />
      ) : (
        <Image
          src="/icons/unknown-token.svg"
          alt={`${assetName} icon`}
          fill
          className="object-contain"
        />
      )}
    </div>
  );
}
