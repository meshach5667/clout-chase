// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CloutCashout} from "../src/CloutCashout.sol";
import {CloutToken} from "../src/CloutToken.sol";

contract CloutCashoutTest is Test {
    CloutToken internal token;
    CloutCashout internal cashout;
    address internal alice = address(0xAA);
    address internal bob = address(0xBB);
    address internal owner = address(this);

    function setUp() public {
        token = new CloutToken(1_000_000e18);
        cashout = new CloutCashout{value: 10 ether}(address(token));

        token.mint(alice, 100_000e18);
        token.mint(bob, 50_000e18);

        vm.prank(alice);
        token.approve(address(cashout), type(uint256).max);

        vm.prank(bob);
        token.approve(address(cashout), type(uint256).max);
    }

    function test_CashoutRate() public {
        // 2000 CLOUT should give 1 MON
        uint256 cloutIn = 2_000e18;
        uint256 aliceMonBefore = alice.balance;

        vm.prank(alice);
        cashout.cashout(cloutIn);

        assertEq(alice.balance - aliceMonBefore, 1 ether);
        assertEq(token.balanceOf(address(cashout)), cloutIn);
    }

    function test_CashoutTo() public {
        uint256 cloutIn = 4_000e18;
        uint256 bobMonBefore = bob.balance;

        vm.prank(alice);
        cashout.cashoutTo(payable(bob), cloutIn);

        assertEq(bob.balance - bobMonBefore, 2 ether);
    }

    function test_FundingViaReceive() public {
        uint256 initialBal = address(cashout).balance;
        (bool ok,) = address(cashout).call{value: 5 ether}("");
        assertTrue(ok);
        assertEq(address(cashout).balance, initialBal + 5 ether);
    }

    function test_RevertWhen_ZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(CloutCashout.ZeroAmount.selector);
        cashout.cashout(0);
    }

    function test_RevertWhen_InsufficientReserve() public {
        // Contract has 10 MON, which covers 20,000 CLOUT.
        // Trying to cash out 20,001 CLOUT requires > 10 MON.
        uint256 cloutIn = 20_002e18;
        vm.prank(alice);
        vm.expectRevert(CloutCashout.InsufficientReserve.selector);
        cashout.cashout(cloutIn);
    }

    function test_OwnerWithdrawMon() public {
        uint256 ownerBalBefore = address(this).balance;
        cashout.withdrawMon(2 ether);
        assertEq(address(this).balance - ownerBalBefore, 2 ether);
    }

    function test_RevertWhen_NonOwnerWithdraw() public {
        vm.prank(alice);
        vm.expectRevert(CloutCashout.NotOwner.selector);
        cashout.withdrawMon(1 ether);
    }

    receive() external payable {}
}
