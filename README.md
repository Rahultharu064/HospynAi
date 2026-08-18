# HospynAI

**An AI-first Hospital Operating System** — patient records, scheduling, billing, and a 24/7 AI voice/calling agent, backed by blockchain-anchored medical record integrity.

[![Backend CI](https://github.com/Rahultharu064/HospynAi/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/Rahultharu064/HospynAi/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/Rahultharu064/HospynAi/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/Rahultharu064/HospynAi/actions/workflows/frontend-ci.yml)
[![Blockchain CI](https://github.com/Rahultharu064/HospynAi/actions/workflows/blockchain-ci.yml/badge.svg)](https://github.com/Rahultharu064/HospynAi/actions/workflows/blockchain-ci.yml)

HospynAI digitizes end-to-end hospital operations — patient intake, appointment and queue management, electronic medical records, billing, and staff administration — and layers AI on top of it: a tool-calling AI agent that can actually book appointments and look up records instead of just describing what it would do, and an AI phone agent that answers calls, remembers the conversation, and hands off to a human when it should. Every medical record write can be anchored to Polygon for a tamper-evident audit trail.

---

## Table of contents

- [Why this project](#why-this-project)
- [Feature highlights](#feature-highlights)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Testing & CI](#testing--ci)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Why this project

Most hospital software either digitizes paperwork or bolts a chatbot onto the front page. HospynAI tries to do the harder thing: give the AI layer real write access to the same services a receptionist or nurse uses, gated by the same role-based permissions, with every action logged. A patient calling in isn't talking to a scripted IVR tree — the calling agent classifies intent, keeps a running transcript across the call, and can genuinely check a doctor's open slots. A "smart" hospital dashboard shouldn't ship four stat tiles and nothing else, so the operator dashboard here surfaces the actual day's schedule and real trend data instead of static shortcuts.

## Feature highlights

### Core hospital operations
- **Auth & RBAC** — JWT access/refresh tokens (httpOnly refresh cookie), email/OTP verification, Google OAuth, 8 distinct roles (`SUPER_ADMIN`, `ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `PHARMACIST`, `LAB_TECHNICIAN`, `PATIENT`) enforced at the route level
- **Patient management** — full profile lifecycle, soft-delete (GDPR-style erasure), document uploads via Cloudinary, search with pagination/filtering
- **Doctor scheduling** — recurring weekly availability, break windows, per-slot duration, conflict detection on booking
- **Appointments & live queue** — real-time slot availability computed from doctor schedules and existing bookings, reschedule/cancel with audit trail, walk-in queue tokens, a live "call next" queue board
- **Electronic Medical Records** — versioned records (every edit creates a new version, prior versions retained), prescriptions, lab reports, blockchain hash anchoring per write
- **Billing** — invoice generation, payment tracking and reconciliation, refund workflow
- **Inventory** — stock tracking for pharmacy/lab consumables
- **Notifications** — email (SendGrid) and SMS (Twilio) delivery with per-user preferences and retry on failure; the backend also emits events over Socket.io for real-time in-app delivery
- **Telemedicine** — backend Socket.io signaling for video sessions with in-session chat (see [Roadmap](#roadmap) — no frontend video UI yet)
- **Admin console** — organization/branch/staff management, audit log viewer, system health

### AI & automation
- **Agentic AI assistant** (`/api/v1/ai/chat`) — real LLM function-calling (not keyword matching) over a toolset that actually executes: books appointments through the real scheduling service, pulls a patient's demographics *and* recent medical records, screens a proposed drug against a patient's current medications, runs symptom triage, drafts prescriptions for physician sign-off, and sends notifications. Multi-turn conversation memory is loaded from prior session turns, not just the last message.
- **24/7 AI calling agent** — Twilio Voice + an OpenAI-compatible LLM (Groq by default) for inbound/outbound calls: intent classification, emergency detection with automatic escalation, low-confidence handoff to a human agent, and a running per-call transcript so the agent has context turn-to-turn instead of amnesia between webhook round-trips. Full call logging — recordings, transcripts, outcomes, duration.
- **RAG knowledge engine** — document ingestion (FAQ/policy/guide/research) chunked and searched via PostgreSQL full-text search with a keyword-match fallback; no external vector DB required for this path
- **AI memory layer** — long-term patient/user memory embedded and stored in Qdrant, retrieved by semantic similarity to personalize agent responses
- **OCR document scanner** — Tesseract + OpenCV pipeline for digitizing prescriptions, lab reports, and insurance cards

### Blockchain medical security
Four Solidity contracts (OpenZeppelin `Ownable`/`Pausable`/`ReentrancyGuard`), deployed to Polygon:
- **`MedicalRecordAnchor`** — anchors SHA-256 hashes of medical records with revocation support and optional per-anchor fees, gated to authorized providers
- **`PatientConsent`** — on-chain consent grants/revocations/updates, gated to authorized providers only
- **`PrescriptionVerifier`** — prescription lifecycle (create → dispense → cancel) gated separately to authorized doctors and pharmacies
- **`MedicalDataRegistry`** — a unified audit-trail registry with a self-service-but-admin-revocable provider directory

Every contract has a full Mocha/Chai test suite, including regression tests for each access-control fix, and compiles/tests on every PR via `blockchain-ci.yml`.

### Frontend
- Angular 21, standalone components + signals (no NgRx), Tailwind CSS on a custom design-token system (navy/teal/indigo palette, Sora/DM Sans/JetBrains Mono type scale)
- Role-aware operator dashboard: live "today's schedule" panel, weekly appointment-volume trend, animated stat tiles, fully responsive with a proper off-canvas mobile nav drawer
- A separate marketing/landing site with its own dark "operations console" aesthetic and a signature animated SVG heartbeat motif
- Functional interceptors/guards, reactive forms, `ng lint` with template accessibility rules enforced in CI

## Architecture

```
┌─────────────────────┐      ┌──────────────────────────┐      ┌────────────────────┐
│      frontend        │      │          backend          │      │     blockchain      │
│  Angular 21 SPA       │◄────►│  Express + TypeScript      │◄────►│  Solidity / Polygon  │
│  Tailwind, signals     │ REST │  Prisma → PostgreSQL       │ ethers│  Hardhat + OpenZeppelin│
└─────────────────────┘      │  Redis (sessions/cache)    │      └────────────────────┘
                              │  Socket.io (real-time)     │
                              │  Groq/OpenAI/Anthropic LLM │
                              │  Twilio (voice + SMS)      │
                              │  Qdrant (memory vectors)   │
                              └──────────────────────────┘
```

Each of the three top-level projects (`backend/`, `frontend/`, `blockchain/`) is independently installable, testable, and has its own CI workflow — there is no shared build step between them.

## Tech stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js, Express, TypeScript |
| Database / ORM | PostgreSQL, Prisma |
| Cache / sessions | Redis (ioredis) |
| Real-time | Socket.io |
| Auth | JWT (access + refresh), Passport (Google OAuth), bcrypt |
| LLM | Groq (OpenAI-compatible, primary), OpenAI/Anthropic available as fallback models |
| Voice | Twilio Voice + TwiML, Groq Whisper for transcription |
| Vector search | Qdrant (AI memory), PostgreSQL full-text search (RAG) |
| OCR | Tesseract.js, OpenCV |
| File storage | Cloudinary |
| Email / SMS | SendGrid, Twilio |
| Frontend | Angular 21, TypeScript, Tailwind CSS, RxJS |
| Smart contracts | Solidity ^0.8.19, OpenZeppelin Contracts 4.9, Hardhat 2, ethers v6 |
| Target chain | Polygon (Amoy testnet + mainnet) |
| CI | GitHub Actions (typecheck, lint, build, contract tests — one workflow per project) |

## Project structure

```
HospynAi/
├── backend/                 Express API
│   ├── src/
│   │   ├── modules/          One folder per domain: auth, patient, appoinment, emr,
│   │   │                     billing, doctor, notifications, aiagent, callingAgent,
│   │   │                     blockchain, memory, inventory, admin, ocr, telemedicine,
│   │   │                     chatbot, analytics
│   │   ├── integration/      External service clients (AI/LLM, Twilio, blockchain, OCR)
│   │   ├── middleware/       Auth, validation, rate limiting, error handling, compliance
│   │   └── config/           Environment loading and typed config
│   └── prisma/schema.prisma  Full data model
├── frontend/                 Angular 21 SPA
│   └── src/app/
│       ├── core/              Auth service, guards, interceptors, models
│       ├── layout/             Shell, sidebar, topbar
│       ├── shared/              Reusable UI components, directives, utils
│       └── features/             auth, dashboard, patients, appointments, emr, billing,
│                                 admin, analytics, settings, marketing
├── blockchain/                Solidity contracts + Hardhat project
│   ├── contracts/               The 4 contracts + interfaces
│   ├── test/                     Mocha/Chai test suites (one per contract)
│   └── scripts/deploy.ts          Sequential multi-contract deploy script
└── .github/workflows/          backend-ci.yml, frontend-ci.yml, blockchain-ci.yml
```

## Getting started

### Prerequisites
- Node.js 20+
- PostgreSQL (for the backend)
- Redis (for the backend)
- npm

### Backend

```bash
cd backend
npm install
cp .env.example .env        # fill in DATABASE_URL, REDIS_URL, JWT secrets, etc. — see below
npx prisma generate
npx prisma migrate dev
npm run dev                  # http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm start                    # http://localhost:4200 — calls the API directly at the
                              # apiUrl configured in src/environments/environment.ts
                              # (defaults to http://localhost:5000/api/v1)
```

### Blockchain

```bash
cd blockchain
npm install
cp .env.example .env         # deployer key, RPC URLs — never commit real values here
npm run compile
npm test
npm run deploy:local         # against a local `npm run node` Hardhat chain
```

## Environment variables

The backend reads its configuration from `backend/src/config/env.ts`. At minimum you'll need:

| Variable | Purpose |
|---|---|
| `PORT` | Backend port — defaults to `5000`, which is what the frontend's `environment.ts` expects |
| `FRONTEND_URL` | Origin allowed by CORS and used for the Google OAuth redirect — defaults to `http://localhost:4200` (the Angular dev server) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Token signing secrets |
| `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_BASE_URL` | Primary LLM provider for chat, the AI agent, and intent classification |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Calling agent + SMS |
| `SENDGRID_API_KEY`, `FROM_EMAIL` | Transactional email |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Document/image uploads |
| `BLOCKCHAIN_ENABLED`, `BLOCKCHAIN_RPC_URL`, `BLOCKCHAIN_PRIVATE_KEY` | On-chain anchoring — safe to leave disabled locally |
| `MEDICAL_RECORD_ANCHOR_ADDRESS`, `PATIENT_CONSENT_ADDRESS`, `PRESCRIPTION_VERIFIER_ADDRESS`, `MEDICAL_DATA_REGISTRY_ADDRESS` | Deployed contract addresses (printed by `blockchain/scripts/deploy.ts`) |

`blockchain/.env` needs its own `BLOCKCHAIN_PRIVATE_KEY`, `POLYGON_AMOY_RPC` / `POLYGON_MAINNET_RPC`, and `POLYGONSCAN_API_KEY` — see `blockchain/README.md` for the full list. **Never commit either `.env` file** — both directories `.gitignore` them, with `.env.example` tracked instead.

## Testing & CI

Every push/PR triggers the relevant workflow:

| Workflow | Checks |
|---|---|
| `backend-ci.yml` | `tsc --noEmit`, ESLint, `npm run build` |
| `frontend-ci.yml` | `ng lint` (incl. template a11y rules), `ng build` |
| `blockchain-ci.yml` | Hardhat compile, full Mocha/Chai contract test suite, contract size check |

Run any of them locally with `npm run lint` / `npm run build` / `npm test` from the relevant directory.

## Security

- Role-based access control enforced at the Express route layer, not just in the UI
- Every smart contract write path (consent, anchoring, prescriptions, audit records) requires an explicitly authorized address or the contract owner — verified with regression tests
- Twilio webhook signatures are validated in production; suspicious/invalid signatures are audit-logged
- Structured audit logging (`AuditService`) on authentication, patient data access, and call/AI agent actions
- `/health` reports real dependency status (Postgres + Redis reachability), not a hardcoded "healthy"

If you find a security issue, please open a private report rather than a public issue.

## Roadmap

Things that exist in the codebase but aren't fully wired into the live request path yet, tracked here for transparency rather than left silently half-built:
- A LangGraph-based multi-agent orchestration layer (`langraphClient.ts`) with an OpenAI/Anthropic LLM fallback chain (`llmFactory.ts`) is implemented but not yet the default agent runtime
- Live third-party payment gateway processing (Stripe/Khalti/eSewa) — invoicing and payment tracking work today; gateway checkout is not yet integrated
- EMR PDF export currently returns a stub URL; real PDF generation is not yet implemented
- The backend's Socket.io layer (notifications, telemedicine signaling, chatbot) is complete, but the Angular frontend doesn't have a `socket.io-client` connection wired up yet — so real-time delivery and the video-call UI aren't visible in the app today
- No push notifications to a mobile/browser push provider (e.g. Firebase) — only email, SMS, and the in-app WebSocket channel above

## Contributing

Issues and PRs are welcome. Before opening a PR:
1. Run the relevant project's lint/build/test commands locally (see [Testing & CI](#testing--ci))
2. Keep changes scoped to one project (`backend/`, `frontend/`, or `blockchain/`) per PR where possible
3. For anything touching the smart contracts or auth/RBAC, please explain the security implications in the PR description

## License

No license file is published in this repository yet — treat the code as all-rights-reserved until one is added.
