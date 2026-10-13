import { Link } from "@tanstack/react-router";

import { WalletButton } from "@/components/wallet-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsMenu } from "@/components/notifications-menu";

const NAV = [
  { to: "/", label: "Markets" },
  { to: "/create", label: "Create" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/leaderboard", label: "Leaderboard" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img
            src="/csLogo.png"
            alt="CloutChase"
            className="h-7 w-auto max-w-[120px] rounded-md bg-white px-1 object-contain sm:h-8 sm:max-w-[145px]"
          />
        </Link>

        <nav className="ml-1 hidden items-center gap-0.5 lg:flex xl:ml-2 xl:gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground xl:px-3 xl:text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-[11px] xl:flex">
            <span className="font-semibold text-primary">2,000 CLOUT</span>
            <span className="text-muted-foreground">=</span>
            <span className="font-semibold text-foreground">1 MON</span>
            <span className="text-muted-foreground">=</span>
            <span className="font-semibold text-yes">$3.00 USD</span>
          </div>
          <NotificationsMenu />
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>

      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-1 border-t border-border/70 px-2 py-1.5 lg:hidden sm:px-3">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            activeProps={{ className: "bg-secondary text-foreground font-semibold" }}
            className="flex min-h-9 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-1.5 py-2 text-[11px] text-muted-foreground transition-colors active:scale-95 sm:flex-none sm:px-3 sm:text-xs"
          >
            {item.label === "Leaderboard" ? (
              <>
                <span className="sm:hidden">Ranks</span>
                <span className="hidden sm:inline">Leaderboard</span>
              </>
            ) : (
              item.label
            )}
          </Link>
        ))}
      </nav>
    </header>
  );
}
