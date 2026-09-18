import { useState } from "react";
import { Check, Copy, Download, ExternalLink, Info, Smartphone, Sparkles } from "lucide-react";
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
  getPhantomDeepLink,
  getRainbowDeepLink,
  isAndroid,
  isIOS,
  useMobileWalletModal,
} from "@/lib/web3/mobile-wallet";

export function MobileWalletModal() {
  const { isOpen, close } = useMobileWalletModal();
  const [copied, setCopied] = useState(false);
  const downloadUrls = getDownloadUrls();
  const ios = isIOS();
  const android = isAndroid();
  const platformLabel = ios ? "iOS App Store" : android ? "Google Play Store" : "Mobile App Store";

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("CloutChase URL copied! Paste it in your wallet app's browser.");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenMetaMask = () => {
    const deepLink = getMetaMaskDeepLink();
    window.location.href = deepLink;
  };

  const handleOpenRainbow = () => {
    const deepLink = getRainbowDeepLink();
    window.location.href = deepLink;
  };

  const handleOpenPhantom = () => {
    const deepLink = getPhantomDeepLink();
    window.location.href = deepLink;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-md border-border/80 bg-surface sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Smartphone className="size-5" />
            </span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              Mobile Browser
            </span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Connect with a Wallet App
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Mobile browsers (Safari, Chrome) do not support desktop extensions. To trade on Monad
            Testnet, open CloutChase inside your Web3 wallet app.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* Section 1: Already have the app -> Open via Deep Link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>If you already have a wallet app</span>
              <span className="text-[11px] text-muted-foreground">Tap to launch</span>
            </div>

            <button
              onClick={handleOpenMetaMask}
              className="flex w-full items-center justify-between rounded-xl border border-primary/40 bg-primary/10 p-3.5 text-left transition hover:bg-primary/15"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 font-bold text-sm">
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
                    Opens CloutChase directly in MetaMask&apos;s Web3 browser
                  </p>
                </div>
              </div>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground ml-2" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleOpenRainbow}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-2 p-3 text-left transition hover:bg-surface-2/80"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌈</span>
                  <span className="text-xs font-semibold text-foreground">Rainbow</span>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </button>

              <button
                onClick={handleOpenPhantom}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-2 p-3 text-left transition hover:bg-surface-2/80"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">👻</span>
                  <span className="text-xs font-semibold text-foreground">Phantom</span>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Section 2: Don't have an app -> Download Prompt */}
          <div className="rounded-xl border border-border/70 bg-surface-2/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Don&apos;t have a wallet app yet?
              </span>
              <span className="text-[11px] text-muted-foreground">Free download</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We recommend <strong>MetaMask Mobile</strong>. It is free and supports Monad Testnet:
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
              <span>Or download:</span>
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

          {/* Section 3: Copy Dapp URL option */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>Manual in-app browser access</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Copy this link and paste it into the search bar of your wallet app&apos;s browser tab:
            </p>
            <div className="flex gap-2">
              <div className="flex-1 truncate rounded-lg border border-border/80 bg-background px-3 py-2 text-xs font-mono text-muted-foreground">
                {typeof window !== "undefined" ? window.location.href : "https://cloutchase.xyz"}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0 gap-1.5 text-xs font-medium"
              >
                {copied ? <Check className="size-3.5 text-yes" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Network Info Callout */}
          <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-surface-2/40 p-3 text-[11px] text-muted-foreground">
            <Info className="size-3.5 shrink-0 text-primary mt-0.5" />
            <div>
              <strong className="text-foreground">Monad Testnet parameters:</strong> Chain ID{" "}
              <code>10143</code> · RPC: <code>https://testnet-rpc.monad.xyz</code> · Symbol:{" "}
              <code>MON</code>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
