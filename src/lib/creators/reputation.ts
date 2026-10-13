import type { Address } from "viem";

export type CloutTier = "Scout" | "Analyst" | "Sharp" | "Oracle" | "Grandmaster";

export type CreatorBadgeId =
  | "early_caller"
  | "crowd_challenger"
  | "streak_builder"
  | "category_specialist"
  | "oracle_sage"
  | "high_accuracy";

export type CreatorBadge = {
  id: CreatorBadgeId;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
};

export type StandoutCall = {
  marketId: string;
  marketSubject: string;
  outcome: "YES" | "NO";
  oddsAtCall: number;
  payoutMultiplier: number;
  settledDate: string;
  category: string;
};

/** Profile data is intentionally optional until a verified creator data source exists. */
export type CreatorProfile = {
  address: Address;
  handle: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  cloutScore: number;
  tier: CloutTier;
  winRate: number;
  marketsPlayed: number;
  marketsWon: number;
  contrarianCalls: number;
  currentStreak: number;
  bestStreak: number;
  totalShares: number;
  standoutCall?: StandoutCall;
  badges: CreatorBadge[];
  verified: boolean;
  joinedDate: string;
};

/** Wilson lower bound (95% confidence); low sample sizes receive lower scores. */
export function calculateWilsonScore(wins: number, total: number): number {
  if (!Number.isFinite(wins) || !Number.isFinite(total) || total <= 0) return 0;
  const safeWins = Math.min(Math.max(wins, 0), total);
  const z = 1.95996;
  const p = safeWins / total;
  const z2 = z * z;
  const numerator = p + z2 / (2 * total) - z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);
  return Math.max(0, numerator / (1 + z2 / total));
}

/** Reputation is based on resolved outcomes and streak only, never stake size or volume. */
export function calculateCloutScore(params: {
  wins: number;
  played: number;
  contrarianCalls: number;
  currentStreak: number;
}): number {
  if (params.played < 1) return 0;
  return Math.round(
    calculateWilsonScore(params.wins, params.played) * 1200 +
      Math.min(Math.max(params.contrarianCalls, 0), params.played) * 50 +
      Math.min(Math.max(params.currentStreak, 0), 10) * 20,
  );
}

export function getCloutTier(score: number): CloutTier {
  if (score >= 2000) return "Grandmaster";
  if (score >= 1200) return "Oracle";
  if (score >= 700) return "Sharp";
  if (score >= 300) return "Analyst";
  return "Scout";
}

export function getTierColor(tier: CloutTier): {
  bg: string;
  text: string;
  border: string;
  glow: string;
} {
  switch (tier) {
    case "Grandmaster":
      return {
        bg: "bg-blue-600/15",
        text: "text-blue-500",
        border: "border-blue-500/40",
        glow: "",
      };
    case "Oracle":
      return {
        bg: "bg-indigo-500/15",
        text: "text-indigo-400",
        border: "border-indigo-500/40",
        glow: "",
      };
    case "Sharp":
      return { bg: "bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/40", glow: "" };
    case "Analyst":
      return {
        bg: "bg-cyan-500/15",
        text: "text-cyan-400",
        border: "border-cyan-500/30",
        glow: "",
      };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", glow: "" };
  }
}

// This is a browser-local demo preference, not a server-backed social graph.
const FOLLOWS_STORAGE_KEY = "cloutchase.followed_creators";

export function getFollowedCreators(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FOLLOWS_STORAGE_KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function toggleFollowCreator(handle: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getFollowedCreators();
    const isFollowing = current.includes(handle);
    const updated = isFollowing ? current.filter((item) => item !== handle) : [...current, handle];
    window.localStorage.setItem(FOLLOWS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("cloutchase-follows-updated", { detail: updated }));
    return !isFollowing;
  } catch {
    return false;
  }
}

export function isCreatorFollowed(handle: string): boolean {
  return getFollowedCreators().includes(handle);
}
