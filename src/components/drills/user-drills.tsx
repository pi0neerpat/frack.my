import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export function UserDrills() {
  const { address } = useAccount();

  const { data: userDrills, isLoading } = useQuery({
    queryKey: ["userDrills", address],
    queryFn: async () => {
      // Query function implementation
      return [];
    },
    enabled: !!address,
  });

  // ... existing code ...
}
