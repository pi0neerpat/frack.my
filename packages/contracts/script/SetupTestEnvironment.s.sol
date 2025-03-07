// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/YieldBox.sol";
import "../src/mocks/MockERC20.sol";
import "../src/mocks/MockStrategy.sol";
import "../src/mocks/MockSuperToken.sol";

contract SetupTestEnvironment is Script {
    // Addresses from the default Anvil private keys
    address public constant DEPLOYER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address public constant USER1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address public constant USER2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

    // Contract addresses (to be filled in during deployment)
    address public underlyingTokenAddress;
    address public strategyAddress;
    address public superTokenAddress;
    address public yieldBoxAddress;

    function run() external {
        // Use the default Anvil private key for the first account
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        console.log("Setting up test environment with deployer:", DEPLOYER);

        vm.startBroadcast(deployerPrivateKey);

        // Load contract addresses from the deployment
        // Note: These addresses should be updated after running DeployToAnvil.s.sol
        underlyingTokenAddress = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
        strategyAddress = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;
        superTokenAddress = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;
        yieldBoxAddress = 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9;

        // Verify contract addresses exist
        require(underlyingTokenAddress != address(0), "Underlying token address not set");
        require(strategyAddress != address(0), "Strategy address not set");
        require(superTokenAddress != address(0), "SuperToken address not set");
        require(yieldBoxAddress != address(0), "YieldBox address not set");

        console.log("Loaded contract addresses:");
        console.log("- Underlying Token:", underlyingTokenAddress);
        console.log("- Strategy:", strategyAddress);
        console.log("- SuperToken:", superTokenAddress);
        console.log("- YieldBox:", yieldBoxAddress);

        // Load contract instances
        MockERC20 underlyingToken = MockERC20(underlyingTokenAddress);
        YieldBox yieldBox = YieldBox(yieldBoxAddress);
        MockStrategy strategy = MockStrategy(strategyAddress);

        // Check if contracts exist at the addresses
        try underlyingToken.balanceOf(address(0)) returns (uint256) {
            console.log("Underlying token contract verified");
        } catch {
            revert("Underlying token contract not found or not accessible");
        }

        try strategy.generateYield(0) {
            console.log("Strategy contract verified");
        } catch {
            revert("Strategy contract not found or not accessible");
        }

        // Setup USER1
        uint256 user1Amount = 100_000 * 10 ** 18;
        console.log("Attempting to mint tokens to USER1...");
        underlyingToken.mint(USER1, user1Amount);
        console.log("Minted", user1Amount, "tokens to USER1:", USER1);
        console.log("USER1 balance:", underlyingToken.balanceOf(USER1));

        // Setup USER2
        uint256 user2Amount = 200_000 * 10 ** 18;
        console.log("Attempting to mint tokens to USER2...");
        underlyingToken.mint(USER2, user2Amount);
        console.log("Minted", user2Amount, "tokens to USER2:", USER2);
        console.log("USER2 balance:", underlyingToken.balanceOf(USER2));

        // Make a deposit for USER1 to demonstrate the system
        uint256 user1PrivateKey = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
        vm.stopBroadcast();

        vm.startBroadcast(user1PrivateKey);
        uint256 depositAmount = 10_000 * 10 ** 18;

        // Check allowance before approval
        uint256 allowanceBefore = underlyingToken.allowance(USER1, yieldBoxAddress);
        console.log("APPROVAL CHECK: USER1 allowance to YieldBox before approval:", allowanceBefore);

        console.log("USER1 approving YieldBox to spend tokens...");
        underlyingToken.approve(yieldBoxAddress, depositAmount);

        // Verify approval was successful
        uint256 allowanceAfter = underlyingToken.allowance(USER1, yieldBoxAddress);
        console.log("APPROVAL CHECK: USER1 allowance to YieldBox after approval:", allowanceAfter);
        require(allowanceAfter >= depositAmount, "Approval failed or insufficient");

        console.log("USER1 attempting to deposit tokens into YieldBox...");

        // Check balance before deposit
        uint256 balanceBefore = underlyingToken.balanceOf(USER1);
        console.log("USER1 balance before deposit:", balanceBefore);
        require(balanceBefore >= depositAmount, "Insufficient balance for deposit");

        yieldBox.deposit(depositAmount);
        console.log("USER1 deposited", depositAmount, "tokens into YieldBox");
        console.log("USER1 balance after deposit:", underlyingToken.balanceOf(USER1));
        vm.stopBroadcast();

        // Generate some yield
        vm.startBroadcast(deployerPrivateKey);

        // Check initial state before yield generation
        console.log("YIELD GENERATION: Initial state");
        console.log("- YieldBox balance:", underlyingToken.balanceOf(yieldBoxAddress));
        console.log("- Strategy balance:", underlyingToken.balanceOf(strategyAddress));
        console.log("- SuperToken balance:", underlyingToken.balanceOf(superTokenAddress));

        uint256 yieldAmount = 1_000 * 10 ** 18;
        console.log("Attempting to generate yield in the strategy...");

        // Mint tokens to the strategy first to ensure it has enough to generate yield
        console.log("Minting tokens to strategy to ensure it can generate yield...");
        underlyingToken.mint(strategyAddress, yieldAmount * 2); // Mint extra to ensure there's enough

        uint256 strategyBalance = underlyingToken.balanceOf(strategyAddress);
        console.log("Strategy balance before generating yield:", strategyBalance);

        try strategy.generateYield(yieldAmount) {
            console.log("Generated", yieldAmount, "yield in the strategy");
        } catch Error(string memory reason) {
            console.log("Failed to generate yield. Reason:", reason);
            revert("Failed to generate yield");
        } catch {
            console.log("Failed to generate yield with unknown error");
            revert("Failed to generate yield");
        }

        console.log("Strategy balance after generating yield:", underlyingToken.balanceOf(strategyAddress));

        // Harvest the yield - this is where the overflow/underflow occurs
        console.log("HARVEST: Attempting to harvest yield from the strategy...");

        // Check state before harvest
        console.log("State before harvest:");
        console.log("- YieldBox balance:", underlyingToken.balanceOf(yieldBoxAddress));
        console.log("- Strategy balance:", underlyingToken.balanceOf(strategyAddress));
        console.log("- SuperToken balance:", underlyingToken.balanceOf(superTokenAddress));

        // Debug the YieldBox contract
        console.log("Debugging YieldBox contract before harvest:");

        // Try-catch block to get more info about the error
        try yieldBox.harvest() {
            console.log("Harvest successful");
        } catch Error(string memory reason) {
            console.log("Harvest failed with reason:", reason);
            revert(string(abi.encodePacked("Harvest failed: ", reason)));
        } catch {
            console.log("Harvest failed with low-level error (likely arithmetic overflow/underflow)");

            // Let's try to debug by checking if the strategy has enough tokens
            uint256 strategyBalanceAfter = underlyingToken.balanceOf(strategyAddress);
            if (strategyBalanceAfter < yieldAmount) {
                console.log("Strategy doesn't have enough tokens for harvest");
                // Try to mint more tokens to the strategy
                underlyingToken.mint(strategyAddress, yieldAmount * 10);
                console.log("Minted more tokens to strategy, balance now:", underlyingToken.balanceOf(strategyAddress));

                // Try harvest again
                try yieldBox.harvest() {
                    console.log("Harvest successful after adding more tokens");
                } catch {
                    console.log("Harvest still failed after adding more tokens");
                }
            }
        }

        // Check state after harvest attempt
        console.log("State after harvest attempt:");
        console.log("- YieldBox balance:", underlyingToken.balanceOf(yieldBoxAddress));
        console.log("- Strategy balance:", underlyingToken.balanceOf(strategyAddress));
        console.log("- SuperToken balance:", underlyingToken.balanceOf(superTokenAddress));

        vm.stopBroadcast();

        console.log("Test environment setup completed!");
        console.log("YieldBox address:", yieldBoxAddress);
        console.log("Underlying Token address:", underlyingTokenAddress);
        console.log("Strategy address:", strategyAddress);
        console.log("SuperToken address:", superTokenAddress);
    }
}
