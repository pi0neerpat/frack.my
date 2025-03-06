import { cn } from "@/lib/utils";

const VALID_ASSETS = ["eth", "wsteth", "reth", "btc"] as const;
type AssetType = typeof VALID_ASSETS[number];

const isValidAsset = (asset: string): asset is AssetType => {
  return VALID_ASSETS.includes(asset as AssetType);
};

interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className }: IconProps) {
  const assetName = name.toLowerCase();

  return (
    <div className={cn("w-full h-full", className)}>
      {isValidAsset(assetName) ? (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {assetName === "eth" && (
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zm-1.194-5.132L6 12.789l4.806-2.832L15.613 12.8l-4.807 6.068zM6 11.211l4.806 2.832V3L6 11.211zm9.613 1.589l-4.807-2.832V3l4.807 8.8z"
              fill="currentColor"
            />
          )}
          {assetName === "wsteth" && (
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zm-1.194-5.132L6 12.789l4.806-2.832L15.613 12.8l-4.807 6.068zM6 11.211l4.806 2.832V3L6 11.211zm9.613 1.589l-4.807-2.832V3l4.807 8.8z"
              fill="#00A3FF"
            />
          )}
          {assetName === "reth" && (
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zm-.5-5L7 13.5 11.5 11 16 13.5 11.5 19zM7 12l4.5 2.5V5L7 12zm9 1.5L11.5 11V5L16 12v1.5z"
              fill="#FF5B28"
            />
          )}
          {assetName === "btc" && (
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zm1.5-17.5h-3v7h3c1.933 0 3.5-1.567 3.5-3.5s-1.567-3.5-3.5-3.5zM9 18v-3h4.5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5H9z"
              fill="#F7931A"
            />
          )}
          {!isValidAsset(assetName) && (
            <>
              <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2"/>
              <path 
                d="M12 6C9.79086 6 8 7.79086 8 10C8 11.1 8.4 12.1 9.1 12.8L8 17H16L14.9 12.8C15.6 12.1 16 11.1 16 10C16 7.79086 14.2091 6 12 6Z" 
                stroke="currentColor" 
                strokeWidth="2"
              />
            </>
          )}
        </svg>
      ) : null}
    </div>
  );
}
