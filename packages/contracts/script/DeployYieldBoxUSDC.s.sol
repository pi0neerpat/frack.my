// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {YieldBoxUSDC} from "../src/YieldBoxUSDC.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {console} from "forge-std/console.sol";
contract DeployYieldBoxUSDC is Script {
    // Base mainnet addresses
    address constant USDC_ADDRESS = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant USDCx_ADDRESS = 0xD04383398dD2426297da660F9CCA3d439AF9ce1b;
    
    // Input your production vault address here
    // This vault should follow ERC4626 standard and accept USDC as its underlying asset
    address constant VAULT_ADDRESS = 0x0A1a3b5f2041F33522C4efc754a7D096f880eE16; // Replace with actual vault address
    
    // Pool configuration
    string constant POOL_NAME = "YieldBox USDC";
    string constant POOL_SYMBOL = "YBX-USDC";
    uint8 constant POOL_DECIMALS = 6; // Match USDC decimals
    
    function run() external {
        // Load environment variables - done in Foundry via CLI
        // Private key should be passed via command line args

        // Verify the vault uses USDC as underlying
        require(
            IERC4626(VAULT_ADDRESS).asset() == USDC_ADDRESS,
            "Vault must use USDC as underlying asset"
        );
        console.log("vault verified");
        // Verify USDCx uses USDC as underlying
        require(
            ISuperToken(USDCx_ADDRESS).getUnderlyingToken() == USDC_ADDRESS,
            "USDCx must use USDC as underlying token"
        );
        console.log("USDCx verified");
        console.log("about to broadcast");
        // Broadcast transactions 
        vm.startBroadcast();
        
        // Deploy YieldBoxUSDC
        YieldBoxUSDC yieldBox = new YieldBoxUSDC(
            VAULT_ADDRESS,
            USDCx_ADDRESS,
            POOL_NAME,
            POOL_SYMBOL,
            POOL_DECIMALS
        );
        
        vm.stopBroadcast();
        
        // Output deployment information
        console.log("YieldBoxUSDC deployed to:", address(yieldBox));
        console.log("Underlying vault:", VAULT_ADDRESS);
        console.log("Yield token (USDCx):", USDCx_ADDRESS);
        console.log("Fee recipient:", yieldBox.feeRecipient());
    }
}