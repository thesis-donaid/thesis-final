# Thesis Blockchain Project

This project is a full-stack solution for transparent donation tracking using blockchain technology. It consists of:

- **blockchain/**: Smart contracts and deployment scripts (Solidity, Hardhat, TypeScript)
- **oauth-provider/**: Next.js app for user authentication, donation management, and blockchain integration (TypeScript, Prisma)

---

## Features

- Immutable, transparent ledger for donation lifecycle proofs (see `DonationProof.sol`)
- End-to-end flow: Donation → Allocation → Disbursement → Receipt → Blockchain
- Only backend wallet can record proofs; anyone can verify on-chain
- Next.js frontend with OAuth and Prisma ORM
- TypeScript integration tests and Foundry-compatible Solidity tests

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm, yarn, pnpm, or bun
- MetaMask (for blockchain wallet)
- Polygon Amoy or Sepolia testnet access

---

### Blockchain Module

1. **Install dependencies:**
   ```
   cd blockchain
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env` and set your wallet/private key and RPC URLs.

3. **Run tests:**
   ```
   npx hardhat test
   ```

4. **Deploy contracts:**
   ```
   npx hardhat ignition deploy ignition/modules/Counter.ts
   ```

---

### OAuth Provider (Next.js App)

1. **Install dependencies:**
   ```
   cd oauth-provider
   npm install
   ```

2. **Run development server:**
   ```
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Configure Prisma:**
   - Edit `prisma/schema.prisma` and set your database URL in `.env`.
   - Run migrations:
     ```
     npx prisma migrate dev
     ```

---

## Learn More

- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Polygon Amoy Testnet](https://wiki.polygon.technology/docs/amoy/)
- [Prisma ORM](https://www.prisma.io/docs/)

---
