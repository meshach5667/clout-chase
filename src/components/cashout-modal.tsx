import { useState } from "react";
import { ArrowRight, Coins, DollarSign, Loader2, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMarketActions, useMonBalance, useTokenBalance, useWallet } from "@/lib/web3/hooks";
import {
  cloutToMon,
  cloutToUsd,
  formatCloutMon,
  formatCloutUsd,
  formatToken,
  parseToken,
} from "@/lib/web3/math";

export function CashoutModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const wallet = useWallet();
  const cloutBalance = useTokenBalance(wallet.address);
  const monBalance = useMonBalance(wallet.address);
  const { cashout, status } = useMarketActions();
  const [amount, setAmount] = useState("");

  const busy = status === "pending" || status === "confirming" || status === "approving";

  let parsedClout = 0n;
  try {
    parsedClout = amount.trim() ? parseToken(amount.trim()) : 0n;
  } catch {
    parsedClout = 0n;
  }

  const monReceive = cloutToMon(parsedClout);
  const usdValue = cloutToUsd(parsedClout);

  const error =
    parsedClout > cloutBalance
      ? "Amount exceeds your CLOUT balance"
      : parsedClout > 0n && parsedClout < 10n ** 18n
        ? "Minimum cashout is 1 CLOUT"
        : null;

  async function handleCashout() {
    if (!wallet.isConnected) {
      await wallet.connect().catch(() => {});
      return;
    }
    if (parsedClout <= 0n || error) return;

    try {
      await cashout(parsedClout);
      toast.success(
        `Successfully cashed out ${formatToken(parsedClout)} CLOUT! ${formatCloutMon(parsedClout)} MON ($${formatCloutUsd(parsedClout)}) sent to your wallet.`,
      );
      setAmount("");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cashout failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Coins className="size-5" />
            <DialogTitle className="text-xl">Cash Out to Native MON</DialogTitle>
          </div>
          <DialogDescription>
            Instantly convert your CLOUT tokens to native MON directly in your connected wallet.
          </DialogDescription>
        </DialogHeader>

        {/* Rate Banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Fixed Conversion Rate</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
              <Sparkles className="size-3" /> 2,000 CLOUT = 1 MON = $3.00 USD
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            MON is sent directly to your connected Web3 address on Monad Testnet so you can withdraw
            freely.
          </p>
        </div>

        <div className="space-y-4 py-2">
          {/* Balances Display */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-surface-2 p-2.5">
              <span className="text-muted-foreground">CLOUT in Wallet</span>
              <p className="numeric mt-0.5 font-bold text-foreground">
                {formatToken(cloutBalance)} CLOUT
              </p>
              <p className="numeric text-[11px] text-muted-foreground">
                ≈ {formatCloutMon(cloutBalance)} MON (${formatCloutUsd(cloutBalance)})
              </p>
            </div>
            <div className="rounded-lg bg-surface-2 p-2.5">
              <span className="text-muted-foreground">Native MON in Wallet</span>
              <p className="numeric mt-0.5 font-bold text-primary">
                {formatToken(monBalance, 4)} MON
              </p>
              <p className="numeric text-[11px] text-muted-foreground">
                ≈ ${(Number(formatToken(monBalance, 4)) * 3).toFixed(2)} USD
              </p>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="cashout-amount"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Amount to cash out
              </Label>
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline"
                onClick={() => setAmount(formatToken(cloutBalance).replace(/,/g, ""))}
              >
                Max ({formatToken(cloutBalance)})
              </button>
            </div>
            <div className="relative">
              <Input
                id="cashout-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.0"
                className="numeric pr-16 text-lg font-bold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                CLOUT
              </span>
            </div>
            <div className="flex gap-2">
              {["500", "1000", "2000"].map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => setAmount(preset)}
                >
                  {preset}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setAmount(formatToken(cloutBalance).replace(/,/g, ""))}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Conversion Preview Box */}
          <div className="rounded-xl border border-border bg-card p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              You will receive
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="numeric text-2xl font-bold text-primary">
                  {monReceive.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                </span>
                <span className="ml-1.5 text-sm font-semibold text-muted-foreground">MON</span>
              </div>
              <div className="text-right">
                <span className="numeric text-lg font-semibold text-foreground">
                  ${usdValue.toFixed(2)}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">USD</span>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <Button
          onClick={() => void handleCashout()}
          disabled={busy || parsedClout <= 0n || Boolean(error)}
          size="lg"
          className="w-full font-semibold"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {status === "approving" ? "Approving CLOUT…" : "Transferring MON to your wallet…"}
            </>
          ) : (
            <>
              Cash out to Connected Wallet <ArrowRight className="ml-2 size-4" />
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
