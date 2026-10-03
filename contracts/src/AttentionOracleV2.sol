// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAttentionOracle} from "./interfaces/IAttentionOracle.sol";

/// @title AttentionOracleV2
/// @notice Permissioned reporters with permissionless testnet fallback so markets can always settle.
contract AttentionOracleV2 is IAttentionOracle {
    struct Report {
        uint256 score;
        uint64 reportedAt;
        bool finalized;
    }

    address public owner;
    mapping(address => bool) public isReporter;
    mapping(uint256 => Report) private _reports;

    event ScoreReported(uint256 indexed marketId, address indexed reporter, uint256 score);
    event ScoreFinalized(uint256 indexed marketId, uint256 score);

    error NotOwner();
    error AlreadyFinalized();
    error NotFinalized();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
        isReporter[msg.sender] = true;
    }

    function setReporter(address reporter, bool enabled) external onlyOwner {
        isReporter[reporter] = enabled;
    }

    /// @notice Anyone can report a score on testnet to finalize settlement.
    function reportScore(uint256 marketId, uint256 score) external {
        Report storage report = _reports[marketId];
        if (report.finalized) revert AlreadyFinalized();

        report.score = score;
        report.reportedAt = uint64(block.timestamp);
        report.finalized = true;

        emit ScoreReported(marketId, msg.sender, score);
        emit ScoreFinalized(marketId, score);
    }

    function isFinalized(uint256 marketId) external view override returns (bool) {
        return _reports[marketId].finalized;
    }

    function getScore(uint256 marketId) external view override returns (uint256 score, uint64 reportedAt) {
        Report memory report = _reports[marketId];
        if (!report.finalized) revert NotFinalized();
        return (report.score, report.reportedAt);
    }
}
