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
        underlyingTokenAddress = 0x5FbDB2315678afecb367f032d93F642f64180aa3; // Example address
        strategyAddress = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512; // Example address
        superTokenAddress = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0; // Example address
        yieldBoxAddress = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9; // Example address

        // Load contract instances
        MockERC20 underlyingToken = MockERC20(underlyingTokenAddress);
        YieldBox yieldBox = YieldBox(yieldBoxAddress);

        // Setup USER1
        uint256 user1Amount = 100_000 * 10 ** 18;
        underlyingToken.mint(USER1, user1Amount);
        console.log("Minted", user1Amount, "tokens to USER1:", USER1);

        // Setup USER2
        uint256 user2Amount = 200_000 * 10 ** 18;
        underlyingToken.mint(USER2, user2Amount);
        console.log("Minted", user2Amount, "tokens to USER2:", USER2);

        // Make a deposit for USER1 to demonstrate the system
        uint256 user1PrivateKey = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
        vm.stopBroadcast();

        vm.startBroadcast(user1PrivateKey);
        uint256 depositAmount = 10_000 * 10 ** 18;
        underlyingToken.approve(yieldBoxAddress, depositAmount);
        yieldBox.deposit(depositAmount);
        console.log("USER1 deposited", depositAmount, "tokens into YieldBox");
        vm.stopBroadcast();

        // Generate some yield
        vm.startBroadcast(deployerPrivateKey);
        MockStrategy strategy = MockStrategy(strategyAddress);
        uint256 yieldAmount = 1_000 * 10 ** 18;
        strategy.generateYield(yieldAmount);
        console.log("Generated", yieldAmount, "yield in the strategy");

        // Harvest the yield
        yieldBox.harvest();
        console.log("Harvested yield from the strategy");

        vm.stopBroadcast();

        console.log("Test environment setup completed successfully!");
        console.log("YieldBox address:", yieldBoxAddress);
        console.log("Underlying Token address:", underlyingTokenAddress);
        console.log("Strategy address:", strategyAddress);
        console.log("SuperToken address:", superTokenAddress);
    }
}
