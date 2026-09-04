# CloutChase contracts (Monad)

Solidity 0.8.24, built and tested with [Foundry](https://book.getfoundry.sh).

## Contracts

| Contract            | Purpose                                                                       |
| ------------------- | ----------------------------------------------------------------------------- |
| `CloutToken`        | ERC20 `CLOUT` staking token with a 1,000/day testnet faucet.                    |
| `AttentionOracle`   | Multi-reporter oracle publishing the measured attention score per market.       |
| `CloutChaseMarket`  | Parimutuel YES/NO markets, staking, permissionless settlement, pull payouts.    |

## Market lifecycle

1. `createMarket(subject, metadataURI, category, threshold, duration)` — duration must be 24–48h.
   Staking closes at 80% of the window so nobody can stake once the outcome is obvious.
2. `stake(marketId, isYes, amount)` — min 1 CLOUT, `approve` the market first.
3. After `resolvesAt`, reporters call `AttentionOracle.reportScore(marketId, score)`; once quorum
   agrees the score is final.
4. Anyone calls `settle(marketId)`. `score >= threshold` → YES wins, otherwise NO.
5. Winners call `claim(marketId)`; losers get nothing, canceled/one-sided markets refund in full.

Fees: 2% protocol + 1% market creator, taken from the losing pool only, hard-capped at 5%.

## Security checks implemented

- custom `nonReentrant` guard on every token-moving entry point
- checks-effects-interactions ordering, pull-based payouts (no loops over users)
- `claim` intentionally works while the contract is paused
- owner cannot touch user funds; only pause, fees (capped), oracle address and cancel-to-refund
- oracle requires a quorum of independent reporters and rejects double reporting
- input validation with custom errors on every public entry point
- fuzz test asserting contract solvency after any pool configuration

Recommended before mainnet: `forge test`, `slither .`, `forge coverage`, and an external audit.

## Commands

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit   # first time only
forge build
forge test -vvv
forge coverage
slither .                                        # optional static analysis

cp .env.example .env                             # fill PRIVATE_KEY + MONAD_RPC_URL
forge script script/Deploy.s.sol --rpc-url $MONAD_RPC_URL --broadcast
```

The deploy script prints the three `VITE_*` addresses — paste them into the app's `.env`.

## Monad testnet

- Chain ID: `10143`
- RPC: `https://testnet-rpc.monad.xyz`
- Explorer: `https://testnet.monadexplorer.com`
