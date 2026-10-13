import { useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Flame,
  Globe,
  Share2,
  Sparkles,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";
import {
  incrementChallengeProgress,
  type CreatorProfile,
  getCreatorByAddress,
} from "@/lib/creators/reputation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCloutUsd, formatToken } from "@/lib/web3/math";
import { OUTCOME, type Market } from "@/lib/web3/types";

export type SharePredictionData = {
  market: Market;
  side: "YES" | "NO";
  stakeAmount?: bigint;
  oddsAtCall?: number; // e.g. 24 for 24%
  userAddress?: string;
  creatorProfile?: CreatorProfile;
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
  const cardRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const { market, side, stakeAmount, userAddress } = data;
  const creator = data.creatorProfile ?? getCreatorByAddress(userAddress);
  const isSettled = market.settled;
  const isWinner =
    isSettled &&
    ((market.outcome === OUTCOME.Yes && side === "YES") ||
      (market.outcome === OUTCOME.No && side === "NO"));
  const isContrarian = (data.oddsAtCall ?? 50) < 35;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/markets/${market.id.toString()}?ref=${creator.handle.replace("@", "")}`
    : `https://cloutchase.app/markets/${market.id.toString()}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Share link copied to clipboard!");
      incrementChallengeProgress("share_alpha");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleTwitterShare = () => {
    const text = isWinner
      ? `Called it before the crowd on @CloutChase! 🎯\n\n"${market.subject}"\nCalled: ${side} at ${data.oddsAtCall ?? 25}% odds.\n\nVerified on Monad testnet: ${shareUrl}`
      : `I just called ${side} on "${market.subject}" on @CloutChase.\n\nTake the other side on Monad: ${shareUrl}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
    incrementChallengeProgress("share_alpha");
  };

  const handleWarpcastShare = () => {
    const text = `Called ${side} on "${market.subject}" on @CloutChase (Monad Testnet). ${shareUrl}`;
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    incrementChallengeProgress("share_alpha");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CloutChase Prediction: ${market.subject}`,
          text: `Called ${side} on "${market.subject}" on CloutChase`,
          url: shareUrl,
        });
        incrementChallengeProgress("share_alpha");
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  // Canvas Image Generator for PNG download
  const handleDownloadImage = () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scale = 2; // Retina sharpness
      canvas.width = 600 * scale;
      canvas.height = 360 * scale;
      ctx.scale(scale, scale);

      // Background
      const isDark = document.documentElement.classList.contains("dark");
      const bgGrad = ctx.createLinearGradient(0, 0, 600, 360);
      if (isDark) {
        bgGrad.addColorStop(0, "#0b132b");
        bgGrad.addColorStop(0.5, "#111c38");
        bgGrad.addColorStop(1, "#0d1733");
      } else {
        bgGrad.addColorStop(0, "#ffffff");
        bgGrad.addColorStop(0.5, "#f8fafc");
        bgGrad.addColorStop(1, "#eff6ff");
      }
      ctx.fillStyle = bgGrad;
      ctx.roundRect(0, 0, 600, 360, 24);
      ctx.fill();

      // Border
      ctx.lineWidth = 2;
      ctx.strokeStyle = isDark ? "rgba(59, 130, 246, 0.35)" : "rgba(37, 99, 235, 0.25)";
      ctx.stroke();

      // Header Brand
      ctx.fillStyle = isDark ? "#3b82f6" : "#2563eb";
      ctx.font = "bold 16px 'Space Grotesk', sans-serif";
      ctx.fillText("CLOUTCHASE", 36, 48);

      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.font = "12px 'JetBrains Mono', monospace";
      ctx.fillText("MONAD TESTNET · ATTENTION ORACLE", 170, 48);

      // Status Stamp / Headline
      if (isWinner) {
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 13px 'DM Sans', sans-serif";
        ctx.fillText("✓ CALLED IT BEFORE THE CROWD", 36, 92);
      } else if (isContrarian) {
        ctx.fillStyle = isDark ? "#38bdf8" : "#0284c7";
        ctx.font = "bold 13px 'DM Sans', sans-serif";
        ctx.fillText("⚡ CONTRARIAN CALL", 36, 92);
      } else {
        ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
        ctx.font = "bold 13px 'DM Sans', sans-serif";
        ctx.fillText("PREDICTION CALL", 36, 92);
      }

      // Market Question Subject
      ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
      ctx.font = "bold 22px 'Space Grotesk', sans-serif";
      const subject = market.subject.length > 48 ? `${market.subject.slice(0, 45)}…` : market.subject;
      ctx.fillText(subject, 36, 130);

      // Prediction Outcome Pill
      ctx.fillStyle = side === "YES" ? "rgba(16, 185, 129, 0.15)" : "rgba(225, 29, 72, 0.15)";
      ctx.roundRect(36, 160, 160, 44, 12);
      ctx.fill();

      ctx.fillStyle = side === "YES" ? "#10b981" : "#e11d48";
      ctx.font = "bold 20px 'JetBrains Mono', monospace";
      ctx.fillText(`PREDICTED: ${side}`, 50, 189);

      // Odds at Call info
      ctx.fillStyle = isDark ? "#94a3b8" : "#475569";
      ctx.font = "14px 'DM Sans', sans-serif";
      ctx.fillText(
        `Consensus at call: ${data.oddsAtCall ?? 24}% · Clout Tier: ${creator.tier}`,
        215,
        188,
      );

      // Divider
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
      ctx.beginPath();
      ctx.moveTo(36, 240);
      ctx.lineTo(564, 240);
      ctx.stroke();

      // Footer: Creator & Timestamp
      ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
      ctx.font = "bold 15px 'DM Sans', sans-serif";
      ctx.fillText(`${creator.displayName} (${creator.handle})`, 36, 280);

      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.font = "12px 'JetBrains Mono', monospace";
      ctx.fillText(`Clout Score: ${creator.cloutScore} pts · Win Rate: ${creator.winRate}%`, 36, 305);

      ctx.fillStyle = isDark ? "#3b82f6" : "#2563eb";
      ctx.font = "12px 'JetBrains Mono', monospace";
      ctx.fillText("cloutchase.app", 460, 305);

      // Trigger download
      const link = document.createElement("a");
      link.download = `cloutchase-call-${market.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Prediction card image downloaded!");
      incrementChallengeProgress("share_alpha");
    } catch {
      toast.error("Failed to generate image");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-border/80">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Share2 className="size-4 text-primary" /> Share Prediction Card
          </DialogTitle>
        </DialogHeader>

        {/* Visual Prediction Card Container */}
        <div className="px-5">
          <div
            ref={cardRef}
            className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-surface via-surface-2 to-primary/5 p-6 shadow-lg"
          >
            {/* Top Bar: CloutChase & Monad badge */}
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm tracking-tight text-primary">
                  CloutChase
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                  Monad Attention Market
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                #{market.id.toString()}
              </Badge>
            </div>

            {/* Headline Callout */}
            <div className="mt-4">
              {isWinner ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="size-3.5" /> Called it before the crowd
                </div>
              ) : isContrarian ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-bold text-primary">
                  <Flame className="size-3.5" /> Contrarian Call
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                  Prediction Call
                </div>
              )}

              <h3 className="mt-3 text-lg font-bold leading-snug text-foreground">
                {market.subject}
              </h3>
            </div>

            {/* Prediction Position & Odds Box */}
            <div className="mt-4 rounded-xl border border-border/70 bg-surface/80 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  Selected Outcome
                </span>
                <span
                  className={`text-xl font-bold font-mono ${
                    side === "YES" ? "text-yes" : "text-no"
                  }`}
                >
                  {side}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  Crowd Consensus
                </span>
                <span className="text-sm font-semibold text-foreground font-mono">
                  {data.oddsAtCall ?? 24}% at call
                </span>
              </div>
            </div>

            {/* Creator Attribution Footer */}
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  className="size-7 rounded-full border border-border object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{creator.displayName}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{creator.handle}</p>
                </div>
              </div>

              <div className="text-right text-[11px] text-muted-foreground">
                <span className="font-semibold text-primary">{creator.tier}</span> ·{" "}
                <span className="font-bold text-foreground">{creator.cloutScore}</span> Clout
              </div>
            </div>
          </div>
        </div>

        {/* Action Sharing Buttons */}
        <div className="p-5 pt-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTwitterShare}
              className="gap-2 text-xs font-semibold h-10"
            >
              <Twitter className="size-4 text-sky-500" /> Share on X
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWarpcastShare}
              className="gap-2 text-xs font-semibold h-10"
            >
              <Globe className="size-4 text-purple-500" /> Warpcast
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadImage}
              className="gap-2 text-xs font-semibold h-10"
            >
              <Download className="size-4 text-primary" /> Save Image (.png)
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2 text-xs font-semibold h-10"
            >
              {copied ? (
                <>
                  <Check className="size-4 text-white" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="size-4" /> Copy Link
                </>
              )}
            </Button>
          </div>

          <p className="text-[11px] text-center text-muted-foreground">
            Sharing verifies your call and earns +50 Clout Score toward weekly challenges.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
