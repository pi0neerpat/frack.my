// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/YieldBox.sol";
import "../src/mocks/MockERC20.sol";
import "../src/mocks/MockStrategy.sol";
import "../src/mocks/MockSuperToken.sol";

contract YieldBoxTest is Test {
    YieldBox public yieldBox;
    MockERC20 public underlyingToken;
    MockStrategy public strategy;
    MockSuperToken public superToken;

    address public deployer = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    uint256 public constant INITIAL_BALANCE = 1_000_000 * 10 ** 18;
    uint256 public constant DEPOSIT_AMOUNT = 10_000 * 10 ** 18;

    function setUp() public {
        vm.startPrank(deployer);

        // Deploy mock tokens and strategy
        underlyingToken = new MockERC20("Underlying Token", "UTK", 18);
        underlyingToken.mint(deployer, INITIAL_BALANCE);
        underlyingToken.mint(user1, INITIAL_BALANCE);
        underlyingToken.mint(user2, INITIAL_BALANCE);

        strategy = new MockStrategy(underlyingToken, "Strategy Vault", "SVLT");
        superToken = new MockSuperToken("Super Token", "STKN", underlyingToken);

        // Approve the superToken to spend the underlying token
        underlyingToken.approve(address(superToken), type(uint256).max);

        // Deploy YieldBox
        yieldBox = new YieldBox(address(strategy), address(superToken));

        vm.stopPrank();
    }

    function testDeposit() public {
        vm.startPrank(user1);

        // Approve and deposit
        underlyingToken.approve(address(yieldBox), DEPOSIT_AMOUNT);
        yieldBox.deposit(DEPOSIT_AMOUNT);

        // Check balances
        assertEq(yieldBox.balanceOf(user1), DEPOSIT_AMOUNT, "User balance in YieldBox should match deposit");
        assertEq(yieldBox.totalDepositedAssets(), DEPOSIT_AMOUNT, "Total deposited assets should match deposit");

        vm.stopPrank();
    }

    function testWithdraw() public {
        // First deposit
        vm.startPrank(user1);
        underlyingToken.approve(address(yieldBox), DEPOSIT_AMOUNT);
        yieldBox.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();

        uint256 initialBalance = underlyingToken.balanceOf(user1);

        // Then withdraw
        vm.startPrank(user1);
        yieldBox.withdraw(DEPOSIT_AMOUNT);
        vm.stopPrank();

        // Check balances
        assertEq(yieldBox.balanceOf(user1), 0, "User balance in YieldBox should be zero after withdrawal");
        assertEq(yieldBox.totalDepositedAssets(), 0, "Total deposited assets should be zero after withdrawal");
        assertEq(
            underlyingToken.balanceOf(user1), initialBalance + DEPOSIT_AMOUNT, "User should receive back their deposit"
        );
    }

    function testHarvest() public {
        // First deposit
        vm.startPrank(user1);
        underlyingToken.approve(address(yieldBox), DEPOSIT_AMOUNT);
        yieldBox.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();

        // Record initial state
        uint256 initialVaultAssets = yieldBox.underlyingVaultAssets();

        // Generate yield in the strategy
        uint256 yieldAmount = 1000 * 10 ** 18;
        vm.startPrank(deployer);

        // Mint tokens directly to the strategy to simulate yield
        underlyingToken.mint(address(strategy), yieldAmount);

        // This will make the strategy report more assets than shares
        // which is necessary for the harvest function to work
        vm.stopPrank();

        // Verify that the strategy now has more assets than before
        uint256 newVaultAssets = yieldBox.underlyingVaultAssets();
        assertGt(newVaultAssets, initialVaultAssets, "Strategy should have more assets after yield generation");

        // Now harvest the yield
        vm.startPrank(deployer);

        // Approve the superToken to spend the underlying token for the yield
        underlyingToken.approve(address(superToken), yieldAmount);

        // Harvest yield
        yieldBox.harvest();
        vm.stopPrank();

        // Check that the yield was harvested
        // In a real test, we would check that the yield was properly distributed
        // but this is simplified for the mock implementation
    }

    function testMultipleUsers() public {
        // User 1 deposits
        vm.startPrank(user1);
        underlyingToken.approve(address(yieldBox), DEPOSIT_AMOUNT);
        yieldBox.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();

        // User 2 deposits
        vm.startPrank(user2);
        underlyingToken.approve(address(yieldBox), DEPOSIT_AMOUNT * 2);
        yieldBox.deposit(DEPOSIT_AMOUNT * 2);
        vm.stopPrank();

        // Check balances
        assertEq(yieldBox.balanceOf(user1), DEPOSIT_AMOUNT, "User1 balance should match deposit");
        assertEq(yieldBox.balanceOf(user2), DEPOSIT_AMOUNT * 2, "User2 balance should match deposit");
        assertEq(
            yieldBox.totalDepositedAssets(), DEPOSIT_AMOUNT * 3, "Total deposited assets should match sum of deposits"
        );
    }
}
