import { useState } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Flame,
  History,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCreatorOfDay,
  getCreatorOfWeek,
  getTierColor,
  HISTORICAL_SPOTLIGHTS,
  isCreatorFollowed,
  toggleFollowCreator,
  type CreatorProfile,
  type HistoricalSpotlight,
} from "@/lib/creators/reputation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreatorProfileDialog } from "@/components/creator-profile-dialog";

export function CreatorSpotlightSection() {
  const dayCreator = getCreatorOfDay();
  const weekCreator = getCreatorOfWeek();

  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dayFollowed, setDayFollowed] = useState(() => isCreatorFollowed(dayCreator.handle));
  const [weekFollowed, setWeekFollowed] = useState(() => isCreatorFollowed(weekCreator.handle));

  const handleFollowToggle = (creator: CreatorProfile, isDay: boolean) => {
    const next = toggleFollowCreator(creator.handle);
    if (isDay) setDayFollowed(next);
    else setWeekFollowed(next);
    toast.success(next ? `Following ${creator.handle}` : `Unfollowed ${creator.handle}`);
  };

  const weekTier = getTierColor(weekCreator.tier);
  const dayTier = getTierColor(dayCreator.tier);

  return (
    <div className="space-y-4">
      {/* Creator of the Week Banner — Elegant Subtle Blue Gradient */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-surface to-surface-2 p-5 sm:p-6 shadow-sm">
        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-primary/10 blur-3xl" />

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start sm:items-center gap-4">
            <button
              onClick={() => setSelectedCreator(weekCreator)}
              className="group relative size-16 sm:size-20 shrink-0 rounded-2xl overflow-hidden border-2 border-primary/40 bg-surface shadow-md transition-transform hover:scale-105"
            >
              <img
                src={weekCreator.avatarUrl}
                alt={weekCreator.displayName}
                className="size-full object-cover"
              />
              <span className="absolute bottom-0 inset-x-0 bg-primary/90 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground text-center">
                Week 41
              </span>
            </button>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Award className="size-3" /> Creator of the Week
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase tracking-wider ${weekTier.bg} ${weekTier.text} ${weekTier.border}`}
                >
                  {weekCreator.tier} Tier · {weekCreator.cloutScore} Clout
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCreator(weekCreator)}
                  className="text-lg sm:text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors text-left"
                >
                  {weekCreator.displayName}
                </button>
                <span className="text-xs font-mono text-muted-foreground">{weekCreator.handle}</span>
                {weekCreator.verified && (
                  <CheckCircle2 className="size-4 text-primary fill-primary/20 shrink-0" />
                )}
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-snug line-clamp-2 max-w-2xl">
                {weekCreator.weeklyAchievement}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 ml-auto md:ml-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="gap-1.5 text-xs h-9"
              title="View past spotlight winners"
            >
              <History className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Past Winners</span>
            </Button>
            <Button
              variant={weekFollowed ? "secondary" : "default"}
              size="sm"
              onClick={() => handleFollowToggle(weekCreator, false)}
              className="gap-1.5 text-xs font-semibold h-9"
            >
              {weekFollowed ? (
                <>
                  <UserCheck className="size-3.5 text-primary" /> Following
                </>
              ) : (
                <>
                  <UserPlus className="size-3.5" /> Follow
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedCreator(weekCreator)}
              className="text-xs gap-1 h-9"
            >
              Profile <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Creator of the Day & Standout Alpha Grid */}
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        {/* Creator of the Day Card */}
        <div className="panel relative overflow-hidden p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" /> Creator of the Day
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">Today&apos;s Spotlight</span>
            </div>

            <div className="flex items-start gap-3.5">
              <button
                onClick={() => setSelectedCreator(dayCreator)}
                className="size-13 shrink-0 rounded-xl overflow-hidden border border-border bg-surface shadow transition-transform hover:scale-105"
              >
                <img
                  src={dayCreator.avatarUrl}
                  alt={dayCreator.displayName}
                  className="size-full object-cover"
                />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedCreator(dayCreator)}
                    className="font-bold text-sm hover:text-primary transition-colors truncate"
                  >
                    {dayCreator.displayName}
                  </button>
                  <span className="text-xs text-muted-foreground font-mono">{dayCreator.handle}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase tracking-wider py-0 ${dayTier.bg} ${dayTier.text} ${dayTier.border}`}
                  >
                    {dayCreator.tier}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    Accuracy: <strong className="text-foreground">{dayCreator.winRate}%</strong> ({dayCreator.marketsWon}/{dayCreator.marketsPlayed})
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant={dayFollowed ? "secondary" : "outline"}
                onClick={() => handleFollowToggle(dayCreator, true)}
                className="h-7 text-xs px-2.5 shrink-0"
              >
                {dayFollowed ? "Following" : "+ Follow"}
              </Button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              {dayCreator.spotlightReason}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Flame className="size-3.5 text-amber-500" />
              Streak: <strong className="text-foreground">{dayCreator.currentStreak} wins</strong>
            </span>
            <button
              onClick={() => setSelectedCreator(dayCreator)}
              className="text-primary hover:underline font-medium text-xs inline-flex items-center gap-1"
            >
              View track record <ChevronRight className="size-3" />
            </button>
          </div>
        </div>

        {/* Transparent Selection Integrity Box */}
        <div className="panel p-5 flex flex-col justify-between bg-surface-2/60">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <TrendingUp className="size-3.5 text-primary" /> Selection Integrity
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Spotlights are earned, never sponsored. Creators are evaluated using an on-chain{" "}
              <strong className="text-foreground">Wilson Score Lower Bound</strong> formula requiring a
              minimum of 5 resolved predictions, heavily weighting contrarian calls made against the crowd.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Audit trail verified</span>
            <span className="font-mono text-primary">Algorithm v1.2</span>
          </div>
        </div>
      </div>

      {/* Historical Winners Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="size-5 text-primary" /> Past Spotlight Honorees
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Historical record of verified top forecasters. Spotlights cannot be purchased or deleted.
          </p>

          <div className="mt-3 divide-y divide-border/60 max-h-80 overflow-y-auto pr-1">
            {HISTORICAL_SPOTLIGHTS.map((item) => (
              <div key={item.id} className="py-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{item.displayName} ({item.creatorHandle})</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {item.period}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.headline}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>Accuracy: <strong className="text-foreground">{item.winRate}%</strong></span>
                  <span>Sample: <strong className="text-foreground">{item.resolvedCount} calls</strong></span>
                  <span>Clout: <strong className="text-primary">{item.cloutScore}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <CreatorProfileDialog
        creator={selectedCreator}
        open={Boolean(selectedCreator)}
        onOpenChange={(open) => !open && setSelectedCreator(null)}
      />
    </div>
  );
}
