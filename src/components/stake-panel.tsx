import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { explorerTxUrl } from "@/lib/web3/chains";
import { useMarketActions, useTokenBalance, useWallet } from "@/lib/web3/hooks";
import {
  formatCloutMon,
  formatCloutUsd,
  formatToken,
  parseToken,
  previewPayout,
} from "@/lib/web3/math";
import { marketStatus, type Market } from "@/lib/web3/types";

const QUICK = ["10", "50", "100", "500"];

export function StakePanel({ market, now }: { market: Market; now: number }) {
  const wallet = useWallet();
  const balance = useTokenBalance(wallet.address);
  const { stake, status, hash } = useMarketActions();
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("50");

  const status_ = marketStatus(market, now);
  const parsed = safeParse(amount);
  const payout = previewPayout(market.yesPool, market.noPool, side === "yes", parsed);
  const busy = status === "pending" || status === "confirming" || status === "approving";

  const error =
    parsed > 0n && parsed < 10n ** 18n
      ? "Minimum stake is 1 CLOUT"
      : parsed > balance
        ? "Not enough CLOUT in your wallet"
        : null;

  if (status_ !== "live") {
    return (
      <div className="panel p-5 text-sm text-muted-foreground">
        Staking is closed for this market. Outcomes are settled from the attention oracle.
      </div>
    );
  }

  async function submit() {
    if (!wallet.isConnected) {
      await wallet.connect().catch(() => {});
      return;
    }
    if (error || parsed <= 0n) return;
    try {
      await stake(market.id, side === "yes", parsed);
      toast.success(`Staked ${formatToken(parsed)} CLOUT on ${side.toUpperCase()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transaction failed");
    }
  }

  return (
    <div className="panel space-y-4 p-5">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSide("yes")}
          className={cn(
            "rounded-lg border px-4 py-3 text-left transition-colors",
            side === "yes"
              ? "border-yes bg-yes/15 text-yes"
              : "border-border text-muted-foreground hover:border-yes/50",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="block text-xs uppercase tracking-widest">Yes</span>
            <span className="text-[10px] font-semibold text-yes">
              (${formatCloutUsd(market.yesPool)})
            </span>
          </div>
          <span className="numeric text-lg font-bold">{formatToken(market.yesPool)}</span>
        </button>
        <button
          type="button"
          onClick={() => setSide("no")}
          className={cn(
            "rounded-lg border px-4 py-3 text-left transition-colors",
            side === "no"
              ? "border-no bg-no/15 text-no"
              : "border-border text-muted-foreground hover:border-no/50",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="block text-xs uppercase tracking-widest">No</span>
            <span className="text-[10px] font-semibold text-no">
              (${formatCloutUsd(market.noPool)})
            </span>
          </div>
          <span className="numeric text-lg font-bold">{formatToken(market.noPool)}</span>
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="stake-amount">Stake</Label>
          <div className="flex items-center gap-2">
            {parsed > 0n && (
              <span className="numeric text-xs font-semibold text-yes">
                ≈ {formatCloutMon(parsed)} MON (${formatCloutUsd(parsed)})
              </span>
            )}
            <span className="numeric text-xs text-muted-foreground">
              Bal: {formatToken(balance)}
            </span>
          </div>
        </div>
        <Input
          id="stake-amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          className="numeric text-lg"
        />
        <div className="flex gap-2">
          {QUICK.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setAmount(value)}
            >
              {value}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setAmount(formatToken(balance).replace(/,/g, ""))}
          >
            Max
          </Button>
        </div>
      </div>

      <dl className="space-y-1.5 rounded-lg bg-surface-2 p-3 text-sm">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
          <dt className="text-muted-foreground">Payout if correct</dt>
          <dd className="numeric text-right font-semibold text-primary">
            {formatToken(payout)} CLOUT{" "}
            <span className="text-xs font-bold text-yes">
              (≈ {formatCloutMon(payout)} MON · ${formatCloutUsd(payout)})
            </span>
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Fee (from losing pool)</dt>
          <dd className="numeric">3%</dd>
        </div>
      </dl>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={() => void submit()}
        disabled={busy || Boolean(error)}
        className="w-full font-semibold"
        size="lg"
      >
        {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
        {!wallet.isConnected
          ? "Connect wallet to stake"
          : status === "approving"
            ? "Approving CLOUT…"
            : busy
              ? "Confirming on Monad…"
              : `Stake ${side.toUpperCase()}`}
      </Button>

      {hash && (
        <a
          href={explorerTxUrl(hash)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          View transaction <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}

function safeParse(value: string): bigint {
  try {
    return parseToken(value);
  } catch {
    return 0n;
  }
}
