// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAttentionOracle {
    function isFinalized(uint256 marketId) external view returns (bool);
    function getScore(uint256 marketId) external view returns (uint256 score, uint64 reportedAt);
}
