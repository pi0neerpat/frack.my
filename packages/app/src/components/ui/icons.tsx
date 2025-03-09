import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState, useEffect } from "react";

interface IconProps {
  name: string;
  className?: string;
  tokenAddress?: `0x${string}`; // Token address for dynamic path
  chainId?: string | number; // Chain ID, defaults to 8453 (Base)
  size?: number; // Optional size prop
  contractAddress?: `0x${string}`; // Fallback if tokenAddress is not provided
}

export function Icon({
  name,
  className,
  tokenAddress,
  chainId = "8453",
  size = 32,
  contractAddress,
}: IconProps) {
  // Use tokenAddress if available, otherwise try contractAddress
  const effectiveAddress = tokenAddress || contractAddress;

  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const assetName = name.toLowerCase();

  // Debug log the token address
  console.log(`Icon component for ${name}:`, {
    tokenAddress,
    contractAddress,
    effectiveAddress,
    chainId,
    component: "Icon",
  });

  // Define all possible paths to try in order
  const getPaths = (address: string): string[] => {
    const normalizedAddress = address.toLowerCase();
    return [
      // Try these paths in order
      `/icons/${chainId}/${normalizedAddress}/logo.svg`,
      `/icons/${chainId}/${normalizedAddress}/logo.png`,
      `/icons/${chainId}/${normalizedAddress}.svg`,
      `/icons/${chainId}/${normalizedAddress}.png`,
      `/icons/${chainId}/${normalizedAddress}`,
      `https://tokens.1inch.io/${normalizedAddress}.png`,
      `/icons/unknown-token.svg`,
    ];
  };

  useEffect(() => {
    // Reset fallback index when props change
    setFallbackIndex(0);

    if (effectiveAddress) {
      const paths = getPaths(effectiveAddress);
      console.log(`Trying paths for ${name}:`, paths[0]);
      setIconSrc(paths[0]);
    } else {
      console.log(`No address for ${name}, using unknown icon`);
      setIconSrc(`/icons/unknown-token.svg`);
    }
  }, [effectiveAddress, chainId, name]);

  // Handle image load error by trying the next path
  const handleError = () => {
    if (effectiveAddress) {
      const paths = getPaths(effectiveAddress);
      const nextIndex = fallbackIndex + 1;

      // If we have more paths to try
      if (nextIndex < paths.length) {
        console.log(`Path failed for ${name}, trying next:`, paths[nextIndex]);
        setFallbackIndex(nextIndex);
        setIconSrc(paths[nextIndex]);
      } else {
        console.log(`All paths failed for ${name}, using unknown icon`);
        setIconSrc(`/icons/unknown-token.svg`);
      }
    } else {
      setIconSrc(`/icons/unknown-token.svg`);
    }
  };

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      {iconSrc && (
        <Image
          src={iconSrc}
          alt={`${assetName} icon`}
          fill
          className="object-contain"
          onError={handleError}
          unoptimized={true}
        />
      )}
    </div>
  );
}
