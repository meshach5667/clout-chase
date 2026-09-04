// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CloutToken} from "../src/CloutToken.sol";
import {AttentionOracle} from "../src/AttentionOracle.sol";
import {CloutChaseMarket} from "../src/CloutChaseMarket.sol";

/// @notice Deploys the full CloutChase stack to Monad.
/// forge script script/Deploy.s.sol --rpc-url $MONAD_RPC_URL --broadcast --verify
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        CloutToken token = new CloutToken(10_000_000e18);
        AttentionOracle oracle = new AttentionOracle(1);
        CloutChaseMarket market = new CloutChaseMarket(address(token), address(oracle), deployer);

        vm.stopBroadcast();

        console.log("VITE_CLOUT_TOKEN_ADDRESS=%s", address(token));
        console.log("VITE_ORACLE_ADDRESS=%s", address(oracle));
        console.log("VITE_MARKET_ADDRESS=%s", address(market));
    }
}
