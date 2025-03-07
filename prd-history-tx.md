# Implementation Plan: Local Transaction Storage & Drill-Specific Transaction Display

## 1. Local Transaction Storage Architecture (Using localStorage)

### Data Model

```typescript
// Define the transaction data structure
interface Transaction {
  id: string;                // Unique identifier (txHash + event index)
  txHash: string;            // Transaction hash
  blockNumber: number;       // Block number for sorting and data integrity
  timestamp: number;         // Unix timestamp
  type: 'deposit' | 'withdraw' | 'harvest' | 'stream'; // Transaction type
  userAddress: string;       // User's wallet address
  amount: string;            // Amount as string (to preserve precision)
  token: string;             // Token address or symbol
  usdValue?: string;         // USD value at transaction time (if available)
  drillId?: string;          // Associated drill ID (for filtering)
  status: 'confirmed' | 'pending'; // Transaction status
  metadata?: Record<string, any>; // Additional transaction-specific data
}

// Define the localStorage structure
interface TransactionStore {
  transactions: Record<string, Transaction>;  // Keyed by transaction ID
  lastUpdated: number;                        // Timestamp for cache invalidation
  lastFetchedBlock: number;                   // For incremental updates
}
```

### Storage Implementation with localStorage

```typescript
// src/lib/transaction-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Using Zustand with the persist middleware to store data in localStorage
type TransactionState = {
  transactions: Record<string, Transaction>;
  lastUpdated: number;
  lastFetchedBlock: number;
  
  // Actions
  addTransaction: (transaction: Transaction) => void;
  addTransactions: (transactions: Transaction[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  clearTransactions: () => void;
  setLastFetchedBlock: (blockNumber: number) => void;
};

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: {},
      lastUpdated: 0,
      lastFetchedBlock: 0,
      
      addTransaction: (transaction) => 
        set((state) => ({
          transactions: { 
            ...state.transactions, 
            [transaction.id]: transaction 
          },
          lastUpdated: Date.now(),
        })),
        
      addTransactions: (transactions) => 
        set((state) => {
          const newTransactions = { ...state.transactions };
          transactions.forEach(tx => {
            newTransactions[tx.id] = tx;
          });
          
          return {
            transactions: newTransactions,
            lastUpdated: Date.now(),
          };
        }),
        
      updateTransaction: (id, updates) => 
        set((state) => ({
          transactions: {
            ...state.transactions,
            [id]: { ...state.transactions[id], ...updates }
          },
        })),
        
      clearTransactions: () => 
        set({ transactions: {}, lastUpdated: Date.now() }),
        
      setLastFetchedBlock: (blockNumber) => 
        set({ lastFetchedBlock: blockNumber }),
    }),
    {
      name: 'frack-my-transactions', // localStorage key name
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          // Optionally implement size checking and pruning logic here
          // if (JSON.stringify(value).length > SOME_LIMIT) { prune old transactions }
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
```

## 2. Transaction Fetching Logic (with localStorage Caching)

```typescript
// src/hooks/use-transactions.ts
import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { useTransactionStore } from '@/lib/transaction-store';

// Constants for your contract events
const DEPOSIT_EVENT = parseAbiItem('event Deposit(address indexed user, uint256 assets, uint256 shares)');
const WITHDRAW_EVENT = parseAbiItem('event Withdraw(address indexed user, address receiver, address owner, uint256 assets, uint256 shares)');
const HARVEST_EVENT = parseAbiItem('event HarvestYield(uint256 yieldAmount)');
const STREAM_EVENT = parseAbiItem('event StreamUpdated(address indexed user, int96 flowRate)');

export function useTransactions(drillId?: string) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const {
    transactions,
    lastFetchedBlock,
    addTransactions,
    setLastFetchedBlock,
  } = useTransactionStore();
  
  // Filter transactions by drill ID if provided
  const filteredTransactions = drillId
    ? Object.values(transactions).filter(tx => tx.drillId === drillId)
    : Object.values(transactions);
    
  // Sort transactions by timestamp (newest first)
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => b.timestamp - a.timestamp
  );
  
  // Function to fetch historical logs and cache in localStorage
  const fetchHistoricalLogs = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Determine start block (use last fetched from localStorage or a default)
      const fromBlock = lastFetchedBlock > 0 
        ? lastFetchedBlock + 1 
        : BigInt(process.env.NEXT_PUBLIC_STARTING_BLOCK || '0');
      
      // Get current block
      const latestBlock = await publicClient.getBlockNumber();
      
      // Fetch deposit logs
      const depositLogs = await publicClient.getLogs({
        address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
        event: DEPOSIT_EVENT,
        args: {
          user: address as `0x${string}`
        },
        fromBlock,
        toBlock: latestBlock
      });
      
      // Fetch withdrawal logs (similar pattern)
      // ... similar code for withdrawal logs
      
      // Parse logs into transactions
      const parsedTransactions = await Promise.all([
        ...depositLogs.map(async (log) => {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          
          // Return a Transaction object
          return {
            id: `${log.transactionHash}-${log.logIndex}`,
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
            timestamp: Number(block.timestamp),
            type: 'deposit',
            userAddress: address,
            amount: log.args.assets.toString(),
            token: 'ETH', // Or determine from contract
            drillId: await getDrillIdFromDeposit(log), // Function to determine drill ID
            status: 'confirmed',
          } as Transaction;
        }),
        // ... similar mapping for withdraw logs
      ]);
      
      // Update localStorage store through Zustand
      addTransactions(parsedTransactions);
      setLastFetchedBlock(Number(latestBlock));
    } catch (err) {
      console.error('Error fetching transaction logs:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch transaction logs'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to determine drill ID from deposit (implementation depends on your contract)
  const getDrillIdFromDeposit = async (log: any): Promise<string> => {
    // This function would need to interpret the deposit event and determine
    // which drill it's associated with based on your contract logic
    return 'some-drill-id';
  };
  
  // Effect to fetch logs on component mount and address change
  // This will use the cached data from localStorage first, then update if needed
  useEffect(() => {
    if (address) {
      fetchHistoricalLogs();
    }
  }, [address]);
  
  // Return data and controls
  return {
    transactions: sortedTransactions,
    isLoading,
    error,
    refetch: fetchHistoricalLogs,
  };
}
```

## 3. Drill-Specific Transaction Component

```typescript
// src/components/drill/drill-transactions.tsx
import { useState } from 'react';
import { useTransactions } from '@/hooks/use-transactions';
import { formatDistanceToNow } from 'date-fns';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import { formatEther, formatUnits } from 'viem';

interface DrillTransactionsProps {
  drillId: string;
}

export function DrillTransactions({ drillId }: DrillTransactionsProps) {
  const { transactions, isLoading, error, refetch } = useTransactions(drillId);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Filter transactions based on active tab
  const filteredTransactions = activeTab === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === activeTab);
  
  if (isLoading && transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drill Transactions</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drill Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">
            <p>Error loading transactions</p>
            <button 
              onClick={() => refetch()} 
              className="mt-2 text-sm underline"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Drill Transactions</CardTitle>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="deposit">Deposits</TabsTrigger>
            <TabsTrigger value="withdraw">Withdrawals</TabsTrigger>
            <TabsTrigger value="harvest">Harvests</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value={activeTab} className="pt-2">
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {tx.type === 'deposit' && (
                            <ArrowDown className="mr-2 h-4 w-4 text-green-500" />
                          )}
                          {tx.type === 'withdraw' && (
                            <ArrowUp className="mr-2 h-4 w-4 text-red-500" />
                          )}
                          {tx.type === 'harvest' && (
                            <span className="mr-2">🌾</span>
                          )}
                          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatEther(BigInt(tx.amount))} {tx.token}
                        {tx.usdValue && (
                          <div className="text-xs text-muted-foreground">
                            ${tx.usdValue}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <a 
                          href={`https://etherscan.io/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {`${tx.txHash.substring(0, 6)}...${tx.txHash.substring(tx.txHash.length - 4)}`}
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
```

## 4. Integration with Drill Page

To integrate the transaction display on the drill page, you'll need to modify the drill page component to include the `DrillTransactions` component:

```typescript
// src/app/drills/[id]/page.tsx
import { DrillDetails } from '@/components/drill/drill-details';
import { DrillTransactions } from '@/components/drill/drill-transactions';
import { OilPool } from '@/components/oil-pool';

export default function DrillPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-4xl font-bold">Drill Details</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Drill details section */}
        <div className="lg:col-span-2">
          <DrillDetails drillId={id} />
        </div>
        
        {/* Oil pool section */}
        <div>
          <OilPool drillId={id} />
        </div>
      </div>
      
      {/* Transactions section - full width */}
      <div>
        <DrillTransactions drillId={id} />
      </div>
    </div>
  );
}
```

## 5. Auto-Updating Mechanism with localStorage Storage

The transaction store should be updated when new transactions occur, with all data persisted to localStorage automatically through Zustand:

```typescript
// src/hooks/use-transaction-watcher.ts
import { useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { useTransactionStore } from '@/lib/transaction-store';

export function useTransactionWatcher() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const { addTransaction } = useTransactionStore();
  
  useEffect(() => {
    if (!address || !publicClient || !walletClient) return;
    
    // Set up event listeners for real-time updates
    const unwatch = publicClient.watchContractEvent({
      address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
      event: parseAbiItem('event Deposit(address indexed user, uint256 assets, uint256 shares)'),
      onLogs: async (logs) => {
        // Filter for current user
        const userLogs = logs.filter(log => 
          log.args.user?.toLowerCase() === address.toLowerCase()
        );
        
        // Process and add to localStorage via Zustand
        for (const log of userLogs) {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          
          addTransaction({
            id: `${log.transactionHash}-${log.logIndex}`,
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
            timestamp: Number(block.timestamp),
            type: 'deposit',
            userAddress: address,
            amount: log.args.assets?.toString() || '0',
            token: 'ETH', // Or determine from contract
            status: 'confirmed',
            // You would need to determine drill ID here
          });
        }
      },
    });
    
    // Similar watchers for other event types
    // ...
    
    return () => {
      unwatch(); // Cleanup on unmount
      // Cleanup other watchers
    };
  }, [address, publicClient, walletClient]);
  
  return null;
}
```

## 6. Real-Time Transaction Handling with localStorage Updates

To ensure real-time updates when a user performs a new transaction, with data persisted to localStorage:

```typescript
// src/hooks/use-transaction-handler.ts
import { useState } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { useTransactionStore } from '@/lib/transaction-store';

export function useDepositTransaction(drillId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const { addTransaction, updateTransaction } = useTransactionStore();
  
  const { 
    write: deposit,
    data: depositData,
    isLoading: isDepositLoading,
    error: depositError
  } = useContractWrite({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: [...],
    functionName: 'deposit',
  });
  
  // Wait for transaction confirmation
  const { isLoading: isConfirming } = useWaitForTransaction({
    hash: depositData?.hash,
    onSuccess: async (data) => {
      // Update the transaction status to confirmed
      if (depositData?.hash) {
        updateTransaction(`${depositData.hash}-0`, {
          status: 'confirmed',
        });
      }
    },
  });
  
  // Function to handle deposit
  const handleDeposit = async (amount: bigint) => {
    setIsLoading(true);
    try {
      // Execute deposit transaction
      deposit({
        args: [amount],
        onSuccess: (data) => {
          // Add pending transaction to store
          addTransaction({
            id: `${data.hash}-0`, // Placeholder log index
            txHash: data.hash,
            blockNumber: 0, // Will be updated after confirmation
            timestamp: Math.floor(Date.now() / 1000),
            type: 'deposit',
            userAddress: data.from,
            amount: amount.toString(),
            token: 'ETH',
            drillId,
            status: 'pending',
          });
        }
      });
    } catch (error) {
      console.error('Deposit error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    deposit: handleDeposit,
    isLoading: isLoading || isDepositLoading || isConfirming,
    error: depositError,
  };
}

// Similar hooks for withdraw and harvest
```

## 7. localStorage Optimization Strategy

Because localStorage has a limited size (usually 5-10MB depending on the browser), we need to implement strategies to manage data growth:

### Size Management

```typescript
// src/lib/storage-manager.ts
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit

export function manageStorageSize(storeName: string) {
  // Get current storage size
  const data = localStorage.getItem(storeName);
  if (!data) return;
  
  // Check size
  const sizeInBytes = new Blob([data]).size;
  
  // If approaching limits, prune old transactions
  if (sizeInBytes > MAX_STORAGE_SIZE) {
    const parsedData = JSON.parse(data);
    if (!parsedData.state?.transactions) return;
    
    // Get all transactions and sort by timestamp
    const transactions = Object.values(parsedData.state.transactions) as Transaction[];
    const sortedTransactions = [...transactions].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    
    // Remove oldest 20% of transactions
    const removeCount = Math.ceil(sortedTransactions.length * 0.2);
    const transactionsToKeep = sortedTransactions.slice(removeCount);
    
    // Rebuild transaction map
    const newTransactions: Record<string, Transaction> = {};
    transactionsToKeep.forEach(tx => {
      newTransactions[tx.id] = tx;
    });
    
    // Update storage
    parsedData.state.transactions = newTransactions;
    localStorage.setItem(storeName, JSON.stringify(parsedData));
  }
}
```

### Integration with Transaction Store

Update the storage implementation to use this manager:

```typescript
// In transaction-store.ts, update the persist middleware

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      // ... existing implementation
    }),
    {
      name: 'frack-my-transactions',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
          // After updating storage, check and manage size
          manageStorageSize(name);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
```

## 8. Implementation Timeline

### Phase 1: Core Infrastructure (Week 1)
- Set up localStorage-based transaction store with Zustand
- Implement basic transaction fetching with localStorage caching
- Create storage size management utilities

### Phase 2: Drill-Specific Transaction UI (Week 2)
- Develop the DrillTransactions component that reads from localStorage
- Integrate with drill page
- Add filtering and sorting capabilities for local data

### Phase 3: Real-Time Updates (Week 3)
- Implement event watchers for real-time updates with localStorage persistence
- Add transaction handling for new user actions
- Finalize UI/UX and test across scenarios
- Implement localStorage pruning for performance

## 9. Testing Strategy

### Unit Tests
- Test localStorage persistence with mock data
- Test storage size management functionality
- Test data formatting and filtering logic

### Integration Tests
- Test event parsing and localStorage updates
- Test UI components with localStorage mock data

### End-to-End Tests
- Test full transaction flow (create transaction → store in localStorage → display in history)
- Test storage limitations and pruning mechanisms
- Test persistence across page refreshes

## 10. localStorage Considerations and Limitations

- **Size Limits**: localStorage is typically limited to 5-10MB per domain. Implement pruning strategies.
- **Performance**: For large datasets, reading/writing to localStorage can impact performance. Use optimization techniques like serialization/deserialization optimization.
- **Persistence**: Data persists across browser sessions but will be lost if the user clears browser data or uses private browsing.
- **User Privacy**: Consider adding an option for users to clear their transaction history.
- **Cross-Device Limitation**: localStorage is device-specific, so users won't see the same history across different devices.
