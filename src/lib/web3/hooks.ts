/**
 * The single typed Web3 access layer used by every screen.
 *
 * When the deployed Monad addresses are present in the environment, all reads/writes go
 * straight to the contracts through wagmi + viem. Otherwise the identical API is served by
 * the local simulation in `demo.ts`, so no component needs to know which mode it is in.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import type { Address } from "viem";

import { marketAbi, tokenAbi } from "./abis";
import { monadTestnet } from "./chains";
import { contracts, contractsConfigured } from "./config";
import { isMobileDevice, isMobileWithoutWallet, openMobileWalletModal } from "./mobile-wallet";
import {
  DEMO_WALLET,
  demoBalance,
  demoClaim,
  demoCreateMarket,
  demoFaucet,
  demoLeaderboard,
  demoPosition,
  demoSettle,
  demoStake,
  useDemoState,
} from "./demo";
import type { LeaderboardEntry, Market, Position } from "./types";

const DEMO_CONNECT_KEY = "cloutchase.demo.connected";

export const isOnChain = contractsConfigured;

// ------------------------------------------------------------------ wallet

export function useWallet() {
  const account = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [demoConnected, setDemoConnected] = useState(false);

  useEffect(() => {
    if (isOnChain || typeof window === "undefined") return;
    setDemoConnected(window.localStorage.getItem(DEMO_CONNECT_KEY) === "1");
  }, []);

  const connect = useCallback(
    async (connectorOverride?: (typeof connectors)[number] | string) => {
      if (!isOnChain) {
        window.localStorage.setItem(DEMO_CONNECT_KEY, "1");
        setDemoConnected(true);
        return;
      }

      if (isMobileWithoutWallet() && !connectorOverride) {
        openMobileWalletModal();
        return;
      }

      const targetConnector =
        typeof connectorOverride === "string"
          ? connectors.find(
              (c) =>
                c.id.toLowerCase() === connectorOverride.toLowerCase() ||
                c.uid?.toLowerCase() === connectorOverride.toLowerCase() ||
                c.type.toLowerCase() === connectorOverride.toLowerCase() ||
                c.name.toLowerCase().includes(connectorOverride.toLowerCase()),
            )
          : (connectorOverride ??
            (isMobileWithoutWallet()
              ? (connectors.find((c) => c.type === "metaMask" || c.id === "metaMaskSDK") ??
                connectors.find((c) => c.type === "coinbaseWallet") ??
                connectors[0])
              : (connectors.find(
                  (c) => c.type === "injected" || c.id === "injected" || c.id === "metaMask",
                ) ?? connectors[0])));

      if (!targetConnector) {
        if (isMobileDevice()) {
          openMobileWalletModal();
          return;
        }
        throw new Error("No wallet detected. Install MetaMask or a Monad-ready wallet.");
      }

      try {
        await connectAsync({ connector: targetConnector });
      } catch (err) {
        throw normalizeError(err, "Connect wallet");
      }

      try {
        await switchChainAsync({ chainId: monadTestnet.id });
      } catch {
        // User can manually click switch to Monad in the UI
      }
    },
    [connectAsync, connectors, switchChainAsync],
  );

  const disconnectWallet = useCallback(() => {
    if (!isOnChain) {
      window.localStorage.removeItem(DEMO_CONNECT_KEY);
      setDemoConnected(false);
      return;
    }
    disconnect();
  }, [disconnect]);

  const switchToMonad = useCallback(async () => {
    if (!isOnChain) return;
    try {
      await switchChainAsync({ chainId: monadTestnet.id });
    } catch (err: unknown) {
      if (typeof window !== "undefined" && "ethereum" in window) {
        try {
          await (
            window as unknown as { ethereum: { request: (args: unknown) => Promise<unknown> } }
          ).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${monadTestnet.id.toString(16)}`,
                chainName: monadTestnet.name,
                nativeCurrency: monadTestnet.nativeCurrency,
                rpcUrls: monadTestnet.rpcUrls.default.http,
                blockExplorerUrls: [monadTestnet.blockExplorers.default.url],
              },
            ],
          });
          return;
        } catch {
          // keep original error
        }
      }
      throw err;
    }
  }, [switchChainAsync]);

  if (!isOnChain) {
    return {
      address: demoConnected ? DEMO_WALLET : undefined,
      isConnected: demoConnected,
      isConnecting: false,
      wrongNetwork: false,
      connect,
      disconnect: disconnectWallet,
      switchToMonad,
      hasInjectedWallet: true,
      connectors: [] as typeof connectors,
      isMobile: isMobileDevice(),
      isMobileWithoutWallet: isMobileWithoutWallet(),
      openMobileWalletModal,
    };
  }

  return {
    address: account.address,
    isConnected: account.isConnected,
    isConnecting: isPending || account.isConnecting,
    wrongNetwork: account.isConnected && chainId !== monadTestnet.id,
    connect,
    disconnect: disconnectWallet,
    switchToMonad,
    hasInjectedWallet: connectors.length > 0,
    connectors,
    isMobile: isMobileDevice(),
    isMobileWithoutWallet: isMobileWithoutWallet(),
    openMobileWalletModal,
  };
}

// ------------------------------------------------------------------- reads

type ReadResult<T> = { data: T; isLoading: boolean; error: Error | null; refetch: () => void };

export function useMarkets(): ReadResult<Market[]> {
  const demo = useDemoState();
  const read = useReadContract({
    abi: marketAbi,
    address: contracts.market,
    functionName: "getMarkets",
    args: [0n, 100n],
    query: { enabled: isOnChain, refetchInterval: 15_000 },
  });

  if (!isOnChain) {
    return { data: demo.markets, isLoading: false, error: null, refetch: () => {} };
  }
  return {
    data: (read.data as Market[] | undefined) ?? [],
    isLoading: read.isLoading,
    error: (read.error as Error | null) ?? null,
    refetch: read.refetch,
  };
}

export function useMarket(marketId: bigint | undefined): ReadResult<Market | undefined> {
  const demo = useDemoState();
  const read = useReadContract({
    abi: marketAbi,
    address: contracts.market,
    functionName: "getMarket",
    args: marketId !== undefined ? [marketId] : undefined,
    query: { enabled: isOnChain && marketId !== undefined, refetchInterval: 10_000 },
  });

  if (!isOnChain) {
    return {
      data: demo.markets.find((m) => m.id === marketId),
      isLoading: false,
      error: null,
      refetch: () => {},
    };
  }
  return {
    data: read.data as Market | undefined,
    isLoading: read.isLoading,
    error: (read.error as Error | null) ?? null,
    refetch: read.refetch,
  };
}

export function usePosition(marketId: bigint | undefined, address?: Address) {
  useDemoState();
  const read = useReadContract({
    abi: marketAbi,
    address: contracts.market,
    functionName: "getPosition",
    args: marketId !== undefined && address ? [marketId, address] : undefined,
    query: { enabled: isOnChain && marketId !== undefined && Boolean(address) },
  });

  if (!isOnChain) {
    return marketId !== undefined
      ? demoPosition(marketId, address)
      : ({ yes: 0n, no: 0n, claimed: false } as Position);
  }
  return (read.data as Position | undefined) ?? { yes: 0n, no: 0n, claimed: false };
}

export function useTokenBalance(address?: Address): bigint {
  useDemoState();
  const read = useReadContract({
    abi: tokenAbi,
    address: contracts.token,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isOnChain && Boolean(address), refetchInterval: 15_000 },
  });
  if (!isOnChain) return demoBalance(address);
  return (read.data as bigint | undefined) ?? 0n;
}

/** Portfolio: every market the wallet holds (or held) a position in. */
export function usePortfolio(address?: Address) {
  const { data: markets, isLoading } = useMarkets();
  const demo = useDemoState();
  const read = useReadContract({
    abi: marketAbi,
    address: contracts.market,
    functionName: "getUserMarkets",
    args: address ? [address] : undefined,
    query: { enabled: isOnChain && Boolean(address) },
  });

  return useMemo(() => {
    if (!address) return { entries: [], isLoading: false };
    if (!isOnChain) {
      const entries = markets
        .map((market) => ({ market, position: demoPosition(market.id, address) }))
        .filter(({ position }) => position.yes > 0n || position.no > 0n);
      return { entries, isLoading: false };
    }
    const ids = new Set(((read.data as bigint[] | undefined) ?? []).map(String));
    return {
      entries: markets
        .filter((m) => ids.has(String(m.id)))
        .map((market) => ({ market, position: { yes: 0n, no: 0n, claimed: false } as Position })),
      isLoading: isLoading || read.isLoading,
    };
    // demo state is a dependency so portfolio refreshes after a simulated stake
  }, [address, markets, isLoading, read.data, read.isLoading, demo]);
}

export function useLeaderboard(): LeaderboardEntry[] {
  const demo = useDemoState();
  const { data: markets } = useMarkets();
  const publicClient = usePublicClient();
  const [onChain, setOnChain] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!isOnChain || !publicClient || !contracts.market || markets.length === 0) return;
    let cancelled = false;

    (async () => {
      const traders = new Set<Address>();
      for (const market of markets.slice(0, 25)) {
        const participants = (await publicClient.readContract({
          abi: marketAbi,
          address: contracts.market!,
          functionName: "getParticipants",
          args: [market.id],
        })) as Address[];
        participants.forEach((p) => traders.add(p));
      }

      const entries = await Promise.all(
        [...traders].map(async (address) => {
          const [totalStaked, totalWon, won, played] = (await Promise.all([
            publicClient.readContract({
              abi: marketAbi,
              address: contracts.market!,
              functionName: "totalStaked",
              args: [address],
            }),
            publicClient.readContract({
              abi: marketAbi,
              address: contracts.market!,
              functionName: "totalWon",
              args: [address],
            }),
            publicClient.readContract({
              abi: marketAbi,
              address: contracts.market!,
              functionName: "marketsWon",
              args: [address],
            }),
            publicClient.readContract({
              abi: marketAbi,
              address: contracts.market!,
              functionName: "marketsPlayed",
              args: [address],
            }),
          ])) as [bigint, bigint, bigint, bigint];
          return {
            address,
            totalStaked,
            totalWon,
            marketsWon: Number(won),
            marketsPlayed: Number(played),
          } satisfies LeaderboardEntry;
        }),
      );

      if (!cancelled) setOnChain(entries.sort((a, b) => (b.totalWon > a.totalWon ? 1 : -1)));
    })().catch(() => setOnChain([]));

    return () => {
      cancelled = true;
    };
  }, [markets, publicClient]);

  if (!isOnChain) {
    void demo;
    return demoLeaderboard();
  }
  return onChain;
}

// ------------------------------------------------------------------ writes

export type TxState = "idle" | "approving" | "pending" | "confirming" | "success" | "error";

export function useMarketActions() {
  const { address } = useWallet();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState<TxState>("idle");
  const [hash, setHash] = useState<string | undefined>();

  const run = useCallback(
    async (label: string, fn: () => Promise<string | undefined>) => {
      setStatus("pending");
      setHash(undefined);
      try {
        const txHash = await fn();
        if (txHash) {
          setHash(txHash);
          setStatus("confirming");
          await publicClient?.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
        }
        setStatus("success");
        return txHash;
      } catch (error) {
        setStatus("error");
        throw normalizeError(error, label);
      }
    },
    [publicClient],
  );

  const ensureAllowance = useCallback(
    async (amount: bigint) => {
      if (!isOnChain || !address || !contracts.token || !contracts.market) return;
      const allowance = (await publicClient?.readContract({
        abi: tokenAbi,
        address: contracts.token,
        functionName: "allowance",
        args: [address as Address, contracts.market],
      })) as bigint | undefined;
      if ((allowance ?? 0n) >= amount) return;
      setStatus("approving");
      const approveHash = await writeContractAsync({
        abi: tokenAbi,
        address: contracts.token,
        functionName: "approve",
        args: [contracts.market, 2n ** 256n - 1n],
      });
      await publicClient?.waitForTransactionReceipt({ hash: approveHash });
    },
    [address, publicClient, writeContractAsync],
  );

  const stake = useCallback(
    (marketId: bigint, isYes: boolean, amount: bigint) =>
      run("stake", async () => {
        if (!address) throw new Error("Connect your wallet first.");
        if (!isOnChain) {
          demoStake(marketId, isYes, amount, address);
          return undefined;
        }
        await ensureAllowance(amount);
        return writeContractAsync({
          abi: marketAbi,
          address: contracts.market!,
          functionName: "stake",
          args: [marketId, isYes, amount],
        });
      }),
    [address, ensureAllowance, run, writeContractAsync],
  );

  const createMarket = useCallback(
    (input: { subject: string; category: number; threshold: bigint; durationHours: number }) =>
      run("createMarket", async () => {
        if (!address) throw new Error("Connect your wallet first.");
        if (!isOnChain) {
          demoCreateMarket({ ...input, creator: address });
          return undefined;
        }
        return writeContractAsync({
          abi: marketAbi,
          address: contracts.market!,
          functionName: "createMarket",
          args: [
            input.subject,
            "",
            input.category,
            input.threshold,
            BigInt(input.durationHours * 3600),
          ],
        });
      }),
    [address, run, writeContractAsync],
  );

  const claim = useCallback(
    (marketId: bigint) =>
      run("claim", async () => {
        if (!address) throw new Error("Connect your wallet first.");
        if (!isOnChain) {
          demoClaim(marketId, address);
          return undefined;
        }
        return writeContractAsync({
          abi: marketAbi,
          address: contracts.market!,
          functionName: "claim",
          args: [marketId],
        });
      }),
    [address, run, writeContractAsync],
  );

  const settle = useCallback(
    (marketId: bigint, simulatedScore?: bigint) =>
      run("settle", async () => {
        if (!isOnChain) {
          demoSettle(marketId, simulatedScore ?? 0n);
          return undefined;
        }
        return writeContractAsync({
          abi: marketAbi,
          address: contracts.market!,
          functionName: "settle",
          args: [marketId],
        });
      }),
    [run, writeContractAsync],
  );

  const faucet = useCallback(
    () =>
      run("faucet", async () => {
        if (!address) throw new Error("Connect your wallet first.");
        if (!isOnChain) {
          demoFaucet(address);
          return undefined;
        }
        return writeContractAsync({
          abi: tokenAbi,
          address: contracts.token!,
          functionName: "claimFaucet",
        });
      }),
    [address, run, writeContractAsync],
  );

  return {
    status,
    hash,
    stake,
    createMarket,
    claim,
    settle,
    faucet,
    reset: () => setStatus("idle"),
  };
}

/** Turns viem/wallet errors into something a human can act on. */
export function normalizeError(error: unknown, label: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (/wallet must has? at least one account/i.test(message))
    return new Error(
      "Your wallet is locked or has no active account. Please unlock your wallet extension and ensure an account is created/selected.",
    );
  if (/User rejected|denied transaction|user rejected the request/i.test(message))
    return new Error("Request was rejected or cancelled in your wallet.");
  if (/insufficient funds/i.test(message)) return new Error("Not enough MON to cover gas.");
  if (/StakeTooSmall/.test(message)) return new Error("Minimum stake is 1 CLOUT.");
  if (/MarketClosed/.test(message)) return new Error("This market has already closed for staking.");
  if (/OracleNotReady/.test(message)) return new Error("The oracle has not published a score yet.");
  if (/AlreadyClaimed/.test(message)) return new Error("You have already claimed this market.");
  if (/InvalidDuration/.test(message))
    return new Error("Duration must be between 24 and 48 hours.");
  const short = message.split("\n")[0] ?? message;
  return new Error(`${label} failed: ${short.slice(0, 160)}`);
}
