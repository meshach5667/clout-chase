import { formatUnits, parseUnits } from "viem";

export const TOKEN_DECIMALS = 18;
export const PROTOCOL_FEE_BPS = 200n;
export const CREATOR_FEE_BPS = 100n;
const BPS = 10_000n;

/** Fixed rate: 2,000 CLOUT = 1 MON = $3.00 USD */
export const CLOUT_PER_MON = 2000n;
export const MON_USD_PRICE = 3.0; // 1 MON = $3.00 USD

/** Returns the MON equivalent of a CLOUT amount */
export function cloutToMon(cloutAmount: bigint): number {
  return Number(formatUnits(cloutAmount, TOKEN_DECIMALS)) / Number(CLOUT_PER_MON);
}

/** Returns the USD equivalent of a CLOUT amount (via MON) */
export function cloutToUsd(cloutAmount: bigint): number {
  return cloutToMon(cloutAmount) * MON_USD_PRICE;
}

/** Formats the MON value of a CLOUT amount, e.g. "0.05 MON" */
export function formatCloutMon(cloutAmount: bigint, maxFractionDigits = 4): string {
  const mon = cloutToMon(cloutAmount);
  return mon.toLocaleString("en-US", { maximumFractionDigits });
}

/** Formats the USD value of a CLOUT amount, e.g. "$1.50" */
export function formatCloutUsd(cloutAmount: bigint, maxFractionDigits = 2): string {
  const usd = cloutToUsd(cloutAmount);
  return usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits });
}

/** YES probability (0-1) implied by the current parimutuel pools. */
export function impliedYesProbability(yesPool: bigint, noPool: bigint): number {
  const total = yesPool + noPool;
  if (total === 0n) return 0.5;
  return Number((yesPool * 1_000_000n) / total) / 1_000_000;
}

/** Decimal odds (payout multiple) for a side, before fees, at current pool sizes. */
export function decimalOdds(sidePool: bigint, otherPool: bigint): number {
  if (sidePool === 0n) return otherPool === 0n ? 2 : 1 + Number(otherPool) / 1;
  const total = sidePool + otherPool;
  return Number((total * 1_000_000n) / sidePool) / 1_000_000;
}

/**
 * Mirrors `CloutChaseMarket.previewPayout` exactly so the UI never shows a number
 * the contract would not pay.
 */
export function previewPayout(
  yesPool: bigint,
  noPool: bigint,
  isYes: boolean,
  amount: bigint,
): bigint {
  if (amount <= 0n) return 0n;
  const winPool = (isYes ? yesPool : noPool) + amount;
  const losePool = isYes ? noPool : yesPool;
  const distributable = losePool - (losePool * (PROTOCOL_FEE_BPS + CREATOR_FEE_BPS)) / BPS;
  return amount + (distributable * amount) / winPool;
}

export function formatToken(value: bigint, maxFractionDigits = 2): string {
  const asNumber = Number(formatUnits(value, TOKEN_DECIMALS));
  return asNumber.toLocaleString("en-US", { maximumFractionDigits: maxFractionDigits });
}

export function parseToken(value: string): bigint {
  const cleaned = value.trim();
  if (!cleaned) return 0n;
  return parseUnits(cleaned, TOKEN_DECIMALS);
}

export function formatCompact(value: bigint | number): string {
  const n = typeof value === "bigint" ? Number(value) : value;
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function shortenAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function countdown(targetSeconds: number, nowSeconds: number): string {
  const diff = targetSeconds - nowSeconds;
  if (diff <= 0) return "0h 0m";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
