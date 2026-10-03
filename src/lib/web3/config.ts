import { createConfig, http } from "wagmi";
import { injected, metaMask, coinbaseWallet, walletConnect } from "wagmi/connectors";
import type { Address } from "viem";

import { monadTestnet } from "./chains";

function readAddress(key: string): Address | undefined {
  const value = import.meta.env[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return /^0x[a-fA-F0-9]{40}$/.test(trimmed) ? (trimmed as Address) : undefined;
}

export const contracts = {
  market: readAddress("VITE_MARKET_ADDRESS"),
  token: readAddress("VITE_CLOUT_TOKEN_ADDRESS"),
  oracle: readAddress("VITE_ORACLE_ADDRESS"),
  cashout: readAddress("VITE_CASHOUT_ADDRESS"),
};

/** True once the deployed Monad addresses are present in the environment. */
export const contractsConfigured = Boolean(contracts.market && contracts.token);

const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(),
    metaMask({
      dapp: {
        name: "CloutChase",
        url: typeof window !== "undefined" ? window.location.origin : "https://cloutchase.xyz",
        iconUrl:
          typeof window !== "undefined" ? `${window.location.origin}/favicon.ico` : undefined,
      },
    }),
    coinbaseWallet({
      appName: "CloutChase",
      appLogoUrl:
        typeof window !== "undefined" ? `${window.location.origin}/favicon.ico` : undefined,
    }),
    ...(wcProjectId ? [walletConnect({ projectId: wcProjectId, showQrModal: true })] : []),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
  ssr: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
