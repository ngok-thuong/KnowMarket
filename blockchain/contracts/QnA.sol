// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20Minimal} from "./IERC20Minimal.sol";

/// @title KnowMarket Q&A (MVP)
/// @notice Pay-to-ask with USDC escrow; answers free; 1 wallet = 1 vote; permissionless resolve after deadline.
/// @dev Events and their fields are locked by docs/spec/events.md.
contract QnA {
    // -----------------------------
    // Events (LOCKED by spec)
    // -----------------------------

    event QuestionCreated(
        uint256 indexed questionId,
        address indexed asker,
        address indexed bountyToken,
        uint256 bountyAmount,
        string questionCid,
        uint64 deadline
    );

    event AnswerSubmitted(
        uint256 indexed questionId,
        uint256 indexed answerId,
        address indexed answerer,
        string answerCid
    );

    event VoteCast(
        uint256 indexed questionId,
        uint256 indexed answerId,
        address indexed voter,
        int8 direction,
        uint32 weight
    );

    event QuestionResolved(
        uint256 indexed questionId,
        uint256 winnerAnswerId,
        address winner,
        address payoutToken,
        uint256 payoutAmount,
        uint8 resolution
    );

    // Optional governance transparency (not indexed by current docs).
    event FeeParamsUpdated(uint16 feeBps, uint256 minFee, uint256 maxFee, uint256 minBounty);
    event TreasuryUpdated(address treasury);

    // -----------------------------
    // Resolution codes (QuestionResolved.resolution)
    // -----------------------------

    uint8 public constant RESOLUTION_WINNER    = 0; // winner found by votes
    uint8 public constant RESOLUTION_NO_ANSWER = 1; // deadline passed, 0 answers → full refund
    uint8 public constant RESOLUTION_NO_VOTES  = 2; // answers exist but 0 votes → refund

    // -----------------------------
    // Errors
    // -----------------------------

    error Unauthorized();
    error InvalidParams();
    error NotFound();
    error AlreadyResolved();
    error DeadlineNotReached();
    error PastDeadline();
    error AlreadyVoted();
    error AlreadyAnswered();
    error NotRefundable();
    error NotClaimable();
    error TransferFailed();
    error Paused();

    // -----------------------------
    // Admin
    // -----------------------------

    address public owner;
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidParams();
        owner = newOwner;
    }

    // -----------------------------
    // Pause
    // -----------------------------

    bool public paused;
    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    function setPaused(bool v) external onlyOwner {
        paused = v;
    }

    // -----------------------------
    // Config
    // -----------------------------

    IERC20Minimal public immutable usdc;
    address public treasury;

    // Fee config (USDC has 6 decimals)
    uint16 public feeBps;        // 200 = 2%
    uint256 public minFee;       // 0.2 USDC = 200_000
    uint256 public maxFee;       // 10 USDC  = 10_000_000
    uint256 public minBounty;    // 2 USDC   = 2_000_000

    // Max answers per question — prevents unbounded resolve() loop
    uint32 public maxAnswersPerQuestion = 200;

    // -----------------------------
    // Reentrancy guard
    // -----------------------------

    uint256 private _locked = 1;
    modifier nonReentrant() {
        if (_locked != 1) revert Unauthorized();
        _locked = 2;
        _;
        _locked = 1;
    }

    // -----------------------------
    // Safe ERC20 helpers
    // -----------------------------
    // Handles tokens that either return bool or return nothing (e.g. USDT).
    // Reverts on transfer failure regardless of return-data convention.

    function _safeTransfer(address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(usdc).call(
            abi.encodeWithSelector(IERC20Minimal.transfer.selector, to, amount)
        );
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _safeTransferFrom(address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(usdc).call(
            abi.encodeWithSelector(IERC20Minimal.transferFrom.selector, from, to, amount)
        );
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    // -----------------------------
    // Storage
    // -----------------------------

    enum PayoutState {
        Open,
        Refundable, // no valid winner after deadline (0 answers or 0 votes)
        Claimable,  // winner set after resolve
        Closed      // claimed or refunded
    }

    struct Question {
        address asker;
        uint64 deadline;
        uint256 bountyAmount;
        uint32 answerCount;
        PayoutState state;
        uint256 winnerAnswerId; // 0 if none
        address winner;         // address(0) if none
        uint256 bestVotes;      // stored after resolve for transparency
    }

    struct Answer {
        uint256 questionId;
        address answerer;
        // CID is emitted in AnswerSubmitted; storing on-chain is optional and omitted in MVP.
        uint32 voteCount;
    }

    uint256 public nextQuestionId = 1;
    uint256 public nextAnswerId   = 1;

    mapping(uint256 => Question) public questions;
    mapping(uint256 => Answer)   public answers;

    // 1 wallet = 1 vote per question
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // 1 wallet = 1 answer per question
    mapping(uint256 => mapping(address => bool)) public hasAnswered;

    // Track answers per question for resolve iteration
    mapping(uint256 => uint256[]) private questionAnswerIds;

    // -----------------------------
    // Constructor
    // -----------------------------

    constructor(
        address usdcToken,
        address treasuryAddress,
        uint16 feeBps_,
        uint256 minFee_,
        uint256 maxFee_,
        uint256 minBounty_
    ) {
        if (usdcToken == address(0) || treasuryAddress == address(0)) revert InvalidParams();
        if (feeBps_ > 1_000) revert InvalidParams(); // sanity: <= 10%
        if (minFee_ > maxFee_) revert InvalidParams();
        if (minBounty_ == 0) revert InvalidParams();

        owner = msg.sender;
        usdc = IERC20Minimal(usdcToken);
        treasury = treasuryAddress;

        feeBps    = feeBps_;
        minFee    = minFee_;
        maxFee    = maxFee_;
        minBounty = minBounty_;

        emit FeeParamsUpdated(feeBps_, minFee_, maxFee_, minBounty_);
        emit TreasuryUpdated(treasuryAddress);
    }

    // -----------------------------
    // Admin setters
    // -----------------------------

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidParams();
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function setFeeParams(uint16 feeBps_, uint256 minFee_, uint256 maxFee_, uint256 minBounty_) external onlyOwner {
        if (feeBps_ > 1_000) revert InvalidParams();
        if (minFee_ > maxFee_) revert InvalidParams();
        if (minBounty_ == 0) revert InvalidParams();
        feeBps    = feeBps_;
        minFee    = minFee_;
        maxFee    = maxFee_;
        minBounty = minBounty_;
        emit FeeParamsUpdated(feeBps_, minFee_, maxFee_, minBounty_);
    }

    function setMaxAnswersPerQuestion(uint32 max_) external onlyOwner {
        if (max_ == 0) revert InvalidParams();
        maxAnswersPerQuestion = max_;
    }

    // -----------------------------
    // Read helpers
    // -----------------------------

    function getQuestionAnswerIds(uint256 questionId) external view returns (uint256[] memory) {
        return questionAnswerIds[questionId];
    }

    function quoteFee(uint256 bountyAmount) public view returns (uint256) {
        uint256 fee = (bountyAmount * uint256(feeBps)) / 10_000;
        if (fee < minFee) fee = minFee;
        if (fee > maxFee) fee = maxFee;
        return fee;
    }

    // -----------------------------
    // Core actions
    // -----------------------------

    /// @notice Create a question, charge platform fee, and escrow bounty in the contract.
    /// @dev Total approval required: bountyAmount + quoteFee(bountyAmount).
    ///      Pulls the full amount in a single transferFrom to reduce gas and approval complexity.
    function createQuestion(string calldata questionCid, uint256 bountyAmount, uint64 deadline)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 questionId)
    {
        if (bytes(questionCid).length == 0) revert InvalidParams();
        if (deadline <= uint64(block.timestamp)) revert InvalidParams();
        if (bountyAmount < minBounty) revert InvalidParams();

        uint256 fee   = quoteFee(bountyAmount);
        uint256 total = bountyAmount + fee;

        // Pull total into contract, then push fee to treasury.
        _safeTransferFrom(msg.sender, address(this), total);
        _safeTransfer(treasury, fee);

        questionId = nextQuestionId++;
        questions[questionId] = Question({
            asker:          msg.sender,
            deadline:       deadline,
            bountyAmount:   bountyAmount,
            answerCount:    0,
            state:          PayoutState.Open,
            winnerAnswerId: 0,
            winner:         address(0),
            bestVotes:      0
        });

        emit QuestionCreated(questionId, msg.sender, address(usdc), bountyAmount, questionCid, deadline);
    }

    /// @notice Submit an answer CID to an open question (free).
    ///         Asker cannot answer their own question.
    ///         Each wallet may only submit one answer per question.
    function submitAnswer(uint256 questionId, string calldata answerCid)
        external
        returns (uint256 answerId)
    {
        Question storage q = questions[questionId];
        if (q.asker == address(0)) revert NotFound();
        if (q.state != PayoutState.Open) revert AlreadyResolved();
        if (uint64(block.timestamp) >= q.deadline) revert PastDeadline();
        if (bytes(answerCid).length == 0) revert InvalidParams();
        if (msg.sender == q.asker) revert Unauthorized();
        if (hasAnswered[questionId][msg.sender]) revert AlreadyAnswered();
        if (q.answerCount >= maxAnswersPerQuestion) revert InvalidParams();

        hasAnswered[questionId][msg.sender] = true;

        answerId = nextAnswerId++;
        answers[answerId] = Answer({questionId: questionId, answerer: msg.sender, voteCount: 0});
        questionAnswerIds[questionId].push(answerId);
        q.answerCount += 1;

        emit AnswerSubmitted(questionId, answerId, msg.sender, answerCid);
    }

    /// @notice Cast a vote on an answer. MVP supports upvotes only.
    function vote(uint256 questionId, uint256 answerId) external {
        Question storage q = questions[questionId];
        if (q.asker == address(0)) revert NotFound();
        if (q.state != PayoutState.Open) revert AlreadyResolved();
        if (uint64(block.timestamp) >= q.deadline) revert PastDeadline();
        if (hasVoted[questionId][msg.sender]) revert AlreadyVoted();

        Answer storage a = answers[answerId];
        if (a.questionId != questionId) revert InvalidParams();

        hasVoted[questionId][msg.sender] = true;
        a.voteCount += 1;

        emit VoteCast(questionId, answerId, msg.sender, int8(1), uint32(1));
    }

    /// @notice Finalize a question after deadline.
    ///         - 0 answers          → Refundable (RESOLUTION_NO_ANSWER)
    ///         - answers, 0 votes   → Refundable (RESOLUTION_NO_VOTES), asker is refunded
    ///         - answers, votes     → Claimable  (RESOLUTION_WINNER), tie-break: earlier answerId
    /// @dev Anyone may call after deadline (permissionless keeper pattern).
    function resolve(uint256 questionId) external {
        Question storage q = questions[questionId];
        if (q.asker == address(0)) revert NotFound();
        if (q.state != PayoutState.Open) revert AlreadyResolved();
        if (uint64(block.timestamp) < q.deadline) revert DeadlineNotReached();

        // Path 1: no answers at all → full refund to asker.
        // payoutAmount=0: no funds moved to a winner; asker pulls via withdrawRefund.
        if (q.answerCount == 0) {
            q.state = PayoutState.Refundable;
            emit QuestionResolved(questionId, 0, address(0), address(usdc), 0, RESOLUTION_NO_ANSWER);
            return;
        }

        // Find winner by highest vote count; tie-break = earlier answerId (smaller id).
        uint256[] storage ids = questionAnswerIds[questionId];
        uint256 bestAnswerId = 0;
        uint256 bestVotes    = 0;

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 aId = ids[i];
            uint256 v   = answers[aId].voteCount;
            if (v > bestVotes) {
                bestVotes    = v;
                bestAnswerId = aId;
            }
            // Equal-vote tie-break: ids are assigned in submission order so
            // earlier (smaller) id is always encountered first; no extra branch needed.
        }

        // Path 2: answers exist but nobody voted → refund asker.
        // payoutAmount=0: no funds moved to a winner; asker pulls via withdrawRefund.
        if (bestVotes == 0) {
            q.state = PayoutState.Refundable;
            emit QuestionResolved(questionId, 0, address(0), address(usdc), 0, RESOLUTION_NO_VOTES);
            return;
        }

        // Path 3: clear winner.
        q.state          = PayoutState.Claimable;
        q.winnerAnswerId = bestAnswerId;
        q.winner         = answers[bestAnswerId].answerer;
        q.bestVotes      = bestVotes;

        emit QuestionResolved(questionId, bestAnswerId, q.winner, address(usdc), q.bountyAmount, RESOLUTION_WINNER);
    }

    /// @notice Asker withdraws bounty when question is Refundable (no answers or no votes).
    function withdrawRefund(uint256 questionId) external nonReentrant {
        Question storage q = questions[questionId];
        if (q.asker == address(0)) revert NotFound();
        if (q.state != PayoutState.Refundable) revert NotRefundable();
        if (msg.sender != q.asker) revert Unauthorized();

        q.state = PayoutState.Closed;

        _safeTransfer(q.asker, q.bountyAmount);
    }

    /// @notice Winner claims bounty after resolve.
    function claimReward(uint256 questionId) external nonReentrant {
        Question storage q = questions[questionId];
        if (q.asker == address(0)) revert NotFound();
        if (q.state != PayoutState.Claimable) revert NotClaimable();
        if (msg.sender != q.winner) revert Unauthorized();

        q.state = PayoutState.Closed;

        _safeTransfer(q.winner, q.bountyAmount);
    }
}
