// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {YieldBoxETH} from "../src/YieldBoxETH.sol";
import {MockETHStrategy} from "../src/MockETHStrategy.sol";
import {MockPriceOracle} from "../src/MockPriceOracle.sol";
import {MockSwapRouter} from "../src/MockSwapRouter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {console} from "forge-std/console.sol";
import {ISuperfluidPool, PoolConfig, PoolERC20Metadata} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import {ISuperfluidPool} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/ISuperfluidPool.sol";
import {e18, e, decimal, Dec, F, A, D} from "../src/decimalLibrary.sol";

contract YieldBoxETHTest is Test {
    using SuperTokenV1Library for ISuperToken;
    using Dec for uint256;
    using Dec for uint8;

    YieldBoxETH public yieldBox;
    MockETHStrategy public ethStrategy;
    MockPriceOracle public priceOracle;
    MockSwapRouter public swapRouter;
    
    address constant USDC_ADDRESS = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant USDCx_ADDRESS = 0xD04383398dD2426297da660F9CCA3d439AF9ce1b;
    address constant WETH_ADDRESS = 0x4200000000000000000000000000000000000006;
    
    ISuperToken yieldToken = ISuperToken(USDCx_ADDRESS);

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    
    IERC20 usdc = IERC20(USDC_ADDRESS);
    ISuperToken usdcx = ISuperToken(USDCx_ADDRESS);

    // ETH price in USD (2000 USD per ETH with 18 decimals)
    uint256 constant ETH_PRICE = 2000 * 1e18;
    // Conversion rate for mock swap router (2000 USDC per ETH with 6 decimals)
    uint256 constant CONVERSION_RATE = 2000 * 1e6;

    // get decimals from contract 
    decimal public U_TOKEN_DEC;
    decimal public E_TOKEN_DEC;
    decimal public POOL_DEC;
    decimal public E18_DEC;

    function setUp() public {
        // Fork Base mainnet
        vm.createSelectFork("base");
        
        // Deploy mock contracts
        ethStrategy = new MockETHStrategy();
        priceOracle = new MockPriceOracle(ETH_PRICE);
        swapRouter = new MockSwapRouter(USDC_ADDRESS, WETH_ADDRESS, CONVERSION_RATE);
        
        // Deploy YieldBoxETH
        yieldBox = new YieldBoxETH(
            address(ethStrategy),
            USDCx_ADDRESS,
            address(priceOracle),
            address(swapRouter),
            USDC_ADDRESS,
            WETH_ADDRESS
        );
        
        // Fund test users with ETH
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        
        // Fund swap router with USDC for swaps
        deal(USDC_ADDRESS, address(swapRouter), 1_000_000 * 1e6);
        
        // Mock USDCx upgrade functionality
        vm.mockCall(
            USDCx_ADDRESS,
            abi.encodeWithSelector(ISuperToken.upgrade.selector, uint256(0)),
            abi.encode()
        );
        
        // Get decimal values from contract
        U_TOKEN_DEC = yieldBox.U_TOKEN_DEC();
        E_TOKEN_DEC = yieldBox.E_TOKEN_DEC();
        POOL_DEC = yieldBox.POOL_DEC();
        E18_DEC = yieldBox.E18_DEC();
    }

    /**** Helper functions ****/

    // Helper function to simulate yield in ETH
    function _simulateYield(uint256 amount) internal {
        vm.deal(address(this), amount);
        ethStrategy.simulateYield{value: amount}();
    }

    // Helper function to deposit ETH and connect to pool
    function _depositETH(address user, uint256 amount) internal {
        vm.startPrank(user);
        yieldBox.deposit{value: amount}();
        yieldToken.connectPool(yieldBox.distributionPool());
        vm.stopPrank();
    }

    // Helper function to withdraw ETH
    function _withdraw(address user, e18 amount) internal {
        vm.startPrank(user);
        yieldBox.withdraw(amount);
        vm.stopPrank();
    }

    // Helper function to harvest yield
    function _harvestYield() internal returns (e18 yield) {
        // Get initial USDCx balance
        uint256 initialUSDCxBalance = yieldToken.balanceOf(address(yieldBox));
        
        // Call upgradeAll to harvest yield
        yieldBox.upgradeAll();
        
        // Calculate yield from USDCx balance change
        uint256 finalUSDCxBalance = yieldToken.balanceOf(address(yieldBox));
        yield = Dec.make18(finalUSDCxBalance - initialUSDCxBalance);
        
        return yield;
    }

    /**** Tests ****/
    function test_InitialState() public {
        // Check strategy and token configuration
        assertEq(address(yieldBox.ethStrategy()), address(ethStrategy), "Wrong strategy address");
        assertEq(address(yieldBox.yieldToken()), USDCx_ADDRESS, "Wrong yield token");
        assertEq(address(yieldBox.priceOracle()), address(priceOracle), "Wrong price oracle");
        assertEq(address(yieldBox.swapRouter()), address(swapRouter), "Wrong swap router");
        assertEq(yieldBox.USDC_ADDRESS(), USDC_ADDRESS, "Wrong USDC address");
        assertEq(yieldBox.WETH_ADDRESS(), WETH_ADDRESS, "Wrong WETH address");

        // Check decimal configurations
        assertEq(D.unwrap(yieldBox.U_TOKEN_DEC()), 6, "Wrong USDC decimals");
        assertEq(D.unwrap(yieldBox.E_TOKEN_DEC()), 18, "Wrong ETH decimals");
        assertEq(D.unwrap(yieldBox.POOL_DEC()), 9, "Wrong pool decimals");
        assertEq(D.unwrap(yieldBox.E18_DEC()), 18, "Wrong E18 decimals");

        // Check initial state
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), 0, "Initial total assets should be 0");
        assertEq(yieldBox.lastHarvestTimestamp(), 0, "Initial harvest timestamp should be 0");
        
        // Verify pool setup
        ISuperfluidPool pool = yieldBox.distributionPool();
        assertTrue(address(pool) != address(0), "Pool not initialized");
        
        // Verify pool metadata
        string memory name = pool.name();
        string memory symbol = pool.symbol();
        uint8 decimals = pool.decimals();
        
        assertEq(name, "YieldBox", "Pool name incorrect");
        assertEq(symbol, "YBX", "Pool symbol incorrect");
        assertEq(decimals, 9, "Pool decimals incorrect");
    }
    
    function test_DepositETHBasicFlow() public {
        uint256 depositAmount = 1 ether;
        
        // Get initial balances
        uint256 aliceInitialBalance = alice.balance;
        uint256 strategyInitialBalance = address(ethStrategy).balance;
        
        // Deposit ETH
        _depositETH(alice, depositAmount);
        
        // Verify ETH transfers
        assertEq(alice.balance, aliceInitialBalance - depositAmount, "Alice ETH balance incorrect");
        assertEq(address(ethStrategy).balance, strategyInitialBalance + depositAmount, "Strategy ETH balance incorrect");
        
        // Verify share accounting (in 18 decimals)
        e18 expectedShares = Dec.make18(depositAmount);
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), F.unwrap(expectedShares), "Share balance incorrect");
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), F.unwrap(expectedShares), "Total shares incorrect");
        
        // Verify pool units (in 9 decimals)
        e memory depositAmountE = Dec.make(depositAmount, E_TOKEN_DEC);
        e memory poolUnits = A.to(depositAmountE, POOL_DEC);
        assertEq(yieldBox.distributionPool().getUnits(alice), uint128(poolUnits.value), "Pool units incorrect");
    }
    
    function test_WithdrawETHFullPosition() public {
        uint256 depositAmount = 1 ether;
        
        // First deposit ETH
        _depositETH(alice, depositAmount);
        
        // Get balances before withdrawal
        uint256 aliceBalanceBefore = alice.balance;
        uint256 strategyBalanceBefore = address(ethStrategy).balance;
        
        // Get initial shares and pool units
        e18 initialShares = yieldBox.balanceOf(alice);
        uint128 initialPoolUnits = yieldBox.distributionPool().getUnits(alice);
        
        // Withdraw full position
        _withdraw(alice, initialShares);
        
        // Verify ETH transfers
        assertEq(alice.balance, aliceBalanceBefore + depositAmount, "Alice ETH balance incorrect after withdrawal");
        assertEq(address(ethStrategy).balance, strategyBalanceBefore - depositAmount, "Strategy ETH balance incorrect after withdrawal");
        
        // Verify share accounting
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), 0, "Share balance should be 0 after full withdrawal");
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), 0, "Total shares should be 0 after full withdrawal");
        
        // Verify pool units
        assertEq(yieldBox.distributionPool().getUnits(alice), 0, "Pool units should be 0 after full withdrawal");
    }
    
    function test_WithdrawETHPartialPosition() public {
        uint256 depositAmount = 1 ether;
        uint256 withdrawAmount = 0.4 ether; // 40% of deposit
        
        // First deposit ETH
        _depositETH(alice, depositAmount);
        
        // Get balances before withdrawal
        uint256 aliceBalanceBefore = alice.balance;
        uint256 strategyBalanceBefore = address(ethStrategy).balance;
        
        // Get initial shares and pool units
        e18 initialShares = yieldBox.balanceOf(alice);
        uint128 initialPoolUnits = yieldBox.distributionPool().getUnits(alice);
        
        // Convert withdraw amount to 18 decimals for the withdraw function
        e18 withdrawShares = Dec.make18(withdrawAmount);
        
        // Withdraw partial position
        _withdraw(alice, withdrawShares);
        
        // Calculate expected remaining amounts
        e18 expectedRemainingShares = F.sub(initialShares, withdrawShares);
        
        // Verify ETH transfers
        assertEq(alice.balance, aliceBalanceBefore + withdrawAmount, "Alice ETH balance incorrect after partial withdrawal");
        assertEq(address(ethStrategy).balance, strategyBalanceBefore - withdrawAmount, "Strategy ETH balance incorrect after partial withdrawal");
        
        // Verify remaining share accounting
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), F.unwrap(expectedRemainingShares), "Remaining share balance incorrect");
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), F.unwrap(expectedRemainingShares), "Total shares incorrect after partial withdrawal");
        
        // Calculate expected remaining pool units
        e memory withdrawAmountE = Dec.make(withdrawAmount, E_TOKEN_DEC);
        e memory withdrawPoolUnits = A.to(withdrawAmountE, POOL_DEC);
        uint128 expectedPoolUnits = initialPoolUnits - uint128(withdrawPoolUnits.value);
        
        // Verify remaining pool units
        assertEq(yieldBox.distributionPool().getUnits(alice), expectedPoolUnits, "Remaining pool units incorrect");
    }
    
    function test_ETHYieldDistributionSingleUser() public {
        // Setup deposit and yield amounts
        uint256 depositAmount = 1 ether;
        uint256 yieldAmount = 0.1 ether; // 10% yield
        
        // Make sure swap router has enough USDC
        deal(USDC_ADDRESS, address(swapRouter), 1_000_000 * 1e6);
        
        // Initial deposit from Alice
        _depositETH(alice, depositAmount);
        
        // Generate yield in strategy (10% return)
        _simulateYield(yieldAmount);
        
        // Verify latent yield is detected correctly
        e18 expectedYield = Dec.make18(yieldAmount);
        assertApproxEqAbs(F.unwrap(yieldBox.latentYield()), F.unwrap(expectedYield), 1e15, 
                         "Latent yield not properly detected");
        
        // Calculate expected USDC yield value
        uint256 expectedUSDCYield = yieldAmount * ETH_PRICE / 1e18; // ETH amount * ETH/USDC price
        expectedUSDCYield = expectedUSDCYield / 10**12; // Convert to USDC decimals (6)
        
        // Verify latent yield in USDC
        e memory expectedUSDCYieldE = Dec.make(expectedUSDCYield, U_TOKEN_DEC);
        assertApproxEqAbs(yieldBox.latentYieldInUSDC().value, expectedUSDCYieldE.value, 10, 
                         "Latent yield in USDC not properly calculated");
        
        // Harvest yield
        vm.warp(block.timestamp + 12 hours); // Wait minimum harvest delay
        
        // Record initial balances
        uint256 initialUSDCBalance = usdc.balanceOf(address(yieldBox));
        console.log("Initial USDC balance:", initialUSDCBalance);
        
        // Harvest yield (only call upgradeAll, not the full harvest)
        yieldBox.upgradeAll();
        
        // Check balances after harvest
        uint256 finalUSDCBalance = usdc.balanceOf(address(yieldBox));
        console.log("Final USDC balance:", finalUSDCBalance);
        console.log("Expected USDC yield:", expectedUSDCYield);
        
        // Verify USDC was received correctly
        assertApproxEqAbs(finalUSDCBalance - initialUSDCBalance, expectedUSDCYield, 10, 
                         "Not all yield converted to USDC");
        
        // Verify yield was properly captured (ETH yield should be transferred out of strategy)
        assertEq(address(ethStrategy).balance, depositAmount, 
                 "ETH yield not properly withdrawn from strategy");
    }
    
    function test_ETHYieldDistributionMultipleUsers() public {
        // Setup deposit and yield amounts
        uint256 aliceDepositAmount = 1 ether;
        uint256 bobDepositAmount = 0.5 ether;
        uint256 firstYieldAmount = 0.05 ether; // 5% yield on Alice's deposit
        uint256 secondYieldAmount = 0.15 ether; // 10% yield on combined deposits
        
        // Make sure swap router has enough USDC
        deal(USDC_ADDRESS, address(swapRouter), 1_000_000 * 1e6);
        
        // Initial deposit from Alice
        _depositETH(alice, aliceDepositAmount);
        
        // Generate first yield batch (only Alice has deposited)
        _simulateYield(firstYieldAmount);
        
        // Harvest first yield batch
        vm.warp(block.timestamp + 12 hours);
        
        // Record initial USDC balance
        uint256 initialUSDCBalance = usdc.balanceOf(address(yieldBox));
        
        // Harvest first yield batch
        yieldBox.upgradeAll();
        
        // Calculate expected first USDC yield
        uint256 firstUSDCYield = firstYieldAmount * ETH_PRICE / 1e18;
        firstUSDCYield = firstUSDCYield / 10**12; // Convert to USDC decimals (6)
        
        // Verify first yield was converted correctly
        assertApproxEqAbs(usdc.balanceOf(address(yieldBox)) - initialUSDCBalance, firstUSDCYield, 10, 
                         "First yield batch not converted correctly");
        
        // Now Bob deposits
        _depositETH(bob, bobDepositAmount);
        
        // Generate second yield batch (both Alice and Bob have deposited)
        _simulateYield(secondYieldAmount);
        
        // Harvest second yield batch
        vm.warp(block.timestamp + 12 hours);
        
        // Record USDC balance before second harvest
        uint256 secondInitialUSDCBalance = usdc.balanceOf(address(yieldBox));
        
        // Harvest second yield batch
        yieldBox.upgradeAll();
        
        // Calculate expected second USDC yield
        uint256 secondUSDCYield = secondYieldAmount * ETH_PRICE / 1e18;
        secondUSDCYield = secondUSDCYield / 10**12; // Convert to USDC decimals (6)
        
        // Verify second yield was converted correctly
        assertApproxEqAbs(usdc.balanceOf(address(yieldBox)) - secondInitialUSDCBalance, secondUSDCYield, 10, 
                         "Second yield batch not converted correctly");
        
        // Verify total ETH in strategy
        // After yield withdrawals, the strategy should have the original deposits
        assertEq(address(ethStrategy).balance, aliceDepositAmount + bobDepositAmount, 
                 "Incorrect total ETH in strategy");
        
        // Verify users can withdraw their deposits
        uint256 aliceBalanceBefore = alice.balance;
        uint256 bobBalanceBefore = bob.balance;
        
        // Get actual share balances
        e18 aliceShares = yieldBox.balanceOf(alice);
        e18 bobShares = yieldBox.balanceOf(bob);
        
        // Withdraw using actual share balances
        _withdraw(alice, aliceShares);
        _withdraw(bob, bobShares);
        
        // Verify ETH returned to users (approximately equal to their deposits)
        assertApproxEqAbs(alice.balance - aliceBalanceBefore, aliceDepositAmount, 1e15, 
                         "Alice ETH balance incorrect after withdrawal");
        assertApproxEqAbs(bob.balance - bobBalanceBefore, bobDepositAmount, 1e15, 
                         "Bob ETH balance incorrect after withdrawal");
        
        // Verify share balances are zero
        assertEq(F.unwrap(yieldBox.balanceOf(alice)), 0, "Alice should have 0 shares after withdrawal");
        assertEq(F.unwrap(yieldBox.balanceOf(bob)), 0, "Bob should have 0 shares after withdrawal");
        
        // Verify total deposited assets is zero
        assertEq(F.unwrap(yieldBox.totalDepositedAssets()), 0, "Total deposited assets should be 0");
    }
} 