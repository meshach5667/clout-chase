import { createFileRoute } from "@tanstack/react-router";
import { Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useLeaderboard, useWallet } from "@/lib/web3/hooks";
import { formatCloutUsd, formatToken, shortenAddress } from "@/lib/web3/math";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — CloutChase" },
      {
        name: "description",
        content:
          "The sharpest attention traders on CloutChase, ranked by realised profit on Monad.",
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
        Ranked by realised profit across every settled market (2,000 CLOUT = 1 MON = $3.00 USD).
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
                "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4",
                isYou && "bg-primary/5",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="numeric w-7 text-xs sm:text-sm font-semibold text-muted-foreground">
                  #{index + 1}
                </span>
                {index === 0 && <Crown className="size-4 text-primary shrink-0" />}
                <span className="numeric text-sm font-medium">{shortenAddress(entry.address)}</span>
                {isYou && <Badge variant="outline" className="text-xs">You</Badge>}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-6 text-right text-xs sm:text-sm pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                <div>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground">
                    Win rate
                  </p>
                  <p className="numeric font-medium">{winRate}%</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground">
                    Staked
                  </p>
                  <p className="numeric font-medium truncate">{formatToken(entry.totalStaked, 0)} CLOUT</p>
                  <p className="numeric text-[10px] text-muted-foreground truncate">
                    ${formatCloutUsd(entry.totalStaked)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground">
                    Profit
                  </p>
                  <p className="numeric font-semibold text-primary truncate">
                    +{formatToken(entry.totalWon, 0)} CLOUT
                  </p>
                  <p className="numeric text-[10px] font-semibold text-yes truncate">
                    +${formatCloutUsd(entry.totalWon)}
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
