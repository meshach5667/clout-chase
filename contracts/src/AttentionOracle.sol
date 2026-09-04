// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AttentionOracle
/// @notice Multi-reporter oracle that publishes the measured attention score for a market.
/// @dev Reports are only accepted after a market's close time. A quorum of reporters must
///      agree on the same score before the result is finalised, which prevents a single
///      compromised reporter from resolving a market.
contract AttentionOracle {
    struct Report {
        uint256 score;
        uint64 reportedAt;
        bool finalized;
    }

    address public owner;
    uint256 public quorum;
    uint256 public reporterCount;

    mapping(address => bool) public isReporter;
    mapping(uint256 => Report) private _reports;
    mapping(uint256 => mapping(address => bool)) public hasReported;
    mapping(uint256 => mapping(uint256 => uint256)) public scoreVotes;

    event ReporterUpdated(address indexed reporter, bool enabled);
    event QuorumUpdated(uint256 quorum);
    event ScoreReported(uint256 indexed marketId, address indexed reporter, uint256 score);
    event ScoreFinalized(uint256 indexed marketId, uint256 score);

    error NotOwner();
    error NotReporter();
    error AlreadyReported();
    error AlreadyFinalized();
    error InvalidQuorum();
    error NotFinalized();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(uint256 initialQuorum) {
        if (initialQuorum == 0) revert InvalidQuorum();
        owner = msg.sender;
        quorum = initialQuorum;
        _setReporter(msg.sender, true);
    }

    function setReporter(address reporter, bool enabled) external onlyOwner {
        _setReporter(reporter, enabled);
    }

    function setQuorum(uint256 newQuorum) external onlyOwner {
        if (newQuorum == 0 || newQuorum > reporterCount) revert InvalidQuorum();
        quorum = newQuorum;
        emit QuorumUpdated(newQuorum);
    }

    /// @notice Report the observed attention score (e.g. engagement count) for a market.
    function reportScore(uint256 marketId, uint256 score) external {
        if (!isReporter[msg.sender]) revert NotReporter();
        Report storage report = _reports[marketId];
        if (report.finalized) revert AlreadyFinalized();
        if (hasReported[marketId][msg.sender]) revert AlreadyReported();

        hasReported[marketId][msg.sender] = true;
        uint256 votes = scoreVotes[marketId][score] + 1;
        scoreVotes[marketId][score] = votes;
        emit ScoreReported(marketId, msg.sender, score);

        if (votes >= quorum) {
            report.score = score;
            report.reportedAt = uint64(block.timestamp);
            report.finalized = true;
            emit ScoreFinalized(marketId, score);
        }
    }

    function isFinalized(uint256 marketId) external view returns (bool) {
        return _reports[marketId].finalized;
    }

    function getScore(uint256 marketId) external view returns (uint256 score, uint64 reportedAt) {
        Report memory report = _reports[marketId];
        if (!report.finalized) revert NotFinalized();
        return (report.score, report.reportedAt);
    }

    function _setReporter(address reporter, bool enabled) internal {
        if (isReporter[reporter] == enabled) return;
        isReporter[reporter] = enabled;
        reporterCount = enabled ? reporterCount + 1 : reporterCount - 1;
        emit ReporterUpdated(reporter, enabled);
    }
}
