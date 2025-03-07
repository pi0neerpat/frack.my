// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20, IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {ISuperfluidPool, PoolConfig, PoolERC20Metadata} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import {ISuperfluidPool} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/ISuperfluidPool.sol";
import {e18, e, decimal, Dec, F, A, D} from "./decimalLibrary.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Interface for ETH yield strategy
interface IETHStrategy {
    function deposit() external payable;
    function withdraw(uint256 amount) external returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function totalAssets() external view returns (uint256);
}

// Interface for price oracle
interface IPriceOracle {
    function getETHtoUSDCPrice() external view returns (uint256); // Returns price with 18 decimals precision
}

// Interface for swapping ETH to USDC
interface ISwapRouter {
    function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) 
        external 
        payable 
        returns (uint256[] memory amounts);
}

// This contract accepts ETH deposits, invests in ETH yield strategies, and distributes USDCx yield
contract YieldBoxETH is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SuperTokenV1Library for ISuperToken;
    using Dec for uint256;
    using Dec for uint8;

    // Events with explicit decimal precision
    event Deposit(address indexed user, uint256 ethAmount);
    event Withdraw(address indexed user, uint256 ethAmount);
    event HarvestYield(uint256 yieldAmount18);
    event StreamUpdated(address indexed user, int96 flowRate);
    event SwapExecuted(uint256 ethAmount, uint256 usdcReceived);

    // State variables
    IETHStrategy public immutable ethStrategy;
    ISuperToken public immutable yieldToken; // USDCx
    IPriceOracle public immutable priceOracle;
    ISwapRouter public immutable swapRouter;
    ISuperfluidPool public immutable distributionPool;
    
    address public immutable USDC_ADDRESS;
    address public immutable WETH_ADDRESS;
    
    // Share accounting - stored in 18 decimals
    mapping(address => e18) public userAssets;
    e18 public totalDepositedAssets;
    
    // Protocol parameters
    uint256 public constant MINIMUM_DEPOSIT = 1e16; // 0.01 ETH
    e18 public constant HARVEST_DELAY = e18.wrap(12 hours);
    uint256 public lastHarvestTimestamp;
    
    // Decimal precisions as type-safe decimal values
    decimal public immutable U_TOKEN_DEC; // USDC decimals (6)
    decimal public immutable E_TOKEN_DEC; // ETH decimals (18)
    decimal public immutable POOL_DEC;    // Pool decimals (9)
    decimal public immutable E18_DEC = uint(18).d();
    
    // Slippage protection
    uint256 public slippageTolerance = 50; // 0.5% default slippage tolerance (basis points)

    constructor(
        address _ethStrategy, 
        address _yieldToken, 
        address _priceOracle,
        address _swapRouter,
        address _usdcAddress,
        address _wethAddress
    ) {
        require(_ethStrategy != address(0), "Invalid strategy address");
        require(_yieldToken != address(0), "Invalid yield token address");
        require(_priceOracle != address(0), "Invalid price oracle address");
        require(_swapRouter != address(0), "Invalid swap router address");
        require(_usdcAddress != address(0), "Invalid USDC address");
        require(_wethAddress != address(0), "Invalid WETH address");
        
        ethStrategy = IETHStrategy(_ethStrategy);
        yieldToken = ISuperToken(_yieldToken);
        priceOracle = IPriceOracle(_priceOracle);
        swapRouter = ISwapRouter(_swapRouter);
        USDC_ADDRESS = _usdcAddress;
        WETH_ADDRESS = _wethAddress;

        // Store decimal precisions with type safety
        U_TOKEN_DEC = IERC20Metadata(_usdcAddress).decimals().d();
        E_TOKEN_DEC = uint(18).d(); // ETH has 18 decimals
        POOL_DEC = uint(9).d();

        // Create distribution pool
        distributionPool = yieldToken.createPoolWithCustomERC20Metadata(
            address(this),
            PoolConfig(true, true),
            PoolERC20Metadata("YieldBox", "YBX", 9)
        );
    }

    // Allow contract to receive ETH
    receive() external payable {
        // Only accept ETH from the strategy or direct deposits
        require(
            msg.sender == address(ethStrategy) || 
            msg.value >= MINIMUM_DEPOSIT, 
            "ETH transfer not allowed"
        );
    }
    
    fallback() external payable {
        // Only accept ETH from the strategy
        require(msg.sender == address(ethStrategy), "ETH transfer not allowed");
    }

    function balanceOf(address user) public view returns (e18) {
        return userAssets[user];
    }

    // Deposit ETH into the strategy
    function deposit() external payable nonReentrant {
        require(msg.value >= MINIMUM_DEPOSIT, "Deposit too small");
        
        // Create amount with ETH decimals (18)
        e memory depositAmount = Dec.make(msg.value, E_TOKEN_DEC);
        
        // Forward ETH to strategy
        ethStrategy.deposit{value: msg.value}();
        
        // Convert to pool units (9 decimals) and update pool
        e memory poolUnits = A.to(depositAmount, POOL_DEC);
        distributionPool.updateMemberUnits(
            msg.sender,
            uint128(poolUnits.value) + distributionPool.getUnits(msg.sender)
        );
        
        // Update user accounting in 18 decimals (already in correct decimals)
        userAssets[msg.sender] = F.add(userAssets[msg.sender], A.to18(depositAmount));
        totalDepositedAssets = F.add(totalDepositedAssets, A.to18(depositAmount));
        
        emit Deposit(msg.sender, msg.value);
    }

    // Withdraw ETH from the strategy
    function withdraw(e18 amount) external nonReentrant {
        require(F.gt(amount, Dec.make18(0)), "Cannot withdraw 0");
        require(F.gte(userAssets[msg.sender], amount), "Insufficient balance");
        
        // Update user accounting first (checks-effects-interactions pattern)
        userAssets[msg.sender] = F.sub(userAssets[msg.sender], amount);
        totalDepositedAssets = F.sub(totalDepositedAssets, amount);
        
        // Update pool units
        e memory poolUnits = F.to(amount, POOL_DEC);
        uint128 currentUnits = distributionPool.getUnits(msg.sender);
        uint128 newUnits;
        if (currentUnits < uint128(poolUnits.value) || F.unwrap(userAssets[msg.sender]) == 0) {
            newUnits = 0;
        } else {
            newUnits = currentUnits - uint128(poolUnits.value);
        }
        distributionPool.updateMemberUnits(msg.sender, newUnits);
        
        // Convert to ETH decimals and withdraw
        e memory withdrawAmount = F.to(amount, E_TOKEN_DEC);
        uint256 ethReceived = ethStrategy.withdraw(withdrawAmount.value);
        
        // Transfer ETH to user
        (bool success, ) = msg.sender.call{value: ethReceived}("");
        require(success, "ETH transfer failed");
        
        emit Withdraw(msg.sender, ethReceived);
    }

    // Harvest yield, convert to USDCx, and distribute
    function harvest() external nonReentrant {
        e18 yieldAmount = upgradeAll();
        smother();
        emit HarvestYield(e18.unwrap(yieldAmount));
    }

    // Calculate and withdraw ETH yield, convert to USDC, and upgrade to USDCx
    function upgradeAll() public nonReentrant returns (e18 yield) {
        // Calculate ETH yield
        e memory ourDeposit = F.to(totalDepositedAssets, E_TOKEN_DEC);
        e memory totalEthInStrategy = Dec.make(ethStrategy.totalAssets(), E_TOKEN_DEC);
        e memory ethYieldAmount = A.sub(totalEthInStrategy, ourDeposit, E_TOKEN_DEC);
        
        require(ethYieldAmount.value > 0, "No yield to upgrade");
        
        // Withdraw ETH yield from strategy
        uint256 ethWithdrawn = ethStrategy.withdraw(ethYieldAmount.value);
        
        // Swap ETH for USDC
        uint256 usdcReceived = swapETHforUSDC(ethWithdrawn);
        
        // Record yield in 18 decimals for return value
        e memory usdcYield = Dec.make(usdcReceived, U_TOKEN_DEC);
        yield = A.to18(usdcYield);
        
        // Approve and upgrade USDC to USDCx
        IERC20(USDC_ADDRESS).approve(address(yieldToken), usdcReceived);
        yieldToken.upgrade(usdcReceived);
        
        lastHarvestTimestamp = block.timestamp;
        
        return yield;
    }

    // Create or update the distribution stream
    function smother() public {
        e18 balance = Dec.make18(yieldToken.balanceOf(address(this)));
        int96 flowRate = F.toInt96(balance) / (F.toInt96(HARVEST_DELAY) * 2);
        yieldToken.distributeFlow(distributionPool, flowRate);
        emit StreamUpdated(address(this), flowRate);
    }

    // Calculate the latent yield in the strategy (in ETH terms)
    function latentYield() public view returns (e18) {
        e memory ourDeposit = F.to(totalDepositedAssets, E_TOKEN_DEC);
        e memory totalEthInStrategy = Dec.make(ethStrategy.totalAssets(), E_TOKEN_DEC);
        
        // If strategy has less than our deposit (loss), return 0
        if (A.lt(totalEthInStrategy, ourDeposit, E_TOKEN_DEC)) {
            return Dec.make18(0);
        }
        
        e memory ethYield = A.sub(totalEthInStrategy, ourDeposit, E_TOKEN_DEC);
        return A.to18(ethYield);
    }
    
    // Calculate the estimated USDC value of the latent ETH yield
    function latentYieldInUSDC() public view returns (e) {
        e18 ethYield = latentYield();
        if (F.unwrap(ethYield) == 0) {
            return Dec.make(0, U_TOKEN_DEC);
        }
        
        uint256 ethPrice = priceOracle.getETHtoUSDCPrice();
        uint256 usdcValue = calculateUSDCYieldValue(F.unwrap(ethYield), ethPrice);
        
        return Dec.make(usdcValue, U_TOKEN_DEC);
    }
    
    // Convert ETH amount to USDC value using price oracle
    function calculateUSDCYieldValue(uint256 ethAmount, uint256 ethPrice) internal view returns (uint256) {
        // ethPrice is in 18 decimals (e.g., 2000 * 10^18 for $2000 per ETH)
        // Formula: ETH amount * ETH/USDC price / 10^18
        uint256 usdcValue = (ethAmount * ethPrice) / 1e18;
        
        // Convert to USDC decimals (6)
        return usdcValue / 10**(18 - uint256(D.unwrap(U_TOKEN_DEC)));
    }
    
    // Swap ETH for USDC using DEX
    function swapETHforUSDC(uint256 ethAmount) internal returns (uint256) {
        if (ethAmount == 0) return 0;
        
        // Get current ETH/USDC price
        uint256 ethPrice = priceOracle.getETHtoUSDCPrice();
        
        // Calculate expected USDC amount
        uint256 expectedUSDC = calculateUSDCYieldValue(ethAmount, ethPrice);
        
        // Calculate minimum acceptable amount with slippage tolerance
        uint256 minUSDC = expectedUSDC * (10000 - slippageTolerance) / 10000;
        
        // Set up swap path
        address[] memory path = new address[](2);
        path[0] = WETH_ADDRESS;
        path[1] = USDC_ADDRESS;
        
        // Execute swap
        uint256[] memory amounts = swapRouter.swapExactETHForTokens{value: ethAmount}(
            minUSDC,
            path,
            address(this),
            block.timestamp + 60
        );
        
        uint256 usdcReceived = amounts[amounts.length - 1];
        emit SwapExecuted(ethAmount, usdcReceived);
        
        return usdcReceived;
    }
    
    // Get current USDCx balance
    function yieldTokenBalance() public view returns (uint256) {
        return yieldToken.balanceOf(address(this));
    }
    
    // Update slippage tolerance (owner only - would add access control in production)
    function setSlippageTolerance(uint256 _slippageTolerance) external {
        require(_slippageTolerance <= 1000, "Slippage tolerance too high"); // Max 10%
        slippageTolerance = _slippageTolerance;
    }
} 