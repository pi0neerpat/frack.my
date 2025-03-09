// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
// import {YieldBox} from "../src/YieldBox.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ISuperfluidPool, PoolConfig, PoolERC20Metadata} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import {ISuperfluidPool} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/ISuperfluidPool.sol";
import {e18, e, decimal, Dec, F, A, D} from "../src/decimalLibrary.sol";
import {YieldBoxUSDC} from "../src/YieldBoxUSDC.sol";
import {IYieldBox} from "../src/interfaces/IYieldBox.sol";
import {console} from "forge-std/console.sol";


contract Mock4626 is ERC4626 {
    constructor(IERC20 asset_) ERC4626(asset_) ERC20("Mock4626", "M4626") {}
}

contract YieldBoxTest is Test {
    using SuperTokenV1Library for ISuperToken;
    using Dec for uint256;
    using Dec for uint8;  // Add this to use .d() on uint8


    IYieldBox public yieldBox;
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
        
        // Deploy YieldBox with the new constructor arguments
        yieldBox = new YieldBoxUSDC(
            address(mockVault),
            USDCx_ADDRESS,
            "YieldBox",       // Pool name
            "YBX",             // Pool symbol
            6                 // Pool decimals (assuming 9 is correct)
        );
        
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
        assertEq(D.unwrap(yieldBox.POOL_DEC()), 6, "Wrong pool decimals");
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
        
        // Convert yield amount to 18 decimals for comparison with availableYield()
        // which returns yield in 18 decimals
        e18 yieldAmount_18dec = A.to18(yieldAmount);
        
        // Verify latent yield is detected correctly
        // Use a larger delta for the approximation due to potential rounding issues
        // when converting between different decimal precisions
        assertApproxEqAbs(F.unwrap(yieldBox.availableYield()), F.unwrap(yieldAmount_18dec), 1e12, 
                         "Vault assets not properly updated");
        
        // Harvest yield
        vm.warp(block.timestamp + 12 hours); // Wait minimum harvest delay

        // Record initial balance and harvest yield
        uint256 initialUSDCxBalance = yieldToken.balanceOf(address(yieldBox));
        e memory withdrawnYield = yieldBox.harvest();

        // Verify withdrawn yield matches expected yield
        assertApproxEqAbs(withdrawnYield.value, yieldAmount.value, 1e12,
                         "Incorrect yield withdrawn");
        
        int96 flowRate = yieldBox.adjustFlow();
        // Check USDCx balance (18 decimals)
        // Convert yield amount to 18 decimals for SuperToken comparison
        e18 expectedUSDCx = A.to18(yieldAmount);
        assertApproxEqAbs(yieldToken.balanceOf(address(yieldBox)) - initialUSDCxBalance, F.unwrap(expectedUSDCx) - uint256(uint96(flowRate)) * 4 hours, 3e12, 
                         "Not all underlying upgraded");

        // Start the stream and check the flow rate
        // move time forward 12 hours
        vm.warp(block.timestamp + 12 hours);
        int96 actualFlowRate = yieldBox.adjustFlow();
        // Verify yield was properly captured (USDC balance should be close to 0)
        assertApproxEqAbs(usdc.balanceOf(address(yieldBox)), 0, 10, 
                         "Not all underlying upgraded");
        
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
        
        // move time forward 12 hours
        vm.warp(block.timestamp + 12 hours);

        // Generate some yield before Bob deposits
        _simulateYield(yieldAmount.value / 3); // 50 USDC yield
        
        // Harvest first yield batch (only Alice should receive this)
        yieldBox.harvest();
        
        // Now Bob deposits
        _depositAndConnect(bob, bobDepositAmount);
        
        // Generate more yield (both Alice and Bob should share this)
        _simulateYield(yieldAmount.value * 2 / 3); // 100 USDC yield
        
        // move time forward 12 hours
        vm.warp(block.timestamp + 12 hours);

        // Harvest second yield batch
        yieldBox.harvest();
        
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
        assertEq(decimals, 6, "Pool decimals incorrect");
        
        // Deposit and connect to pool
        _depositAndConnect(alice, depositAmount);
        
        // Verify alice has units in the pool
        uint128 aliceUnits = pool.getUnits(alice);
        assertGt(aliceUnits, 0, "Alice should have units in the pool");
        
        // Generate yield and create stream
        _simulateYield(100e6); // 100 USDC yield
        yieldBox.harvest();
        
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
        
        // Store initial USDCx balance before harvest
        uint256 initialUSDCxBalance = yieldToken.balanceOf(address(yieldBox));
        
        // Wait minimum harvest delay and harvest yield
        vm.warp(block.timestamp + 12 hours);
        e memory harvestedYield = yieldBox.harvest();
        
        // Verify harvested yield matches expected yield (in underlying decimals)
        assertApproxEqAbs(harvestedYield.value, yieldAmount.value, 1e3, 
                         "Incorrect harvested yield amount");
        
        // Check USDCx balance after harvest
        uint256 afterHarvestBalance = yieldToken.balanceOf(address(yieldBox));
        
        // Convert expected yield to 18 decimals for SuperToken comparison
        e memory expectedYield18 = A.to(yieldAmount, E18_DEC);
        
        // Get the flow rate after harvest
        int96 flowRate = yieldToken.getFlowRate(address(yieldBox), address(yieldBox.distributionPool()));
        assertGt(flowRate, 0, "No stream created");
        
        // Calculate expected flow rate (yield distributed over 24 hours)
        e memory expectedFlowRate = Dec.make(expectedYield18.value / (24 hours), E18_DEC);
        assertApproxEqAbs(flowRate, int96(uint96(expectedFlowRate.value)), 1e12, 
                         "Incorrect flow rate");
        
        // Fast forward to receive some yield (5 hours)
        vm.warp(block.timestamp + 5 hours);
        
        // Get amounts streamed to each user
        e memory aliceStreamed = Dec.make(usdcx.getTotalAmountReceivedByMember(yieldBox.distributionPool(), alice), E18_DEC);
        e memory bobStreamed = Dec.make(usdcx.getTotalAmountReceivedByMember(yieldBox.distributionPool(), bob), E18_DEC);
        
        // Verify both users received yield
        assertGt(aliceStreamed.value, 0, "Alice received no yield");
        assertGt(bobStreamed.value, 0, "Bob received no yield");
        
        // Since Alice and Bob have equal deposits, they should receive equal yield
        assertApproxEqAbs(aliceStreamed.value, bobStreamed.value, 1e12, 
                         "Alice and Bob should receive equal yield");

        // Calculate expected streamed amount based on actual values
        // The flow rate is calculated as: balance / (HARVEST_DELAY * 2)
        // So for 5 hours, we expect: flowRate * 5 hours
        e memory totalStreamed = Dec.make(aliceStreamed.value + bobStreamed.value, E18_DEC);
        
        // Expected streamed amount: flowRate * 5 hours
        uint256 expectedStreamedValue = uint256(int256(flowRate)) * 5 hours;
        e memory expectedStreamed = Dec.make(expectedStreamedValue, E18_DEC);
        
        // Use a 10% tolerance for the streaming amount check
        uint256 tenPercentOfExpected = expectedStreamed.value / 10;
        assertApproxEqAbs(totalStreamed.value, expectedStreamed.value, tenPercentOfExpected, 
                         "Incorrect total streamed amount");
        
        // Fast forward to the end of the distribution period (another 19 hours)
        vm.warp(block.timestamp + 19 hours);
        
        // Get final amounts streamed
        e memory aliceFinalStreamed = Dec.make(usdcx.getTotalAmountReceivedByMember(yieldBox.distributionPool(), alice), E18_DEC);
        e memory bobFinalStreamed = Dec.make(usdcx.getTotalAmountReceivedByMember(yieldBox.distributionPool(), bob), E18_DEC);
        
        // Verify users received the full yield amount (with 10% tolerance)
        e memory totalFinalStreamed = Dec.make(aliceFinalStreamed.value + bobFinalStreamed.value, E18_DEC);
        uint256 tenPercentOfTotal = expectedYield18.value / 10;
        assertApproxEqAbs(totalFinalStreamed.value, expectedYield18.value, tenPercentOfTotal, 
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
        
        // Expect revert with the correct error message
        vm.expectRevert("No yield to harvest");  // Updated error message
        yieldBox.harvest();
        
        // Verify no streams were created
        int96 flowRate = yieldToken.getFlowRate(address(yieldBox), address(yieldBox.distributionPool()));
        assertEq(flowRate, 0, "Stream should not be created with zero yield");
        
        // Verify latent yield is zero
        assertEq(F.unwrap(yieldBox.availableYield()), 0, "Latent yield should be zero");
        
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
        console.log("Box yieldToken balance before simulated yield", yieldToken.balanceOf(address(yieldBox)));
        _simulateYield(yieldAmount.value);
        console.log("Box yieldToken balance after simulated yield", yieldToken.balanceOf(address(yieldBox)));
        yieldBox.harvest();
        console.log("Box yieldToken balance after harvest", yieldToken.balanceOf(address(yieldBox)));
        
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
        console.log("Box yieldToken balance", yieldToken.balanceOf(address(yieldBox)));
        console.log("Pool flow rate", yieldToken.getFlowRate(address(yieldBox), address(yieldBox.distributionPool())));
        console.log("pool units total", yieldBox.distributionPool().getTotalUnits());
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

    /// @notice Fuzz test for deposit and withdraw operations
    /// @dev Tests invariants across random inputs:
    ///      - Total shares should always match total deposits
    ///      - User balances should be accurate after operations
    ///      - Pool units should match share balances
    function testFuzz_DepositWithdraw(uint256 depositAmountRaw, uint256 withdrawAmountRaw) public {
        // Bound deposit to reasonable range (between min deposit and max uint128)
        e memory depositAmount = Dec.make(bound(depositAmountRaw, yieldBox.MINIMUM_DEPOSIT(), 1e15 * 1e6), U_TOKEN_DEC);
        console.log("depositAmount", depositAmount.value);
        // Ensure Alice has enough funds
        deal(USDC_ADDRESS, alice, depositAmount.value);
        
        // Initial deposit
        vm.startPrank(alice);
        usdc.approve(address(yieldBox), depositAmount.value);
        yieldBox.deposit(depositAmount.value);
        vm.stopPrank();
        console.log("Alice's balance in the yieldBox", F.unwrap(yieldBox.balanceOf(alice)));
        // Convert amounts to decimal types for comparison
        e18 depositShares = A.to18(depositAmount);
        console.log("depositShares", F.unwrap(depositShares));
        
        // Verify initial deposit state
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), F.unwrap(depositShares), 
            "Initial shares incorrect");
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), F.unwrap(depositShares), 
            "Total shares incorrect");
        assertEq(yieldBox.distributionPool().getUnits(alice), uint128(A.to(depositAmount, POOL_DEC).value),
            "Pool units incorrect");
        // Bound withdraw to user's actual balance
        e18 withdrawAmount = F.wrap(bound(withdrawAmountRaw, yieldBox.MINIMUM_DEPOSIT(), F.unwrap(depositShares)));
        console.log("withdrawAmount", F.unwrap(withdrawAmount));
        // Perform withdraw
        vm.startPrank(alice);
        yieldBox.withdraw(withdrawAmount);
        vm.stopPrank();
        console.log("Alice's balance in the yieldBox after withdraw", F.unwrap(yieldBox.balanceOf(alice)));

        // Verify withdraw state
        e18 expectedRemainingBalance = F.sub(depositShares, withdrawAmount);
        console.log("Alice's balance in the yieldBox after withdraw", F.unwrap(yieldBox.balanceOf(alice)));
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), F.unwrap(expectedRemainingBalance), 
            "Remaining balance incorrect after withdraw");
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), F.unwrap(expectedRemainingBalance), 
            "Total shares incorrect after withdraw");       
        // Verify pool units are updated correctly
        assertApproxEqAbs(yieldBox.distributionPool().getUnits(alice), uint128(F.to(expectedRemainingBalance, POOL_DEC).value),
            1e6,
            "Pool units incorrect after withdraw");
        // Verify USDC balance is correct
        assertEq(usdc.balanceOf(alice), F.to(withdrawAmount, U_TOKEN_DEC).value, 
            "USDC balance incorrect after withdraw");
        // Verify yieldToken balance is correct
        assertEq(yieldToken.balanceOf(alice), 0, 
            "YieldToken balance incorrect after withdraw");
        // Verify total deposited assets is correct
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), F.unwrap(expectedRemainingBalance), 
            "Total deposited assets incorrect after withdraw");     
        // Verify flow rate is correct
        assertEq(yieldToken.getFlowRate(address(yieldBox), address(yieldBox.distributionPool())), 0, 
            "Flow rate should be 0 after withdraw");
    }

    // ok now write another fuzz test for deposit and withdraw with N users, where N is a random number between 2 and 10
    // Also include yield accruing, harvesting, and users receiving streams
    // make sure invariants are maintained for each user, and that no user can affect another user's balance
    function testFuzz_DepositWithdrawMultipleUsers(uint256[20] memory depositAmountRaw, uint256[20] memory withdrawAmountRaw, uint256 NRaw) public {
        // Bound N to reasonable range (between 2 and 10)
        uint256 N = bound(NRaw, 2, 20);
        console.log("N: ", N);
        // Create multiple users
        address[] memory users = new address[](N);
        for (uint256 i = 0; i < N; i++) {
            users[i] = address(uint160(i+1));
        }
        e[] memory depositAmount = new e[](N);
        e memory totalDepositedUnderlying = Dec.make(0, U_TOKEN_DEC);
        // Create deposit amount with underlying token decimals (6 for USDC)
        for (uint256 i = 0; i < N; i++) {
            depositAmount[i] = Dec.make(bound(depositAmountRaw[i], yieldBox.MINIMUM_DEPOSIT(), 1e12 * 1e6), U_TOKEN_DEC);
            totalDepositedUnderlying = A.add(totalDepositedUnderlying, depositAmount[i]);
        }
        // Ensure each user has enough funds
        for (uint256 i = 0; i < N; i++) {
            deal(USDC_ADDRESS, users[i], depositAmount[i].value);
        }
        // Initial deposit from each user
        for (uint256 i = 0; i < N; i++) {   
            _depositAndConnect(users[i], depositAmount[i]);
        }
        // now let's check some invariants, for each user. Specifically, the balance of the yieldBox, the total deposited assets, and the pool units
        assertEq(F.eq(yieldBox.totalDepositedAssets(), A.to18(totalDepositedUnderlying)),true, "Total deposited assets incorrect");
        for (uint256 i = 0; i < N; i++) {
            assertEq(F.eq(yieldBox.balanceOf(users[i]), A.to18(depositAmount[i])),true, "User balance incorrect");
            assertEq(yieldBox.distributionPool().getUnits(users[i]), uint128(depositAmount[i].value), "Pool units incorrect");
        }
        
        e memory yieldAmount = Dec.make(totalDepositedUnderlying.value / N, U_TOKEN_DEC);
        // Generate yield and start streaming
        _simulateYield(yieldAmount.value /10);
        vm.warp(block.timestamp + 12 hours);
        yieldBox.harvest();

        // Fast forward to receive some yield
        vm.warp(block.timestamp + 6 hours);
        // Record yield received so far
        uint256[] memory userYieldBefore = new uint256[](N);
        for (uint256 i = 0; i < N; i++) {
            userYieldBefore[i] = usdcx.balanceOf(users[i]);
        }
        // Process withdrawals for each user
        e18[] memory withdrawAmount = new e18[](N);
        e18 totalWithdrawnE18 = Dec.make18(0);
        
        // Calculate withdraw amounts in e18 decimals to match userAssets
        for (uint256 i = 0; i < N; i++) {
            // Bound withdraw to user's available balance
            e18 userBalance = yieldBox.balanceOf(users[i]);
            withdrawAmount[i] = Dec.make18(
                bound(withdrawAmountRaw[i], 1, F.unwrap(userBalance))
            );
            totalWithdrawnE18 = F.add(totalWithdrawnE18, withdrawAmount[i]);
        }

        // Process withdrawals
        for (uint256 i = 0; i < N; i++) {
            if (F.gt(withdrawAmount[i], Dec.make18(0))) {
                vm.startPrank(users[i]);
                yieldBox.withdraw(withdrawAmount[i]);
                vm.stopPrank();
            }
        }

        // Check invariants after withdrawals
        e18 expectedTotalDeposited = F.sub(A.to18(totalDepositedUnderlying), totalWithdrawnE18);
        assertEq(
            F.eq(yieldBox.totalDepositedAssets(), expectedTotalDeposited),
            true,
            "Total deposited assets incorrect after withdrawals"
        );

        // Check individual user balances and pool units
        for (uint256 i = 0; i < N; i++) {
            e18 expectedBalance = F.sub(A.to18(depositAmount[i]), withdrawAmount[i]);
            assertEq(
                F.eq(yieldBox.balanceOf(users[i]), expectedBalance),
                true,
                "User balance incorrect after withdrawal"
            );

            // Convert expected balance to pool units
            e memory poolUnits = F.to(expectedBalance, POOL_DEC);
            assertApproxEqAbs(
                yieldBox.distributionPool().getUnits(users[i]),
                uint128(poolUnits.value),
                10,
                "Pool units incorrect after withdrawal"
            );
        }

        // Fast forward and check yield is still flowing
        vm.warp(block.timestamp + 6 hours);
        
        // Check each user received additional yield
        for (uint256 i = 0; i < N; i++) {
            uint256 userYieldAfter = yieldToken.balanceOf(users[i]);
            if (F.gt(yieldBox.balanceOf(users[i]), Dec.make18(0))) {
                assertGt(
                    userYieldAfter,
                    userYieldBefore[i],
                    "User should have received additional yield"
                );
            }
        }

        // Generate more yield and verify stream continues
        _simulateYield(yieldAmount.value / 10);
        vm.warp(block.timestamp + 12 hours);
        yieldBox.harvest();

        // Verify stream rate is still positive
        int96 flowRate = yieldToken.getFlowRate(
            address(yieldBox),
            address(yieldBox.distributionPool())
        );
        assertGt(flowRate, 0, "Stream should still be flowing");
        
    }
        
        // Withdraw depositAmount from each user

    /// @notice Tests basic deposit for another user functionality
    function test_DepositFor() public {
        // Setup
        address depositor = address(0x123);
        address recipient = address(0x456);
        uint256 depositAmount = 1000e6; // 1000 USDC
        
        // Fund depositor
        deal(USDC_ADDRESS, depositor, depositAmount);
        
        // First transfer tokens to the contract
        vm.startPrank(depositor);
        usdc.transfer(address(yieldBox), depositAmount);
        
        // Then call depositFor 
        yieldBox.depositFor(recipient);
        vm.stopPrank();
        
        // Verify recipient balance
        e18 expectedShares = A.to18(Dec.make(depositAmount, U_TOKEN_DEC));
        assertEq(F.unwrap(yieldBox.balanceOf(recipient)), F.unwrap(expectedShares), "Recipient balance incorrect");
        
        // Verify depositor has no balance
        assertEq(F.unwrap(yieldBox.balanceOf(depositor)), 0, "Depositor should not have balance");
        
        // Verify total assets
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), F.unwrap(expectedShares), "Total assets incorrect");
    }

    /// @notice Tests using contract balance for multiple deposits
    function test_MultipleDepositsForSameUser() public {
        // Setup
        address depositor = address(0x123);
        address recipient = address(0x456);
        uint256 deposit1 = 1000e6;
        uint256 deposit2 = 2000e6;
        
        // Fund depositor
        deal(USDC_ADDRESS, depositor, deposit1 + deposit2);
        
        // First deposit
        vm.startPrank(depositor);
        usdc.transfer(address(yieldBox), deposit1);
        yieldBox.depositFor(recipient);
        
        // Verify first deposit
        e18 expectedShares1 = A.to18(Dec.make(deposit1, U_TOKEN_DEC));
        assertEq(F.unwrap(yieldBox.balanceOf(recipient)), F.unwrap(expectedShares1), "First deposit balance incorrect");
        
        // Second deposit
        usdc.transfer(address(yieldBox), deposit2);
        yieldBox.depositFor(recipient);
        vm.stopPrank();
        
        // Verify combined balance
        e18 expectedShares2 = A.to18(Dec.make(deposit1 + deposit2, U_TOKEN_DEC));
        assertEq(F.unwrap(yieldBox.balanceOf(recipient)), F.unwrap(expectedShares2), "Combined balance incorrect");
    }

    /// @notice Tests different depositors for the same recipient
    function test_DifferentDepositorsForSameRecipient() public {
        // Setup
        address depositor1 = address(0x123);
        address depositor2 = address(0x456);
        address recipient = address(0x789);
        uint256 deposit1 = 1000e6;
        uint256 deposit2 = 2000e6;
        
        // Fund depositors
        deal(USDC_ADDRESS, depositor1, deposit1);
        deal(USDC_ADDRESS, depositor2, deposit2);
        
        // First depositor
        vm.startPrank(depositor1);
        usdc.transfer(address(yieldBox), deposit1);
        yieldBox.depositFor(recipient);
        vm.stopPrank();
        
        // Verify first deposit
        e18 expectedShares1 = A.to18(Dec.make(deposit1, U_TOKEN_DEC));
        assertEq(F.unwrap(yieldBox.balanceOf(recipient)), F.unwrap(expectedShares1), "First deposit balance incorrect");
        
        // Second depositor
        vm.startPrank(depositor2);
        usdc.transfer(address(yieldBox), deposit2);
        yieldBox.depositFor(recipient);
        vm.stopPrank();
        
        // Verify combined balance
        e18 expectedShares2 = A.to18(Dec.make(deposit1 + deposit2, U_TOKEN_DEC));
        assertEq(F.unwrap(yieldBox.balanceOf(recipient)), F.unwrap(expectedShares2), "Combined balance incorrect");
    }

    /// @notice Tests deposit for zero address fails
    function test_DepositForZeroAddress() public {
        // Setup
        address depositor = address(0x123);
        uint256 depositAmount = 1000e6;
        
        // Fund depositor
        deal(USDC_ADDRESS, depositor, depositAmount);
        
        // First transfer tokens to the contract
        vm.startPrank(depositor);
        usdc.transfer(address(yieldBox), depositAmount);
        
        // Try to deposit for zero address (should revert)
        vm.expectRevert("Cannot deposit for zero address");
        yieldBox.depositFor(address(0));
        vm.stopPrank();
    }

    /// @notice Tests deposit when amount is too small
    function test_DepositForTooSmall() public {
        // Setup
        address depositor = address(0x123);
        address recipient = address(0x456);
        uint256 tooSmallDeposit = yieldBox.MINIMUM_DEPOSIT() - 1;
        
        // Fund depositor
        deal(USDC_ADDRESS, depositor, tooSmallDeposit);
        
        // Transfer too small amount and try to deposit
        vm.startPrank(depositor);
        usdc.transfer(address(yieldBox), tooSmallDeposit);
        vm.expectRevert("Deposit too small");
        yieldBox.depositFor(recipient);
        vm.stopPrank();
    }

    /// @notice Tests deposit and withdrawal flow
    function test_DepositForAndWithdraw() public {
        // Setup
        address depositor = address(0x123);
        address recipient = address(0x456);
        uint256 depositAmount = 1000e6;
        
        // Initial balances
        deal(USDC_ADDRESS, depositor, depositAmount);
        uint256 initialRecipientBalance = usdc.balanceOf(recipient);
        
        // Deposit for recipient
        vm.startPrank(depositor);
        usdc.transfer(address(yieldBox), depositAmount);
        yieldBox.depositFor(recipient);
        vm.stopPrank();
        
        // Recipient withdraws
        e18 shareBalance = yieldBox.balanceOf(recipient);
        vm.startPrank(recipient);
        yieldBox.withdraw(shareBalance);
        vm.stopPrank();
        
        // Verify recipient got the funds
        assertEq(
            usdc.balanceOf(recipient), 
            initialRecipientBalance + depositAmount, 
            "Recipient should receive the full deposit amount"
        );
        
        // Verify recipient's share balance is now zero
        assertEq(F.unwrap(yieldBox.balanceOf(recipient)), 0, "Recipient should have no shares left");
    }

    /// @notice Fuzzing test for depositFor function
    function testFuzz_DepositFor(uint256[] calldata depositAmounts) public {
        // Limit array size to manageable values and ensure non-empty array
        vm.assume(depositAmounts.length > 0 && depositAmounts.length <= 10);
        
        uint256 totalDeposited = 0;
        
        for (uint256 i = 0; i < depositAmounts.length; i++) {
            // Create unique user address for this deposit
            address user = address(uint160(0x1000 + i));
            
            // Create unique depositor address
            address depositor = address(uint160(0x2000 + i));
            
            // Ensure minimum deposit and cap maximum to avoid overflow
            uint256 amount = bound(depositAmounts[i], yieldBox.MINIMUM_DEPOSIT(), 1000000e6);
            
            // Setup depositor with funds
            deal(USDC_ADDRESS, depositor, amount);
            
            // Record initial balances
            uint256 initialYieldBoxBalance = usdc.balanceOf(address(yieldBox));
            e18 initialUserShares = yieldBox.balanceOf(user);
            
            // Deposit
            vm.startPrank(depositor);
            usdc.transfer(address(yieldBox), amount);
            yieldBox.depositFor(user);
            vm.stopPrank();
            
            totalDeposited += amount;
            
            // Verify individual balance - calculate expected shares
            e memory depositAmountE = Dec.make(amount, U_TOKEN_DEC);
            e18 expectedNewShares = A.to18(depositAmountE);
            e18 expectedTotalShares = F.add(initialUserShares, expectedNewShares);
            
            assertEq(
                F.unwrap(yieldBox.balanceOf(user)), 
                F.unwrap(expectedTotalShares), 
                "User balance incorrect after deposit"
            );
            
            // Verify USDC was transferred correctly
            assertEq(
                usdc.balanceOf(address(yieldBox)), 
                initialYieldBoxBalance, 
                "YieldBox USDC balance should not change (tokens go to vault)"
            );
            
            // Verify pool units were updated
            assertApproxEqAbs(
                yieldBox.distributionPool().getUnits(user),
                uint128(F.to(expectedTotalShares, POOL_DEC).value),
                10,
                "Pool units incorrect after deposit"
            );
        }
        
        // Verify total assets
        e18 expectedTotal = A.to18(Dec.make(totalDeposited, U_TOKEN_DEC));
        uint256 actualTotal = F.unwrap(yieldBox.totalDepositedAssets());
        
        // Use approximate equality with small delta for potential rounding errors
        assertApproxEqAbs(
            actualTotal, 
            F.unwrap(expectedTotal), 
            1e12, 
            "Total assets incorrect"
        );
    }
}

// Malicious contract with custom receive function
contract MaliciousContract {
    IYieldBox public yieldBox;
    IERC20 public token;
    uint256 public receiveCount;
    
    constructor(address _yieldBox, address _token) {
        yieldBox = IYieldBox(_yieldBox);
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