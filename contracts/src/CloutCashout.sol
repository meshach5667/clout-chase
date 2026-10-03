// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";

/// @title CloutCashout
/// @notice Converts CLOUT tokens into native MON at fixed rate: 2000 CLOUT = 1 MON ($3.00 USD)
contract CloutCashout {
    IERC20 public immutable cloutToken;
    address public owner;

    // 2000 CLOUT (18 decimals) = 1 MON (18 decimals)
    uint256 public constant CLOUT_PER_MON = 2000;

    event CashedOut(address indexed user, address indexed recipient, uint256 cloutAmount, uint256 monAmount);
    event Funded(address indexed funder, uint256 monAmount);
    event EmergencyWithdraw(address indexed owner, uint256 monAmount);

    error NotOwner();
    error InsufficientReserve();
    error TransferFailed();
    error ZeroAmount();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _cloutToken) payable {
        cloutToken = IERC20(_cloutToken);
        owner = msg.sender;
    }

    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }

    /// @notice Cash out CLOUT for native MON sent to msg.sender
    function cashout(uint256 cloutAmount) external {
        _cashout(payable(msg.sender), cloutAmount);
    }

    /// @notice Cash out CLOUT for native MON sent to `recipient`
    function cashoutTo(address payable recipient, uint256 cloutAmount) external {
        _cashout(recipient, cloutAmount);
    }

    function _cashout(address payable recipient, uint256 cloutAmount) internal {
        if (cloutAmount == 0) revert ZeroAmount();

        // 2000 CLOUT (18 decimals) = 1 MON (18 decimals)
        uint256 monAmount = cloutAmount / CLOUT_PER_MON;
        if (address(this).balance < monAmount) revert InsufficientReserve();

        bool ok = cloutToken.transferFrom(msg.sender, address(this), cloutAmount);
        if (!ok) revert TransferFailed();

        (bool sent, ) = recipient.call{value: monAmount}("");
        if (!sent) revert TransferFailed();

        emit CashedOut(msg.sender, recipient, cloutAmount, monAmount);
    }

    function withdrawMon(uint256 amount) external onlyOwner {
        (bool sent, ) = msg.sender.call{value: amount}("");
        if (!sent) revert TransferFailed();
        emit EmergencyWithdraw(msg.sender, amount);
    }
}
