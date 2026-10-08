import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Info,
  Loader2,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getDownloadUrls,
  getMetaMaskDeepLink,
  isAndroid,
  isIOS,
  useMobileWalletModal,
} from "@/lib/web3/mobile-wallet";
import { useWallet } from "@/lib/web3/hooks";

export function MobileWalletModal() {
  const { isOpen, close } = useMobileWalletModal();
  const wallet = useWallet();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showInAppFallback, setShowInAppFallback] = useState(false);

  const downloadUrls = getDownloadUrls();
  const ios = isIOS();
  const android = isAndroid();
  const platformLabel = ios ? "iOS App Store" : android ? "Google Play Store" : "App Store";

  // Automatically close modal once wallet is connected
  useEffect(() => {
    if (wallet.isConnected && isOpen) {
      setConnectingWallet(null);
      close();
    }
  }, [wallet.isConnected, isOpen, close]);

  const handleConnectMetaMask = async () => {
    setConnectingWallet("metaMask");
    try {
      await wallet.connect("metaMaskSDK");
      toast.success("Wallet connected!");
      close();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/User rejected|cancelled/i.test(msg)) {
        toast.error(msg || "Could not connect to MetaMask");
      }
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleConnectCoinbase = async () => {
    setConnectingWallet("coinbase");
    try {
      await wallet.connect("coinbaseWalletSDK");
      toast.success("Wallet connected!");
      close();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/User rejected|cancelled/i.test(msg)) {
        toast.error(msg || "Could not connect to Coinbase Wallet");
      }
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("CloutChase URL copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenMetaMaskInApp = () => {
    const deepLink = getMetaMaskDeepLink();
    window.location.href = deepLink;
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setConnectingWallet(null);
          close();
        }
      }}
    >
      <DialogContent className="max-w-md border-border/80 bg-surface p-4 sm:p-6">
        <DialogHeader className="space-y-2 text-left pr-8">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Smartphone className="size-5" />
            </span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              Mobile Connect
            </span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Connect your Wallet
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Connect your wallet app to trade on Monad Testnet. Once you approve in your wallet app,
            you will automatically return right back here in your browser.
          </DialogDescription>
        </DialogHeader>

        {connectingWallet ? (
          /* Connecting State */
          <div className="my-4 space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
            <div className="flex justify-center">
              <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Loader2 className="size-7 animate-spin text-primary" />
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-foreground">
                Connecting to {connectingWallet === "metaMask" ? "MetaMask" : "Coinbase Wallet"}…
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed px-2">
                Your wallet app should prompt you to approve the connection. Once approved, you will
                be redirected back to CloutChase in this browser.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConnectingWallet(null)}
                className="text-xs gap-1.5"
              >
                <ArrowLeft className="size-3.5" /> Cancel
              </Button>
              {connectingWallet === "metaMask" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleConnectMetaMask}
                  className="text-xs"
                >
                  Retry App
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2 space-y-4">
            {/* Wallet Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span>Select your wallet</span>
                <span className="text-[11px] text-muted-foreground">Redirects back to browser</span>
              </div>

              {/* MetaMask Option */}
              <button
                onClick={() => void handleConnectMetaMask()}
                disabled={Boolean(connectingWallet)}
                className="flex w-full items-center justify-between rounded-xl border border-primary/40 bg-primary/10 p-3.5 text-left transition hover:bg-primary/15 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-xl font-bold">
                    🦊
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                      MetaMask
                      <span className="inline-flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.2 text-[10px] font-bold text-primary-foreground">
                        <Sparkles className="size-2.5" /> Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Connect via MetaMask app &amp; return to browser
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                  Connect
                </span>
              </button>

              {/* Coinbase Wallet Option */}
              <button
                onClick={() => void handleConnectCoinbase()}
                disabled={Boolean(connectingWallet)}
                className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-surface-2 p-3.5 text-left transition hover:bg-surface-2/80 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-xl font-bold">
                    🔵
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">Coinbase Wallet</div>
                    <p className="text-[11px] text-muted-foreground">
                      Connect via Coinbase app &amp; return to browser
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">
                  Connect
                </span>
              </button>
            </div>

            {/* Download Prompt */}
            <div className="rounded-xl border border-border/70 bg-surface-2/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Don&apos;t have a wallet app?
                </span>
                <span className="text-[11px] text-muted-foreground">Free install</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Install <strong>MetaMask Mobile</strong> to trade on Monad Testnet:
              </p>

              <Button asChild variant="default" className="w-full gap-2 font-medium">
                <a
                  href={downloadUrls.metaMask}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center"
                >
                  <Download className="size-4" />
                  Download MetaMask from {platformLabel}
                </a>
              </Button>

              <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-muted-foreground">
                <span>Or get:</span>
                <a
                  href={downloadUrls.coinbase}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-foreground inline-flex items-center gap-0.5"
                >
                  Coinbase <ExternalLink className="size-2.5" />
                </a>
                <span>·</span>
                <a
                  href={downloadUrls.rainbow}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-foreground inline-flex items-center gap-0.5"
                >
                  Rainbow <ExternalLink className="size-2.5" />
                </a>
                <span>·</span>
                <a
                  href={downloadUrls.phantom}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-foreground inline-flex items-center gap-0.5"
                >
                  Phantom <ExternalLink className="size-2.5" />
                </a>
              </div>
            </div>

            {/* In-App Browser Fallback Accordion/Toggle */}
            <div className="space-y-2 pt-1 border-t border-border/50">
              <button
                type="button"
                onClick={() => setShowInAppFallback(!showInAppFallback)}
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                {showInAppFallback
                  ? "Hide advanced options"
                  : "Having trouble redirecting? Click here"}
              </button>

              {showInAppFallback && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground">
                      Alternatively, open CloutChase directly in MetaMask&apos;s internal browser:
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenMetaMaskInApp}
                      className="w-full text-xs gap-1.5"
                    >
                      Open inside MetaMask In-App Browser <ExternalLink className="size-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground">Or copy the link manually:</p>
                    <div className="flex gap-2">
                      <div className="flex-1 truncate rounded-lg border border-border/80 bg-background px-3 py-2 text-xs font-mono text-muted-foreground">
                        {typeof window !== "undefined"
                          ? window.location.href
                          : "https://cloutchase.xyz"}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopyLink}
                        className="shrink-0 gap-1.5 text-xs font-medium"
                      >
                        {copied ? (
                          <Check className="size-3.5 text-yes" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Network Info */}
            <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-surface-2/40 p-3 text-[11px] text-muted-foreground">
              <Info className="size-3.5 shrink-0 text-primary mt-0.5" />
              <div>
                <strong className="text-foreground">Monad Testnet:</strong> Chain ID{" "}
                <code>10143</code> · RPC: <code>https://testnet-rpc.monad.xyz</code> · Symbol:{" "}
                <code>MON</code>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
