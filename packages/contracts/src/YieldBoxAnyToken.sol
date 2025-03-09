// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {IERC20, IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {ISuperfluidPool, PoolConfig, PoolERC20Metadata} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import {ISuperfluidPool} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/ISuperfluidPool.sol";
import {e18, e, decimal, Dec, F, A, D} from "./decimalLibrary.sol";
import {YieldBoxBase} from "./YieldBoxBase.sol";

// // This contract should format any return values to 18 decimals
// contract YieldBoxAnyToken is YieldBoxBase {

//     function harvest() external {
//         e18 yieldAmount = upgradeAll();
//         smother();
//         emit HarvestYield(e18.unwrap(yieldAmount));
//     }

//     function upgradeAll() public returns (e18 yield) {
//         // Get current vault balance
//         e memory myShares = Dec.make(underlyingVault.balanceOf(address(this)), U_VAULT_DEC);
//         e memory myAssets = Dec.make(underlyingVault.previewRedeem(myShares.value), U_TOKEN_DEC);
        
//         // Convert e18 to underlying decimals using F.to
//         e memory totalAssetsUnderlying = F.to(totalDepositedAssets, U_TOKEN_DEC);
//         // Use A.sub for subtracting two 'e' types with same decimals
//         e memory yieldAmountUnderlying = A.sub(myAssets, totalAssetsUnderlying, U_TOKEN_DEC);

//         require(yieldAmountUnderlying.value > 0, "No yield to upgrade");
//         // Withdraw and upgrade yield
//         underlyingVault.withdraw(yieldAmountUnderlying.value, address(this), address(this));
//         yield = A.to18(yieldAmountUnderlying);
//         _upgradeAll();
//     }

//     function _upgradeAll() internal returns (e18 yield) {
//         yieldToken.upgrade(IERC20(yieldToken.underlyingToken()).balanceOf(address(this)));
//     }

//     function latentYield() public view returns (e18) {
//         e memory ourShares = Dec.make(underlyingVault.balanceOf(address(this)), U_VAULT_DEC);
//         e memory ourAssets = Dec.make(underlyingVault.previewRedeem(ourShares.value), U_TOKEN_DEC);
//         e18 ourAssets18 = A.to18(ourAssets);

//         return F.sub(ourAssets18, totalDepositedAssets);
//     }

// }