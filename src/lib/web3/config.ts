import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
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
};

/** True once the deployed Monad addresses are present in the environment. */
export const contractsConfigured = Boolean(contracts.market && contracts.token);

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [monadTestnet.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
