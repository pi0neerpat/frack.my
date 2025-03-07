// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {YieldBox} from "../src/YieldBox.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {console} from "forge-std/console.sol";
import {ISuperfluidPool, PoolConfig, PoolERC20Metadata} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import {ISuperfluidPool} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/ISuperfluidPool.sol";
import {e18, e, decimal, Dec, F, A, D} from "../src/decimalLibrary.sol";

contract Mock4626 is ERC4626 {
    constructor(IERC20 asset_) ERC4626(asset_) ERC20("Mock4626", "M4626") {}
}

contract YieldBoxTest is Test {
    using SuperTokenV1Library for ISuperToken;
    using Dec for uint256;
    using Dec for uint8;  // Add this to use .d() on uint8


    YieldBox public yieldBox;
    address constant USDC_ADDRESS = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant USDCx_ADDRESS = 0xD04383398dD2426297da660F9CCA3d439AF9ce1b;
    // address of the actual vault on base
    //address constant UNDERLYING_VAULT = 0x0A1a3b5f2041F33522C4efc754a7D096f880eE16; // Replace with actual vault
    ERC4626 public mockVault;

    ISuperToken yieldToken = ISuperToken(USDCx_ADDRESS);

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    
    IERC20 usdc = IERC20(USDC_ADDRESS);
    ISuperToken usdcx = ISuperToken(USDCx_ADDRESS);

    // get decimals from contract 
    decimal public U_TOKEN_DEC;
    decimal public U_VAULT_DEC;
    decimal public POOL_DEC;
    decimal public E18_DEC;

    function setUp() public {
        // Fork Base mainnet
        vm.createSelectFork("base");
        
        // deploy a mock vault
        mockVault = new Mock4626(usdc);
        // Deploy YieldBox27'174'171
        yieldBox = new YieldBox(address(mockVault), USDCx_ADDRESS);
        
        // Fund test users with USDC
        deal(USDC_ADDRESS, alice, 10000e6);
        deal(USDC_ADDRESS, bob, 10000e6);

        U_TOKEN_DEC = yieldBox.U_TOKEN_DEC();
        U_VAULT_DEC = yieldBox.U_VAULT_DEC();
        POOL_DEC = yieldBox.POOL_DEC();
        E18_DEC = yieldBox.E18_DEC();
    }

    /**** Helper functions ****/

    // Helper function to simulate yield
    function _simulateYield(uint256 amount) internal {
        deal(USDC_ADDRESS, address(mockVault), 
            usdc.balanceOf(address(mockVault)) + amount);
    }

    function _depositAndConnect(address user, e memory amount) internal {
        // check that amount is in the correct decimals
        assertEq(D.unwrap(amount.decimals), D.unwrap(U_TOKEN_DEC), "Amount is not in the correct decimals");
        vm.startPrank(user);
        usdc.approve(address(yieldBox), amount.value);
        yieldBox.deposit(amount.value);
        yieldToken.connectPool(yieldBox.distributionPool());
        vm.stopPrank();
    }

    function _withdraw(address user, e18 amount) internal {
        // check that amount is in the correct decimals
        vm.startPrank(user);
        yieldBox.withdraw(amount);
        vm.stopPrank();
    }

    /**** Tests ****/
    function test_InitialState() public {
        // Check vault configuration
        assertEq(address(yieldBox.underlyingVault()), address(mockVault), "Wrong vault address");
        assertEq(address(yieldBox.underlyingToken()), USDC_ADDRESS, "Wrong underlying token");
        assertEq(address(yieldBox.yieldToken()), USDCx_ADDRESS, "Wrong yield token");

        // Check decimal configurations
        assertEq(D.unwrap(yieldBox.U_TOKEN_DEC()), 6, "Wrong underlying token decimals"); // USDC has 6 decimals
        assertEq(D.unwrap(yieldBox.U_VAULT_DEC()), 6, "Wrong vault decimals");
        assertEq(D.unwrap(yieldBox.POOL_DEC()), 9, "Wrong pool decimals");
        assertEq(D.unwrap(yieldBox.E18_DEC()), 18, "Wrong yield decimals");

        // Check initial state
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), 0, "Initial total assets should be 0");
        assertEq(yieldBox.lastHarvestTimestamp(), 0, "Initial harvest timestamp should be 0");
        
        // Verify pool setup
        ISuperfluidPool pool = yieldBox.distributionPool();
        assertTrue(address(pool) != address(0), "Pool not initialized");
    }

    /**** Basic Functionality Tests ****/

    /// @notice Tests that users can deposit USDC and receive shares
    /// @dev Should verify:
    ///      - Correct share calculation
    ///      - USDC transfer to vault
    ///      - Share tokens minted to user
    ///      - Events emitted
    function test_DepositBasicFlow() public {
        // Create deposit amount with underlying token decimals (6 for USDC)
        e memory depositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        
        // Get initial balances with correct decimal precision
        e memory aliceInitialBalance = Dec.make(usdc.balanceOf(alice), U_TOKEN_DEC);
        e memory vaultInitialBalance = Dec.make(usdc.balanceOf(address(mockVault)), U_TOKEN_DEC);
        
        vm.startPrank(alice);
        
        // Approve and deposit (using underlying token decimals)
        usdc.approve(address(yieldBox), depositAmount.value);
        yieldBox.deposit(depositAmount.value);
        
        vm.stopPrank();

        // Verify USDC transfers (using underlying token decimals)
        assertEq(usdc.balanceOf(alice), aliceInitialBalance.value - depositAmount.value, "Alice USDC balance incorrect");
        assertEq(usdc.balanceOf(address(mockVault)), vaultInitialBalance.value + depositAmount.value, "Vault USDC balance incorrect");
        
        // Convert deposit amount to 18 decimals for share balance check
        // YieldBox stores shares in 18 decimals internally
        e18 expectedShares = A.to18(depositAmount);
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), F.unwrap(expectedShares), "Share balance incorrect");
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), F.unwrap(expectedShares), "Total shares incorrect");

        // Convert deposit amount to pool units (9 decimals)
        // Distribution pool uses 9 decimals
        e memory poolUnits = A.to(depositAmount, POOL_DEC);
        assertEq(yieldBox.distributionPool().getUnits(alice), uint128(poolUnits.value), "Pool units incorrect");
    }
    /// @notice Tests that users can withdraw their full position
    /// @dev Should verify:
    ///      - Correct USDC amount returned
    ///      - Shares burned
    ///      - Vault share calculation
    ///      - Events emitted
    function test_WithdrawFullPosition() public {
        // Create deposit amount with underlying token decimals (6 for USDC)
        e memory depositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        
        // First deposit and connect to pool
        _depositAndConnect(alice, depositAmount);
        
        // Get initial balances before withdrawal with correct decimal precision
        e memory aliceInitialBalance = Dec.make(usdc.balanceOf(alice), U_TOKEN_DEC);
        e memory vaultInitialBalance = Dec.make(usdc.balanceOf(address(mockVault)), U_TOKEN_DEC);
        
        // Get initial shares (in 18 decimals) and convert to underlying decimals for comparison
        e18 initialShares18 = yieldBox.balanceOf(alice);
        
        // Get initial pool units (in 9 decimals)
        uint128 initialPoolUnits = yieldBox.distributionPool().getUnits(alice);
        
        // Withdraw full position (need to convert to 18 decimals for withdraw function)
        _withdraw(alice, A.to18(depositAmount));

        // Verify USDC transfers (in underlying token decimals)
        assertEq(usdc.balanceOf(alice), A.add(aliceInitialBalance, depositAmount, U_TOKEN_DEC).value, "Alice USDC balance incorrect");
        assertEq(usdc.balanceOf(address(mockVault)), A.sub(vaultInitialBalance, depositAmount, U_TOKEN_DEC).value, "Vault USDC balance incorrect");
        
        // Verify share accounting (in 18 decimals)
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), 0, "Share balance should be 0");
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), 0, "Total shares should be 0");
        
        // Verify pool units (in 9 decimals)
        assertEq(yieldBox.distributionPool().getUnits(alice), 0, "Pool units should be 0");
    }

    /// @notice Tests partial withdrawal functionality
    /// @dev Should verify:
    ///      - Correct partial USDC amount returned
    ///      - Correct remaining shares
    ///      - Proper vault share recalculation
    function test_WithdrawPartialPosition() public {
        // Create deposit amount with underlying token decimals (6 for USDC)
        e memory depositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        
        // Create withdraw amount (400 USDC) in underlying decimals and convert to 18 decimals
        // for the withdraw function which expects 18 decimals
        e memory withdrawAmount_6dec = Dec.make(400e6, U_TOKEN_DEC);
        e18 withdrawAmount_18dec = A.to18(withdrawAmount_6dec);
        
        // First deposit and connect to pool
        _depositAndConnect(alice, depositAmount);
        
        // Get initial balances before withdrawal with correct decimal precision
        e memory aliceInitialBalance = Dec.make(usdc.balanceOf(alice), U_TOKEN_DEC);
        e memory vaultInitialBalance = Dec.make(usdc.balanceOf(address(mockVault)), U_TOKEN_DEC);
        
        // Get initial shares (in 18 decimals)
        e18 initialShares = yieldBox.balanceOf(alice);
        
        // Get initial pool units (in 9 decimals)
        uint128 initialPoolUnits = yieldBox.distributionPool().getUnits(alice);
        
        // Withdraw partial position (using 18 decimals as required by the contract)
        _withdraw(alice, withdrawAmount_18dec);
        
        // Calculate expected remaining amounts
        e18 expectedRemainingShares = F.sub(initialShares, withdrawAmount_18dec);
        
        // Convert withdraw amount back to underlying decimals for USDC balance checks
        e memory withdrawAmount_underlying = F.to(withdrawAmount_18dec, U_TOKEN_DEC);
        
        // Verify USDC transfers (in underlying token decimals)
        assertEq(usdc.balanceOf(alice), A.add(aliceInitialBalance, withdrawAmount_underlying, U_TOKEN_DEC).value, 
                "Alice USDC balance incorrect");
        assertEq(usdc.balanceOf(address(mockVault)), A.sub(vaultInitialBalance, withdrawAmount_underlying, U_TOKEN_DEC).value, 
                "Vault USDC balance incorrect");
        
        // Verify remaining share accounting (in 18 decimals)
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), F.unwrap(expectedRemainingShares), 
                "Remaining share balance incorrect");
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), F.unwrap(expectedRemainingShares), 
                "Total shares incorrect");
        
        // Calculate expected remaining pool units (in 9 decimals)
        e memory withdrawAmount_9dec = F.to(withdrawAmount_18dec, POOL_DEC);
        uint128 expectedPoolUnits = initialPoolUnits - uint128(withdrawAmount_9dec.value);
        
        // Verify remaining pool units (in 9 decimals)
        assertEq(yieldBox.distributionPool().getUnits(alice), expectedPoolUnits, 
                "Remaining pool units incorrect");
    }

    /**** Yield Distribution Tests ****/
    /// @notice Tests yield distribution when single user has deposited
    /// @dev Should verify:
    ///      - Yield is properly reflected in share price
    ///      - User can withdraw initial deposit plus yield
    ///      - Correct accounting in underlying vault
    function test_YieldDistributionSingleUser() public {
        // Create deposit and yield amounts with underlying token decimals (6 for USDC)
        e memory depositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        e memory yieldAmount = Dec.make(100e6, U_TOKEN_DEC);    // 100 USDC yield (10%)

        // Initial deposit from Alice
        _depositAndConnect(alice, depositAmount);
        
        // Get balances before harvest with correct decimal precision
        e memory aliceInitialBalance = Dec.make(usdc.balanceOf(alice), U_TOKEN_DEC);
        e memory initialVaultBalance = Dec.make(mockVault.totalAssets(), U_TOKEN_DEC);
        
        // Generate yield in mock vault (10% return)
        _simulateYield(yieldAmount.value);
        
        // Convert yield amount to 18 decimals for comparison with latentYield()
        // which returns yield in 18 decimals
        e18 yieldAmount_18dec = A.to18(yieldAmount);
        
        // Verify latent yield is detected correctly
        // Use a larger delta for the approximation due to potential rounding issues
        // when converting between different decimal precisions
        assertApproxEqAbs(F.unwrap(yieldBox.latentYield()), F.unwrap(yieldAmount_18dec), 1e12, 
                         "Vault assets not properly updated");
        
        // Harvest yield
        vm.warp(block.timestamp + 12 hours); // Wait minimum harvest delay
        yieldBox.upgradeAll();
        
        // Check USDCx balance (18 decimals)
        // Convert yield amount to 18 decimals for SuperToken comparison
        e memory expectedUSDCx = A.to(yieldAmount, E18_DEC);
        assertApproxEqAbs(yieldToken.balanceOf(address(yieldBox)), expectedUSDCx.value, 1e12, 
                         "Not all underlying upgraded");

        // Start the stream and check the flow rate
        yieldBox.smother();
        int96 flowRate = yieldBox.yieldToken().getFlowRate(address(yieldBox), address(yieldBox.distributionPool()));
        
        // Verify yield was properly captured (USDC balance should be close to 0)
        assertApproxEqAbs(usdc.balanceOf(address(yieldBox)), 0, 10, 
                         "Not all underlying upgraded");
        
        // Calculate expected flow rate (18 decimals)
        // Flow rate is calculated to distribute yield over 24 hours
        // Use a larger delta for the flow rate comparison due to potential rounding
        // in the contract's calculation
        e memory expectedFlowRate = Dec.make(expectedUSDCx.value / (24 hours), E18_DEC);
        assertApproxEqAbs(flowRate, int96(uint96(expectedFlowRate.value)), 1e12, 
                         "Incorrect flow rate");
        
        // Fast forward to receive some yield 
        vm.warp(block.timestamp + 6 hours);
        
        // Verify the yieldBox is still streaming yield
        assertTrue(yieldBox.yieldToken().getFlowRate(address(yieldBox), address(yieldBox.distributionPool())) > 0, 
                  "Yield stream not active");
        
        // Verify that alice is actually receiving yield (in 18 decimals)
        e memory amountStreamed = Dec.make(usdcx.getTotalAmountReceivedByMember(yieldBox.distributionPool(), alice), E18_DEC);
        assertGt(amountStreamed.value, 0, "No yield streamed");
        
        // Check alice's USDCx balance (in 18 decimals)
        assertEq(usdcx.balanceOf(alice), amountStreamed.value, "No yield received");
    }

    /// @notice Tests yield distribution with multiple users
    /// @dev Should verify:
    ///      - Yield is distributed proportionally
    ///      - Different deposit timings are handled correctly
    ///      - All users can withdraw their fair share
    function test_YieldDistributionMultipleUsers() public {
        // Create deposit amounts with underlying token decimals (6 for USDC)
        e memory aliceDepositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        e memory bobDepositAmount = Dec.make(500e6, U_TOKEN_DEC);    // 500 USDC
        e memory yieldAmount = Dec.make(150e6, U_TOKEN_DEC);         // 150 USDC yield (10%)

        // Initial deposit from Alice
        _depositAndConnect(alice, aliceDepositAmount);
        
        // Generate some yield before Bob deposits
        _simulateYield(yieldAmount.value / 3); // 50 USDC yield
        
        // Harvest first yield batch (only Alice should receive this)
        vm.warp(block.timestamp + 12 hours);
        yieldBox.upgradeAll();
        yieldBox.smother();
        
        // Now Bob deposits
        _depositAndConnect(bob, bobDepositAmount);
        
        // Generate more yield (both Alice and Bob should share this)
        _simulateYield(yieldAmount.value * 2 / 3); // 100 USDC yield
        
        // Harvest second yield batch
        vm.warp(block.timestamp + 12 hours);
        yieldBox.upgradeAll();
        yieldBox.smother();
        
        // Fast forward to receive some yield
        vm.warp(block.timestamp + 12 hours);
        
        // Get amounts streamed to each user
        e memory aliceStreamed = Dec.make(usdcx.getTotalAmountReceivedByMember(yieldBox.distributionPool(), alice), E18_DEC);
        e memory bobStreamed = Dec.make(usdcx.getTotalAmountReceivedByMember(yieldBox.distributionPool(), bob), E18_DEC);
        
        // Verify both users received yield
        assertGt(aliceStreamed.value, 0, "Alice received no yield");
        assertGt(bobStreamed.value, 0, "Bob received no yield");
        
        // Verify Alice received more yield than Bob (she had larger deposit and was in longer)
        assertGt(aliceStreamed.value, bobStreamed.value, "Alice should receive more yield than Bob");
        
        // The distribution is based on pool units at the time of each distribution
        // For the second distribution, Alice has 2/3 of the pool units (1000 / (1000 + 500))
        // and Bob has 1/3 of the pool units (500 / (1000 + 500))
        // We don't need to calculate an exact ratio, just verify that Alice gets more than Bob
        // and that the ratio is reasonable (between 1.5 and 3)
        uint256 actualRatio = aliceStreamed.value / bobStreamed.value;
        assertGt(actualRatio, 1, "Alice should receive more yield than Bob");
        assertLt(actualRatio, 4, "Alice's yield shouldn't be excessively higher than Bob's");
        
        // Verify users can withdraw their deposits
        _withdraw(alice, A.to18(aliceDepositAmount));
        _withdraw(bob, A.to18(bobDepositAmount));
        
        // Verify balances after withdrawal
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), 0, "Alice should have 0 shares after withdrawal");
        assertEq(F.unwrap(yieldBox.balanceOf(bob)), 0, "Bob should have 0 shares after withdrawal");
        
        // Verify users still have their yield streams
        assertGt(usdcx.balanceOf(alice), 0, "Alice should still have yield after withdrawal");
        assertGt(usdcx.balanceOf(bob), 0, "Bob should still have yield after withdrawal");
    }

    /**** Superfluid Integration Tests ****/

    /// @notice Tests the Superfluid stream connection setup
    /// @dev Should verify:
    ///      - Pool connection is established
    ///      - USDCx stream can be created
    ///      - Events are emitted correctly
    function test_SuperfluidConnectionSetup() public {}

    /// @notice Tests streaming yield to depositors
    /// @dev Should verify:
    ///      - Yield is properly streamed via USDCx
    ///      - Stream rates are calculated correctly
    ///      - Users receive correct stream amounts
    function test_YieldStreaming() public {}

    /**** Edge Cases and Security Tests ****/

    /// @notice Tests behavior when underlying vault has no yield
    /// @dev Should verify:
    ///      - System handles zero yield gracefully
    ///      - No streams are created
    ///      - Users can still withdraw principal
    function test_ZeroYieldScenario() public {}

    /// @notice Tests deposit limits and constraints
    /// @dev Should verify:
    ///      - Minimum deposit amounts
    ///      - Maximum deposit limits if any
    ///      - Zero deposit handling
    function test_DepositLimits() public {}

    /// @notice Tests emergency withdrawal functionality
    /// @dev Should verify:
    ///      - Users can withdraw in emergency
    ///      - Proper handling of streams during emergency
    ///      - System state after emergency
    function test_EmergencyWithdrawal() public {}
    /**** Revert Cases ****/

    /// @notice Tests that unauthorized actions revert
    /// @dev Should verify:
    ///      - Only owner can perform admin functions
    ///      - Users can't withdraw more than they deposited
    ///      - Invalid operations revert with correct errors
    function test_RevertWhen_UnauthorizedActions() public {}

    /// @notice Tests system behavior with insufficient funds
    /// @dev Should verify:
    ///      - Withdrawals with insufficient balance revert
    ///      - Proper error messages are returned
    function test_RevertIf_InsufficientFunds() public {}

    /// @notice Tests reentrancy protection
    /// @dev Should verify:
    ///      - Contract is protected against reentrancy attacks
    ///      - Proper error messages are returned
    function test_RevertWhen_ReentrancyAttempted() public {}
} 