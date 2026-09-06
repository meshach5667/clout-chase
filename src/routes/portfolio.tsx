import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/market-bits";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import {
  useMarketActions,
  usePortfolio,
  useTokenBalance,
  useWallet,
} from "@/lib/web3/hooks";
import { formatToken } from "@/lib/web3/math";
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
  const { entries, isLoading } = usePortfolio(wallet.address);
  const { claim, status } = useMarketActions();
  const busy = status === "pending" || status === "confirming";

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
      <h1 className="text-3xl font-bold">Your portfolio</h1>

      <dl className="mt-6 grid grid-cols-3 gap-3">
        <Metric label="Wallet" value={`${formatToken(balance, 0)} CLOUT`} />
        <Metric label="At stake" value={`${formatToken(staked, 0)} CLOUT`} />
        <Metric label="Open positions" value={String(open)} />
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
                  <span className="numeric">{formatToken(size)} CLOUT</span> ·{" "}
                  {marketStatus(market, now)}
                </p>
              </div>
              <StatusBadge market={market} now={now} />
              {claimable ? (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      await claim(market.id);
                      toast.success("Payout claimed");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Claim failed");
                    }
                  }}
                >
                  {busy && <Loader2 className="mr-2 size-3.5 animate-spin" />} Claim
                </Button>
              ) : market.settled ? (
                <span className="text-xs text-muted-foreground">
                  {position.claimed ? "Claimed" : "No payout"}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="numeric mt-1 text-lg font-bold">{value}</dd>
    </div>
  );
}
