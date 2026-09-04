import { defineChain } from "viem";

const rpcUrl = import.meta.env["VITE_MONAD_RPC_URL"] ?? "https://testnet-rpc.monad.xyz";

/** Monad testnet (chain id 10143). */
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  },
  testnet: true,
});

export function explorerTxUrl(hash: string) {
  return `${monadTestnet.blockExplorers.default.url}/tx/${hash}`;
}

export function explorerAddressUrl(address: string) {
  return `${monadTestnet.blockExplorers.default.url}/address/${address}`;
}
