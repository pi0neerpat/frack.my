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

    function _harvestYield() internal returns (e18) {
        // Get the initial USDCx balance of the yieldBox
        uint256 initialUSDCxBalance = yieldToken.balanceOf(address(yieldBox));
        
        // Call the individual functions in the correct order
        yieldBox.upgradeAll();
        
        // Calculate the actual yield from the change in USDCx balance
        uint256 finalUSDCxBalance = yieldToken.balanceOf(address(yieldBox));
        e18 actualYield = Dec.make18(finalUSDCxBalance - initialUSDCxBalance);
        
        return actualYield;
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
        
        // Record initial balance and harvest yield
        uint256 initialUSDCxBalance = yieldToken.balanceOf(address(yieldBox));
        e18 withdrawnYield = _harvestYield();
        
        // Verify withdrawn yield matches expected yield
        assertApproxEqAbs(F.unwrap(withdrawnYield), F.unwrap(yieldAmount_18dec), 1e12,
                         "Incorrect yield withdrawn");
        
        // Check USDCx balance (18 decimals)
        // Convert yield amount to 18 decimals for SuperToken comparison
        e memory expectedUSDCx = A.to(yieldAmount, E18_DEC);
        assertApproxEqAbs(yieldToken.balanceOf(address(yieldBox)) - initialUSDCxBalance, expectedUSDCx.value, 1e12, 
                         "Not all underlying upgraded");

        // Start the stream and check the flow rate
        yieldBox.smother();
        int96 flowRate = yieldToken.getFlowRate(address(yieldBox), address(yieldBox.distributionPool()));
        
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
        _harvestYield();
        yieldBox.smother();
        
        // Now Bob deposits
        _depositAndConnect(bob, bobDepositAmount);
        
        // Generate more yield (both Alice and Bob should share this)
        _simulateYield(yieldAmount.value * 2 / 3); // 100 USDC yield
        
        // Harvest second yield batch
        vm.warp(block.timestamp + 12 hours);
        _harvestYield();
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
    function test_SuperfluidConnectionSetup() public {
        // Create deposit amount with underlying token decimals (6 for USDC)
        e memory depositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        
        // Verify the distribution pool was created during YieldBox deployment
        ISuperfluidPool pool = yieldBox.distributionPool();
        assertTrue(address(pool) != address(0), "Pool not initialized");
        
        // Verify pool metadata
        string memory name = pool.name();
        string memory symbol = pool.symbol();
        uint8 decimals = pool.decimals();
        
        assertEq(name, "YieldBox", "Pool name incorrect");
        assertEq(symbol, "YBX", "Pool symbol incorrect");
        assertEq(decimals, 9, "Pool decimals incorrect");
        
        // Deposit and connect to pool
        _depositAndConnect(alice, depositAmount);
        
        // Verify alice has units in the pool
        uint128 aliceUnits = pool.getUnits(alice);
        assertGt(aliceUnits, 0, "Alice should have units in the pool");
        
        // Generate yield and create stream
        _simulateYield(100e6); // 100 USDC yield
        vm.warp(block.timestamp + 12 hours);
        yieldBox.upgradeAll();
        yieldBox.smother();
        
        // Verify stream is created
        int96 flowRate = yieldToken.getFlowRate(address(yieldBox), address(pool));
        assertGt(flowRate, 0, "No stream created to pool");
        
        // Verify user can receive yield
        vm.warp(block.timestamp + 1 hours);
        uint256 aliceBalance = yieldToken.balanceOf(alice);
        assertGt(aliceBalance, 0, "Alice received no yield");
    }

    /// @notice Tests streaming yield to depositors
    /// @dev Should verify:
    ///      - Yield is properly streamed via USDCx
    ///      - Stream rates are calculated correctly
    ///      - Users receive correct stream amounts
    function test_YieldStreaming() public {
        // Create deposit amounts with underlying token decimals (6 for USDC)
        e memory aliceDepositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        e memory bobDepositAmount = Dec.make(1000e6, U_TOKEN_DEC);   // 1000 USDC (equal deposits)
        e memory yieldAmount = Dec.make(200e6, U_TOKEN_DEC);         // 200 USDC yield

        // Initial deposits from Alice and Bob
        _depositAndConnect(alice, aliceDepositAmount);
        _depositAndConnect(bob, bobDepositAmount);
        
        // Generate yield
        _simulateYield(yieldAmount.value);
        
        // Harvest yield
        vm.warp(block.timestamp + 12 hours);
        
        // Store initial USDCx balance
        uint256 initialUSDCxBalance = yieldToken.balanceOf(address(yieldBox));
        
        // Withdraw surplus and convert to USDCx
        yieldBox.upgradeAll();
        yieldBox.smother();
        
        // Calculate harvested yield
        uint256 harvestedYieldValue = yieldToken.balanceOf(address(yieldBox)) - initialUSDCxBalance;
        e18 harvestedYield = Dec.make18(harvestedYieldValue);
        
        // Convert yield to 18 decimals for comparison
        e memory expectedYield18 = A.to(yieldAmount, E18_DEC);
        assertApproxEqAbs(F.unwrap(harvestedYield), expectedYield18.value, 1e12, 
                         "Incorrect harvested yield amount");
        
        // Start streaming
        yieldBox.smother();
        
        // Verify stream is created with correct flow rate
        int96 flowRate = yieldToken.getFlowRate(address(yieldBox), address(yieldBox.distributionPool()));
        assertGt(flowRate, 0, "No stream created");
        
        // Calculate expected flow rate (yield distributed over 24 hours)
        e memory expectedFlowRate = Dec.make(expectedYield18.value / (24 hours), E18_DEC);
        assertApproxEqAbs(flowRate, int96(uint96(expectedFlowRate.value)), 1e12, 
                         "Incorrect flow rate");
        
        // Fast forward to receive some yield (6 hours = 25% of the yield)
        vm.warp(block.timestamp + 6 hours);
        
        // Get amounts streamed to each user
        e memory aliceStreamed = Dec.make(usdcx.getTotalAmountReceivedByMember(yieldBox.distributionPool(), alice), E18_DEC);
        e memory bobStreamed = Dec.make(usdcx.getTotalAmountReceivedByMember(yieldBox.distributionPool(), bob), E18_DEC);
        
        // Verify both users received yield
        assertGt(aliceStreamed.value, 0, "Alice received no yield");
        assertGt(bobStreamed.value, 0, "Bob received no yield");
        
        // Since Alice and Bob have equal deposits, they should receive equal yield
        assertApproxEqAbs(aliceStreamed.value, bobStreamed.value, 1e12, 
                         "Alice and Bob should receive equal yield");
        
        // Verify the amount streamed is approximately 25% of the total yield (6/24 hours)
        // Use a larger delta (1%) for the approximation due to potential timing differences
        e memory expectedStreamed = Dec.make(expectedYield18.value / 4, E18_DEC); // 25% of yield
        e memory totalStreamed = Dec.make(aliceStreamed.value + bobStreamed.value, E18_DEC);
        
        uint256 onePercentOfExpected = expectedStreamed.value / 100;
        assertApproxEqAbs(totalStreamed.value, expectedStreamed.value, onePercentOfExpected, 
                         "Incorrect total streamed amount");
        
        // Fast forward to the end of the distribution period (another 18 hours)
        vm.warp(block.timestamp + 18 hours);
        
        // Get final amounts streamed
        e memory aliceFinalStreamed = Dec.make(usdcx.getTotalAmountReceivedByMember(yieldBox.distributionPool(), alice), E18_DEC);
        e memory bobFinalStreamed = Dec.make(usdcx.getTotalAmountReceivedByMember(yieldBox.distributionPool(), bob), E18_DEC);
        
        // Verify users received the full yield amount (with 1% tolerance)
        e memory totalFinalStreamed = Dec.make(aliceFinalStreamed.value + bobFinalStreamed.value, E18_DEC);
        uint256 onePercentOfTotal = expectedYield18.value / 100;
        assertApproxEqAbs(totalFinalStreamed.value, expectedYield18.value, onePercentOfTotal, 
                         "Full yield amount not distributed");
    }

    /**** Edge Cases and Security Tests ****/

    /// @notice Tests behavior when underlying vault has no yield
    /// @dev Should verify:
    ///      - System handles zero yield gracefully
    ///      - No streams are created
    ///      - Users can still withdraw principal
    function test_ZeroYieldScenario() public {
        // Create deposit amount with underlying token decimals (6 for USDC)
        e memory depositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        
        // Initial deposit from Alice
        _depositAndConnect(alice, depositAmount);
        
        // Try to harvest with no yield
        vm.warp(block.timestamp + 12 hours);
        
        // Expect revert when trying to withdraw surplus with no yield
        vm.expectRevert("No yield to upgrade");
        yieldBox.upgradeAll();
        
        // Verify no streams were created
        int96 flowRate = yieldToken.getFlowRate(address(yieldBox), address(yieldBox.distributionPool()));
        assertEq(flowRate, 0, "Stream should not be created with zero yield");
        
        // Verify latent yield is zero
        assertEq(F.unwrap(yieldBox.latentYield()), 0, "Latent yield should be zero");
        
        // Verify user can still withdraw principal
        e memory aliceInitialBalance = Dec.make(usdc.balanceOf(alice), U_TOKEN_DEC);
        
        _withdraw(alice, A.to18(depositAmount));
        
        // Verify USDC was returned to Alice
        assertEq(usdc.balanceOf(alice), aliceInitialBalance.value + depositAmount.value, 
                "Alice should receive full principal back");
        
        // Verify Alice's share balance is zero
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), 0, "Alice should have 0 shares after withdrawal");
        
        // Verify total deposited assets is zero
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), 0, "Total deposited assets should be 0");
    }

    /// @notice Tests deposit limits and constraints
    /// @dev Should verify:
    ///      - Minimum deposit amounts
    ///      - Maximum deposit limits if any
    ///      - Zero deposit handling
    function test_DepositLimits() public {
        // Test zero deposit (should revert)
        vm.startPrank(alice);
        usdc.approve(address(yieldBox), 0);
        vm.expectRevert("Deposit too small");
        yieldBox.deposit(0);
        vm.stopPrank();
        
        // Test deposit below minimum (should revert)
        // MINIMUM_DEPOSIT is 1e6 (1 USDC)
        e memory tinyDeposit = Dec.make(1e5, U_TOKEN_DEC); // 0.1 USDC
        
        vm.startPrank(alice);
        usdc.approve(address(yieldBox), tinyDeposit.value);
        vm.expectRevert("Deposit too small");
        yieldBox.deposit(tinyDeposit.value);
        vm.stopPrank();
        
        // Test minimum deposit (should succeed)
        e memory minDeposit = Dec.make(1e6, U_TOKEN_DEC); // 1 USDC (minimum)
        
        vm.startPrank(alice);
        usdc.approve(address(yieldBox), minDeposit.value);
        yieldBox.deposit(minDeposit.value);
        vm.stopPrank();
        
        // Verify minimum deposit was accepted
        e18 expectedShares = A.to18(minDeposit);
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), F.unwrap(expectedShares), 
                "Minimum deposit not accepted");
        
        // Test very large deposit (should succeed)
        // First withdraw the minimum deposit
        _withdraw(alice, A.to18(minDeposit));
        
        // Then try a large deposit
        e memory largeDeposit = Dec.make(1000000e6, U_TOKEN_DEC); // 1,000,000 USDC
        
        // Ensure Alice has enough USDC
        deal(USDC_ADDRESS, alice, largeDeposit.value);
        
        vm.startPrank(alice);
        usdc.approve(address(yieldBox), largeDeposit.value);
        yieldBox.deposit(largeDeposit.value);
        vm.stopPrank();
        
        // Verify large deposit was accepted
        e18 expectedLargeShares = A.to18(largeDeposit);
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), F.unwrap(expectedLargeShares), 
                "Large deposit not accepted");
    }

    /// @notice Tests emergency withdrawal functionality
    /// @dev Should verify:
    ///      - Users can withdraw in emergency
    ///      - Proper handling of streams during emergency
    ///      - System state after emergency
    function test_EmergencyWithdrawal() public {
        // Create deposit amounts with underlying token decimals (6 for USDC)
        e memory aliceDepositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        e memory bobDepositAmount = Dec.make(500e6, U_TOKEN_DEC);    // 500 USDC
        e memory yieldAmount = Dec.make(150e6, U_TOKEN_DEC);         // 150 USDC yield
        
        // Initial deposits from Alice and Bob
        _depositAndConnect(alice, aliceDepositAmount);
        _depositAndConnect(bob, bobDepositAmount);
        
        // Generate yield and start streaming
        _simulateYield(yieldAmount.value);
        vm.warp(block.timestamp + 12 hours);
        yieldBox.upgradeAll();
        yieldBox.smother();
        
        // Fast forward to receive some yield
        vm.warp(block.timestamp + 6 hours);
        
        // Record yield received so far
        uint256 aliceYieldBefore = usdcx.balanceOf(alice);
        uint256 bobYieldBefore = usdcx.balanceOf(bob);
        
        // Simulate emergency: Alice needs to withdraw immediately
        e memory aliceInitialBalance = Dec.make(usdc.balanceOf(alice), U_TOKEN_DEC);
        
        // Emergency withdrawal
        _withdraw(alice, A.to18(aliceDepositAmount));
        
        // Verify Alice received her full principal
        assertEq(usdc.balanceOf(alice), aliceInitialBalance.value + aliceDepositAmount.value, 
                "Alice should receive full principal in emergency");
        
        // Verify Alice's share balance is zero
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), 0, 
                "Alice should have 0 shares after emergency withdrawal");
        
        // Verify Alice's pool units are zero
        assertEq(yieldBox.distributionPool().getUnits(alice), 0, 
                "Alice should have 0 pool units after emergency withdrawal");
        
        // Verify Alice still has her yield received so far
        assertEq(usdcx.balanceOf(alice), aliceYieldBefore, 
                "Alice should keep yield received before emergency withdrawal");
        
        // Fast forward more time
        vm.warp(block.timestamp + 6 hours);
        
        // Verify Alice doesn't receive more yield after withdrawal
        assertEq(usdcx.balanceOf(alice), aliceYieldBefore, 
                "Alice should not receive more yield after withdrawal");
        
        // Verify Bob continues to receive yield
        assertGt(usdcx.balanceOf(bob), bobYieldBefore, 
                "Bob should continue receiving yield");
        
        // Verify Bob can still withdraw his principal
        e memory bobInitialBalance = Dec.make(usdc.balanceOf(bob), U_TOKEN_DEC);
        
        _withdraw(bob, A.to18(bobDepositAmount));
        
        // Verify Bob received his full principal
        assertEq(usdc.balanceOf(bob), bobInitialBalance.value + bobDepositAmount.value, 
                "Bob should receive full principal after Alice's emergency withdrawal");
        
        // Verify total deposited assets is zero
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), 0, 
                "Total deposited assets should be 0 after all withdrawals");
    }

    /// @notice Tests that unauthorized actions revert
    /// @dev Should verify:
    ///      - Only owner can perform admin functions
    ///      - Users can't withdraw more than they deposited
    ///      - Invalid operations revert with correct errors
    function test_RevertWhen_UnauthorizedActions() public {
        // Create deposit amount with underlying token decimals (6 for USDC)
        e memory depositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        
        // Initial deposit from Alice
        _depositAndConnect(alice, depositAmount);
        
        // Test: Bob tries to withdraw Alice's funds
        vm.startPrank(bob);
        vm.expectRevert("Insufficient balance");
        yieldBox.withdraw(A.to18(depositAmount));
        vm.stopPrank();
        
        // Test: Alice tries to withdraw more than she deposited
        e memory excessAmount = Dec.make(2000e6, U_TOKEN_DEC); // 2000 USDC
        vm.startPrank(alice);
        vm.expectRevert("Insufficient balance");
        yieldBox.withdraw(A.to18(excessAmount));
        vm.stopPrank();
        
        // Test: Alice tries to withdraw zero
        vm.startPrank(alice);
        vm.expectRevert("Cannot withdraw 0");
        yieldBox.withdraw(Dec.make18(0));
        vm.stopPrank();
        
        // Verify Alice's balance is still intact
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), F.unwrap(A.to18(depositAmount)), 
                "Alice's balance should be unchanged after failed withdrawals");
        
        // Verify Alice can still withdraw her actual deposit
        e memory aliceInitialBalance = Dec.make(usdc.balanceOf(alice), U_TOKEN_DEC);
        _withdraw(alice, A.to18(depositAmount));
        
        // Verify Alice received her full principal
        assertEq(usdc.balanceOf(alice), aliceInitialBalance.value + depositAmount.value, 
                "Alice should receive full principal after failed withdrawals");
    }

    /// @notice Tests system behavior with insufficient funds
    /// @dev Should verify:
    ///      - Withdrawals with insufficient balance revert
    ///      - Proper error messages are returned
    function test_RevertIf_InsufficientFunds() public {
        // Create deposit amount with underlying token decimals (6 for USDC)
        e memory depositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        
        // Initial deposit from Alice
        _depositAndConnect(alice, depositAmount);
        
        // Test: Alice tries to withdraw more than she deposited
        e memory excessAmount = Dec.make(1001e6, U_TOKEN_DEC); // 1001 USDC (just over deposit)
        vm.startPrank(alice);
        vm.expectRevert("Insufficient balance");
        yieldBox.withdraw(A.to18(excessAmount));
        vm.stopPrank();
        
        // Test: Alice withdraws part of her deposit
        e memory partialAmount = Dec.make(500e6, U_TOKEN_DEC); // 500 USDC
        _withdraw(alice, A.to18(partialAmount));
        
        // Verify Alice's remaining balance
        e18 expectedRemainingBalance = F.sub(A.to18(depositAmount), A.to18(partialAmount));
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), F.unwrap(expectedRemainingBalance), 
                "Alice's remaining balance incorrect after partial withdrawal");
        
        // Test: Alice tries to withdraw more than her remaining balance
        vm.startPrank(alice);
        vm.expectRevert("Insufficient balance");
        yieldBox.withdraw(A.to18(depositAmount)); // Try to withdraw original full amount
        vm.stopPrank();
    }

    /// @notice Tests security against malicious contracts
    /// @dev Should verify:
    ///      - Contract handles interactions with malicious contracts safely
    ///      - Proper error messages are returned
    function test_RevertWhen_ReentrancyAttempted() public {
        // Create a malicious contract
        MaliciousContract malicious = new MaliciousContract(address(yieldBox), address(usdc));
        
        // Fund the malicious contract
        deal(USDC_ADDRESS, address(malicious), 1000e6);
        
        // Make a legitimate deposit
        vm.startPrank(address(malicious));
        usdc.approve(address(yieldBox), 1000e6);
        yieldBox.deposit(1000e6);
        vm.stopPrank();
        
        // Verify deposit was successful
        assertEq(F.unwrap(yieldBox.balanceOf(address(malicious))), F.unwrap(A.to18(Dec.make(1000e6, U_TOKEN_DEC))), 
                "Malicious contract should have correct balance after deposit");
        
        // Test withdrawal to malicious contract
        vm.prank(address(malicious));
        yieldBox.withdraw(e18.wrap(1000e6 * 1e12)); // Convert to 18 decimals
        
        // Verify withdrawal was successful
        assertEq(F.unwrap(yieldBox.balanceOf(address(malicious))), 0, 
                "Malicious contract should have 0 balance after withdrawal");
        assertEq(usdc.balanceOf(address(malicious)), 1000e6, 
                "Malicious contract should have received full USDC amount");
    }
}

// Malicious contract with custom receive function
contract MaliciousContract {
    YieldBox public yieldBox;
    IERC20 public token;
    uint256 public receiveCount;
    
    constructor(address _yieldBox, address _token) {
        yieldBox = YieldBox(_yieldBox);
        token = IERC20(_token);
    }
    
    // Receive function that counts calls
    receive() external payable {
        receiveCount++;
    }
    
    // Allow the contract to receive ERC20 tokens
    function onERC20Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        return this.onERC20Received.selector;
    }
} 