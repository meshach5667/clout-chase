import type { Address } from "viem";

export const OUTCOME = {
  Unresolved: 0,
  Yes: 1,
  No: 2,
  Canceled: 3,
} as const;

export type OutcomeValue = (typeof OUTCOME)[keyof typeof OUTCOME];

export const CATEGORIES = ["Post", "Creator", "Trend"] as const;
export type CategoryIndex = 0 | 1 | 2;

export type Market = {
  id: bigint;
  creator: Address;
  subject: string;
  metadataURI: string;
  category: number;
  threshold: bigint;
  createdAt: bigint;
  closesAt: bigint;
  resolvesAt: bigint;
  yesPool: bigint;
  noPool: bigint;
  outcome: number;
  finalScore: bigint;
  settled: boolean;
};

export type Position = {
  yes: bigint;
  no: bigint;
  claimed: boolean;
};

export type LeaderboardEntry = {
  address: Address;
  totalStaked: bigint;
  totalWon: bigint;
  marketsWon: number;
  marketsPlayed: number;
};

export type MarketStatus = "live" | "closed" | "settled" | "canceled";

export function marketStatus(market: Market, nowSeconds: number): MarketStatus {
  if (market.settled && market.outcome === OUTCOME.Canceled) return "canceled";
  if (market.settled) return "settled";
  if (nowSeconds >= Number(market.closesAt)) return "closed";
  return "live";
}
