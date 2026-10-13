import { useState, useEffect } from "react";
import { CheckCircle2, Flame, Shield, TrendingUp, Trophy, UserCheck, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  type CreatorProfile,
  getTierColor,
  isCreatorFollowed,
  toggleFollowCreator,
} from "@/lib/creators/reputation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CreatorProfileDialog({
  creator,
  open,
  onOpenChange,
}: {
  creator: CreatorProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (creator) {
      setFollowing(isCreatorFollowed(creator.handle));
    }
  }, [creator]);

  if (!creator) return null;

  const tierColors = getTierColor(creator.tier);

  const handleToggleFollow = () => {
    const nextState = toggleFollowCreator(creator.handle);
    setFollowing(nextState);
    if (nextState) {
      toast.success(`Now following ${creator.handle}`);
    } else {
      toast.info(`Unfollowed ${creator.handle}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-border/80">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 pb-4 border-b border-border/60">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative size-16 shrink-0 rounded-2xl overflow-hidden border-2 border-primary/30 bg-surface shadow-md">
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  className="size-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {creator.displayName}
                  </h3>
                  {creator.verified && (
                    <CheckCircle2 className="size-4 text-primary fill-primary/20" />
                  )}
                </div>
                <p className="text-xs font-mono text-muted-foreground">{creator.handle}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold uppercase tracking-wider ${tierColors.bg} ${tierColors.text} ${tierColors.border}`}
                  >
                    {creator.tier} Tier
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Clout Score: <span className="font-bold text-foreground">{creator.cloutScore}</span>
                  </span>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant={following ? "secondary" : "default"}
              onClick={handleToggleFollow}
              className="gap-1.5 h-8 text-xs font-semibold shrink-0"
            >
              {following ? (
                <>
                  <UserCheck className="size-3.5 text-primary" /> Following
                </>
              ) : (
                <>
                  <UserPlus className="size-3.5" /> Follow
                </>
              )}
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">{creator.bio}</p>
        </div>

        {/* Performance Metrics Grid */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-xl border border-border/60 bg-surface-2 p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Win Rate
              </span>
              <p className="numeric text-base sm:text-lg font-bold text-foreground mt-0.5">
                {creator.winRate}%
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-surface-2 p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Resolved
              </span>
              <p className="numeric text-base sm:text-lg font-bold text-foreground mt-0.5">
                {creator.marketsWon}/{creator.marketsPlayed}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-surface-2 p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Underdogs
              </span>
              <p className="numeric text-base sm:text-lg font-bold text-primary mt-0.5">
                {creator.contrarianCalls} won
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-surface-2 p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Streak
              </span>
              <p className="numeric text-base sm:text-lg font-bold text-amber-500 mt-0.5">
                {creator.currentStreak} 🔥
              </p>
            </div>
          </div>

          {/* Standout Prediction Highlight */}
          {creator.standoutCall && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-primary">
                  <Flame className="size-3.5" /> Standout Prediction
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {creator.standoutCall.settledDate}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">
                {creator.standoutCall.marketSubject}
              </p>
              <div className="flex items-center gap-3 text-xs">
                <Badge className="bg-yes text-yes-foreground hover:bg-yes text-[10px]">
                  Called {creator.standoutCall.outcome} at {creator.standoutCall.oddsAtCall}% odds
                </Badge>
                <span className="font-semibold text-yes">
                  +{creator.standoutCall.payoutMultiplier}x Payout
                </span>
              </div>
            </div>
          )}

          {/* Badges / Accolades */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
              <Trophy className="size-3.5 text-amber-500" /> Earned Accolades
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {creator.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-surface p-2.5"
                >
                  <span className="text-lg leading-none">{badge.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Address Footnote */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
            <span className="font-mono">{creator.address}</span>
            <span>Joined {creator.joinedDate}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
