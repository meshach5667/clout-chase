/**
 * Typed ABIs for the deployed CloutChase contracts.
 * Kept as `const` tuples so wagmi/viem infer argument and return types end-to-end.
 */

export const marketAbi = [
  {
    type: "function",
    name: "marketCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getMarkets",
    stateMutability: "view",
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "subject", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "category", type: "uint8" },
          { name: "threshold", type: "uint256" },
          { name: "createdAt", type: "uint64" },
          { name: "closesAt", type: "uint64" },
          { name: "resolvesAt", type: "uint64" },
          { name: "yesPool", type: "uint256" },
          { name: "noPool", type: "uint256" },
          { name: "outcome", type: "uint8" },
          { name: "finalScore", type: "uint256" },
          { name: "settled", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getMarket",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "subject", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "category", type: "uint8" },
          { name: "threshold", type: "uint256" },
          { name: "createdAt", type: "uint64" },
          { name: "closesAt", type: "uint64" },
          { name: "resolvesAt", type: "uint64" },
          { name: "yesPool", type: "uint256" },
          { name: "noPool", type: "uint256" },
          { name: "outcome", type: "uint8" },
          { name: "finalScore", type: "uint256" },
          { name: "settled", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getPosition",
    stateMutability: "view",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "yes", type: "uint256" },
          { name: "no", type: "uint256" },
          { name: "claimed", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getUserMarkets",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    type: "function",
    name: "participantCount",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getParticipants",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [{ type: "address[]" }],
  },
  {
    type: "function",
    name: "totalStaked",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalWon",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "marketsWon",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "marketsPlayed",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "createMarket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "subject", type: "string" },
      { name: "metadataURI", type: "string" },
      { name: "category", type: "uint8" },
      { name: "threshold", type: "uint256" },
      { name: "duration", type: "uint64" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "stake",
    stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "isYes", type: "bool" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "settle",
    stateMutability: "nonpayable",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "event",
    name: "MarketCreated",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "subject", type: "string", indexed: false },
      { name: "category", type: "uint8", indexed: false },
      { name: "threshold", type: "uint256", indexed: false },
      { name: "closesAt", type: "uint64", indexed: false },
      { name: "resolvesAt", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Staked",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "isYes", type: "bool", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

export const tokenAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "claimFaucet",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const;

export const oracleAbi = [
  {
    type: "function",
    name: "isFinalized",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "getScore",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [{ type: "uint256" }, { type: "uint64" }],
  },
  {
    type: "function",
    name: "reportScore",
    stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "score", type: "uint256" },
    ],
    outputs: [],
  },
] as const;
