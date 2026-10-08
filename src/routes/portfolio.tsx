import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, Loader2, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatUnits } from "viem";

import { CashoutModal } from "@/components/cashout-modal";
import { StatusBadge } from "@/components/market-bits";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import {
  useMarketActions,
  useMonBalance,
  usePortfolio,
  useTokenBalance,
  useWallet,
} from "@/lib/web3/hooks";
import { formatCloutMon, formatCloutUsd, formatToken } from "@/lib/web3/math";
import { OUTCOME, marketStatus } from "@/lib/web3/types";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Your portfolio — CloutChase" },
      {
        name: "description",
        content:
          "Track every open attention position, settled outcome and unclaimed payout in one place.",
      },
      { property: "og:title", content: "Your portfolio — CloutChase" },
      {
        property: "og:description",
        content: "Open positions, settled outcomes and unclaimed payouts on CloutChase.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const now = useNow();
  const wallet = useWallet();
  const balance = useTokenBalance(wallet.address);
  const monBalance = useMonBalance(wallet.address);
  const { entries, isLoading } = usePortfolio(wallet.address);
  const { claim, claimAndCashout, status } = useMarketActions();
  const [cashoutOpen, setCashoutOpen] = useState(false);
  const busy = status === "pending" || status === "confirming" || status === "approving";

  if (!wallet.isConnected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Your portfolio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect a wallet to see your positions, settled markets and unclaimed payouts.
        </p>
        <Button className="mt-6" onClick={() => void wallet.connect()}>
          Connect wallet
        </Button>
      </div>
    );
  }

  const staked = entries.reduce((sum, e) => sum + e.position.yes + e.position.no, 0n);
  const open = entries.filter((e) => !e.market.settled).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your open positions, settled payouts, and cash out rewards to native MON.
          </p>
        </div>
        <Button
          onClick={() => setCashoutOpen(true)}
          className="gap-2 font-semibold bg-yes hover:bg-yes/90 text-yes-foreground w-full sm:w-auto h-11 sm:h-10"
        >
          <ArrowDownToLine className="size-4" /> Cash out CLOUT to MON
        </Button>
      </div>

      {/* Conversion Banner */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              Rate: 2,000 CLOUT = 1 MON = $3.00 USD
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            (Rewards convert directly to native MON in your wallet)
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCashoutOpen(true)}
          className="text-xs font-semibold w-full sm:w-auto h-9"
        >
          Open Cashout Calculator
        </Button>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric
          label="CLOUT Balance"
          value={`${formatToken(balance, 0)} CLOUT`}
          subtext={`≈ ${formatCloutMon(balance)} MON ($${formatCloutUsd(balance)} USD)`}
        />
        <Metric
          label="At stake"
          value={`${formatToken(staked, 0)} CLOUT`}
          subtext={`≈ ${formatCloutMon(staked)} MON ($${formatCloutUsd(staked)} USD)`}
        />
        <Metric
          label="Wallet MON Balance"
          value={`${formatToken(monBalance, 4)} MON`}
          subtext={`≈ $${(Number(formatUnits(monBalance ?? 0n, 18)) * 3).toFixed(2)} USD`}
        />
      </dl>

      {isLoading && (
        <div className="panel mt-6 flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading positions…
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <div className="panel mt-6 p-10 text-center">
          <p className="text-sm text-muted-foreground">You haven&apos;t taken a position yet.</p>
          <Button asChild className="mt-4">
            <Link to="/">Browse markets</Link>
          </Button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {entries.map(({ market, position }) => {
          const side = position.yes > 0n ? "YES" : "NO";
          const size = position.yes + position.no;
          const won =
            market.settled &&
            ((market.outcome === OUTCOME.Yes && position.yes > 0n) ||
              (market.outcome === OUTCOME.No && position.no > 0n) ||
              market.outcome === OUTCOME.Canceled);
          const claimable = market.settled && won && !position.claimed;

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
            <div key={market.id.toString()} className="panel flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <Link
                  to="/markets/$marketId"
                  params={{ marketId: market.id.toString() }}
                  className="font-medium hover:text-primary"
                >
                  {market.subject}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className={side === "YES" ? "text-yes" : "text-no"}>{side}</span> ·{" "}
                  <span className="numeric font-medium">{formatToken(size)} CLOUT</span>{" "}
                  <span className="numeric text-yes font-semibold">(${formatCloutUsd(size)})</span>{" "}
                  · {marketStatus(market, now)}
                </p>
              </div>
              <StatusBadge market={market} now={now} />
              {claimable ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    disabled={busy}
                    className="font-semibold bg-yes hover:bg-yes/90 text-yes-foreground h-10 sm:h-9"
                    onClick={async () => {
                      try {
                        await claimAndCashout(market.id);
                        toast.success(
                          `Payout of ${formatCloutMon(estPayout)} MON ($${formatCloutUsd(estPayout)}) sent to your wallet!`,
                        );
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Claim as MON failed");
                      }
                    }}
                  >
                    {busy && <Loader2 className="mr-2 size-3.5 animate-spin" />}
                    Claim as MON ({formatCloutMon(estPayout)} MON · ${formatCloutUsd(estPayout)})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    className="h-10 sm:h-9"
                    onClick={async () => {
                      try {
                        await claim(market.id);
                        toast.success("CLOUT payout claimed to wallet");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Claim failed");
                      }
                    }}
                  >
                    Claim CLOUT
                  </Button>
                </div>
              ) : market.settled ? (
                <span className="text-xs text-muted-foreground font-medium">
                  {position.claimed ? "Claimed" : "No payout"}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <CashoutModal open={cashoutOpen} onOpenChange={setCashoutOpen} />
    </div>
  );
}

function Metric({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <div className="panel p-4">
      <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="numeric mt-1 text-lg font-bold">{value}</dd>
      {subtext && <p className="numeric mt-0.5 text-xs font-semibold text-yes">{subtext}</p>}
    </div>
  );
}
