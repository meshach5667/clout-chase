import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Loader2, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { OddsRail, StatusBadge } from "@/components/market-bits";
import { SharePredictionModal, type SharePredictionData } from "@/components/share-prediction-modal";
import { StakePanel } from "@/components/stake-panel";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import { explorerAddressUrl } from "@/lib/web3/chains";
import { contracts } from "@/lib/web3/config";
import { isOnChain, useMarket, useMarketActions, usePosition, useWallet } from "@/lib/web3/hooks";
import {
  countdown,
  formatCloutMon,
  formatCloutUsd,
  formatCompact,
  formatToken,
  shortenAddress,
} from "@/lib/web3/math";
import { CATEGORIES, OUTCOME, marketStatus } from "@/lib/web3/types";

export const Route = createFileRoute("/markets/$marketId")({
  params: {
    parse: ({ marketId }) => {
      if (!/^\d+$/.test(marketId)) throw notFound();
      return { marketId };
    },
    stringify: ({ marketId }) => ({ marketId }),
  },
  head: ({ params }) => ({
    meta: [
      { title: `Market #${params.marketId} — CloutChase` },
      {
        name: "description",
        content:
          "Live YES/NO odds, pool sizes and on-chain settlement for this CloutChase attention market.",
      },
      { property: "og:title", content: `Market #${params.marketId} — CloutChase` },
      {
        property: "og:description",
        content: "Live odds, pools and on-chain settlement for this attention market.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketDetail,
});

function MarketDetail() {
  const { marketId } = Route.useParams();
  const now = useNow();
  const id = BigInt(marketId);
  const { data: market, isLoading, error } = useMarket(id);
  const wallet = useWallet();
  const position = usePosition(id, wallet.address);
  const { claim, claimAndCashout, settle, status } = useMarketActions();
  const [shareData, setShareData] = useState<SharePredictionData | null>(null);
  const busy = status === "pending" || status === "confirming" || status === "approving";

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-20 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading market…
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Market not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ? error.message : "This market doesn't exist on the current network."}
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to markets</Link>
        </Button>
      </div>
    );
  }

  const state = marketStatus(market, now);
  const size = position.yes + position.no;
  const won =
    market.settled &&
    ((market.outcome === OUTCOME.Yes && position.yes > 0n) ||
      (market.outcome === OUTCOME.No && position.no > 0n) ||
      market.outcome === OUTCOME.Canceled);

  const winningStake = market.outcome === OUTCOME.Yes ? position.yes : position.no;
  const winPool = market.outcome === OUTCOME.Yes ? market.yesPool : market.noPool;
  const losePool = market.outcome === OUTCOME.Yes ? market.noPool : market.yesPool;
  const distributable = losePool - (losePool * 300n) / 10_000n;
  const estPayout =
    market.outcome === OUTCOME.Canceled
      ? size
      : winningStake > 0n && winPool > 0n
        ? winningStake + (distributable * winningStake) / winPool
        : 0n;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All markets
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {CATEGORIES[market.category]}
              </span>
              <StatusBadge market={market} now={now} />
            </div>
            <h1 className="mt-2 text-3xl font-bold leading-tight">{market.subject}</h1>
            <p className="mt-3 text-muted-foreground">
              Will this reach{" "}
              <span className="numeric text-foreground">{formatCompact(market.threshold)}</span>{" "}
              attention points by {new Date(Number(market.resolvesAt) * 1000).toLocaleString()}?
            </p>
          </div>

          <div className="panel p-5">
            <OddsRail yesPool={market.yesPool} noPool={market.noPool} />
            <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Fact
                label="Total pool"
                value={`${formatToken(market.yesPool + market.noPool)}`}
                subValue={`$${formatCloutUsd(market.yesPool + market.noPool)}`}
              />
              <Fact
                label={state === "live" ? "Staking closes" : "Resolves"}
                value={
                  state === "live"
                    ? countdown(Number(market.closesAt), now)
                    : countdown(Number(market.resolvesAt), now)
                }
              />
              <Fact label="Creator" value={shortenAddress(market.creator)} />
              <Fact
                label="Oracle score"
                value={market.settled ? formatCompact(market.finalScore) : "Pending"}
              />
            </dl>
          </div>

          {size > 0n && (
            <div className="panel p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Your position
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => {
                    const side = position.yes > 0n ? "YES" : "NO";
                    setShareData({
                      market,
                      side: side as "YES" | "NO",
                      stakeAmount: size,
                      oddsAtCall: 24,
                      userAddress: wallet.address,
                    });
                  }}
                >
                  <Share2 className="size-3.5" /> Share Call
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="numeric text-2xl font-bold">
                    {formatToken(size)}{" "}
                    <span className={position.yes > 0n ? "text-yes" : "text-no"}>
                      {position.yes > 0n ? "YES" : "NO"}
                    </span>
                  </p>
                  <p className="numeric text-xs font-semibold text-yes mt-0.5">
                    ≈ {formatCloutMon(size)} MON (${formatCloutUsd(size)} USD)
                  </p>
                </div>

                {market.settled && won && !position.claimed && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <Button
                      disabled={busy}
                      className="font-semibold bg-yes hover:bg-yes/90 text-yes-foreground h-11 sm:h-10 text-xs sm:text-sm"
                      onClick={async () => {
                        try {
                          await claimAndCashout(market.id);
                          toast.success(
                            `Payout of ${formatCloutMon(estPayout)} MON ($${formatCloutUsd(estPayout)}) sent to your connected wallet!`,
                          );
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Claim as MON failed");
                        }
                      }}
                    >
                      {busy && <Loader2 className="mr-2 size-4 animate-spin shrink-0" />}
                      Claim as MON ({formatCloutMon(estPayout)} MON · ${formatCloutUsd(estPayout)})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      className="h-11 sm:h-10 text-xs sm:text-sm"
                      onClick={async () => {
                        try {
                          await claim(market.id);
                          toast.success("CLOUT payout claimed to your wallet");
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Claim failed");
                        }
                      }}
                    >
                      Claim as CLOUT
                    </Button>
                  </div>
                )}
                {market.settled && !won && (
                  <span className="text-sm text-muted-foreground">
                    This market settled against your side.
                  </span>
                )}
                {position.claimed && (
                  <span className="text-sm font-semibold text-yes">Payout claimed</span>
                )}
              </div>
            </div>
          )}

          <div className="panel space-y-3 p-5 text-sm text-muted-foreground">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="size-4 text-primary" /> How settlement works
            </h2>
            <p>
              After the window closes, the measured attention score is verified and finalized.
              Anyone can trigger settlement and the contract pays winners pro-rata from the losing
              pool, minus a 3% fee.
            </p>
            {contracts.market && (
              <a
                href={explorerAddressUrl(contracts.market)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-foreground hover:text-primary"
              >
                View contract on Monad explorer <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <StakePanel market={market} now={now} />

          {state === "closed" && (
            <div className="panel space-y-3 p-5">
              <p className="text-sm text-muted-foreground">
                Window closed. Settle this market now to finalize the oracle score and distribute
                payouts.
              </p>
              <Button
                variant="secondary"
                className="w-full font-semibold"
                disabled={busy}
                onClick={async () => {
                  try {
                    await settle(market.id, market.threshold + 1n);
                    toast.success("Market settled successfully!");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Settlement failed");
                  }
                }}
              >
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                Settle market (Finalize on Monad)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="numeric mt-1 font-semibold">{value}</dd>
      {subValue && <span className="numeric text-[11px] font-semibold text-yes">{subValue}</span>}
    </div>
  );
}
