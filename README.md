# Clout Chase

Build CloutChase, a fully integrated Web3 prediction-market platform where users predict which social posts, creators, or trends will gain the most attention within 24–48 hours.

Use Solidity on Monad for the prediction-market smart contracts, Next.js + TypeScript for the frontend, and Tailwind CSS + shadcn/ui for the UI. Integrate everything end-to-end: wallet connection, contract interactions, market creation, YES/NO positions, token staking, live market odds and pool data, portfolio/history, leaderboards, oracle-based outcome verification, and automatic on-chain settlement and payouts. Use a clean, modern, mobile-responsive design with proper loading/error states and transaction feedback.

Structure the project so the frontend communicates directly with the deployed contracts through a typed Web3 layer, all contract addresses/ABIs and environment variables are properly configured, and every major user flow works end-to-end on Monad. Include comprehensive Solidity and frontend tests, contract security checks, validation, and a clear deployment/setup configuration.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6a14ce7f-85d2-41e2-ad3b-5267983fb463).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
