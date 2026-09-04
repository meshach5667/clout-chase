// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAttentionOracle} from "./interfaces/IAttentionOracle.sol";
import {IERC20} from "./interfaces/IERC20.sol";

/// @title CloutChaseMarket
/// @notice Parimutuel YES/NO prediction markets on social attention, settled on-chain
///         from an attention oracle score.
/// @dev Security posture:
///      - custom reentrancy guard on every token-moving external function
///      - checks-effects-interactions ordering, pull-based payouts
///      - pausable by owner, but pause can never block `claim` of an existing win
///      - all money math in uint256 with 1e18 fixed point for shares
contract CloutChaseMarket {
    // --------------------------------------------------------------- types

    enum Outcome {
        Unresolved,
        Yes,
        No,
        Canceled
    }

    struct Market {
        uint256 id;
        address creator;
        string subject; // handle, post URL or trend tag
        string metadataURI; // off-chain JSON (image, description, platform)
        uint8 category; // 0 post, 1 creator, 2 trend
        uint256 threshold; // attention score required for YES
        uint64 createdAt;
        uint64 closesAt; // staking ends
        uint64 resolvesAt; // outcome window ends (24-48h after creation)
        uint256 yesPool;
        uint256 noPool;
        Outcome outcome;
        uint256 finalScore;
        bool settled;
    }

    struct Position {
        uint256 yes;
        uint256 no;
        bool claimed;
    }

    // ------------------------------------------------------------- storage

    uint64 public constant MIN_DURATION = 24 hours;
    uint64 public constant MAX_DURATION = 48 hours;
    uint256 public constant MIN_STAKE = 1e18;
    uint256 public constant MAX_FEE_BPS = 500; // 5% hard cap
    uint256 private constant BPS = 10_000;

    IERC20 public immutable stakeToken;
    IAttentionOracle public oracle;
    address public owner;
    address public feeRecipient;
    uint256 public protocolFeeBps = 200; // 2%
    uint256 public creatorFeeBps = 100; // 1%
    bool public paused;

    uint256 public marketCount;
    mapping(uint256 => Market) private _markets;
    mapping(uint256 => mapping(address => Position)) private _positions;
    mapping(uint256 => address[]) private _participants;
    mapping(address => uint256[]) private _userMarkets;
    mapping(address => bool) private _hasJoined0; // placeholder to keep layout stable

    // trader stats used by the leaderboard
    mapping(address => uint256) public totalStaked;
    mapping(address => uint256) public totalWon;
    mapping(address => uint256) public marketsWon;
    mapping(address => uint256) public marketsPlayed;

    uint256 private _lock = 1;

    // -------------------------------------------------------------- events

    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string subject,
        uint8 category,
        uint256 threshold,
        uint64 closesAt,
        uint64 resolvesAt
    );
    event Staked(uint256 indexed marketId, address indexed user, bool isYes, uint256 amount);
    event MarketSettled(uint256 indexed marketId, Outcome outcome, uint256 finalScore);
    event MarketCanceled(uint256 indexed marketId, string reason);
    event Claimed(uint256 indexed marketId, address indexed user, uint256 payout);
    event OracleUpdated(address oracle);
    event FeesUpdated(uint256 protocolFeeBps, uint256 creatorFeeBps);
    event PausedSet(bool paused);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // -------------------------------------------------------------- errors

    error NotOwner();
    error Paused();
    error Reentrancy();
    error ZeroAddress();
    error InvalidDuration();
    error InvalidThreshold();
    error EmptySubject();
    error MarketNotFound();
    error MarketClosed();
    error MarketNotClosed();
    error AlreadySettled();
    error NotSettled();
    error StakeTooSmall();
    error NothingToClaim();
    error AlreadyClaimed();
    error OracleNotReady();
    error FeeTooHigh();
    error TransferFailed();

    // ----------------------------------------------------------- modifiers

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    modifier nonReentrant() {
        if (_lock != 1) revert Reentrancy();
        _lock = 2;
        _;
        _lock = 1;
    }

    // --------------------------------------------------------- constructor

    constructor(address _stakeToken, address _oracle, address _feeRecipient) {
        if (_stakeToken == address(0) || _oracle == address(0) || _feeRecipient == address(0)) {
            revert ZeroAddress();
        }
        owner = msg.sender;
        stakeToken = IERC20(_stakeToken);
        oracle = IAttentionOracle(_oracle);
        feeRecipient = _feeRecipient;
    }

    // ----------------------------------------------------------- admin ops

    function setOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert ZeroAddress();
        oracle = IAttentionOracle(_oracle);
        emit OracleUpdated(_oracle);
    }

    function setFees(uint256 _protocolFeeBps, uint256 _creatorFeeBps) external onlyOwner {
        if (_protocolFeeBps + _creatorFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        protocolFeeBps = _protocolFeeBps;
        creatorFeeBps = _creatorFeeBps;
        emit FeesUpdated(_protocolFeeBps, _creatorFeeBps);
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        feeRecipient = _feeRecipient;
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedSet(_paused);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Escape hatch when the oracle can never resolve a market: everybody is refunded.
    function cancelMarket(uint256 marketId, string calldata reason) external onlyOwner {
        Market storage m = _market(marketId);
        if (m.settled) revert AlreadySettled();
        m.settled = true;
        m.outcome = Outcome.Canceled;
        emit MarketCanceled(marketId, reason);
    }

    // ------------------------------------------------------- market create

    function createMarket(
        string calldata subject,
        string calldata metadataURI,
        uint8 category,
        uint256 threshold,
        uint64 duration
    ) external whenNotPaused returns (uint256 marketId) {
        if (bytes(subject).length == 0 || bytes(subject).length > 200) revert EmptySubject();
        if (duration < MIN_DURATION || duration > MAX_DURATION) revert InvalidDuration();
        if (threshold == 0) revert InvalidThreshold();
        if (category > 2) revert InvalidThreshold();

        marketId = ++marketCount;
        uint64 nowTs = uint64(block.timestamp);
        // staking closes at 80% of the window so late traders cannot front-run the result
        uint64 closesAt = nowTs + (duration * 4) / 5;

        _markets[marketId] = Market({
            id: marketId,
            creator: msg.sender,
            subject: subject,
            metadataURI: metadataURI,
            category: category,
            threshold: threshold,
            createdAt: nowTs,
            closesAt: closesAt,
            resolvesAt: nowTs + duration,
            yesPool: 0,
            noPool: 0,
            outcome: Outcome.Unresolved,
            finalScore: 0,
            settled: false
        });

        emit MarketCreated(
            marketId, msg.sender, subject, category, threshold, closesAt, nowTs + duration
        );
    }

    // -------------------------------------------------------------- staking

    function stake(uint256 marketId, bool isYes, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        Market storage m = _market(marketId);
        if (block.timestamp >= m.closesAt) revert MarketClosed();
        if (m.settled) revert AlreadySettled();
        if (amount < MIN_STAKE) revert StakeTooSmall();

        Position storage p = _positions[marketId][msg.sender];
        if (p.yes == 0 && p.no == 0) {
            _participants[marketId].push(msg.sender);
            _userMarkets[msg.sender].push(marketId);
            marketsPlayed[msg.sender] += 1;
        }

        if (isYes) {
            p.yes += amount;
            m.yesPool += amount;
        } else {
            p.no += amount;
            m.noPool += amount;
        }
        totalStaked[msg.sender] += amount;

        _pull(msg.sender, amount);
        emit Staked(marketId, msg.sender, isYes, amount);
    }

    // ------------------------------------------------------------ settling

    /// @notice Settle a closed market from the oracle score. Permissionless: anyone can trigger it.
    function settle(uint256 marketId) external nonReentrant {
        Market storage m = _market(marketId);
        if (m.settled) revert AlreadySettled();
        if (block.timestamp < m.resolvesAt) revert MarketNotClosed();
        if (!oracle.isFinalized(marketId)) revert OracleNotReady();

        (uint256 score,) = oracle.getScore(marketId);
        m.finalScore = score;
        m.settled = true;

        // no liquidity on one side -> nothing to win, refund everyone
        if (m.yesPool == 0 || m.noPool == 0) {
            m.outcome = Outcome.Canceled;
            emit MarketCanceled(marketId, "one-sided market");
            return;
        }

        m.outcome = score >= m.threshold ? Outcome.Yes : Outcome.No;
        emit MarketSettled(marketId, m.outcome, score);
    }

    /// @notice Claim winnings (or a refund for canceled markets). Pull-based payout.
    function claim(uint256 marketId) external nonReentrant returns (uint256 payout) {
        Market storage m = _market(marketId);
        if (!m.settled) revert NotSettled();

        Position storage p = _positions[marketId][msg.sender];
        if (p.claimed) revert AlreadyClaimed();
        if (p.yes == 0 && p.no == 0) revert NothingToClaim();
        p.claimed = true;

        if (m.outcome == Outcome.Canceled) {
            payout = p.yes + p.no;
            _push(msg.sender, payout);
            emit Claimed(marketId, msg.sender, payout);
            return payout;
        }

        uint256 winningStake = m.outcome == Outcome.Yes ? p.yes : p.no;
        if (winningStake == 0) {
            emit Claimed(marketId, msg.sender, 0);
            return 0;
        }

        uint256 winPool = m.outcome == Outcome.Yes ? m.yesPool : m.noPool;
        uint256 losePool = m.outcome == Outcome.Yes ? m.noPool : m.yesPool;

        uint256 protocolFee = (losePool * protocolFeeBps) / BPS;
        uint256 creatorFee = (losePool * creatorFeeBps) / BPS;
        uint256 distributable = losePool - protocolFee - creatorFee;

        uint256 profit = (distributable * winningStake) / winPool;
        payout = winningStake + profit;

        totalWon[msg.sender] += profit;
        marketsWon[msg.sender] += 1;

        // fees are paid out with the first winning claim of the market
        _push(msg.sender, payout);
        if (protocolFee > 0 || creatorFee > 0) {
            _payFeesOnce(marketId, m.creator, protocolFee, creatorFee, winningStake, winPool);
        }
        emit Claimed(marketId, msg.sender, payout);
    }

    mapping(uint256 => uint256) private _feesPaid;

    /// @dev Fees are streamed pro-rata with each winning claim so the contract never
    ///      over-pays even if some winners never claim.
    function _payFeesOnce(
        uint256 marketId,
        address creator,
        uint256 protocolFee,
        uint256 creatorFee,
        uint256 winningStake,
        uint256 winPool
    ) internal {
        uint256 protoShare = (protocolFee * winningStake) / winPool;
        uint256 creatorShare = (creatorFee * winningStake) / winPool;
        _feesPaid[marketId] += protoShare + creatorShare;
        if (protoShare > 0) _push(feeRecipient, protoShare);
        if (creatorShare > 0) _push(creator, creatorShare);
    }

    // --------------------------------------------------------------- views

    function getMarket(uint256 marketId) external view returns (Market memory) {
        return _market(marketId);
    }

    function getMarkets(uint256 offset, uint256 limit) external view returns (Market[] memory out) {
        uint256 total = marketCount;
        if (offset >= total) return new Market[](0);
        uint256 end = offset + limit;
        if (end > total) end = total;
        out = new Market[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            out[i - offset] = _markets[i + 1];
        }
    }

    function getPosition(uint256 marketId, address user) external view returns (Position memory) {
        return _positions[marketId][user];
    }

    function getUserMarkets(address user) external view returns (uint256[] memory) {
        return _userMarkets[user];
    }

    function participantCount(uint256 marketId) external view returns (uint256) {
        return _participants[marketId].length;
    }

    function getParticipants(uint256 marketId) external view returns (address[] memory) {
        return _participants[marketId];
    }

    /// @notice YES probability in basis points implied by the current pools.
    function impliedYesOddsBps(uint256 marketId) external view returns (uint256) {
        Market memory m = _market(marketId);
        uint256 total = m.yesPool + m.noPool;
        if (total == 0) return 5_000;
        return (m.yesPool * BPS) / total;
    }

    /// @notice Payout preview (in wei of stake token) for a hypothetical stake.
    function previewPayout(uint256 marketId, bool isYes, uint256 amount)
        external
        view
        returns (uint256)
    {
        Market memory m = _market(marketId);
        uint256 winPool = (isYes ? m.yesPool : m.noPool) + amount;
        uint256 losePool = isYes ? m.noPool : m.yesPool;
        uint256 distributable = losePool - (losePool * (protocolFeeBps + creatorFeeBps)) / BPS;
        return amount + (distributable * amount) / winPool;
    }

    // ------------------------------------------------------------ internal

    function _market(uint256 marketId) internal view returns (Market storage m) {
        if (marketId == 0 || marketId > marketCount) revert MarketNotFound();
        m = _markets[marketId];
    }

    function _pull(address from, uint256 amount) internal {
        bool ok = stakeToken.transferFrom(from, address(this), amount);
        if (!ok) revert TransferFailed();
    }

    function _push(address to, uint256 amount) internal {
        bool ok = stakeToken.transfer(to, amount);
        if (!ok) revert TransferFailed();
    }
}
