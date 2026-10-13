import type { Address } from "viem";
import type { Market } from "@/lib/web3/types";

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
  oddsAtCall: number; // e.g. 18% (underdog odds)
  payoutMultiplier: number; // e.g. 4.2x
  settledDate: string;
  category: string;
};

export type CreatorProfile = {
  address: Address;
  handle: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  cloutScore: number;
  tier: CloutTier;
  winRate: number; // 0 - 100 percentage
  marketsPlayed: number;
  marketsWon: number;
  contrarianCalls: number;
  currentStreak: number;
  bestStreak: number;
  totalShares: number;
  standoutCall?: StandoutCall;
  badges: CreatorBadge[];
  verified: boolean;
  isCreatorOfDay?: boolean;
  isCreatorOfWeek?: boolean;
  spotlightReason?: string;
  weeklyAchievement?: string;
  joinedDate: string;
};

export type HistoricalSpotlight = {
  id: string;
  type: "day" | "week";
  period: string;
  creatorHandle: string;
  displayName: string;
  cloutScore: number;
  headline: string;
  reason: string;
  winRate: number;
  resolvedCount: number;
};

export type CommunityChallenge = {
  id: string;
  title: string;
  description: string;
  rewardClout: number;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  category: "Accuracy" | "Contrarian" | "Social" | "Streak";
};

// ------------------------------------------------------------------ Wilson Score Formula
/**
 * Computes Wilson Score Interval Lower Bound (95% confidence).
 * Ensures a 4/4 record doesn't outrank a 40/45 record.
 */
export function calculateWilsonScore(wins: number, total: number): number {
  if (total === 0) return 0;
  const z = 1.95996; // 95% confidence
  const p = wins / total;
  const n = total;
  const numerator =
    p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  const denominator = 1 + (z * z) / n;
  return Math.max(0, numerator / denominator);
}

/**
 * Skill-based Clout Score:
 * Wilson Score lower bound base + contrarian call bonus + streak bonus.
 * Completely separate from wallet balance and token volume.
 */
export function calculateCloutScore(params: {
  wins: number;
  played: number;
  contrarianCalls: number;
  currentStreak: number;
}): number {
  if (params.played === 0) return 0;
  const wilson = calculateWilsonScore(params.wins, params.played);
  const basePoints = Math.round(wilson * 1200);
  const contrarianBonus = params.contrarianCalls * 75;
  const streakBonus = Math.min(params.currentStreak, 10) * 35;
  const volumeBonus = Math.min(params.played, 50) * 8;
  return Math.max(50, basePoints + contrarianBonus + streakBonus + volumeBonus);
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
        glow: "shadow-[0_0_15px_rgba(59,130,246,0.35)]",
      };
    case "Oracle":
      return {
        bg: "bg-indigo-500/15",
        text: "text-indigo-400",
        border: "border-indigo-500/40",
        glow: "shadow-[0_0_12px_rgba(99,102,241,0.25)]",
      };
    case "Sharp":
      return {
        bg: "bg-sky-500/15",
        text: "text-sky-400",
        border: "border-sky-500/40",
        glow: "shadow-[0_0_8px_rgba(14,165,233,0.2)]",
      };
    case "Analyst":
      return {
        bg: "bg-cyan-500/15",
        text: "text-cyan-400",
        border: "border-cyan-500/30",
        glow: "",
      };
    case "Scout":
    default:
      return {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border",
        glow: "",
      };
  }
}

// ------------------------------------------------------------------ Pre-configured / Seeded Creators
export const SEED_CREATORS: CreatorProfile[] = [
  {
    address: "0x9A3f8b21C7e04D5f6B8a2C1d0E9f4A7b3C5d6E80",
    handle: "@mesh",
    displayName: "Mesh",
    avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=mesh_monad",
    bio: "Deep attention analyst & contrarian forecaster on Monad testnet. Tracking virality signals before the crowd arrives.",
    cloutScore: 1840,
    tier: "Oracle",
    winRate: 82,
    marketsPlayed: 28,
    marketsWon: 23,
    contrarianCalls: 7,
    currentStreak: 6,
    bestStreak: 9,
    totalShares: 142,
    verified: true,
    isCreatorOfWeek: true,
    weeklyAchievement:
      "12 of 15 resolved predictions correct this week, with three high-confidence calls beating the crowd consensus.",
    spotlightReason:
      "Called YES on #MonadSzn early against 82% crowd consensus, netting a 4.1x pool return.",
    standoutCall: {
      marketId: "3",
      marketSubject: "#MonadSzn attention explosion",
      outcome: "YES",
      oddsAtCall: 18,
      payoutMultiplier: 4.1,
      settledDate: "Yesterday",
      category: "Trend",
    },
    badges: [
      {
        id: "early_caller",
        name: "Early Caller",
        description: "Staked position when pool was under 20% total volume",
        icon: "⚡",
        unlockedAt: "2026-10-01",
      },
      {
        id: "crowd_challenger",
        name: "Crowd Challenger",
        description: "Won a prediction where crowd odds were under 30%",
        icon: "🎯",
        unlockedAt: "2026-10-05",
      },
      {
        id: "streak_builder",
        name: "Streak Builder",
        description: "Achieved 5+ consecutive winning market calls",
        icon: "🔥",
        unlockedAt: "2026-10-09",
      },
      {
        id: "oracle_sage",
        name: "Oracle Tier",
        description: "Surpassed 1,200 Clout Score points",
        icon: "👁️",
        unlockedAt: "2026-10-11",
      },
    ],
    joinedDate: "Sept 2026",
  },
  {
    address: "0x2b71E4a09Cf3D68B15aE7c9D4f2A8b6C0d1E3F42",
    handle: "@zoravibes",
    displayName: "Zora Vibes",
    avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=zoravibes",
    bio: "Curating creator momentum & viral media drops across Monad & Zora ecosystems.",
    cloutScore: 1460,
    tier: "Oracle",
    winRate: 75,
    marketsPlayed: 24,
    marketsWon: 18,
    contrarianCalls: 5,
    currentStreak: 4,
    bestStreak: 6,
    totalShares: 89,
    verified: true,
    isCreatorOfDay: true,
    spotlightReason:
      "Called the exact timing on @luna.codes thread hitting 40k reach before the oracle window closed.",
    standoutCall: {
      marketId: "4",
      marketSubject: "@luna.codes rewrite thread reach",
      outcome: "YES",
      oddsAtCall: 24,
      payoutMultiplier: 3.4,
      settledDate: "12h ago",
      category: "Post",
    },
    badges: [
      {
        id: "crowd_challenger",
        name: "Crowd Challenger",
        description: "Won against heavy crowd odds (<30%)",
        icon: "🎯",
        unlockedAt: "2026-10-03",
      },
      {
        id: "category_specialist",
        name: "Post Specialist",
        description: "Over 80% accuracy in Post attention markets",
        icon: "💎",
        unlockedAt: "2026-10-08",
      },
      {
        id: "high_accuracy",
        name: "High Accuracy",
        description: "75%+ win rate across 20+ resolved markets",
        icon: "🎖️",
        unlockedAt: "2026-10-12",
      },
    ],
    joinedDate: "Sept 2026",
  },
  {
    address: "0x7Cd1F0a8B6e94C25D3f7A1b0C8e2D4f6A9b3C5d7",
    handle: "@0xchef",
    displayName: "Chef G",
    avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=0xchef_alpha",
    bio: "Cooking high-signal trend analyses. Quantitative social metrics & liquidity movements.",
    cloutScore: 1120,
    tier: "Sharp",
    winRate: 71,
    marketsPlayed: 21,
    marketsWon: 15,
    contrarianCalls: 4,
    currentStreak: 2,
    bestStreak: 5,
    totalShares: 64,
    verified: false,
    standoutCall: {
      marketId: "2",
      marketSubject: "@0xchef 90k attention surge",
      outcome: "NO",
      oddsAtCall: 28,
      payoutMultiplier: 2.8,
      settledDate: "2 days ago",
      category: "Creator",
    },
    badges: [
      {
        id: "early_caller",
        name: "Early Caller",
        description: "Early market entrant",
        icon: "⚡",
        unlockedAt: "2026-10-04",
      },
      {
        id: "streak_builder",
        name: "Streak Builder",
        description: "3+ consecutive winning calls",
        icon: "🔥",
        unlockedAt: "2026-10-07",
      },
    ],
    joinedDate: "Oct 2026",
  },
  {
    address: "0x5E8c2A4b7D019F36c8B1e5A0d7F2c9B4a6E3d8C1",
    handle: "@monad_whale",
    displayName: "Monad Whale",
    avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=monad_whale",
    bio: "High stakes macro trend tracker. If it's trending on Monad, I've already taken a position.",
    cloutScore: 880,
    tier: "Sharp",
    winRate: 65,
    marketsPlayed: 19,
    marketsWon: 12,
    contrarianCalls: 3,
    currentStreak: 1,
    bestStreak: 4,
    totalShares: 41,
    verified: true,
    standoutCall: {
      marketId: "5",
      marketSubject: "#DeadInternetTheory peak",
      outcome: "NO",
      oddsAtCall: 35,
      payoutMultiplier: 2.4,
      settledDate: "3 days ago",
      category: "Trend",
    },
    badges: [
      {
        id: "early_caller",
        name: "Early Caller",
        description: "Early position maker",
        icon: "⚡",
        unlockedAt: "2026-10-06",
      },
    ],
    joinedDate: "Oct 2026",
  },
];

// ------------------------------------------------------------------ Historical Spotlight Winners
export const HISTORICAL_SPOTLIGHTS: HistoricalSpotlight[] = [
  {
    id: "spotlight-w-41",
    type: "week",
    period: "Week 41 · Oct 6–12, 2026",
    creatorHandle: "@mesh",
    displayName: "Mesh",
    cloutScore: 1840,
    headline: "12 of 15 predictions correct with 3 underdog wins",
    reason: "Consistent crowd-beating calls across Trend and Post categories.",
    winRate: 82,
    resolvedCount: 28,
  },
  {
    id: "spotlight-d-1012",
    type: "day",
    period: "Oct 12, 2026",
    creatorHandle: "@zoravibes",
    displayName: "Zora Vibes",
    cloutScore: 1460,
    headline: "Called @luna.codes viral reach at 24% odds",
    reason: "Underdog victory paying out 3.4x to early YES stakers.",
    winRate: 75,
    resolvedCount: 24,
  },
  {
    id: "spotlight-w-40",
    type: "week",
    period: "Week 40 · Sep 29–Oct 5, 2026",
    creatorHandle: "@0xchef",
    displayName: "Chef G",
    cloutScore: 1120,
    headline: "9 consecutive correct calls on creator growth metrics",
    reason: "Category dominance in Creator attention forecasts.",
    winRate: 71,
    resolvedCount: 21,
  },
];

// ------------------------------------------------------------------ Follow System
const FOLLOWS_STORAGE_KEY = "cloutchase.followed_creators";

export function getFollowedCreators(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FOLLOWS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : ["@mesh"];
  } catch {
    return ["@mesh"];
  }
}

export function toggleFollowCreator(handle: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getFollowedCreators();
    const isFollowing = current.includes(handle);
    const updated = isFollowing
      ? current.filter((h) => h !== handle)
      : [...current, handle];
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

// ------------------------------------------------------------------ Community Challenges
const CHALLENGES_STORAGE_KEY = "cloutchase.community_challenges.v1";

export const DEFAULT_CHALLENGES: CommunityChallenge[] = [
  {
    id: "contrarian_call",
    title: "The Contrarian",
    description: "Stake on a prediction where current crowd probability is under 35%.",
    rewardClout: 100,
    target: 1,
    current: 1,
    completed: true,
    claimed: false,
    category: "Contrarian",
  },
  {
    id: "category_explorer",
    title: "Category Explorer",
    description: "Participate in markets across at least 2 distinct categories (Post, Creator, Trend).",
    rewardClout: 75,
    target: 2,
    current: 2,
    completed: true,
    claimed: false,
    category: "Accuracy",
  },
  {
    id: "share_alpha",
    title: "Spread the Alpha",
    description: "Share a prediction card or copy link to showcase your call.",
    rewardClout: 50,
    target: 1,
    current: 0,
    completed: false,
    claimed: false,
    category: "Social",
  },
  {
    id: "streak_starter",
    title: "Streak Starter",
    description: "Achieve 2 consecutive winning market calls on settled markets.",
    rewardClout: 150,
    target: 2,
    current: 1,
    completed: false,
    claimed: false,
    category: "Streak",
  },
];

export function getChallenges(): CommunityChallenge[] {
  if (typeof window === "undefined") return DEFAULT_CHALLENGES;
  try {
    const raw = window.localStorage.getItem(CHALLENGES_STORAGE_KEY);
    if (!raw) return DEFAULT_CHALLENGES;
    return JSON.parse(raw) as CommunityChallenge[];
  } catch {
    return DEFAULT_CHALLENGES;
  }
}

export function saveChallenges(challenges: CommunityChallenge[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHALLENGES_STORAGE_KEY, JSON.stringify(challenges));
    window.dispatchEvent(new CustomEvent("cloutchase-challenges-updated"));
  } catch {
    // Ignore
  }
}

export function claimChallengeReward(id: string): number {
  const challenges = getChallenges();
  const challenge = challenges.find((c) => c.id === id);
  if (!challenge || !challenge.completed || challenge.claimed) return 0;
  challenge.claimed = true;
  saveChallenges(challenges);
  return challenge.rewardClout;
}

export function incrementChallengeProgress(id: string): boolean {
  const challenges = getChallenges();
  const challenge = challenges.find((c) => c.id === id);
  if (!challenge || challenge.completed) return false;
  challenge.current = Math.min(challenge.target, challenge.current + 1);
  if (challenge.current >= challenge.target) {
    challenge.completed = true;
  }
  saveChallenges(challenges);
  return challenge.completed;
}

// ------------------------------------------------------------------ Lookup & Creator Match
export function getCreatorByAddress(address?: string): CreatorProfile {
  if (!address) return SEED_CREATORS[0]!;
  const found = SEED_CREATORS.find(
    (c) => c.address.toLowerCase() === address.toLowerCase(),
  );
  if (found) return found;

  // Synthesize a deterministic profile for on-chain address
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return {
    address: address as Address,
    handle: `@${address.slice(2, 8).toLowerCase()}`,
    displayName: short,
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${address.toLowerCase()}`,
    bio: "Decentralized forecaster on Monad testnet.",
    cloutScore: 420,
    tier: "Analyst",
    winRate: 60,
    marketsPlayed: 5,
    marketsWon: 3,
    contrarianCalls: 1,
    currentStreak: 1,
    bestStreak: 2,
    totalShares: 5,
    badges: [
      {
        id: "early_caller",
        name: "Early Caller",
        description: "Early market entrant",
        icon: "⚡",
      },
    ],
    verified: false,
    joinedDate: "Oct 2026",
  };
}

export function getCreatorByHandle(handle: string): CreatorProfile | undefined {
  return SEED_CREATORS.find(
    (c) => c.handle.toLowerCase() === handle.toLowerCase() || c.handle.slice(1).toLowerCase() === handle.toLowerCase(),
  );
}

export function getCreatorOfDay(): CreatorProfile {
  return SEED_CREATORS.find((c) => c.isCreatorOfDay) ?? SEED_CREATORS[1]!;
}

export function getCreatorOfWeek(): CreatorProfile {
  return SEED_CREATORS.find((c) => c.isCreatorOfWeek) ?? SEED_CREATORS[0]!;
}
