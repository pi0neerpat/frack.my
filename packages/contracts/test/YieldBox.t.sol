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
        e memory depositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        
        // Get initial balances
        e memory aliceInitialBalance = Dec.make(usdc.balanceOf(alice), U_TOKEN_DEC);
        e memory vaultInitialBalance = Dec.make(usdc.balanceOf(address(mockVault)), U_TOKEN_DEC);
        
        vm.startPrank(alice);
        
        // Approve and deposit
        usdc.approve(address(yieldBox), depositAmount.value);
        yieldBox.deposit(depositAmount.value);
        
        vm.stopPrank();

        // Verify USDC transfers
        assertEq(usdc.balanceOf(alice), aliceInitialBalance.value - depositAmount.value, "Alice USDC balance incorrect");
        assertEq(usdc.balanceOf(address(mockVault)), vaultInitialBalance.value + depositAmount.value, "Vault USDC balance incorrect");
        
        // Verify share accounting
        assertEq(e18.unwrap(yieldBox.balanceOf(alice)), depositAmount.value, "Share balance incorrect");
        assertEq(e18.unwrap(yieldBox.totalDepositedAssets()), depositAmount.value, "Total shares incorrect");

        // Verify pool units
        console2.log("Pool units", yieldBox.distributionPool().getUnits(alice));
        console2.log("Deposit amount", depositAmount.value);
        console2.log("Deposit amount / 1e4", depositAmount.value/1e4);
        assertEq(yieldBox.distributionPool().getUnits(alice), uint128(depositAmount.value/1e4), "Pool units incorrect");
    }
    /// @notice Tests that users can withdraw their full position
    /// @dev Should verify:
    ///      - Correct USDC amount returned
    ///      - Shares burned
    ///      - Vault share calculation
    ///      - Events emitted
    function test_WithdrawFullPosition() public {
        e memory depositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        
        // First deposit
        _depositAndConnect(alice, depositAmount);
        
        // Get initial balances before withdrawal
        e memory aliceInitialBalance = Dec.make(usdc.balanceOf(alice), U_TOKEN_DEC);
        e memory vaultInitialBalance = Dec.make(usdc.balanceOf(address(mockVault)), U_TOKEN_DEC);
        e memory initialShares = Dec.make(e18.unwrap(yieldBox.balanceOf(alice)), U_TOKEN_DEC);
        e memory initialPoolUnits = Dec.make(yieldBox.distributionPool().getUnits(alice), POOL_DEC);
        
        vm.startPrank(alice);
        
        // Withdraw full position
        _withdraw(alice, A.to18(depositAmount));
        
        vm.stopPrank();

        // Verify USDC transfers
        assertEq(usdc.balanceOf(alice), A.add(aliceInitialBalance, depositAmount, U_TOKEN_DEC).value, "Alice USDC balance incorrect");
        assertEq(usdc.balanceOf(address(mockVault)), A.sub(vaultInitialBalance, depositAmount, U_TOKEN_DEC).value, "Vault USDC balance incorrect");
        
        // Verify share accounting
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), 0, "Share balance should be 0");
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), 0, "Total shares should be 0");
        
        // Verify pool units
        assertEq(yieldBox.distributionPool().getUnits(alice), 0, "Pool units should be 0");
        
        // Verify all shares were burned
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), initialShares.value - depositAmount.value, "Not all shares were burned");
        
        // Verify all pool units were removed
        assertEq(yieldBox.distributionPool().getUnits(alice), (A.sub(A.to(initialPoolUnits, POOL_DEC), A.to(depositAmount, POOL_DEC), POOL_DEC)).value, "Not all pool units were removed");
    }

    /// @notice Tests partial withdrawal functionality
    /// @dev Should verify:
    ///      - Correct partial USDC amount returned
    ///      - Correct remaining shares
    ///      - Proper vault share recalculation
    function test_WithdrawPartialPosition() public {
        e memory depositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        e18 withdrawAmount = Dec.make18(400e6); // 400 USDC
        
        // First deposit
        _depositAndConnect(alice, depositAmount);
        
        // Get initial balances before withdrawal
        e memory aliceInitialBalance = Dec.make(usdc.balanceOf(alice), U_TOKEN_DEC);
        e memory vaultInitialBalance = Dec.make(usdc.balanceOf(address(mockVault)), U_TOKEN_DEC);
        e18 initialShares = yieldBox.balanceOf(alice);
        e memory initialPoolUnits = Dec.make(yieldBox.distributionPool().getUnits(alice), POOL_DEC);
        
        vm.startPrank(alice);
        
        // Withdraw partial position
        yieldBox.withdraw(withdrawAmount);
        
        vm.stopPrank();

        // Verify USDC transfers
        assertEq(usdc.balanceOf(alice), A.add(aliceInitialBalance, F.to(withdrawAmount, U_TOKEN_DEC), U_TOKEN_DEC).value, "Alice USDC balance incorrect");
        assertEq(usdc.balanceOf(address(mockVault)), A.sub(vaultInitialBalance, F.to(withdrawAmount, U_TOKEN_DEC), U_TOKEN_DEC).value, "Vault USDC balance incorrect");
        
        // Verify remaining share accounting
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), F.unwrap(F.sub(A.to18(depositAmount), withdrawAmount)), "Remaining share balance incorrect");
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), F.unwrap(F.sub(A.to18(depositAmount), withdrawAmount)), "Total shares incorrect");
        
        // Verify remaining pool units
        e memory expectedPoolUnits = F.to(F.sub(A.to18(depositAmount), withdrawAmount), POOL_DEC);
        assertEq(yieldBox.distributionPool().getUnits(alice), uint128(expectedPoolUnits.value), "Remaining pool units incorrect");
        
        // Verify partial shares were burned
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), F.unwrap(F.sub(initialShares, withdrawAmount)), "Incorrect shares burned");
        
        // Verify partial pool units were removed
        assertEq(yieldBox.distributionPool().getUnits(alice), uint128(A.sub(initialPoolUnits, F.to(withdrawAmount, POOL_DEC), POOL_DEC).value), "Incorrect pool units removed");
    }

    /**** Yield Distribution Tests ****/
    /// @notice Tests yield distribution when single user has deposited
    /// @dev Should verify:
    ///      - Yield is properly reflected in share price
    ///      - User can withdraw initial deposit plus yield
    ///      - Correct accounting in underlying vault
    function test_YieldDistributionSingleUser() public {
        e memory depositAmount = Dec.make(1000e6, U_TOKEN_DEC); // 1000 USDC
        e memory yieldAmount = Dec.make(100e6, U_TOKEN_DEC); // 100 USDC

        // Initial deposit from Alice
        _depositAndConnect(alice, depositAmount);
        
        // Get balances before harvest
        e memory aliceInitialBalance = Dec.make(usdc.balanceOf(alice), U_TOKEN_DEC);
        e memory initialVaultBalance = Dec.make(mockVault.totalAssets(), U_TOKEN_DEC);
        
        // Generate yield in mock vault (10% return)
        _simulateYield(yieldAmount.value);
        
        assertApproxEqAbs(F.unwrap(yieldBox.latentYield()), yieldAmount.value, 10, "Vault assets not properly updated");
        // Harvest yield
        vm.warp(block.timestamp + 12 hours); // Wait minimum harvest delay
        yieldBox.upgradeAll();
        // now check USDCx balance
        assertApproxEqAbs(yieldToken.balanceOf(address(yieldBox)), yieldAmount.value * 1e12, 1e12, "Not all underlying upgraded");

        // now let's start the stream and check the flow rate
        yieldBox.smother();
        int96 flowRate = yieldBox.yieldToken().getFlowRate(address(yieldBox), address(yieldBox.distributionPool()));
        // Verify yield was properly captured. 
        // this should take into account the buffer of the stream (4 hours)
        assertApproxEqAbs(usdc.balanceOf(address(yieldBox)), 0, 10e12, "Not all underlying upgraded");
        
        // Calculate expected flow rate using decimal library
        e memory expectedFlowRate = Dec.make(yieldAmount.value * 1e12 / (24 hours), U_TOKEN_DEC);
        assertApproxEqAbs(flowRate, int96(uint96(expectedFlowRate.value)), 10e9, "Incorrect flow rate");
        
        // Fast forward to receive some yield 
        vm.warp(block.timestamp + 6 hours);
        // Verify the yieldBox is still streaming yield
        assertTrue(yieldBox.yieldToken().getFlowRate(address(yieldBox), address(yieldBox.distributionPool())) > 0, "Yield stream not active");
        
        // verify that alice is actually receiving yield
        e memory amountStreamed = Dec.make(usdcx.getTotalAmountReceivedByMember(yieldBox.distributionPool(), alice), E18_DEC);
        assertGt(amountStreamed.value, 0, "No yield streamed");
        // check alice's balance
        assertEq(usdcx.balanceOf(alice), amountStreamed.value, "No yield received");
    }

    /// @notice Tests yield distribution with multiple users
    /// @dev Should verify:
    ///      - Yield is distributed proportionally
    ///      - Different deposit timings are handled correctly
    ///      - All users can withdraw their fair share
    function test_YieldDistributionMultipleUsers() public {}

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