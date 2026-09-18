import { useState } from "react";
import { Loader2, LogOut, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMarketActions, useTokenBalance, useWallet } from "@/lib/web3/hooks";
import { formatToken, shortenAddress } from "@/lib/web3/math";

export function WalletButton() {
  const wallet = useWallet();
  const balance = useTokenBalance(wallet.address);
  const { faucet } = useMarketActions();
  const [busy, setBusy] = useState(false);

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <span className="numeric hidden text-primary sm:inline">
            {formatToken(balance)} CLOUT
          </span>
          <span className="numeric">{shortenAddress(wallet.address ?? "")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={async () => {
            try {
              await faucet();
              toast.success("1,000 CLOUT added to your wallet");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Faucet failed");
            }
          }}
        >
          Get test CLOUT
        </DropdownMenuItem>
        <DropdownMenuItem onClick={wallet.disconnect} className="gap-2">
          <LogOut className="size-4" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
