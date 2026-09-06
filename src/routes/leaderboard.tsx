import { createFileRoute } from "@tanstack/react-router";
import { Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useLeaderboard, useWallet } from "@/lib/web3/hooks";
import { formatToken, shortenAddress } from "@/lib/web3/math";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — CloutChase" },
      {
        name: "description",
        content: "The sharpest attention traders on CloutChase, ranked by realised profit on Monad.",
      },
      { property: "og:title", content: "Leaderboard — CloutChase" },
      {
        property: "og:description",
        content: "Ranked by realised profit across every settled attention market.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const entries = useLeaderboard();
  const wallet = useWallet();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Leaderboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ranked by realised profit across every settled market.
      </p>

      <div className="panel mt-6 divide-y divide-border/70">
        {entries.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No settled markets yet — the first winners will show up here.
          </p>
        )}
        {entries.map((entry, index) => {
          const isYou = wallet.address?.toLowerCase() === entry.address.toLowerCase();
          const winRate = entry.marketsPlayed
            ? Math.round((entry.marketsWon / entry.marketsPlayed) * 100)
            : 0;
          return (
            <div
              key={entry.address}
              className={cn(
                "flex flex-wrap items-center gap-3 p-4",
                isYou && "bg-primary/5",
              )}
            >
              <span className="numeric w-8 text-sm text-muted-foreground">#{index + 1}</span>
              {index === 0 && <Crown className="size-4 text-primary" />}
              <span className="numeric text-sm font-medium">
                {shortenAddress(entry.address)}
              </span>
              {isYou && <Badge variant="outline">You</Badge>}
              <div className="ml-auto flex items-center gap-6 text-right text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Win rate
                  </p>
                  <p className="numeric">{winRate}%</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Staked
                  </p>
                  <p className="numeric">{formatToken(entry.totalStaked, 0)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Profit
                  </p>
                  <p className="numeric font-semibold text-primary">
                    +{formatToken(entry.totalWon, 0)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
