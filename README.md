<p align="center">
  <img src="docs/assets/trigr-logo.png" alt="Trigr Logo" width="180" />
</p>

<h1 align="center">Trigr</h1>

<p align="center">
  <strong>The First Reactive Transaction Builder for Rialo Network</strong>
</p>

<p align="center">
  <em>Conditional DeFi execution powered by blockchain-native reactive smart contracts</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/pnpm-8+-F69220?logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Prisma-5.0-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

---

## The Problem

### DeFi Trading is Broken

Every day, traders lose millions because of three fundamental problems:

| Problem | Impact | Current "Solutions" |
|---------|--------|---------------------|
| **24/7 Monitoring** | Miss a price movement at 3 AM? You miss the trade. | Set alarms, lose sleep |
| **Centralized Bots** | Third-party services hold your keys, extract MEV | Trust assumptions, custody risk |
| **Failed Transactions** | Network congestion = missed opportunities | Overpay gas, pray it works |

### The Keeper Problem

Traditional DeFi automation relies on **keepers** — off-chain bots that:

- Can front-run your orders (MEV extraction)
- May fail during high congestion
- Require trust in third parties
- Charge fees for their "service"
- Create single points of failure

Current blockchain applications rely on a fragile tower of offchain automation to function. Blockchains are fundamentally synchronous systems: they execute logic only when a transaction is submitted. To run any form of asynchronous workflow, applications depend on bots, keepers, cron-based schedulers, indexers, and other orchestration logic because blockchains never provided a native way to run logic automatically.

---

## Why Rialo Changes Everything

### Introducing Reactive Transactions

Rialo Network introduces a paradigm shift: **the blockchain itself becomes the keeper**.

Instead of requiring users or bots to push transactions into the chain whenever a condition becomes true, developers can define **predicates** that trigger transactions. A predicate is a logical expression that determines the conditions under which a transaction is eligible for execution. Each predicate is stored onchain and continuously evaluated during block execution; if the condition is met, the associated transaction triggers automatically.

```
Traditional DeFi:
User → Signs Order → Keeper Bot → Watches Price → Submits TX → Maybe Executes

Rialo Reactive:
User → Defines Predicate → Stored Onchain → Validators Evaluate → Guaranteed Execution
```

### What Makes Rialo Special?

A predicate may reference a wide range of signals:

- **Onchain state**: balances, collateral ratios, AMM curve parameters
- **State transitions**: produced by other programs during the same block
- **Events**: emitted by earlier transactions
- **Validator-attested oracle data**: real-time external signals
- **Time-based conditions**: block height or timestamp checks
- **Workflow results**: results of earlier steps in a workflow

When any of these inputs change, Rialo evaluates the predicate. If it becomes true, the associated logic runs. If not, the program simply waits until the proper condition arises.

| Feature | Traditional Chains | Rialo Network |
|---------|-------------------|---------------|
| **Conditional Execution** | Requires external keepers | Native blockchain feature |
| **MEV Protection** | Vulnerable to sandwich attacks | Validator-enforced fairness |
| **Reliability** | Depends on bot uptime | Same uptime as the chain |
| **Trust Model** | Trust the keeper | Trust the protocol |
| **Race Conditions** | Bots compete for execution | Deterministic execution |

### How Reactive Execution Works Inside Blocks

1. A user deploys a transaction that defines a predicate and the program that should run when the predicate becomes true
2. A block of ordinary user-submitted transactions executes in the validator runtime
3. During block execution, any of these changes may affect the inputs to existing predicates
4. At the end of a block's execution, Rialo evaluates all predicates whose dependencies may have changed (deterministically)
5. Any predicate that becomes true is marked as triggered
6. The triggered transaction runs either within the same block or in subsequent blocks
7. The consensus protocol guarantees its execution

This pipeline is executed by all validators and happens as part of the chain's native execution logic.

---

## How Trigr Works

Trigr is the **first application** built specifically for Rialo's reactive transaction paradigm.

### User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            TRIGR USER JOURNEY                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   1. CONNECT              2. CREATE INTENT         3. SET & FORGET      │
│   ┌──────────┐           ┌──────────────────┐     ┌──────────────────┐  │
│   │  Wallet  │──────────▶│  "Sell 2 ETH if  │────▶│   Intent lives   │  │
│   │  Login   │           │   price < $2800" │     │   on blockchain  │  │
│   └──────────┘           └──────────────────┘     └──────────────────┘  │
│                                                            │            │
│                                                            ▼            │
│   4. AUTOMATIC EXECUTION                                                │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Price hits $2800 → Validators detect → TX executes → Done!    │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Supported Intent Types

| Intent Type | Description | Use Case |
|-------------|-------------|----------|
| **Market Swap** | Execute immediately at current price | "I want ETH now" |
| **Limit Order** | Buy when price drops to target | "Buy ETH when it hits $2500" |
| **Stop-Loss** | Sell when price drops below threshold | "Protect my ETH if it drops to $2800" |
| **DCA** | Recurring purchases at set intervals | "Buy $100 of BTC every week" |

These match the workflows Rialo documentation describes as **price-triggered workflows** and **time-based workflows**.

### Key Features

**Slippage Protection**

Every intent includes minimum output guarantees. If market moves too fast, the transaction reverts rather than executing at a bad price.

**Time-Based Expiration**

Intents automatically expire to prevent stale orders from executing in unexpected market conditions.

**Real-Time Price Charts**

Live price visualization helps users set realistic targets based on current market trends.

**Edit & Cancel Anytime**

Full control over your pending intents until execution.

---

## Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              TRIGR PLATFORM                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────┐                      ┌────────────────────────┐  │
│  │                    │                      │                        │  │
│  │    NEXT.JS WEB     │◀────── REST API ────▶│    EXPRESS BACKEND     │  │
│  │                    │                      │                        │  │
│  │  • Trade Interface │                      │  • Intent Management   │  │
│  │  • Dashboard       │                      │  • Authentication      │  │
│  │  • Price Charts    │                      │  • Price Oracle        │  │
│  │                    │                      │                        │  │
│  └────────────────────┘                      └───────────┬────────────┘  │
│                                                          │               │
│                                                          ▼               │
│                               ┌──────────────────────────────────────┐   │
│                               │                                      │   │
│                               │      REACTIVE EXECUTION ENGINE       │   │
│                               │                                      │   │
│                               │  • Event-Driven Architecture         │   │
│                               │  • Priority Queue (High→Low)         │   │
│                               │  • Predicate Evaluation              │   │
│                               │  • Slippage Validation               │   │
│                               │  • Expiration Handling               │   │
│                               │                                      │   │
│                               └───────────────┬──────────────────────┘   │
│                                               │                          │
│               ┌───────────────────────────────┼───────────────────────┐  │
│               │                               │                       │  │
│               ▼                               ▼                       ▼  │
│  ┌────────────────────┐      ┌────────────────────────┐  ┌────────────┐  │
│  │                    │      │                        │  │            │  │
│  │    POSTGRESQL      │      │    PRICE ORACLE        │  │  RIALO     │  │
│  │    (Prisma ORM)    │      │    (CoinGecko API)     │  │  NETWORK   │  │
│  │                    │      │                        │  │            │  │
│  │  • Users           │      │  • ETH, BTC, SOL       │  │  Planned   │  │
│  │  • Intents         │      │  • Real-time prices    │  │  Mainnet   │  │
│  │  • Executions      │      │  • Price history       │  │  Release   │  │
│  │                    │      │                        │  │            │  │
│  └────────────────────┘      └────────────────────────┘  └────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14, React 18 | Server-side rendering, optimized UX |
| **Styling** | Custom CSS | Premium design with cream & burgundy palette |
| **Backend** | Express.js, TypeScript | Type-safe API development |
| **Database** | PostgreSQL, Prisma ORM | Reliable data persistence |
| **Validation** | Zod schemas | Runtime type safety |
| **Auth** | JWT + Refresh Tokens | Secure, stateless authentication |
| **Oracle** | CoinGecko API | Real-time price feeds (development) |

### Project Structure

```
trigr/
├── apps/
│   ├── api/                    # Backend API
│   │   ├── src/
│   │   │   ├── routes/         # REST endpoints
│   │   │   ├── services/       # Business logic
│   │   │   │   ├── intent.service.ts
│   │   │   │   ├── oracle.service.ts
│   │   │   │   ├── reactive-engine.service.ts
│   │   │   │   └── auth.service.ts
│   │   │   ├── middleware/     # Auth, rate limiting
│   │   │   └── lib/            # Utilities
│   │   └── prisma/             # Database schema
│   │
│   └── web/                    # Frontend
│       ├── app/
│       │   ├── page.tsx        # Landing
│       │   ├── dashboard/      # User dashboard
│       │   └── trade/          # Trading interface
│       └── components/         # Reusable UI
│
├── packages/
│   └── shared/                 # Shared types, schemas
│
└── docs/                       # Documentation
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 16+ (or Docker)

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd trigr

# Install dependencies
pnpm install

# Set up environment
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# Start database (Docker)
docker-compose up -d

# Run database migrations
cd apps/api && pnpm prisma migrate dev && pnpm prisma db seed

# Start development servers (in separate terminals)
cd apps/api && pnpm dev    # API on :3001
cd apps/web && pnpm dev    # Web on :3000
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/trigr"

# JWT Authentication
JWT_SECRET="your-secret-key-min-32-characters"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# API Configuration
API_PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

---

## Security

### Implemented Protections

| Protection | Implementation |
|------------|----------------|
| **Password Security** | bcrypt hashing (cost factor 10) |
| **Authentication** | JWT with short-lived access tokens + refresh tokens |
| **Input Validation** | Zod schemas on all API inputs |
| **Price Validation** | Max 10% deviation from market price |
| **Slippage Protection** | Automatic minimum output calculation |

---

## Development Status

Trigr is currently in active development.

| Component | Status | Notes |
|-----------|--------|-------|
| Intent Management | Complete | CRUD operations, validation |
| Reactive Engine | Complete | Event-driven execution simulation |
| Price Oracle | Complete | CoinGecko integration (development) |
| Authentication | Complete | JWT + refresh tokens |
| Web Interface | Complete | Full trading UI |
| Rialo Integration | Planned | Awaiting mainnet and SDK availability |

### Future Development

Mainnet Preparation:

- Native Rialo wallet integration
- On-chain predicate submission
- Validator-attested price oracles (replacing CoinGecko)
- Native timer triggers for DCA
- Multi-hop swap routing

---

## Testing

```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run E2E tests (Playwright)
pnpm test:e2e
```

---

## References

- [Reactive Transactions: A Model for Native Automation on Rialo](https://www.rialo.io/posts/reactive-transactions-a-model-for-native-automation-on-rialo)
- [Rialo Learn: Reactive Transactions](https://reactive-transactions.learn.rialo.io/)
- [Rialo Learn: Recurring Payments](https://www.rialo.io/learn/rialo-recurring-payments)
- [Rialo Documentation](https://www.rialo.io/docs)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built for Rialo Network</strong>
</p>

<p align="center">
  <em>Where the blockchain becomes your keeper</em>
</p>
