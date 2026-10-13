import { useState } from "react";
import { AlertTriangle, ArrowRight, Coins, Loader2, Sparkles, Wallet } from "lucide-react";
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
import {
  useCashoutReserveInfo,
  useMarketActions,
  useMonBalance,
  useTokenBalance,
  useWallet,
} from "@/lib/web3/hooks";
import {
  CLOUT_PER_MON,
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
  const { reserve, isLoading: reserveLoading } = useCashoutReserveInfo();
  const { cashout, fundReserve, status } = useMarketActions();
  const [amount, setAmount] = useState("");
  const [toppingUp, setToppingUp] = useState(false);

  const busy = status === "pending" || status === "confirming" || status === "approving";

  let parsedClout = 0n;
  try {
    parsedClout = amount.trim() ? parseToken(amount.trim()) : 0n;
  } catch {
    parsedClout = 0n;
  }

  const monReceive = cloutToMon(parsedClout);
  const usdValue = cloutToUsd(parsedClout);

  // Maximum CLOUT that can be cashed out given the current reserve
  const maxCloutFromReserve = reserve * CLOUT_PER_MON;

  // Maximum CLOUT the user can actually cash out right now
  const maxAvailableClout = reserveLoading
    ? cloutBalance
    : maxCloutFromReserve < cloutBalance
      ? maxCloutFromReserve
      : cloutBalance;

  const error = !wallet.isConnected
    ? null
    : wallet.wrongNetwork
      ? "Switch to Monad Testnet to cash out"
      : reserveLoading
        ? null
        : reserve === 0n
          ? "The cashout vault has 0 MON remaining. Top up the vault below or wait for liquidity."
          : parsedClout > cloutBalance
            ? "Amount exceeds your CLOUT balance"
            : parsedClout > 0n && parsedClout < 10n ** 18n
              ? "Minimum cashout is 1 CLOUT"
              : parsedClout > 0n && parsedClout > maxCloutFromReserve
                ? `Exceeds contract reserve. Max available: ${formatToken(maxCloutFromReserve)} CLOUT`
                : null;

  async function handleCashout() {
    if (!wallet.isConnected) {
      if (wallet.isMobile) {
        onOpenChange(false);
      }
      await wallet.connect().catch(() => {});
      return;
    }
    if (wallet.wrongNetwork) {
      await wallet.switchToMonad().catch(() => {});
      return;
    }
    if (parsedClout <= 0n || error || reserve === 0n) return;

    try {
      await cashout(parsedClout);
      toast.success(
        `Cashed out ${formatToken(parsedClout)} CLOUT → ${formatCloutMon(parsedClout)} MON ($${formatCloutUsd(parsedClout)}) sent to your wallet!`,
      );
      setAmount("");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cashout failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 sm:p-6 gap-3 sm:gap-4 max-w-md w-full">
        <DialogHeader className="pr-8 text-left">
          <div className="flex items-center gap-2 text-primary">
            <Coins className="size-5 shrink-0" />
            <DialogTitle className="text-lg sm:text-xl font-bold">
              Cash Out to Native MON
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
            Instantly convert your CLOUT tokens to native MON directly in your connected wallet.
          </DialogDescription>
        </DialogHeader>

        {/* Rate Banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
            <span className="font-medium text-muted-foreground">Fixed Conversion Rate</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary w-fit text-[11px] sm:text-xs">
              <Sparkles className="size-3 shrink-0" /> 2,000 CLOUT = 1 MON = $3.00 USD
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Native MON is sent directly to your connected Monad address for free transfer and
            withdrawal.
          </p>
        </div>

        {/* Wrong Network Banner */}
        {wallet.isConnected && wallet.wrongNetwork && (
          <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <span>Connected to wrong network</span>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs font-semibold"
              onClick={() => void wallet.switchToMonad()}
            >
              Switch to Monad
            </Button>
          </div>
        )}

        {/* Reserve Warning */}
        {reserveLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin shrink-0 text-primary" />
            <span>Checking contract reserve…</span>
          </div>
        ) : reserve < 10n ** 18n ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Reserve Alert</p>
                <p className="mt-0.5 text-[11px] text-destructive/90 leading-tight">
                  {reserve === 0n
                    ? "Cashout contract has 0 MON remaining. All reserve liquidity was cashed out. Top up the reserve below to enable conversions."
                    : `Cashout contract reserve is low (${formatToken(reserve, 4)} MON remaining). Cashouts are capped at ${formatToken(maxCloutFromReserve)} CLOUT.`}
                </p>
              </div>
            </div>

            {/* Quick Top-Up for testing */}
            {wallet.isConnected && !wallet.wrongNetwork && (
              <div className="pt-2 border-t border-destructive/20 flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-foreground">
                  Top up vault liquidity directly from your wallet:
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 5].map((mon) => (
                    <Button
                      key={mon}
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy || toppingUp}
                      className="h-7 px-2.5 text-[11px] font-semibold border-primary/30 text-primary hover:bg-primary/10 flex-1"
                      onClick={async () => {
                        setToppingUp(true);
                        try {
                          await fundReserve(BigInt(mon) * 10n ** 18n);
                          toast.success(`Successfully deposited ${mon} MON into cashout vault!`);
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Top-up failed");
                        } finally {
                          setToppingUp(false);
                        }
                      }}
                    >
                      {toppingUp ? <Loader2 className="size-3 animate-spin mr-1" /> : "+"}
                      {mon} MON ({formatToken(BigInt(mon * 2000))} CLOUT)
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="space-y-3">
          {/* Balances Display */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-surface-2 p-2.5 min-w-0">
              <span className="text-[11px] text-muted-foreground block truncate">
                CLOUT in Wallet
              </span>
              <p className="numeric mt-0.5 text-sm sm:text-base font-bold text-foreground truncate">
                {formatToken(cloutBalance)} CLOUT
              </p>
              <p className="numeric text-[11px] text-muted-foreground truncate">
                ≈ {formatCloutMon(cloutBalance)} MON (${formatCloutUsd(cloutBalance)})
              </p>
            </div>
            <div className="rounded-xl bg-surface-2 p-2.5 min-w-0">
              <span className="text-[11px] text-muted-foreground block truncate">
                Native MON in Wallet
              </span>
              <p className="numeric mt-0.5 text-sm sm:text-base font-bold text-primary truncate">
                {formatToken(monBalance, 4)} MON
              </p>
              <p className="numeric text-[11px] text-muted-foreground truncate">
                ≈ ${(Number(formatToken(monBalance, 4)) * 3).toFixed(2)} USD
              </p>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <Label
                htmlFor="cashout-amount"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Amount to Cash Out
              </Label>
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                disabled={reserve === 0n}
                onClick={() => setAmount(formatToken(maxAvailableClout).replace(/,/g, ""))}
              >
                {reserve === 0n
                  ? "Max Available (0 CLOUT - Reserve Empty)"
                  : cloutBalance > maxCloutFromReserve
                    ? `Max Available (${formatToken(maxAvailableClout)})`
                    : `Max (${formatToken(cloutBalance)})`}
              </button>
            </div>
            <div className="relative">
              <Input
                id="cashout-amount"
                inputMode="decimal"
                value={amount}
                disabled={reserve === 0n}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.0"
                className="numeric pr-16 text-base sm:text-lg font-bold h-11"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                CLOUT
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {["500", "1000", "2000"].map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={reserve === 0n}
                  className="text-xs h-9"
                  onClick={() => setAmount(preset)}
                >
                  {preset}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={reserve === 0n}
                className="text-xs h-9 font-semibold text-primary"
                onClick={() => setAmount(formatToken(maxAvailableClout).replace(/,/g, ""))}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Conversion Preview Box */}
          <div className="rounded-xl border border-border bg-card p-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground block">
              You will receive
            </span>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <span className="numeric text-xl sm:text-2xl font-bold text-primary">
                  {monReceive.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                </span>
                <span className="ml-1.5 text-xs sm:text-sm font-semibold text-muted-foreground">
                  MON
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="numeric text-base sm:text-lg font-semibold text-foreground">
                  ${usdValue.toFixed(2)}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">USD</span>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        </div>

        <Button
          onClick={() => void handleCashout()}
          disabled={
            busy ||
            toppingUp ||
            (wallet.isConnected && (parsedClout <= 0n || Boolean(error) || reserve === 0n))
          }
          size="lg"
          className="w-full font-semibold h-12 text-sm sm:text-base mt-1"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin shrink-0" />
              <span className="truncate">
                {status === "approving" ? "Approving CLOUT…" : "Transferring MON to wallet…"}
              </span>
            </>
          ) : !wallet.isConnected ? (
            <>
              <Wallet className="mr-2 size-4 shrink-0" />
              Connect Wallet to Cash Out
            </>
          ) : reserve === 0n ? (
            <>
              <AlertTriangle className="mr-2 size-4 shrink-0 text-destructive" />
              Vault Reserve Empty (0 MON Available)
            </>
          ) : (
            <>
              <span className="truncate">Cash out to Connected Wallet</span>
              <ArrowRight className="ml-2 size-4 shrink-0" />
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
