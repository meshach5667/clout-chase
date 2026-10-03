/**
 * Local simulation layer.
 *
 * The app talks to the deployed Monad contracts whenever VITE_MARKET_ADDRESS /
 * VITE_CLOUT_TOKEN_ADDRESS are configured. Before deployment this store mirrors the exact
 * same contract semantics (parimutuel pools, 3% fee on the losing pool, oracle threshold,
 * pull-based claims) so every screen and flow is testable end-to-end.
 */
import { useSyncExternalStore } from "react";
import type { Address } from "viem";

import { OUTCOME, type LeaderboardEntry, type Market, type Position } from "./types";
import { PROTOCOL_FEE_BPS, CREATOR_FEE_BPS } from "./math";

const STORAGE_KEY = "cloutchase.demo.v1";
const HOUR = 3600;

export const DEMO_WALLET = "0x00c1f0aA7d3b1e5A9E43c8f00De4a1a92f8f7Ce1" as Address;

type DemoState = {
  markets: Market[];
  positions: Record<string, Position>; // `${marketId}:${address}`
  balances: Record<string, bigint>;
  stats: Record<string, LeaderboardEntry>;
  nextId: bigint;
};

const listeners = new Set<() => void>();
let state: DemoState = seed();
let hydrated = false;

function now() {
  return Math.floor(Date.now() / 1000);
}

function e18(n: number): bigint {
  return BigInt(Math.round(n * 1000)) * 10n ** 15n;
}

function addr(value: string) {
  return value as Address;
}

function seed(): DemoState {
  const t = now();
  const markets: Market[] = [
    makeMarket(1n, "@zoravibes drop teaser", 0, 250_000n, t - 6 * HOUR, 36 * HOUR, 4_820, 2_140),
    makeMarket(2n, "@0xchef", 1, 90_000n, t - 14 * HOUR, 24 * HOUR, 1_300, 3_950),
    makeMarket(3n, "#MonadSzn", 2, 1_200_000n, t - 2 * HOUR, 48 * HOUR, 7_600, 6_900),
    makeMarket(4n, "@luna.codes rewrite thread", 0, 40_000n, t - 30 * HOUR, 32 * HOUR, 2_200, 800),
    makeMarket(5n, "#DeadInternetTheory", 2, 500_000n, t - 50 * HOUR, 48 * HOUR, 3_400, 5_100),
  ];

  // market 4 already settled YES, market 5 settled NO
  markets[3]!.settled = true;
  markets[3]!.outcome = OUTCOME.Yes;
  markets[3]!.finalScore = 61_500n;
  markets[4]!.settled = true;
  markets[4]!.outcome = OUTCOME.No;
  markets[4]!.finalScore = 318_000n;

  const traders: Array<[string, number, number, number, number]> = [
    ["0x9A3f8b21C7e04D5f6B8a2C1d0E9f4A7b3C5d6E80", 41_200, 12_400, 18, 24],
    ["0x2b71E4a09Cf3D68B15aE7c9D4f2A8b6C0d1E3F42", 33_800, 9_150, 15, 23],
    ["0x7Cd1F0a8B6e94C25D3f7A1b0C8e2D4f6A9b3C5d7", 28_400, 7_980, 12, 21],
    [DEMO_WALLET, 4_500, 1_260, 4, 6],
    ["0x5E8c2A4b7D019F36c8B1e5A0d7F2c9B4a6E3d8C1", 19_700, 4_210, 9, 19],
  ];

  const stats: Record<string, LeaderboardEntry> = {};
  for (const [address, staked, won, wins, played] of traders) {
    stats[address.toLowerCase()] = {
      address: addr(address),
      totalStaked: e18(staked),
      totalWon: e18(won),
      marketsWon: wins,
      marketsPlayed: played,
    };
  }

  return {
    markets,
    positions: {
      [`1:${DEMO_WALLET.toLowerCase()}`]: { yes: e18(250), no: 0n, claimed: false },
      [`4:${DEMO_WALLET.toLowerCase()}`]: { yes: e18(400), no: 0n, claimed: false },
      [`5:${DEMO_WALLET.toLowerCase()}`]: { yes: 0n, no: e18(150), claimed: true },
    },
    balances: { [DEMO_WALLET.toLowerCase()]: e18(2_500) },
    stats,
    nextId: 6n,
  };
}

function makeMarket(
  id: bigint,
  subject: string,
  category: number,
  threshold: bigint,
  createdAt: number,
  duration: number,
  yes: number,
  no: number,
): Market {
  return {
    id,
    creator: addr("0x9A3f8b21C7e04D5f6B8a2C1d0E9f4A7b3C5d6E80"),
    subject,
    metadataURI: "",
    category,
    threshold,
    createdAt: BigInt(createdAt),
    closesAt: BigInt(createdAt + Math.floor((duration * 4) / 5)),
    resolvesAt: BigInt(createdAt + duration),
    yesPool: e18(yes),
    noPool: e18(no),
    outcome: OUTCOME.Unresolved,
    finalScore: 0n,
    settled: false,
  };
}

// ------------------------------------------------------------------ persistence

type Serialized = {
  markets: unknown[];
  positions: unknown;
  balances: unknown;
  stats: unknown;
  nextId: string;
};

function replacer(_key: string, value: unknown) {
  return typeof value === "bigint" ? `${value.toString()}n` : value;
}

function reviver(_key: string, value: unknown) {
  return typeof value === "string" && /^\d+n$/.test(value) ? BigInt(value.slice(0, -1)) : value;
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state, replacer));
  } catch {
    /* storage unavailable — keep in-memory state */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw, reviver) as unknown as DemoState & Serialized;
    if (Array.isArray(parsed.markets)) {
      state = parsed as unknown as DemoState;
      emit();
    }
  } catch {
    /* corrupt payload — fall back to the seed */
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function commit(next: DemoState) {
  state = next;
  persist();
  emit();
}

// ----------------------------------------------------------------------- reads

export function getDemoState(): DemoState {
  return state;
}

export function useDemoState(): DemoState {
  return useSyncExternalStore(
    (listener) => {
      hydrate();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
}

export function demoPosition(marketId: bigint, address?: string): Position {
  if (!address) return { yes: 0n, no: 0n, claimed: false };
  return (
    state.positions[`${marketId}:${address.toLowerCase()}`] ?? { yes: 0n, no: 0n, claimed: false }
  );
}

export function demoBalance(address?: string): bigint {
  if (!address) return 0n;
  return state.balances[address.toLowerCase()] ?? e18(1_000);
}

export function demoLeaderboard(): LeaderboardEntry[] {
  return Object.values(state.stats).sort((a, b) => (b.totalWon > a.totalWon ? 1 : -1));
}

// ---------------------------------------------------------------------- writes

export function demoCreateMarket(input: {
  subject: string;
  category: number;
  threshold: bigint;
  durationHours: number;
  creator: string;
}): bigint {
  const t = now();
  const duration = input.durationHours * HOUR;
  const id = state.nextId;
  const market: Market = {
    id,
    creator: addr(input.creator),
    subject: input.subject,
    metadataURI: "",
    category: input.category,
    threshold: input.threshold,
    createdAt: BigInt(t),
    closesAt: BigInt(t + Math.floor((duration * 4) / 5)),
    resolvesAt: BigInt(t + duration),
    yesPool: 0n,
    noPool: 0n,
    outcome: OUTCOME.Unresolved,
    finalScore: 0n,
    settled: false,
  };
  commit({ ...state, markets: [market, ...state.markets], nextId: id + 1n });
  return id;
}

export function demoStake(marketId: bigint, isYes: boolean, amount: bigint, address: string) {
  const key = `${marketId}:${address.toLowerCase()}`;
  const markets = state.markets.map((m) =>
    m.id === marketId
      ? {
          ...m,
          yesPool: isYes ? m.yesPool + amount : m.yesPool,
          noPool: isYes ? m.noPool : m.noPool + amount,
        }
      : m,
  );
  const prev = state.positions[key] ?? { yes: 0n, no: 0n, claimed: false };
  const balanceKey = address.toLowerCase();
  const stats = { ...state.stats };
  const existing = stats[balanceKey];
  stats[balanceKey] = {
    address: addr(address),
    totalStaked: (existing?.totalStaked ?? 0n) + amount,
    totalWon: existing?.totalWon ?? 0n,
    marketsWon: existing?.marketsWon ?? 0,
    marketsPlayed: (existing?.marketsPlayed ?? 0) + (prev.yes === 0n && prev.no === 0n ? 1 : 0),
  };

  commit({
    ...state,
    markets,
    positions: {
      ...state.positions,
      [key]: {
        yes: isYes ? prev.yes + amount : prev.yes,
        no: isYes ? prev.no : prev.no + amount,
        claimed: false,
      },
    },
    balances: { ...state.balances, [balanceKey]: demoBalance(address) - amount },
    stats,
  });
}

/** Mirrors `settle()` — resolves from the simulated oracle score. */
export function demoSettle(marketId: bigint, score: bigint) {
  const markets = state.markets.map((m) => {
    if (m.id !== marketId) return m;
    if (m.yesPool === 0n || m.noPool === 0n) {
      return { ...m, settled: true, outcome: OUTCOME.Canceled, finalScore: score };
    }
    return {
      ...m,
      settled: true,
      finalScore: score,
      outcome: score >= m.threshold ? OUTCOME.Yes : OUTCOME.No,
    };
  });
  commit({ ...state, markets });
}

/** Mirrors `claim()` including the 3% fee taken from the losing pool. */
export function demoClaim(marketId: bigint, address: string): bigint {
  const market = state.markets.find((m) => m.id === marketId);
  const key = `${marketId}:${address.toLowerCase()}`;
  const position = state.positions[key];
  if (!market || !position || position.claimed || !market.settled) return 0n;

  let payout = 0n;
  if (market.outcome === OUTCOME.Canceled) {
    payout = position.yes + position.no;
  } else {
    const winningStake = market.outcome === OUTCOME.Yes ? position.yes : position.no;
    if (winningStake > 0n) {
      const winPool = market.outcome === OUTCOME.Yes ? market.yesPool : market.noPool;
      const losePool = market.outcome === OUTCOME.Yes ? market.noPool : market.yesPool;
      const distributable = losePool - (losePool * (PROTOCOL_FEE_BPS + CREATOR_FEE_BPS)) / 10_000n;
      payout = winningStake + (distributable * winningStake) / winPool;
    }
  }

  const balanceKey = address.toLowerCase();
  commit({
    ...state,
    positions: { ...state.positions, [key]: { ...position, claimed: true } },
    balances: { ...state.balances, [balanceKey]: demoBalance(address) + payout },
  });
  return payout;
}

export function demoFaucet(address: string) {
  const balanceKey = address.toLowerCase();
  commit({
    ...state,
    balances: { ...state.balances, [balanceKey]: demoBalance(address) + e18(1_000) },
  });
}

export function demoCashout(amount: bigint, address: string) {
  const balanceKey = address.toLowerCase();
  const current = demoBalance(address);
  if (current < amount) throw new Error("Insufficient CLOUT balance to cash out");
  commit({
    ...state,
    balances: { ...state.balances, [balanceKey]: current - amount },
  });
}

export function resetDemoState() {
  hydrated = true;
  commit(seed());
}
