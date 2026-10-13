import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";

import { CreatorSpotlightSection } from "@/components/creator-spotlight";
import { HeroScene } from "@/components/hero-scene";
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
      <section className="hero-surface relative overflow-hidden border-b border-border/70">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Live on Monad
            </span>
            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Trade attention
              <br />
              before it peaks.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              Will this post, creator or trend hit its target in the next 24–48 hours? Stake CLOUT,
              watch the odds move, get paid on-chain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="font-medium">
                <Link to="/create">
                  Create a market <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="font-medium">
                <Link to="/leaderboard">See top traders</Link>
              </Button>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-2 sm:gap-6 border-t border-border/70 pt-6">
              <Stat label="Open markets" value={String(liveCount)} />
              <Stat label="Total staked" value={`${formatToken(volume, 0)}`} />
              <Stat label="Settlement" value="On-chain" />
            </dl>
          </div>

          <HeroScene className="h-[280px] w-full md:h-[460px]" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-8 pb-2">
        <CreatorSpotlightSection />
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
                className="h-8 text-xs"
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
                className="h-8 text-xs"
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
              className="pl-9 h-10 text-base sm:text-sm"
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
            <p className="text-sm text-muted-foreground">No markets match this filter yet.</p>
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
    <div className="panel p-2.5 sm:p-4 min-w-0">
      <dt className="text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground truncate">
        {label}
      </dt>
      <dd className="numeric mt-1 text-base sm:text-xl font-bold truncate">{value}</dd>
    </div>
  );
}
