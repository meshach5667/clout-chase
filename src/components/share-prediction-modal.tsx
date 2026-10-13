import { useState } from "react";
import { Check, Copy, Download, ExternalLink, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OUTCOME, type Market } from "@/lib/web3/types";
import { shortenAddress } from "@/lib/web3/math";

export type SharePredictionData = {
  market: Market;
  side: "YES" | "NO";
  userAddress?: string | undefined;
};

export function SharePredictionModal({
  data,
  open,
  onOpenChange,
}: {
  data: SharePredictionData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!data) return null;

  const { market, side, userAddress } = data;
  const resolvedSide =
    market.outcome === OUTCOME.Yes
      ? "YES"
      : market.outcome === OUTCOME.No
        ? "NO"
        : market.outcome === OUTCOME.Canceled
          ? "Canceled"
          : null;
  const isCorrect = market.settled && resolvedSide === side;
  const isIncorrect =
    market.settled && (resolvedSide === "YES" || resolvedSide === "NO") && resolvedSide !== side;
  const origin = typeof window === "undefined" ? "https://cloutchase.app" : window.location.origin;
  const shareUrl = `${origin}/markets/${market.id.toString()}`;
  const status =
    market.settled && resolvedSide === "Canceled"
      ? "Canceled market"
      : isCorrect
        ? "Correct position"
        : isIncorrect
          ? "Incorrect position"
          : "Unresolved market";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success("Market link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareTo = (platform: "x" | "warpcast") => {
    const text = `${side} position on “${market.subject}” — ${status}.`;
    const url =
      platform === "x"
        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text} ${shareUrl}`)}`
        : `https://warpcast.com/~/compose?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadCard = () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      toast.error("Could not create the image");
      return;
    }
    const scale = 2;
    canvas.width = 1200;
    canvas.height = 720;
    context.scale(scale, scale);
    const dark = document.documentElement.classList.contains("dark");
    context.fillStyle = dark ? "#111c38" : "#ffffff";
    context.fillRect(0, 0, 600, 360);
    context.strokeStyle = dark ? "#35517f" : "#bfdbfe";
    context.lineWidth = 2;
    context.strokeRect(1, 1, 598, 358);
    context.fillStyle = dark ? "#60a5fa" : "#2563eb";
    context.font = "bold 17px sans-serif";
    context.fillText("CLOUTCHASE · MONAD MARKET", 32, 42);
    context.fillStyle = dark ? "#f8fafc" : "#0f172a";
    context.font = "bold 25px sans-serif";
    const subject = market.subject.length > 52 ? `${market.subject.slice(0, 49)}…` : market.subject;
    context.fillText(subject, 32, 104, 536);
    context.fillStyle = side === "YES" ? "#2563eb" : "#475569";
    context.font = "bold 32px sans-serif";
    context.fillText(`POSITION: ${side}`, 32, 174);
    context.fillStyle = dark ? "#cbd5e1" : "#475569";
    context.font = "17px sans-serif";
    context.fillText(`Market result: ${resolvedSide ?? "Pending"}`, 32, 222);
    context.fillText(`Status: ${status}`, 32, 252);
    context.fillText(
      `Wallet: ${userAddress ? shortenAddress(userAddress) : "Not connected"}`,
      32,
      282,
    );
    context.fillStyle = dark ? "#94a3b8" : "#64748b";
    context.font = "14px sans-serif";
    context.fillText(shareUrl, 32, 326, 536);
    const link = document.createElement("a");
    link.download = `cloutchase-market-${market.id.toString()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Market card downloaded");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden border-border/80 p-0">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Share2 className="size-4 text-primary" /> Share market position
          </DialogTitle>
        </DialogHeader>

        <div className="px-5">
          <div className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-surface via-surface-2 to-primary/5 p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <span className="text-sm font-bold text-primary">
                CloutChase · Monad Attention Market
              </span>
              <Badge variant="outline" className="border-primary/30 font-mono text-primary">
                #{market.id.toString()}
              </Badge>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="rounded-full border border-border bg-muted px-2.5 py-1">
                {status}
              </span>
              {resolvedSide && <span>Verified outcome: {resolvedSide}</span>}
            </div>
            <h3 className="mt-3 text-lg font-bold leading-snug text-foreground">
              {market.subject}
            </h3>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border/70 bg-surface/80 p-3.5">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Position
                </span>
                <span
                  className={`font-mono text-xl font-bold ${side === "YES" ? "text-yes" : "text-no"}`}
                >
                  {side}
                </span>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <span className="block">Wallet</span>
                <span className="font-mono text-foreground">
                  {userAddress ? shortenAddress(userAddress) : "Not connected"}
                </span>
              </div>
            </div>
            <a
              href={shareUrl}
              className="mt-4 flex items-center gap-1.5 truncate border-t border-border/60 pt-3 text-xs text-primary"
            >
              {shareUrl} <ExternalLink className="size-3 shrink-0" />
            </a>
          </div>
        </div>

        <div className="space-y-2.5 p-5 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareTo("x")}
              className="gap-2 text-xs font-semibold"
            >
              <Twitter className="size-4 text-sky-500" /> Share on X
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareTo("warpcast")}
              className="gap-2 text-xs font-semibold"
            >
              Share on Warpcast
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={downloadCard}
              className="gap-2 text-xs font-semibold"
            >
              <Download className="size-4 text-primary" /> Save image (.png)
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2 text-xs font-semibold"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            The result appears only after market settlement. Sharing does not change reputation or
            rewards.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
