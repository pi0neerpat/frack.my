#!/bin/bash

# Base Mainnet RPC URL - Replace with your own RPC URL if needed
BASE_RPC_URL="https://base-mainnet.rpc.x.superfluid.dev"

# Start Anvil with Base fork
echo "Starting Anvil with Base network fork..."
anvil --fork-url $BASE_RPC_URL \
      --chain-id 8453 \
      --block-time 12 \
      --port 8545 \
      --hardfork shanghai 