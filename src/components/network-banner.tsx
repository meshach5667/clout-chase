import { Info } from "lucide-react";

import { isOnChain } from "@/lib/web3/hooks";

/** Tells the user which backend the app is currently talking to. */
export function NetworkBanner() {
  if (isOnChain) return null;
  return (
    <div className="border-b border-border/70 bg-surface-2">
      <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0 text-accent" />
        <span>
          Simulation mode — contract addresses aren&apos;t set yet, so markets settle locally with
          the same rules as the Monad contracts. Deploy and set the addresses to go live.
        </span>
      </p>
    </div>
  );
}
