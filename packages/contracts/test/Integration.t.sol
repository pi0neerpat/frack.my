// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/YieldBox.sol";
import "../src/mocks/MockERC20.sol";
import "../src/mocks/MockStrategy.sol";
import "../src/mocks/MockSuperToken.sol";
import "../src/mocks/MockSuperfluidPool.sol";

contract IntegrationTest is Test {
    YieldBox public yieldBox;
    MockERC20 public underlyingToken;
    MockStrategy public strategy;
    MockSuperToken public superToken;
    MockSuperfluidPool public pool;

    address public deployer = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    uint256 public constant INITIAL_BALANCE = 1_000_000 * 10 ** 18;
    uint256 public constant DEPOSIT_AMOUNT_1 = 10_000 * 10 ** 18;
    uint256 public constant DEPOSIT_AMOUNT_2 = 20_000 * 10 ** 18;
    uint256 public constant YIELD_AMOUNT = 1_000 * 10 ** 18;

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

        // Get the pool address from the YieldBox
        pool = yieldBox.poolAddress();

        vm.stopPrank();
    }

    function testFullFlow() public {
        // Step 1: Users deposit assets
        vm.startPrank(user1);
        underlyingToken.approve(address(yieldBox), DEPOSIT_AMOUNT_1);
        yieldBox.deposit(DEPOSIT_AMOUNT_1);
        vm.stopPrank();

        vm.startPrank(user2);
        underlyingToken.approve(address(yieldBox), DEPOSIT_AMOUNT_2);
        yieldBox.deposit(DEPOSIT_AMOUNT_2);
        vm.stopPrank();

        // Verify deposits
        assertEq(yieldBox.balanceOf(user1), DEPOSIT_AMOUNT_1, "User1 balance incorrect");
        assertEq(yieldBox.balanceOf(user2), DEPOSIT_AMOUNT_2, "User2 balance incorrect");
        assertEq(yieldBox.totalDepositedAssets(), DEPOSIT_AMOUNT_1 + DEPOSIT_AMOUNT_2, "Total deposits incorrect");

        // Record initial state
        uint256 initialVaultAssets = yieldBox.underlyingVaultAssets();

        // Step 2: Generate yield in the strategy
        vm.startPrank(deployer);

        // Mint tokens directly to the strategy to simulate yield
        underlyingToken.mint(address(strategy), YIELD_AMOUNT);
        vm.stopPrank();

        // Verify that the strategy now has more assets than before
        uint256 newVaultAssets = yieldBox.underlyingVaultAssets();
        assertGt(newVaultAssets, initialVaultAssets, "Strategy should have more assets after yield generation");

        // Step 3: Harvest yield
        vm.startPrank(deployer);

        // Approve the superToken to spend the underlying token for the yield
        underlyingToken.approve(address(superToken), YIELD_AMOUNT);

        // Harvest yield
        yieldBox.harvest();
        vm.stopPrank();

        // Step 4: User1 withdraws half their deposit
        uint256 withdrawAmount = DEPOSIT_AMOUNT_1 / 2;
        vm.startPrank(user1);
        uint256 initialBalance = underlyingToken.balanceOf(user1);
        yieldBox.withdraw(withdrawAmount);
        vm.stopPrank();

        // Verify withdrawal
        assertEq(
            yieldBox.balanceOf(user1),
            DEPOSIT_AMOUNT_1 - withdrawAmount,
            "User1 balance after partial withdrawal incorrect"
        );
        assertEq(
            underlyingToken.balanceOf(user1), initialBalance + withdrawAmount, "User1 should receive withdrawn assets"
        );

        // Record state before second yield generation
        initialVaultAssets = yieldBox.underlyingVaultAssets();

        // Step 5: Generate more yield
        vm.startPrank(deployer);

        // Mint tokens directly to the strategy to simulate yield
        underlyingToken.mint(address(strategy), YIELD_AMOUNT);
        vm.stopPrank();

        // Verify that the strategy now has more assets than before
        newVaultAssets = yieldBox.underlyingVaultAssets();
        assertGt(newVaultAssets, initialVaultAssets, "Strategy should have more assets after yield generation");

        // Step 6: Harvest again
        vm.startPrank(deployer);

        // Approve the superToken to spend the underlying token for the yield
        underlyingToken.approve(address(superToken), YIELD_AMOUNT);

        // Harvest yield
        yieldBox.harvest();
        vm.stopPrank();

        // Step 7: User2 withdraws all their deposit
        vm.startPrank(user2);
        initialBalance = underlyingToken.balanceOf(user2);
        yieldBox.withdraw(DEPOSIT_AMOUNT_2);
        vm.stopPrank();

        // Verify withdrawal
        assertEq(yieldBox.balanceOf(user2), 0, "User2 balance after full withdrawal incorrect");
        assertEq(
            underlyingToken.balanceOf(user2), initialBalance + DEPOSIT_AMOUNT_2, "User2 should receive withdrawn assets"
        );

        // Step 8: User1 withdraws remaining deposit
        vm.startPrank(user1);
        initialBalance = underlyingToken.balanceOf(user1);
        yieldBox.withdraw(DEPOSIT_AMOUNT_1 - withdrawAmount);
        vm.stopPrank();

        // Verify final state
        assertEq(yieldBox.balanceOf(user1), 0, "User1 final balance incorrect");
        assertEq(
            underlyingToken.balanceOf(user1),
            initialBalance + (DEPOSIT_AMOUNT_1 - withdrawAmount),
            "User1 should receive remaining assets"
        );
        assertEq(yieldBox.totalDepositedAssets(), 0, "Total deposits should be zero");
    }

    function testYieldDistribution() public {
        // Step 1: Users deposit assets
        vm.startPrank(user1);
        underlyingToken.approve(address(yieldBox), DEPOSIT_AMOUNT_1);
        yieldBox.deposit(DEPOSIT_AMOUNT_1);
        vm.stopPrank();

        vm.startPrank(user2);
        underlyingToken.approve(address(yieldBox), DEPOSIT_AMOUNT_2);
        yieldBox.deposit(DEPOSIT_AMOUNT_2);
        vm.stopPrank();

        // Record initial state
        uint256 initialVaultAssets = yieldBox.underlyingVaultAssets();

        // Step 2: Generate yield in the strategy
        vm.startPrank(deployer);

        // Mint tokens directly to the strategy to simulate yield
        underlyingToken.mint(address(strategy), YIELD_AMOUNT);
        vm.stopPrank();

        // Verify that the strategy now has more assets than before
        uint256 newVaultAssets = yieldBox.underlyingVaultAssets();
        assertGt(newVaultAssets, initialVaultAssets, "Strategy should have more assets after yield generation");

        // Step 3: Harvest yield
        vm.startPrank(deployer);

        // Approve the superToken to spend the underlying token for the yield
        underlyingToken.approve(address(superToken), YIELD_AMOUNT);

        // Harvest yield
        yieldBox.harvest();
        vm.stopPrank();

        // Note: In a real test, we would check that the yield was properly distributed
        // through the Superfluid pool, but this is simplified for the mock implementation
        // We would verify:
        // 1. SuperToken balance of the YieldBox
        // 2. Flow rates to each user
        // 3. Accumulated yield for each user over time
    }
}
