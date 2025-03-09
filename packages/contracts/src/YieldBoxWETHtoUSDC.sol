// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {YieldBoxBase} from "./YieldBoxBase.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {e18, e, Dec, F} from "./decimalLibrary.sol";
import {IWETH} from "./interfaces/IWETH.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {TickMath} from "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import {FullMath} from "@uniswap/v3-core/contracts/libraries/FullMath.sol";

/**
 * @title YieldBoxWETHtoUSDC
 * @dev Implementation for WETH vault with USDCx yield token
 * Accepts both ETH and WETH deposits and converts yield to USDC
 */
contract YieldBoxWETHtoUSDC is YieldBoxBase {
    // Uniswap router and pool references
    ISwapRouter public immutable swapRouter;
    IUniswapV3Pool public immutable wethUsdcPool;
    
    // WETH contract reference
    IWETH public immutable weth;
    
    // USDC contract reference
    IERC20 public immutable usdc;
    
    // Swap parameters
    uint24 public immutable poolFee;
    uint32 public immutable twapInterval; // Time period in seconds to consider for TWAP
    uint256 public maxSlippageBps = 100; // 1% default slippage tolerance (in basis points)
    
    // Events
    event ETHDeposited(address indexed user, uint256 amount);
    event ETHDepositedFor(address indexed user, address indexed recipient, uint256 amount);
    event SlippageUpdated(uint256 newSlippageBps);
    event SwapExecuted(uint256 wethAmount, uint256 usdcReceived, uint256 expectedMinimum);
    
    constructor(
        address _underlyingVault, 
        address _yieldToken,
        address _weth,
        address _usdc,
        address _swapRouter,
        address _wethUsdcPool,
        uint24 _poolFee,
        uint32 _twapInterval,
        string memory _poolName,
        string memory _poolSymbol,
        uint8 _poolDecimals
    ) 
        YieldBoxBase(
            _underlyingVault, 
            _yieldToken, 
            _poolName, 
            _poolSymbol,
            _poolDecimals
        ) 
    {
        require(_weth != address(0), "Invalid WETH address");
        require(_usdc != address(0), "Invalid USDC address");
        require(_swapRouter != address(0), "Invalid router address");
        require(_wethUsdcPool != address(0), "Invalid pool address");
        require(_twapInterval > 0, "TWAP interval must be > 0");
        
        weth = IWETH(_weth);
        usdc = IERC20(_usdc);
        swapRouter = ISwapRouter(_swapRouter);
        wethUsdcPool = IUniswapV3Pool(_wethUsdcPool);
        poolFee = _poolFee;
        twapInterval = _twapInterval;
        
        // Approve router to spend WETH
        IERC20(_weth).approve(_swapRouter, type(uint256).max);
    }
    
    /**
     * @notice Set maximum allowed slippage in basis points (1/100 of a percent)
     * @param _slippageBps New slippage tolerance (100 = 1%)
     */
    function setMaxSlippage(uint256 _slippageBps) external onlyOwner {
        require(_slippageBps <= 1000, "Slippage too high"); // Max 10%
        maxSlippageBps = _slippageBps;
        emit SlippageUpdated(_slippageBps);
    }
    
    /**
     * @notice Accept ETH deposits
     */
    receive() external payable {
        _handleETHDeposit(msg.sender);
    }
    
    /**
     * @notice Fallback function to accept ETH
     */
    fallback() external payable {
        _handleETHDeposit(msg.sender);
    }
    
    /**
     * @notice Deposit ETH and receive yield box shares
     */
    function depositETH() external payable {
        _handleETHDeposit(msg.sender);
    }
    
    /**
     * @notice Deposit ETH for another recipient
     * @param recipient Address to receive the yield box shares
     */
    function depositETHFor(address recipient) external payable {
        require(recipient != address(0), "Cannot deposit for zero address");
        _handleETHDeposit(recipient);
        emit ETHDepositedFor(msg.sender, recipient, msg.value);
    }
    
    /**
     * @notice Internal function to handle ETH deposits
     * @param recipient Address to receive the yield box shares
     */
    function _handleETHDeposit(address recipient) internal {
        uint256 ethAmount = msg.value;
        require(ethAmount >= MINIMUM_DEPOSIT, "Deposit too small");
        
        // Wrap ETH to WETH
        weth.deposit{value: ethAmount}();
        
        // Proceed with deposit
        _depositWETH(recipient, ethAmount);
        
        emit ETHDeposited(recipient, ethAmount);
    }
    
    /**
     * @notice Internal function to deposit WETH after wrapping
     * @param recipient Address to receive the yield box shares
     * @param amount Amount of WETH to deposit
     */
    function _depositWETH(address recipient, uint256 amount) internal {
        // Transfer WETH to vault and mint shares
        e memory depositAmount = Dec.make(amount, U_TOKEN_DEC);
        _deposit(recipient, depositAmount.value);
    }
    
    /**
     * @notice Get the current TWAP price of WETH in USDC
     * @return price WETH/USDC price with 6 decimals (USDC decimals)
     */
    function getTWAPPrice() public view returns (uint256 price) {
        // Get current timestamp and make sure it's safe to use
        uint32 secondsAgo = twapInterval;
        uint32 currentTimestamp = uint32(block.timestamp);
        require(currentTimestamp >= secondsAgo, "Historical timestamp too recent");
        
        // Get TWAP tick from Uniswap pool
        (int24 arithmeticMeanTick, ) = OracleLibrary.consult(address(wethUsdcPool), secondsAgo);
        
        // Convert tick to price (sqrtPriceX96)
        uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(arithmeticMeanTick);
        
        // Convert sqrtPriceX96 to price
        // Formula: price = (sqrtPriceX96^2 * (10^decimalsUSDC)) / (2^192 * 10^decimalsWETH)
        uint256 priceX192 = uint256(sqrtPriceX96) * uint256(sqrtPriceX96);
        
        // WETH has 18 decimals, USDC has 6 decimals
        // Adjust the price calculation to account for decimals
        price = FullMath.mulDiv(priceX192, 10**6, 1 << 192);
        
        return price;
    }
    
    /**
     * @notice Override to convert WETH to USDC using TWAP protected swap
     */
    function _convertYield() internal override {
        // Get WETH balance
        uint256 wethBalance = IERC20(address(underlyingToken)).balanceOf(address(this));
        
        if (wethBalance > 0) {
            uint256 beforeUsdcBalance = usdc.balanceOf(address(this));
            
            // Get TWAP price with slippage protection
            uint256 twapPrice = getTWAPPrice();
            
            // Calculate expected minimum USDC output (with slippage)
            // WETH has 18 decimals, USDC has 6 decimals, so adjust accordingly
            uint256 expectedUsdcOutput = (wethBalance * twapPrice) / 1e18;
            uint256 minUsdcOutput = expectedUsdcOutput * (10000 - maxSlippageBps) / 10000;
            
            // Execute the swap with slippage protection
            _swapWETHtoUSDC(wethBalance, minUsdcOutput);
            
            uint256 afterUsdcBalance = usdc.balanceOf(address(this));
            uint256 usdcReceived = afterUsdcBalance - beforeUsdcBalance;
            
            emit YieldConverted(wethBalance, usdcReceived);
            emit SwapExecuted(wethBalance, usdcReceived, minUsdcOutput);
        }
    }
    
    /**
     * @notice Swaps WETH to USDC using Uniswap V3 with TWAP-based slippage protection
     * @param wethAmount Amount of WETH to swap
     * @param minUsdcOutput Minimum acceptable USDC output
     * @return usdcReceived Amount of USDC received from the swap
     */
    function _swapWETHtoUSDC(uint256 wethAmount, uint256 minUsdcOutput) internal returns (uint256 usdcReceived) {
        if (wethAmount == 0) return 0;
        
        // Set up swap parameters
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: address(weth),
            tokenOut: address(usdc),
            fee: poolFee,
            recipient: address(this),
            deadline: block.timestamp + 300, // 5 minute timeout
            amountIn: wethAmount,
            amountOutMinimum: minUsdcOutput,
            sqrtPriceLimitX96: 0 // No price limit
        });
        
        // Execute the swap
        usdcReceived = swapRouter.exactInputSingle(params);
        
        // Ensure we received at least the minimum amount
        require(usdcReceived >= minUsdcOutput, "Slippage too high");
        
        return usdcReceived;
    }
}

// Interface for Oracle library functionality
library OracleLibrary {
    function consult(address pool, uint32 secondsAgo)
        internal
        view
        returns (int24 arithmeticMeanTick, uint128 harmonicMeanLiquidity)
    {
        require(secondsAgo != 0, 'BP');
        
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = secondsAgo;
        secondsAgos[1] = 0;

        (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s) = 
            IUniswapV3Pool(pool).observe(secondsAgos);

        int56 tickCumulativesDelta = tickCumulatives[1] - tickCumulatives[0];
        uint160 secondsPerLiquidityCumulativesDelta = secondsPerLiquidityCumulativeX128s[1] - secondsPerLiquidityCumulativeX128s[0];

        arithmeticMeanTick = int24(tickCumulativesDelta / int56(uint56(secondsAgo)));
        // Always round to negative infinity
        if (tickCumulativesDelta < 0 && (tickCumulativesDelta % int56(uint56(secondsAgo)) != 0)) arithmeticMeanTick--;

        // We are multiplying here instead of shifting to ensure that harmonicMeanLiquidity doesn't overflow uint128
        uint192 secondsAgoX160 = uint192(secondsAgo) * uint192(2**160);
        harmonicMeanLiquidity = uint128(secondsAgoX160 / (uint192(secondsPerLiquidityCumulativesDelta) * uint192(secondsAgo)));
    }
}

// Interface for WETH
interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256) external;
} 