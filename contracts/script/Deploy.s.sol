// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CloutToken} from "../src/CloutToken.sol";
import {AttentionOracleV2} from "../src/AttentionOracleV2.sol";
import {CloutChaseMarket} from "../src/CloutChaseMarket.sol";
import {CloutCashout} from "../src/CloutCashout.sol";

/// @notice Deploys the full CloutChase stack to Monad.
/// forge script script/Deploy.s.sol --rpc-url $MONAD_RPC_URL --broadcast
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        CloutToken token = new CloutToken(10_000_000e18);
        AttentionOracleV2 oracle = new AttentionOracleV2();
        CloutChaseMarket market = new CloutChaseMarket(address(token), address(oracle), deployer);
        CloutCashout cashout = new CloutCashout{value: 2 ether}(address(token));

        // Approve market and seed initial active markets with real liquidity
        token.approve(address(market), type(uint256).max);

        uint256 m1 = market.createMarket("@zoravibes drop teaser", "", 0, 250_000, 36 hours);
        market.stake(m1, true, 4_820e18);
        market.stake(m1, false, 2_140e18);

        uint256 m2 = market.createMarket("@0xchef", "", 1, 90_000, 24 hours);
        market.stake(m2, true, 1_300e18);
        market.stake(m2, false, 3_950e18);

        uint256 m3 = market.createMarket("#MonadSzn", "", 2, 1_200_000, 48 hours);
        market.stake(m3, true, 7_600e18);
        market.stake(m3, false, 6_900e18);

        uint256 m4 = market.createMarket("@luna.codes rewrite thread", "", 0, 40_000, 32 hours);
        market.stake(m4, true, 2_200e18);
        market.stake(m4, false, 800e18);

        uint256 m5 = market.createMarket("#DeadInternetTheory", "", 2, 500_000, 48 hours);
        market.stake(m5, true, 3_400e18);
        market.stake(m5, false, 5_100e18);

        vm.stopBroadcast();

        console.log("VITE_CLOUT_TOKEN_ADDRESS=%s", address(token));
        console.log("VITE_ORACLE_ADDRESS=%s", address(oracle));
        console.log("VITE_MARKET_ADDRESS=%s", address(market));
        console.log("VITE_CASHOUT_ADDRESS=%s", address(cashout));
    }
}
