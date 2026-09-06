import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";

import { MarketCard, MarketCardSkeleton } from "@/components/market-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNow } from "@/hooks/use-now";
import { useMarkets } from "@/lib/web3/hooks";
import { formatToken } from "@/lib/web3/math";
import { CATEGORIES, marketStatus } from "@/lib/web3/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CloutChase — Trade the attention economy on Monad" },
      {
        name: "description",
        content:
          "Predict which posts, creators and trends win the next 24–48 hours. On-chain YES/NO markets settled by an attention oracle on Monad.",
      },
      { property: "og:title", content: "CloutChase — Trade the attention economy on Monad" },
      {
        property: "og:description",
        content:
          "On-chain prediction markets on social attention. Stake CLOUT on YES or NO and get paid automatically when the oracle settles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketsPage,
});

const FILTERS = ["All", "Live", "Awaiting oracle", "Settled"] as const;

function MarketsPage() {
  const now = useNow();
  const { data: markets, isLoading, error } = useMarkets();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [category, setCategory] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return markets.filter((market) => {
      const status = marketStatus(market, now);
      if (filter === "Live" && status !== "live") return false;
      if (filter === "Awaiting oracle" && status !== "closed") return false;
      if (filter === "Settled" && status !== "settled" && status !== "canceled") return false;
      if (category !== null && market.category !== category) return false;
      if (query && !market.subject.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [markets, filter, category, query, now]);

  const volume = markets.reduce((sum, m) => sum + m.yesPool + m.noPool, 0n);
  const liveCount = markets.filter((m) => marketStatus(m, now) === "live").length;

  return (
    <div>
      <section className="hero-surface border-b border-border/70">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-xs uppercase tracking-widest text-primary">
            Live on Monad
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.05] md:text-6xl">
            Trade the attention economy before it peaks.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Every market asks one question: will this post, creator or trend hit its attention
            target in the next 24–48 hours? Stake CLOUT, watch the odds move, get paid on-chain.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="font-semibold">
              <Link to="/create">
                Create a market <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/leaderboard">See top traders</Link>
            </Button>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
            <Stat label="Open markets" value={String(liveCount)} />
            <Stat label="Total staked" value={`${formatToken(volume, 0)}`} />
            <Stat label="Settlement" value="On-chain" />
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={filter === item ? "default" : "secondary"}
                onClick={() => setFilter(item)}
              >
                {item}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((label, index) => (
              <Button
                key={label}
                size="sm"
                variant={category === index ? "default" : "secondary"}
                onClick={() => setCategory(category === index ? null : index)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="relative md:ml-auto md:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search markets"
              className="pl-9"
            />
          </div>
        </div>

        {error && (
          <p className="mt-8 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Couldn&apos;t load markets from Monad: {error.message}
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <MarketCardSkeleton key={i} />)
            : filtered.map((market) => (
                <MarketCard key={market.id.toString()} market={market} now={now} />
              ))}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="panel mt-6 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No markets match this filter yet.
            </p>
            <Button asChild className="mt-4">
              <Link to="/create">Create the first one</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="numeric mt-1 text-xl font-bold">{value}</dd>
    </div>
  );
}
