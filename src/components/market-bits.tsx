import { Link } from "@tanstack/react-router";
import { Flame, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  countdown,
  formatCompact,
  formatToken,
  impliedYesProbability,
} from "@/lib/web3/math";
import { CATEGORIES, OUTCOME, marketStatus, type Market } from "@/lib/web3/types";

export function OddsRail({ yesPool, noPool }: { yesPool: bigint; noPool: bigint }) {
  const yes = Math.round(impliedYesProbability(yesPool, noPool) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="numeric font-semibold text-yes">YES {yes}%</span>
        <span className="numeric font-semibold text-no">NO {100 - yes}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-yes transition-all duration-500"
          style={{ width: `${yes}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="numeric">{formatToken(yesPool)} CLOUT</span>
        <span className="numeric">{formatToken(noPool)} CLOUT</span>
      </div>
    </div>
  );
}

export function StatusBadge({ market, now }: { market: Market; now: number }) {
  const status = marketStatus(market, now);
  if (status === "live") {
    return (
      <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
        <span className="live-dot size-1.5 rounded-full bg-primary" />
        {countdown(Number(market.closesAt), now)} left
      </Badge>
    );
  }
  if (status === "closed") {
    return (
      <Badge variant="outline" className="border-accent/50 text-accent">
        Awaiting oracle
      </Badge>
    );
  }
  if (status === "canceled") {
    return <Badge variant="secondary">Refunded</Badge>;
  }
  return market.outcome === OUTCOME.Yes ? (
    <Badge className="bg-yes text-yes-foreground hover:bg-yes">Settled YES</Badge>
  ) : (
    <Badge className="bg-no text-no-foreground hover:bg-no">Settled NO</Badge>
  );
}

export function MarketCard({ market, now }: { market: Market; now: number }) {
  const total = market.yesPool + market.noPool;
  return (
    <Link
      to="/markets/$marketId"
      params={{ marketId: market.id.toString() }}
      className={cn(
        "panel group flex flex-col gap-4 p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[var(--glow-primary)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {CATEGORIES[market.category] ?? "Market"}
          </span>
          <h3 className="text-base font-semibold leading-snug">{market.subject}</h3>
        </div>
        <StatusBadge market={market} now={now} />
      </div>

      <p className="text-sm text-muted-foreground">
        Reaches{" "}
        <span className="numeric text-foreground">{formatCompact(market.threshold)}</span> attention
        points before{" "}
        {new Date(Number(market.resolvesAt) * 1000).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
        })}
        ?
      </p>

      <OddsRail yesPool={market.yesPool} noPool={market.noPool} />

      <div className="flex items-center gap-4 border-t border-border/70 pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="size-3.5" />
          <span className="numeric">{formatToken(total)}</span> pool
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" /> {CATEGORIES[market.category]}
        </span>
        {total > 5_000n * 10n ** 18n && (
          <span className="ml-auto flex items-center gap-1 text-accent">
            <Flame className="size-3.5" /> Hot
          </span>
        )}
      </div>
    </Link>
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="panel h-56 animate-pulse p-5">
      <div className="h-4 w-24 rounded bg-muted" />
      <div className="mt-3 h-5 w-3/4 rounded bg-muted" />
      <div className="mt-6 h-2 w-full rounded bg-muted" />
      <div className="mt-6 h-3 w-1/2 rounded bg-muted" />
    </div>
  );
}
