import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";

import { WalletButton } from "@/components/wallet-button";

const NAV = [
  { to: "/", label: "Markets" },
  { to: "/create", label: "Create" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/leaderboard", label: "Leaderboard" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-4" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">CloutChase</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-[11px] sm:flex">
            <span className="font-semibold text-primary">2,000 CLOUT</span>
            <span className="text-muted-foreground">=</span>
            <span className="font-semibold text-foreground">1 MON</span>
            <span className="text-muted-foreground">=</span>
            <span className="font-semibold text-yes">$3.00 USD</span>
          </div>
          <WalletButton />
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/70 px-3 py-1.5 md:hidden scrollbar-none">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            activeProps={{ className: "bg-secondary text-foreground font-semibold" }}
            className="whitespace-nowrap rounded-lg px-3.5 py-2 text-xs text-muted-foreground transition-colors min-h-[36px] flex items-center active:scale-95"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
