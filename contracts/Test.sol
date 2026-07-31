// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Test {
    // Not optimized For loop
    function sumArrayNonOptimized(
        uint256[] calldata data
    ) external pure returns (uint256 total) {
        for (uint256 i = 0; i < data.length; i++) {
            total += data[i];
        }
        return total;
    }

    // Optimized
    function sumArrayOptimized(
        uint256[] calldata data
    ) external pure returns (uint256 total) {
        uint256 len = data.length;
        for (uint256 i = 0; i < len; ) {
            total += data[i];
            unchecked {
                i++;
            }
        }
        return total;
    }
}
