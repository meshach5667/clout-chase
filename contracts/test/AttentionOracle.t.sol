// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AttentionOracle} from "../src/AttentionOracle.sol";

contract AttentionOracleTest is Test {
    AttentionOracle oracle;
    address reporterB = address(0xB1);
    address reporterC = address(0xC1);

    function setUp() public {
        oracle = new AttentionOracle(1);
        oracle.setReporter(reporterB, true);
        oracle.setReporter(reporterC, true);
    }

    function test_SingleReporterFinalizesAtQuorumOne() public {
        oracle.reportScore(1, 500);
        assertTrue(oracle.isFinalized(1));
        (uint256 score,) = oracle.getScore(1);
        assertEq(score, 500);
    }

    function test_QuorumTwoNeedsAgreement() public {
        oracle.setQuorum(2);
        oracle.reportScore(1, 500);
        assertFalse(oracle.isFinalized(1));
        vm.prank(reporterB);
        oracle.reportScore(1, 400);
        assertFalse(oracle.isFinalized(1));
        vm.prank(reporterC);
        oracle.reportScore(1, 500);
        assertTrue(oracle.isFinalized(1));
    }

    function test_RevertWhen_NotReporter() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert(AttentionOracle.NotReporter.selector);
        oracle.reportScore(1, 10);
    }

    function test_RevertWhen_ReportTwice() public {
        oracle.setQuorum(2);
        oracle.reportScore(1, 10);
        vm.expectRevert(AttentionOracle.AlreadyReported.selector);
        oracle.reportScore(1, 11);
    }

    function test_RevertWhen_ReadingUnfinalized() public {
        vm.expectRevert(AttentionOracle.NotFinalized.selector);
        oracle.getScore(99);
    }

    function test_RevertWhen_QuorumExceedsReporters() public {
        vm.expectRevert(AttentionOracle.InvalidQuorum.selector);
        oracle.setQuorum(10);
    }
}
