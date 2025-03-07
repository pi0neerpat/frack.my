// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Library for handling different decimal types and conversions between them
 */
error DecimalOverflow();
error InvalidDecimals();

// Core types
type decimal is uint8;
type e18 is uint256;  // renamed from e18 to e18 to avoid naming conflicts
struct e {         // renamed from e to e for clarity
    uint256 value;
    decimal decimals;
}


// Helper library for creating decimal types
library Dec {
    function make(uint256 value, decimal decimals) internal pure returns (e memory) {
        return e(value, decimals);
    }

    function make18(uint256 value) internal pure returns (e18) {
        return e18.wrap(value);
    }

    function d(uint256 decimals) internal pure returns (decimal) {
        return decimal.wrap(uint8(decimals));
    }
}

// Library for decimal precision operations
library D {
    function wrap(uint8 x) internal pure returns (decimal) {
        if (x > 77) revert InvalidDecimals();
        return decimal.wrap(x);
    }

    function unwrap(decimal x) internal pure returns (uint8) {
        return decimal.unwrap(x);
    }
}

// Library for e18-point (18 decimal) operations
library F {
    function wrap(uint256 x) internal pure returns (e18) {
        return e18.wrap(x);
    }

    function unwrap(e18 x) internal pure returns (uint256) {
        return e18.unwrap(x);
    }

    function toInt96(e18 amount) internal pure returns (int96) {
        return int96(uint96(unwrap(amount)));
    }

    function add(e18 a, e18 b) internal pure returns (e18) {
        return e18.wrap(e18.unwrap(a) + e18.unwrap(b));
    }

    function sub(e18 a, e18 b) internal pure returns (e18) {
        return e18.wrap(e18.unwrap(a) - e18.unwrap(b));
    }

    function to(e18 self, decimal d) internal pure returns (e memory) {
        uint8 targetDecimals = decimal.unwrap(d);
        if (targetDecimals > 18) {
            uint256 factor = 10**(targetDecimals - 18);
            if (e18.unwrap(self) > type(uint256).max / factor) revert DecimalOverflow();
            return e(e18.unwrap(self) * factor, d);
        } else {
            uint256 factor = 10**(18 - targetDecimals);
            return e(e18.unwrap(self) / factor, d);
        }
    }

    function gt(e18 a, e18 b) internal pure returns (bool) {
        return e18.unwrap(a) > e18.unwrap(b);
    }

    function gte(e18 a, e18 b) internal pure returns (bool) {
        return e18.unwrap(a) >= e18.unwrap(b);
    }

    function div(e18 self, uint256 scalar) internal pure returns (e18) {
        return e18.wrap(e18.unwrap(self) / scalar);
    }
}

// Library for variable decimal operations
library A {
    function to18(e memory self) internal pure returns (e18) {
        uint8 dec = decimal.unwrap(self.decimals);
        if (dec > 18) {
            uint256 factor = 10**(dec - 18);
            return e18.wrap(self.value / factor);
        } else {
            uint256 factor = 10**(18 - dec);
            if (self.value > type(uint256).max / factor) revert DecimalOverflow();
            return e18.wrap(self.value * factor);
        }
    }

    function to(e memory self, decimal d) internal pure returns (e memory) {
        uint8 targetDec = decimal.unwrap(d);
        uint8 sourceDec = decimal.unwrap(self.decimals);
        
        if (targetDec > sourceDec) {
            uint256 factor = 10**(targetDec - sourceDec);
            if (self.value > type(uint256).max / factor) revert DecimalOverflow();
            return e(self.value * factor, d);
        } else {
            uint256 factor = 10**(sourceDec - targetDec);
            return e(self.value / factor, d);
        }
    }

    function addTo18(e memory a, e memory b) internal pure returns (e memory) {
        return add(a, b, Dec.d(18));
    }

    function add(e memory a, e memory b, decimal d) internal pure returns (e memory) {
        // Convert both e types to the same decimal, then add
        e memory aConverted = to(a, d);
        e memory bConverted = to(b, d);
        return e(aConverted.value + bConverted.value, d);
    }

    function sub(e memory a, e memory b, decimal d) internal pure returns (e memory) {
        // Convert both e types to the same decimal, then subtract 
        e memory aConverted = to(a, d);
        e memory bConverted = to(b, d);
        return e(aConverted.value - bConverted.value, d);
    }

    function subTo18(e memory a, e memory b) internal pure returns (e memory) {
        return sub(a, b, Dec.d(18));
    }

}

