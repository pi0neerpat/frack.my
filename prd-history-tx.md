# Implementation Plan: Local Transaction Storage & Drill-Specific Transaction Display

## 1. Local Transaction Storage Architecture

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

// Define the storage structure
interface TransactionStore {
  transactions: Record<string, Transaction>;  // Keyed by transaction ID
  lastUpdated: number;                        // Timestamp for cache invalidation
  lastFetchedBlock: number;                   // For incremental updates
}
```

### Storage Implementation

```typescript
// src/lib/transaction-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
      name: 'frack-my-transactions',
    }
  )
);
```

## 2. Transaction Fetching Logic

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
  
  // Function to fetch historical logs
  const fetchHistoricalLogs = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Determine start block (use last fetched or a default)
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
      
      // Update store
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

## 5. Auto-Updating Mechanism

The transaction store should be updated when new transactions occur. One approach is to listen for real-time events:

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
        
        // Process and add to store
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

## 6. Real-Time Transaction Handling

To ensure real-time updates when a user performs a new transaction through your UI:

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

## 7. Implementation Timeline

### Phase 1: Core Infrastructure (Week 1)
- Set up transaction store with Zustand
- Implement basic transaction fetching
- Create transaction indexing service

### Phase 2: Drill-Specific Transaction UI (Week 2)
- Develop the DrillTransactions component
- Integrate with drill page
- Add filtering and sorting capabilities

### Phase 3: Real-Time Updates (Week 3)
- Implement event watchers for real-time updates
- Add transaction handling for new user actions
- Finalize UI/UX and test across scenarios

## 8. Testing Strategy

### Unit Tests
- Test store functionality (adding, updating transactions)
- Test data formatting and filtering logic

### Integration Tests
- Test event parsing and contract interaction
- Test UI components with mock data

### End-to-End Tests
- Test full transaction flow (create transaction → display in history)
- Test drill-specific filtering
