// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CloutToken} from "../src/CloutToken.sol";
import {AttentionOracle} from "../src/AttentionOracle.sol";
import {CloutChaseMarket} from "../src/CloutChaseMarket.sol";

contract CloutChaseMarketTest is Test {
    CloutToken token;
    AttentionOracle oracle;
    CloutChaseMarket market;

    address admin = address(this);
    address treasury = address(0xFEE);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address carol = address(0xCAC0);

    function setUp() public {
        token = new CloutToken(1_000_000e18);
        oracle = new AttentionOracle(1);
        market = new CloutChaseMarket(address(token), address(oracle), treasury);

        address[3] memory users = [alice, bob, carol];
        for (uint256 i; i < users.length; i++) {
            token.mint(users[i], 10_000e18);
            vm.prank(users[i]);
            token.approve(address(market), type(uint256).max);
        }
    }

    function _create() internal returns (uint256 id) {
        id = market.createMarket("@vitalik", "ipfs://meta", 1, 100_000, 24 hours);
    }

    // ------------------------------------------------------------- creation

    function test_CreateMarket() public {
        uint256 id = _create();
        CloutChaseMarket.Market memory m = market.getMarket(id);
        assertEq(m.id, 1);
        assertEq(m.threshold, 100_000);
        assertEq(m.resolvesAt - m.createdAt, 24 hours);
        assertLt(m.closesAt, m.resolvesAt);
        assertEq(uint8(m.outcome), uint8(CloutChaseMarket.Outcome.Unresolved));
    }

    function test_RevertWhen_DurationOutOfRange() public {
        vm.expectRevert(CloutChaseMarket.InvalidDuration.selector);
        market.createMarket("@a", "", 0, 10, 12 hours);
        vm.expectRevert(CloutChaseMarket.InvalidDuration.selector);
        market.createMarket("@a", "", 0, 10, 72 hours);
    }

    function test_RevertWhen_EmptySubject() public {
        vm.expectRevert(CloutChaseMarket.EmptySubject.selector);
        market.createMarket("", "", 0, 10, 24 hours);
    }

    function test_RevertWhen_ZeroThreshold() public {
        vm.expectRevert(CloutChaseMarket.InvalidThreshold.selector);
        market.createMarket("@a", "", 0, 0, 24 hours);
    }

    // -------------------------------------------------------------- staking

    function test_StakeUpdatesPoolsAndPositions() public {
        uint256 id = _create();
        vm.prank(alice);
        market.stake(id, true, 100e18);
        vm.prank(bob);
        market.stake(id, false, 300e18);

        CloutChaseMarket.Market memory m = market.getMarket(id);
        assertEq(m.yesPool, 100e18);
        assertEq(m.noPool, 300e18);
        assertEq(market.getPosition(id, alice).yes, 100e18);
        assertEq(market.participantCount(id), 2);
        assertEq(market.impliedYesOddsBps(id), 2_500);
        assertEq(token.balanceOf(address(market)), 400e18);
    }

    function test_RevertWhen_StakeBelowMinimum() public {
        uint256 id = _create();
        vm.prank(alice);
        vm.expectRevert(CloutChaseMarket.StakeTooSmall.selector);
        market.stake(id, true, 0.5e18);
    }

    function test_RevertWhen_StakeAfterClose() public {
        uint256 id = _create();
        vm.warp(block.timestamp + 24 hours);
        vm.prank(alice);
        vm.expectRevert(CloutChaseMarket.MarketClosed.selector);
        market.stake(id, true, 10e18);
    }

    function test_RevertWhen_MarketMissing() public {
        vm.prank(alice);
        vm.expectRevert(CloutChaseMarket.MarketNotFound.selector);
        market.stake(42, true, 10e18);
    }

    function test_RevertWhen_PausedStake() public {
        uint256 id = _create();
        market.setPaused(true);
        vm.prank(alice);
        vm.expectRevert(CloutChaseMarket.Paused.selector);
        market.stake(id, true, 10e18);
    }

    // ------------------------------------------------------------ settlement

    function test_SettleYesAndClaimPaysWinners() public {
        uint256 id = _create();
        vm.prank(alice);
        market.stake(id, true, 100e18);
        vm.prank(bob);
        market.stake(id, false, 300e18);

        vm.warp(block.timestamp + 24 hours);
        oracle.reportScore(id, 150_000);
        market.settle(id);

        CloutChaseMarket.Market memory m = market.getMarket(id);
        assertEq(uint8(m.outcome), uint8(CloutChaseMarket.Outcome.Yes));

        uint256 before = token.balanceOf(alice);
        vm.prank(alice);
        market.claim(id);
        // 3% total fee on the 300 losing pool -> 291 distributable, alice owns 100% of YES
        assertEq(token.balanceOf(alice) - before, 391e18);
        assertEq(token.balanceOf(treasury), 6e18); // 2% of 300
    }

    function test_SettleNoLosersGetNothing() public {
        uint256 id = _create();
        vm.prank(alice);
        market.stake(id, true, 100e18);
        vm.prank(bob);
        market.stake(id, false, 100e18);

        vm.warp(block.timestamp + 24 hours);
        oracle.reportScore(id, 10);
        market.settle(id);

        uint256 before = token.balanceOf(alice);
        vm.prank(alice);
        uint256 payout = market.claim(id);
        assertEq(payout, 0);
        assertEq(token.balanceOf(alice), before);
    }

    function test_ProRataSplitBetweenTwoWinners() public {
        uint256 id = _create();
        vm.prank(alice);
        market.stake(id, true, 100e18);
        vm.prank(carol);
        market.stake(id, true, 300e18);
        vm.prank(bob);
        market.stake(id, false, 400e18);

        vm.warp(block.timestamp + 24 hours);
        oracle.reportScore(id, 100_000);
        market.settle(id);

        uint256 a0 = token.balanceOf(alice);
        uint256 c0 = token.balanceOf(carol);
        vm.prank(alice);
        market.claim(id);
        vm.prank(carol);
        market.claim(id);

        uint256 aGain = token.balanceOf(alice) - a0;
        uint256 cGain = token.balanceOf(carol) - c0;
        assertEq(aGain, 100e18 + 97e18); // 388 distributable * 1/4
        assertEq(cGain, 300e18 + 291e18);
        assertLe(token.balanceOf(address(market)), 1);
    }

    function test_RevertWhen_ClaimTwice() public {
        uint256 id = _create();
        vm.prank(alice);
        market.stake(id, true, 100e18);
        vm.prank(bob);
        market.stake(id, false, 100e18);
        vm.warp(block.timestamp + 24 hours);
        oracle.reportScore(id, 100_000);
        market.settle(id);

        vm.startPrank(alice);
        market.claim(id);
        vm.expectRevert(CloutChaseMarket.AlreadyClaimed.selector);
        market.claim(id);
        vm.stopPrank();
    }

    function test_RevertWhen_SettleBeforeResolveTime() public {
        uint256 id = _create();
        vm.expectRevert(CloutChaseMarket.MarketNotClosed.selector);
        market.settle(id);
    }

    function test_RevertWhen_OracleNotFinalized() public {
        uint256 id = _create();
        vm.warp(block.timestamp + 24 hours);
        vm.expectRevert(CloutChaseMarket.OracleNotReady.selector);
        market.settle(id);
    }

    function test_OneSidedMarketRefunds() public {
        uint256 id = _create();
        vm.prank(alice);
        market.stake(id, true, 100e18);
        vm.warp(block.timestamp + 24 hours);
        oracle.reportScore(id, 100_000);
        market.settle(id);

        assertEq(uint8(market.getMarket(id).outcome), uint8(CloutChaseMarket.Outcome.Canceled));
        uint256 before = token.balanceOf(alice);
        vm.prank(alice);
        market.claim(id);
        assertEq(token.balanceOf(alice) - before, 100e18);
    }

    function test_CancelRefundsEveryone() public {
        uint256 id = _create();
        vm.prank(alice);
        market.stake(id, true, 100e18);
        vm.prank(bob);
        market.stake(id, false, 50e18);
        market.cancelMarket(id, "oracle outage");

        vm.prank(bob);
        uint256 payout = market.claim(id);
        assertEq(payout, 50e18);
    }

    // ------------------------------------------------------------- security

    function test_RevertWhen_NonOwnerAdmin() public {
        vm.prank(alice);
        vm.expectRevert(CloutChaseMarket.NotOwner.selector);
        market.setPaused(true);
    }

    function test_RevertWhen_FeeAboveCap() public {
        vm.expectRevert(CloutChaseMarket.FeeTooHigh.selector);
        market.setFees(400, 200);
    }

    function test_ClaimWorksWhilePaused() public {
        uint256 id = _create();
        vm.prank(alice);
        market.stake(id, true, 100e18);
        vm.prank(bob);
        market.stake(id, false, 100e18);
        vm.warp(block.timestamp + 24 hours);
        oracle.reportScore(id, 100_000);
        market.settle(id);
        market.setPaused(true);
        vm.prank(alice);
        assertGt(market.claim(id), 0);
    }

    // ---------------------------------------------------------------- fuzz

    function testFuzz_SolvencyAfterSettlement(uint96 yesAmt, uint96 noAmt) public {
        vm.assume(yesAmt >= 1e18 && noAmt >= 1e18);
        vm.assume(uint256(yesAmt) < 5_000e18 && uint256(noAmt) < 5_000e18);

        uint256 id = _create();
        vm.prank(alice);
        market.stake(id, true, yesAmt);
        vm.prank(bob);
        market.stake(id, false, noAmt);

        vm.warp(block.timestamp + 24 hours);
        oracle.reportScore(id, 100_000);
        market.settle(id);

        vm.prank(alice);
        market.claim(id);
        vm.prank(bob);
        market.claim(id);
        // contract may only retain dust from integer division
        assertLe(token.balanceOf(address(market)), 10);
    }
}
