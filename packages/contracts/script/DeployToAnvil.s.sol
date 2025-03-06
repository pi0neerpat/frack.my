// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/YieldBox.sol";
import "../src/mocks/MockERC20.sol";
import "../src/mocks/MockStrategy.sol";
import "../src/mocks/MockSuperToken.sol";

contract DeployToAnvil is Script {
    function run() external {
        // Use the default Anvil private key for the first account
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockERC20 token
        MockERC20 underlyingToken = new MockERC20("Underlying Token", "UTK", 18);
        console.log("MockERC20 deployed at:", address(underlyingToken));

        // 2. Mint tokens to the deployer
        uint256 mintAmount = 1_000_000 * 10 ** 18; // 1 million tokens
        underlyingToken.mint(deployer, mintAmount);
        console.log("Minted", mintAmount, "tokens to deployer");

        // 3. Deploy MockStrategy (ERC4626 vault)
        MockStrategy strategy = new MockStrategy(underlyingToken, "Strategy Vault", "SVLT");
        console.log("MockStrategy deployed at:", address(strategy));

        // 4. Deploy MockSuperToken
        MockSuperToken superToken = new MockSuperToken("Super Token", "STKN", underlyingToken);
        console.log("MockSuperToken deployed at:", address(superToken));

        // 5. Deploy YieldBox
        YieldBox yieldBox = new YieldBox(address(strategy), address(superToken));
        console.log("YieldBox deployed at:", address(yieldBox));

        // 6. Approve YieldBox to spend tokens
        underlyingToken.approve(address(yieldBox), mintAmount / 2);
        console.log("Approved YieldBox to spend tokens");

        // 7. Transfer some tokens to the deployer wallet (already done in step 2)
        console.log("Deployer balance:", underlyingToken.balanceOf(deployer));

        vm.stopBroadcast();

        console.log("Deployment completed successfully!");
    }
}
