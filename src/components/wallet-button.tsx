import { useState } from "react";
import { ArrowDownToLine, Coins, Loader2, LogOut, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";

import { CashoutModal } from "@/components/cashout-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMarketActions, useMonBalance, useTokenBalance, useWallet } from "@/lib/web3/hooks";
import { formatCloutMon, formatCloutUsd, formatToken, shortenAddress } from "@/lib/web3/math";

export function WalletButton() {
  const wallet = useWallet();
  const balance = useTokenBalance(wallet.address);
  const monBalance = useMonBalance(wallet.address);
  const { faucet } = useMarketActions();
  const [busy, setBusy] = useState(false);
  const [cashoutOpen, setCashoutOpen] = useState(false);

  const handleConnect = async (connectorId?: string) => {
    if (wallet.isMobileWithoutWallet && !connectorId) {
      wallet.openMobileWalletModal();
      return;
    }
    setBusy(true);
    try {
      await wallet.connect(connectorId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not connect wallet");
    } finally {
      setBusy(false);
    }
  };

  if (!wallet.isConnected) {
    if (wallet.isMobile) {
      return (
        <Button
          onClick={() => void handleConnect()}
          disabled={busy || wallet.isConnecting}
          className="gap-2 font-semibold"
        >
          {busy || wallet.isConnecting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Wallet className="size-4" />
          )}
          Connect wallet
        </Button>
      );
    }

    const validConnectors = wallet.connectors?.filter(
      (c, idx, arr) => arr.findIndex((x) => x.name === c.name) === idx,
    );

    if (validConnectors && validConnectors.length > 1) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={busy || wallet.isConnecting} className="gap-2 font-semibold">
              {busy || wallet.isConnecting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wallet className="size-4" />
              )}
              Connect wallet
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {validConnectors.map((connector) => (
              <DropdownMenuItem
                key={connector.uid ?? connector.id}
                onClick={() => void handleConnect(connector.id)}
                className="cursor-pointer"
              >
                {connector.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Button
        onClick={() => void handleConnect()}
        disabled={busy || wallet.isConnecting}
        className="gap-2 font-semibold"
      >
        {busy || wallet.isConnecting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Wallet className="size-4" />
        )}
        Connect wallet
      </Button>
    );
  }

  if (wallet.wrongNetwork) {
    return (
      <Button variant="destructive" onClick={() => void wallet.switchToMonad()}>
        Switch to Monad
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="gap-2 px-3 py-1.5 h-auto">
            <div className="flex flex-col items-end leading-tight text-right">
              <div className="flex items-center gap-1.5">
                <span className="numeric font-bold text-primary">{formatToken(balance)} CLOUT</span>
                <span className="numeric text-xs font-semibold text-yes">
                  (${formatCloutUsd(balance)})
                </span>
              </div>
              <span className="numeric text-[11px] text-muted-foreground">
                {shortenAddress(wallet.address ?? "")}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-2">
          {/* Balance Breakdown Header */}
          <div className="rounded-lg bg-surface-2 p-2.5 mb-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">CLOUT Token:</span>
              <span className="numeric font-bold text-foreground">
                {formatToken(balance)} CLOUT
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Worth in USD:</span>
              <span className="numeric font-semibold text-yes">${formatCloutUsd(balance)} USD</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-border/60 pt-1.5">
              <span className="text-muted-foreground">Connected Wallet MON:</span>
              <span className="numeric font-bold text-primary">
                {formatToken(monBalance, 4)} MON
              </span>
            </div>
          </div>

          <DropdownMenuItem
            onClick={() => setCashoutOpen(true)}
            className="cursor-pointer gap-2 font-semibold text-yes focus:text-yes focus:bg-yes/10"
          >
            <ArrowDownToLine className="size-4 text-yes" /> Cash out CLOUT to MON
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={async () => {
              try {
                await faucet();
                toast.success("1,000 CLOUT added to your wallet");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Faucet failed");
              }
            }}
            className="cursor-pointer gap-2"
          >
            <Coins className="size-4" /> Get test CLOUT
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={wallet.disconnect}
            className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          >
            <LogOut className="size-4" /> Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CashoutModal open={cashoutOpen} onOpenChange={setCashoutOpen} />
    </>
  );
}
