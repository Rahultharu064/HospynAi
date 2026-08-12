# VoiceMed Pro
## Product Requirements Document — v2.0

> **Product:** VoiceMed Pro — AI-Powered Hospital Operating System
> **Version:** 2.0 | **Status:** Final Draft | **Classification:** Confidential
> **Type:** B2B SaaS Healthcare Platform | **Prepared By:** Product & Design Team
> **Last Updated:** 2025

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Stakeholders & User Roles](#3-stakeholders--user-roles)
4. [Functional Requirements](#4-functional-requirements)
   - 4.1 Authentication & Security
   - 4.2 Patient Management
   - 4.3 Doctor Management
   - 4.4 Appointment & Queue
   - 4.5 Electronic Medical Records (EMR)
   - 4.6 AI Voice Assistant
   - 4.7 24/7 AI Calling Agent
   - 4.8 Agentic AI Layer
   - 4.9 RAG Knowledge Engine
   - 4.10 AI Memory Layer
   - 4.11 Blockchain Medical Security
   - 4.12 Billing & Payments
   - 4.13 Telemedicine
   - 4.14 Notifications Engine
   - 4.15 Analytics Dashboard
   - 4.16 OCR Document Scanner
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [System Architecture](#6-system-architecture)
7. [Database Schema](#7-database-schema)
8. [UI/UX Design System](#8-uiux-design-system)
   - 8.1 Design Philosophy & Aesthetic Direction
   - 8.2 Complete Color System
   - 8.3 Typography System
   - 8.4 Spacing & Layout Grid
   - 8.5 Component Design Specifications
   - 8.6 Alignment & Composition Rules
   - 8.7 Iconography System
   - 8.8 Motion & Animation
   - 8.9 Dark Mode System
   - 8.10 Application Pages & Layout Specifications
   - 8.11 Responsive Design System
   - 8.12 Accessibility Specifications
   - 8.13 Design Tokens — Master Reference
9. [Product Roadmap](#9-product-roadmap)
10. [Testing Requirements](#10-testing-requirements)
11. [Success Metrics (KPIs)](#11-success-metrics-kpis)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [Appendix: Glossary](#appendix-glossary)

---

## 1. Executive Summary

VoiceMed Pro is a startup-grade, enterprise-ready **Hospital Operating System (Hospital OS)** that digitally transforms hospitals, clinics, and multi-branch healthcare providers through a unified, AI-first platform.

### 1.1 Core Value Proposition

| Capability | Technology | User Benefit | Business Impact |
|---|---|---|---|
| Agentic AI | LangGraph / LangChain | Autonomous task execution | Reduced manual workload |
| Voice AI | OpenAI Whisper + GPT-4o | Hands-free interaction | Faster patient intake |
| 24/7 AI Calling | Twilio | Always-available support | 50% fewer missed calls |
| RAG Engine | Vector DB + LLM | Accurate, grounded answers | Higher AI reliability |
| AI Memory | Qdrant | Personalized care | Improved patient retention |
| Blockchain Security | Polygon / Solidity | Tamper-proof records | Regulatory compliance |

### 1.2 Strategic Goals

- Digitize end-to-end hospital operations from patient intake to discharge
- Automate front-desk workflows, reducing manual booking by **70%**
- Enable 24/7 patient support via AI voice and calling agents
- Secure medical records with blockchain-backed, immutable verification
- Improve operational efficiency and support scalable, multi-tenant delivery

---

## 2. Product Overview

### 2.1 Product Identity

| Attribute | Value |
|---|---|
| Product Name | VoiceMed Pro |
| Product Type | B2B SaaS Healthcare Platform (Hospital Operating System) |
| Target Market | Hospitals, clinics, multi-branch healthcare providers, telemedicine platforms |
| Deployment | Cloud-native — Vercel + Render + AWS S3, multi-tenant, multi-branch |
| Licensing Model | Subscription-based SaaS with tiered plans per organization |
| Compliance Targets | HIPAA, GDPR, WCAG 2.1 AA, OWASP Top-10 |

### 2.2 Problem Statement

Healthcare institutions globally face persistent operational challenges that directly impact patient outcomes and institutional efficiency:

- Manual appointment booking and queue management cause patient wait-time frustration
- Missed calls and unavailable front-desk staff lead to lost appointments and revenue
- Fragmented medical record systems increase risk of data loss and compliance violations
- Lack of intelligent decision support for clinical workflows slows doctor productivity
- Paper-based or legacy EMR systems prevent scalability and data-driven improvement

### 2.3 Solution Overview

VoiceMed Pro addresses these challenges through a unified, AI-first Hospital Operating System integrating:

- Intelligent voice and agentic AI for autonomous workflow automation
- A 24/7 AI calling layer that never misses a patient interaction
- Blockchain-anchored medical records ensuring immutability and auditability
- A RAG-powered knowledge engine for grounded, contextual AI responses
- Long-term AI memory for personalized patient and doctor interactions

---

## 3. Stakeholders & User Roles

### 3.1 Primary Stakeholders

| Stakeholder | Role in System | Primary Concerns |
|---|---|---|
| Patient | End-user of healthcare services | Ease of booking, record access, privacy |
| Doctor / Physician | Clinical decision-maker | Efficient EMR, prescription tools, schedule |
| Nurse | Patient care support | Quick record updates, patient status |
| Receptionist | Front-desk operations | Appointment management, queue control |
| Pharmacist | Medication dispensing | Prescription accuracy, inventory |
| Lab Technician | Diagnostic support | Report upload, result tracking |
| Hospital Admin | Operational oversight | Analytics, staff management, billing |
| Super Admin | Multi-tenant platform control | Organization provisioning, compliance |
| Hospital Owner | Strategic and financial oversight | Revenue, KPIs, platform ROI |

### 3.2 Role-Based Access Control Matrix

| Permission | Patient | Doctor | Nurse | Recept. | Admin | Sup.Admin | Owner |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Book Appointments | ✓ | — | — | ✓ | ✓ | ✓ | ✓ |
| Manage Patients | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Write Prescriptions | — | ✓ | — | — | — | ✓ | ✓ |
| View Own Records | ✓ | — | — | — | — | ✓ | ✓ |
| Access Analytics | — | ✓ | — | — | ✓ | ✓ | ✓ |
| View Blockchain Records | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage Staff | — | — | — | — | ✓ | ✓ | ✓ |
| Manage Organizations | — | — | — | — | ✓ | ✓ | ✓ |
| Platform Super Control | — | — | — | — | — | ✓ | ✓ |
| Financial Reports | — | — | — | — | ✓ | ✓ | ✓ |

---

## 4. Functional Requirements

### 4.1 Authentication & Security
**Priority:** Critical | **Module ID:** FR-AUTH | **Phase:** 1

#### Features
- User registration with email and phone number verification
- Secure login / logout with session invalidation
- OTP-based two-factor authentication (SMS + email)
- Forgot password and secure reset password flows
- JWT-based stateless authentication with refresh token rotation
- Role-Based Access Control (RBAC) with fine-grained permissions
- Comprehensive audit logging for all user actions and data access
- Secure HttpOnly, SameSite, Secure cookies with CSRF protection
- IP-based rate limiting and brute-force attack prevention
- Session management with concurrent session controls

#### API Endpoints

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/auth/register` | POST | No | Register new user with role assignment |
| `/auth/login` | POST | No | Authenticate, return JWT + refresh token |
| `/auth/logout` | POST | Yes | Invalidate session and revoke tokens |
| `/auth/verify-otp` | POST | Partial | Verify OTP for 2FA or email confirmation |
| `/auth/refresh` | POST | No | Rotate refresh token for new access token |
| `/auth/forgot-password` | POST | No | Trigger password reset email flow |
| `/auth/reset-password` | POST | No | Set new password with valid reset token |
| `/auth/me` | GET | Yes | Retrieve authenticated user profile and permissions |

#### Database Tables
- `users`, `roles`, `sessions`, `audit_logs`

---

### 4.2 Patient Management
**Priority:** Critical | **Module ID:** FR-PAT | **Phase:** 1

#### Features
- Complete patient profile lifecycle: registration, update, soft-delete
- Insurance information storage and management
- Longitudinal medical history with chronological versioning
- Secure document and report uploads (PDF, DICOM, JPEG, PNG)
- Patient search with advanced filtering, sorting, and pagination
- Duplicate patient detection on registration

#### API Endpoints

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/patients` | GET | Yes | List patients with filters, sort, paginate |
| `/patients` | POST | Yes | Register new patient with full profile |
| `/patients/:id` | GET | Yes | Retrieve single patient detail |
| `/patients/:id` | PATCH | Yes | Selective patient profile update |
| `/patients/:id` | DELETE | Yes | Soft-delete (GDPR compliant) |
| `/patients/:id/documents` | POST | Yes | Upload patient document to S3 |

#### Database Tables
- `patients`

---

### 4.3 Doctor Management
**Priority:** High | **Module ID:** FR-DOC | **Phase:** 1

#### Features
- Doctor profile with credentials, specialization, biography, and fees
- Dynamic availability scheduling with recurring schedule support
- Multi-timezone support for telemedicine consultations
- Consultation fee configuration per appointment type and channel
- Doctor-patient assignment and transfer workflows
- Doctor search by specialty, availability, and location

#### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/doctors` | GET | List doctors with specialty and availability filters |
| `/doctors` | POST | Register new doctor profile |
| `/doctors/:id` | GET | Get doctor profile and availability |
| `/doctors/:id` | PATCH | Update profile, schedule, or fees |
| `/doctors/:id/schedule` | GET | Get doctor's availability slots |
| `/doctors/:id/schedule` | PUT | Set or override availability schedule |

#### Database Tables
- `doctors`

---

### 4.4 Appointment & Queue Management
**Priority:** Critical | **Module ID:** FR-APT | **Phase:** 1

#### Features
- Online appointment booking with real-time slot availability
- Appointment rescheduling and cancellation with policy enforcement
- Auto-generated queue tokens with estimated wait times
- Live waitlist management with dynamic queue position updates
- Booking conflict detection and prevention at submission time
- Automated reminders via SMS, email, and voice call
- Walk-in patient queue support with instant token generation

#### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/appointments` | POST | Create appointment with slot validation |
| `/appointments` | GET | List appointments by patient, doctor, or date |
| `/appointments/:id` | GET | Get single appointment detail |
| `/appointments/:id` | PATCH | Reschedule or cancel an appointment |
| `/queue` | GET | Retrieve current live queue and token status |
| `/queue/token` | POST | Generate walk-in queue token |

#### Database Tables
- `appointments`

---

### 4.5 Electronic Medical Records (EMR)
**Priority:** Critical | **Module ID:** FR-EMR | **Phase:** 2

#### Features
- Structured prescription creation with drug interaction alerting
- Diagnosis entry with ICD-10 code autocomplete support
- Complete treatment history with immutable audit trail
- Lab report upload, linking, and digital annotation tools
- Downloadable and printable EMR summary as formatted PDF
- Version-controlled record history with change attribution
- Blockchain hash anchoring for every record write

#### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/emr` | POST | Create new medical record entry |
| `/emr/:patientId` | GET | Retrieve complete EMR history |
| `/emr/:id` | PATCH | Append update to existing record |
| `/emr/:id/pdf` | GET | Generate downloadable PDF summary |
| `/emr/:id/labs` | POST | Attach lab report to EMR record |

#### Database Tables
- `medical_records`

---

### 4.6 AI Voice Assistant
**Priority:** High | **Module ID:** FR-VOI | **Phase:** 2

#### Features
- Real-time speech-to-text transcription via OpenAI Whisper
- Voice-driven appointment booking and cancellation
- Symptom description intake using natural language
- Medical report and prescription explanation in plain language
- Multilingual support for regional healthcare accessibility
- Voice command history and transcript storage

#### Technology Stack
- **STT:** OpenAI Whisper (multilingual)
- **NLU + Generation:** OpenAI GPT-4o with system prompt tuning
- **Audio Format:** WebM, MP3, WAV, M4A supported

#### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/voice/transcribe` | POST | Convert audio blob to text via Whisper |
| `/voice/process` | POST | Process text through AI intent classification |
| `/voice/history/:patientId` | GET | Retrieve voice interaction history |

#### Database Tables
- `voice_logs`

---

### 4.7 24/7 AI Calling Agent
**Priority:** High | **Module ID:** FR-CALL | **Phase:** 2

#### Features
- Automated inbound call answering with NLU
- AI-driven appointment booking and rescheduling over voice
- FAQ handling for common patient inquiries
- Intelligent emergency detection and escalation routing
- Seamless human handoff when AI confidence score is low
- Outbound automated reminder and follow-up calls
- Full call logging: recordings, transcripts, outcomes, duration

#### Technology Stack
- **Calling Infrastructure:** Twilio Voice API + TwiML
- **NLU:** OpenAI GPT-4o with tool-use for system actions
- **STT/TTS:** Twilio + OpenAI Whisper hybrid

#### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/calls/incoming` | POST | Twilio webhook for inbound call handling |
| `/calls/outgoing` | POST | Trigger outbound reminder or follow-up call |
| `/calls/logs` | GET | Paginated call log history with filters |
| `/calls/:id/transcript` | GET | Retrieve transcript for a specific call |

#### Database Tables
- `call_logs`

---

### 4.8 Agentic AI Layer
**Priority:** High | **Module ID:** FR-AGENT | **Phase:** 4

#### Features
- Autonomous multi-step task orchestration without human triggers
- Tool-calling across all system modules (scheduling, EMR, billing)
- Intelligent workflow execution with conditional branching
- AI-driven recommendations for appointments and follow-ups
- Clinical decision support with evidence-based reasoning
- Agent memory persistence via long-term memory layer
- Agent action audit trail for compliance

#### Technology Stack
- **Orchestration:** LangGraph (stateful multi-actor graphs)
- **Tool Execution:** LangChain tool-calling framework
- **Reasoning Model:** OpenAI GPT-4o with function calling

#### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/ai/chat` | POST | Submit message to agentic AI assistant |
| `/ai/tool` | POST | Trigger specific AI tool execution |
| `/ai/history` | GET | Retrieve agent conversation and action history |
| `/ai/agents` | GET | List active agent tasks and their status |

#### Database Tables
- `agent_logs`

---

### 4.9 RAG Knowledge Engine
**Priority:** High | **Module ID:** FR-RAG | **Phase:** 4

#### Features
- Hospital-specific FAQ ingestion and retrieval pipeline
- Medical knowledge base for condition and treatment queries
- Doctor schedule and availability retrieval for accurate AI responses
- Citation-backed, grounded responses preventing AI hallucination
- Multi-format document ingestion: PDF, DOCX, HTML, plain text
- Knowledge base versioning and document management UI

#### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/rag/upload` | POST | Ingest document into the RAG knowledge base |
| `/rag/query` | POST | Query with natural language, return grounded answer |
| `/rag/documents` | GET | List all ingested knowledge base documents |
| `/rag/documents/:id` | DELETE | Remove document from knowledge base |

#### Database Tables
- `rag_documents`

---

### 4.10 AI Memory Layer
**Priority:** Medium | **Module ID:** FR-MEM | **Phase:** 4

#### Features
- Long-term patient interaction memory across all sessions
- Doctor preference memory for personalized workflow suggestions
- Conversation context memory for coherent multi-turn dialogues
- Personalized follow-up generation based on patient history
- Memory management controls: view, edit, delete stored memories
- Semantic memory retrieval using vector similarity search

#### Technology Stack
- **Vector Database:** Qdrant (managed cloud cluster)
- **Embedding Model:** OpenAI `text-embedding-3-small`

#### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/memory/save` | POST | Persist new memory entry to vector store |
| `/memory/:patientId` | GET | Retrieve relevant memories for a patient |
| `/memory/:id` | DELETE | Remove a specific memory entry |

#### Database Tables
- `ai_memories`, `conversation_history`

---

### 4.11 Blockchain Medical Security
**Priority:** High | **Module ID:** FR-CHAIN | **Phase:** 3

#### Features
- SHA-256 hash generation for every medical record write
- Immutable audit trail anchored to the Polygon blockchain
- Decentralized record verification accessible to authorized parties
- Patient consent management with blockchain-backed consent logs
- Tamper detection with hash mismatch alerting
- Smart contract event logging for regulatory audit trails

#### Technology Stack
- **Network:** Polygon (EVM-compatible Layer-2)
- **Smart Contracts:** Solidity
- **Development:** Hardhat + ethers.js
- **Testnet:** Polygon Amoy

#### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/blockchain/hash` | POST | Generate and anchor record hash on-chain |
| `/blockchain/verify` | POST | Verify record hash against on-chain anchor |
| `/blockchain/logs/:patientId` | GET | Get patient's blockchain audit trail |

#### Database Tables
- `blockchain_records`

---

### 4.12 Billing & Payments
**Priority:** High | **Module ID:** FR-BILL | **Phase:** 1

#### Features
- Automated invoice generation per consultation and service
- Multi-gateway payment processing: Stripe, Khalti, eSewa
- Refund management with approval workflows and audit trail
- Subscription billing for SaaS organizational plans
- Financial reports and revenue reconciliation dashboards
- Payment receipt generation (PDF)

#### Database Tables
- `payments`, `subscriptions`

---

### 4.13 Telemedicine
**Priority:** Medium | **Module ID:** FR-TELE | **Phase:** 4

#### Features
- WebRTC-powered HD video consultation (doctor ↔ patient)
- Real-time in-session chat with file sharing capability
- Medical image and report sharing during video calls
- Session recording with consent-gated S3 storage
- Session quality metrics and reliability monitoring

#### Technology Stack
- **Video:** WebRTC (peer-to-peer)
- **Signaling:** Node.js + Socket.io
- **Recording:** AWS S3

---

### 4.14 Notifications Engine
**Priority:** High | **Module ID:** FR-NOTIF | **Phase:** 1

#### Delivery Channels

| Channel | Provider | Use Cases |
|---|---|---|
| SMS | Twilio SMS | Appointment reminders, OTP, alerts |
| Email | SendGrid / AWS SES | Confirmations, reports, billing |
| Push | Firebase FCM | Real-time dashboard alerts |
| Voice Call | Twilio Voice | Pre-appointment call reminders |

#### Features
- Appointment reminders at configurable intervals (24hr, 1hr, 15min)
- System alerts for critical events (failed AI calls, payment issues)
- User notification preference management per channel
- Notification delivery status tracking and retry logic

#### Database Tables
- `notifications`

---

### 4.15 Analytics Dashboard
**Priority:** Medium | **Module ID:** FR-ANALY | **Phase:** 3

#### Features
- Patient trend visualization: demographics, visit frequency, condition distribution
- Revenue analytics: daily, monthly, specialty-wise breakdowns
- AI usage metrics: voice interactions, call success rate, agent task completion
- Missed call and escalation rate tracking with root cause tagging
- Operational KPI dashboards configurable per role
- Exportable reports (PDF, CSV) for administrative use

---

### 4.16 OCR Document Scanner
**Priority:** Low | **Module ID:** FR-OCR | **Phase:** 3

#### Features
- Prescription digitization from scanned physical documents
- Lab report and insurance card OCR field extraction
- Structured field extraction mapped to EMR data schemas
- Accuracy validation UI for reviewing and correcting OCR output

#### Technology Stack
- **OCR Engine:** Tesseract OCR
- **Pre-processing:** OpenCV (image deskew, threshold, denoise)

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Metric | Target | Notes |
|---|---|---|
| API Response Time | < 2 seconds P95 | Excluding AI inference |
| AI Inference (Chat) | < 5 seconds P90 | Streaming preferred |
| Voice Transcription | < 3 seconds | Per audio segment |
| Concurrent Users | 10,000+ | Horizontal scaling required |
| Page Load (FCP) | < 1.5 seconds | Core Web Vitals compliance |
| System Uptime | 99.9% SLA | < 8.7 hours/year downtime |
| Database Query | < 200ms P95 | With proper indexing |

### 5.2 Security

- Bcrypt password hashing with adaptive cost factor (minimum 12 rounds)
- HTTPS-only with TLS 1.3 enforcement across all endpoints
- HttpOnly, Secure, SameSite=Strict cookies
- RBAC enforced at API middleware and database row level
- Comprehensive audit logs for all data access and mutations
- Blockchain-verified record integrity with tamper alerting
- OWASP Top-10 vulnerability mitigation across all layers
- Automated SAST scanning in CI pipeline

### 5.3 Compliance & Privacy

- HIPAA-compliant data handling, storage, and access controls
- GDPR-ready data export, deletion, and consent management workflows
- AES-256 encryption at rest; TLS 1.3 in transit
- Data residency controls for regional compliance requirements
- PHI (Protected Health Information) data classification and handling

### 5.4 Accessibility

- WCAG 2.1 Level AA compliance across all UI surfaces
- Full keyboard navigation without mouse dependency
- Screen-reader compatibility (ARIA labels, landmark roles, semantic HTML)
- Minimum 4.5:1 color contrast ratio for normal text (3:1 for large text)
- `prefers-reduced-motion` support for animation-sensitive users
- Minimum 44×44px touch targets on all interactive elements

### 5.5 Scalability & Reliability

- Microservice-ready modular architecture supporting independent scaling
- Multi-tenant SaaS with strict organizational data isolation
- Multi-branch support under single organizational umbrella
- Automatic retry with exponential backoff for AI and external API calls
- Disaster recovery: automated PostgreSQL backups, RPO < 1 hour

---

## 6. System Architecture

### 6.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                          │
│      Angular 21 (Standalone + Signals) + Tailwind CSS        │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS / REST
┌─────────────────────────▼───────────────────────────────────┐
│                  API GATEWAY LAYER                          │
│           Node.js + Express + TypeScript                    │
│     (Auth middleware, Rate limiting, RBAC, Routing)         │
└──────┬──────────┬──────────┬──────────┬────────────────────┘
       │          │          │          │
┌──────▼──┐ ┌────▼────┐ ┌───▼────┐ ┌──▼──────────┐
│AGENTIC  │ │  VOICE  │ │  RAG   │ │  BLOCKCHAIN │
│AI LAYER │ │  LAYER  │ │ ENGINE │ │   LAYER     │
│LangGraph│ │Whisper+ │ │Vector  │ │Polygon+     │
│LangChain│ │Twilio   │ │Embed.  │ │Solidity     │
└──────┬──┘ └────┬────┘ └───┬────┘ └──┬──────────┘
       └──────────┴──────────┴─────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   MEMORY LAYER                              │
│                Qdrant Vector Database                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   DATA LAYER                                │
│          PostgreSQL + Prisma ORM + AWS S3                   │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Technology Stack

| Category | Technology | Purpose |
|---|---|---|
| Frontend | Angular 21 (standalone components + signals), Tailwind CSS, RxJS, Angular HttpClient | UI, state management, API calls |
| Backend | Node.js 20, Express 4, TypeScript 5 | REST API and business logic |
| Database | PostgreSQL 16, Prisma ORM | Relational data persistence |
| AI / LLM | OpenAI GPT-4o, Whisper v3 | Language understanding and generation |
| AI Orchestration | LangGraph, LangChain | Agentic workflow and tool calling |
| Vector Database | Qdrant Cloud | AI memory and RAG semantic retrieval |
| Calling | Twilio Voice API + TwiML | Inbound/outbound AI calling |
| Blockchain | Polygon, Solidity, Hardhat | Record hashing and verification |
| Payments | Stripe, Khalti, eSewa | Multi-gateway payment processing |
| File Storage | AWS S3 + CloudFront CDN | Binary file and media storage |
| Hosting | Vercel (Frontend), Render (Backend) | Cloud deployment |
| Notifications | Twilio SMS, SendGrid, Firebase FCM | Multi-channel alerts |
| Monitoring | Datadog, Sentry | Performance and error tracking |

### 6.3 Frontend Architecture

The Angular application (`/frontend`) is a single-page app organized around feature isolation and strict typing, mirroring the backend's module boundaries.

| Layer | Location | Responsibility |
|---|---|---|
| Core | `src/app/core` | `AuthService` (JWT access-token + httpOnly-cookie refresh flow), functional HTTP interceptors (auth attach/refresh-retry, error toasts), functional route guards (`authGuard`, `roleGuard`), shared models |
| Layout | `src/app/layout` | App shell (sidebar + topbar), auth layout, role-filtered navigation |
| Shared | `src/app/shared` | Reusable UI primitives (buttons, badges, pagination, stat cards, bar charts), form-error and validator utilities |
| Features | `src/app/features/*` | One folder per domain (`auth`, `patients`, `appointments`, `emr`, `billing`, `admin`, `analytics`, `dashboard`, `settings`), each with its own routes, services, and typed request/response models matching the backend's Express routes exactly |

**State management:** Angular signals (`signal`/`computed`) scoped per-service or per-component — no global store library. This keeps state colocated with the feature that owns it and avoids boilerplate for a domain this size; it can be swapped for NgRx later if cross-feature state sharing grows beyond what signals comfortably express.

**Styling:** Tailwind CSS, themed via `tailwind.config.js` mapped 1:1 to the design tokens in §8.13 (navy/teal/indigo palette, Sora/DM Sans/JetBrains Mono type scale, spacing and radius scale) — no separate CSS-in-JS or component library.

**Auth flow:** Access tokens are held in memory/`sessionStorage` and attached via interceptor; refresh tokens live in an httpOnly cookie set by the backend (`/api/v1/auth/refresh`) and are never touched by JS. A 401 triggers a single shared refresh call (`shareReplay`) that all concurrent failed requests wait on, then retries them — avoiding a refresh-storm on page load.

**Quality gates:** `frontend-ci.yml` runs `ng lint` (typescript-eslint + `@angular-eslint` template rules, including accessibility checks such as `label-has-associated-control` and `click-events-have-key-events`) and a production `ng build` on every PR touching `frontend/`, mirroring `backend-ci.yml`'s `tsc --noEmit` + `eslint` + build gate for the API.

---

## 7. Database Schema

### 7.1 Domain Groups & Tables

| Table | Domain | Key Relationships |
|---|---|---|
| `organizations` | Multi-tenancy | Parent of branches, users |
| `branches` | Multi-tenancy | Belongs to organization |
| `subscriptions` | Billing | Linked to organizations |
| `users` | Identity & Access | RBAC base entity |
| `roles` | Identity & Access | Assigned to users |
| `patients` | Patient Management | Links to appointments, EMR, memories |
| `doctors` | Doctor Management | Links to appointments, schedules |
| `appointments` | Scheduling | Joins patients and doctors |
| `medical_records` | EMR | Linked to patients, blockchain_records |
| `blockchain_records` | Security | Hash references to medical_records |
| `voice_logs` | Voice AI | Linked to patients and sessions |
| `call_logs` | AI Calling | Inbound/outbound call metadata |
| `payments` | Billing | Linked to appointments and patients |
| `notifications` | Messaging | Multi-channel delivery log |
| `inventory` | Pharmacy | Drug and supply management |
| `audit_logs` | Security | System-wide tamper-evident action log |
| `agent_logs` | Agentic AI | AI task execution and tool-call history |
| `ai_memories` | AI Memory | Qdrant-backed semantic memory index |
| `rag_documents` | RAG Engine | Knowledge base document registry |
| `conversation_history` | AI Memory | Session-level dialogue context store |

---

## 8. UI/UX Design System

> This section is the **single source of truth** for all visual and interaction design decisions in VoiceMed Pro. Every component, screen, and interaction must conform to these specifications.

---

### 8.1 Design Philosophy & Aesthetic Direction

#### 8.1.1 Core Premise

VoiceMed Pro serves medical professionals and patients in high-stakes healthcare environments. The design must simultaneously communicate:

- **Authority & Trust** — the system handles life-critical data
- **Intelligence** — AI is the core differentiator; it must feel genuinely advanced
- **Human Warmth** — healthcare is deeply human; cold, sterile interfaces increase patient anxiety
- **Clarity Under Pressure** — doctors and nurses operate under cognitive load; the UI must reduce friction, not add it

#### 8.1.2 Aesthetic Direction: *Deep Precision*

The chosen aesthetic is **Deep Precision** — a refined, dark-foundation design system with a warm teal intelligence layer. Think of it as a high-end medical instrument: precise, purposeful, beautiful, and completely unambiguous.

**Not:** generic SaaS blue-on-white, sterile clinical white, consumer health app pastels
**Yes:** deep navy foundations, warm teal for AI interactions, generous whitespace, sharp typographic hierarchy, purposeful micro-animation

#### 8.1.3 The Three Visual Languages

| Context | Visual Treatment | Meaning |
|---|---|---|
| **Clinical / Core** | Navy + White, structured grids | Trustworthy, authoritative |
| **AI / Intelligence** | Teal glow, animated elements | Powered by intelligence |
| **Blockchain / Security** | Indigo-purple, mono typeface | Cryptographic, immutable |

---

### 8.2 Complete Color System

#### 8.2.1 Primary Brand Palette — Navy

The primary palette is built on a deep navy blue. Navy conveys trust, authority, and medical precision. It is the dominant color across navigation, headers, and primary actions.

| Token Name | CSS Variable | Hex Value | RGB | Usage |
|---|---|---|---|---|
| Navy 950 | `--color-navy-950` | `#050E1C` | 5, 14, 28 | Darkest backgrounds, app shell |
| Navy 900 | `--color-navy-900` | `#0A1628` | 10, 22, 40 | Sidebar, dark panels |
| Navy 800 | `--color-navy-800` | `#0F2040` | 15, 32, 64 | Dark card backgrounds |
| Navy 700 | `--color-navy-700` | `#1B3A6B` | 27, 58, 107 | Section headers, strong accents |
| Navy 600 | `--color-navy-600` | `#1E4D8C` | 30, 77, 140 | Interactive tab states |
| Navy 500 | `--color-navy-500` | `#2563EB` | 37, 99, 235 | **Primary action color** |
| Navy 400 | `--color-navy-400` | `#3B82F6` | 59, 130, 246 | Hover state for primary |
| Navy 300 | `--color-navy-300` | `#93C5FD` | 147, 197, 253 | Light accent, focus rings |
| Navy 200 | `--color-navy-200` | `#BFDBFE` | 191, 219, 254 | Very light tints |
| Navy 100 | `--color-navy-100` | `#DBEAFE` | 219, 234, 254 | Card tint backgrounds |
| Navy 50 | `--color-navy-50` | `#EFF6FF` | 239, 246, 255 | Page background light mode |

#### 8.2.2 AI Accent Palette — Teal

Teal is exclusively reserved for **AI-powered features**: voice assistant, calling agent, agentic tasks, RAG responses, and memory indicators. This creates an unmistakable visual language — if it's teal, AI is involved.

| Token Name | CSS Variable | Hex Value | RGB | Usage |
|---|---|---|---|---|
| Teal 700 | `--color-teal-700` | `#0D5E59` | 13, 94, 89 | Deep teal for high contrast |
| Teal 600 | `--color-teal-600` | `#0D7377` | 13, 115, 119 | Active states, selected AI items |
| Teal 500 | `--color-teal-500` | `#0D9488` | 13, 148, 136 | **Primary AI accent color** |
| Teal 400 | `--color-teal-400` | `#14B8A6` | 20, 184, 166 | Hover teal, progress indicators |
| Teal 300 | `--color-teal-300` | `#2DD4BF` | 45, 212, 191 | Active voice wave bars |
| Teal 200 | `--color-teal-200` | `#99F6E4` | 153, 246, 228 | Light teal accents |
| Teal 100 | `--color-teal-100` | `#CCFBF1` | 204, 251, 241 | AI chip / badge backgrounds |
| Teal 50 | `--color-teal-50` | `#F0FDFA` | 240, 253, 250 | AI section tints, message bubbles |

#### 8.2.3 Blockchain Security Palette — Indigo

The indigo/purple family is exclusively for **blockchain and cryptographic security** elements. This visual isolation immediately communicates immutability and security.

| Token Name | CSS Variable | Hex Value | RGB | Usage |
|---|---|---|---|---|
| Indigo 900 | `--color-indigo-900` | `#1E1B4B` | 30, 27, 75 | Blockchain dark backgrounds |
| Indigo 700 | `--color-indigo-700` | `#3730A3` | 55, 48, 163 | Blockchain header fills |
| Indigo 600 | `--color-indigo-600` | `#4F46E5` | 79, 70, 229 | **Blockchain primary color** |
| Indigo 500 | `--color-indigo-500` | `#6366F1` | 99, 102, 241 | Blockchain interactive elements |
| Indigo 400 | `--color-indigo-400` | `#818CF8` | 129, 140, 248 | Blockchain hover states |
| Indigo 100 | `--color-indigo-100` | `#E0E7FF` | 224, 231, 255 | Blockchain badge backgrounds |
| Indigo 50 | `--color-indigo-50` | `#EEF2FF` | 238, 242, 255 | Blockchain section tints |

#### 8.2.4 Semantic Color Palette

Used exclusively for status communication — **never** for decorative purposes.

**Success — Emerald**

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| Success 700 | `--color-success-700` | `#047857` | Text on light success backgrounds |
| Success 600 | `--color-success-600` | `#059669` | **Confirmed, verified, active states** |
| Success 500 | `--color-success-500` | `#10B981` | Success icons, checkmarks |
| Success 100 | `--color-success-100` | `#D1FAE5` | Success badge backgrounds |
| Success 50 | `--color-success-50` | `#ECFDF5` | Success toast/card tint |

**Warning — Amber**

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| Warning 700 | `--color-warning-700` | `#B45309` | Warning text on light backgrounds |
| Warning 600 | `--color-warning-600` | `#D97706` | **Pending, rescheduled, caution** |
| Warning 500 | `--color-warning-500` | `#F59E0B` | Warning icons |
| Warning 100 | `--color-warning-100` | `#FEF3C7` | Warning badge backgrounds |
| Warning 50 | `--color-warning-50` | `#FFFBEB` | Warning toast tint |

**Danger — Ruby**

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| Danger 700 | `--color-danger-700` | `#B91C1C` | Error text on light backgrounds |
| Danger 600 | `--color-danger-600` | `#DC2626` | **Errors, cancelled, critical alerts** |
| Danger 500 | `--color-danger-500` | `#EF4444` | Danger icons |
| Danger 100 | `--color-danger-100` | `#FEE2E2` | Error badge backgrounds |
| Danger 50 | `--color-danger-50` | `#FEF2F2` | Error toast tint |

**Info — Sky**

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| Info 700 | `--color-info-700` | `#0369A1` | Info text |
| Info 600 | `--color-info-600` | `#0284C7` | **Informational callouts** |
| Info 100 | `--color-info-100` | `#E0F2FE` | Info badge backgrounds |
| Info 50 | `--color-info-50` | `#F0F9FF` | Info toast tint |

#### 8.2.5 Neutral Palette

| Token Name | CSS Variable | Hex | Usage |
|---|---|---|---|
| Gray 950 | `--color-gray-950` | `#030712` | Deepest text, code |
| Gray 900 | `--color-gray-900` | `#111827` | **Primary body text** |
| Gray 800 | `--color-gray-800` | `#1F2937` | Strong secondary text |
| Gray 700 | `--color-gray-700` | `#374151` | Secondary text, form labels |
| Gray 600 | `--color-gray-600` | `#4B5563` | Tertiary text, icons |
| Gray 500 | `--color-gray-500` | `#6B7280` | Placeholder text, captions |
| Gray 400 | `--color-gray-400` | `#9CA3AF` | Disabled text |
| Gray 300 | `--color-gray-300` | `#D1D5DB` | Dividers, borders, separators |
| Gray 200 | `--color-gray-200` | `#E5E7EB` | Card borders, table lines |
| Gray 100 | `--color-gray-100` | `#F3F4F6` | Input backgrounds, alternate rows |
| Gray 50 | `--color-gray-50` | `#F9FAFB` | Page background subtle tint |
| White | `--color-white` | `#FFFFFF` | Card surfaces, modal backgrounds |

#### 8.2.6 Gradient Definitions

```css
/* ── Hero / Landing ── */
--gradient-hero:
  linear-gradient(135deg, #050E1C 0%, #0A1628 35%, #0D4A6E 70%, #0D9488 100%);

/* ── AI Feature Panels ── */
--gradient-ai-panel:
  linear-gradient(135deg, #0F2040 0%, #0D7377 60%, #14B8A6 100%);

/* ── AI Glow Effect (overlay, 40% opacity) ── */
--gradient-ai-glow:
  radial-gradient(ellipse at center, rgba(13,148,136,0.25) 0%, transparent 70%);

/* ── Primary Button ── */
--gradient-btn-primary:
  linear-gradient(135deg, #1B3A6B 0%, #2563EB 100%);

/* ── Primary Button Hover ── */
--gradient-btn-primary-hover:
  linear-gradient(135deg, #1E4D8C 0%, #3B82F6 100%);

/* ── Teal / AI Button ── */
--gradient-btn-ai:
  linear-gradient(135deg, #0D7377 0%, #0D9488 50%, #14B8A6 100%);

/* ── Blockchain / Indigo Button ── */
--gradient-btn-blockchain:
  linear-gradient(135deg, #3730A3 0%, #4F46E5 50%, #6366F1 100%);

/* ── Sidebar ── */
--gradient-sidebar:
  linear-gradient(180deg, #050E1C 0%, #0A1628 50%, #0D2A4A 100%);

/* ── Card Hover Shimmer ── */
--gradient-card-hover:
  linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%);

/* ── Dark Card ── */
--gradient-card-dark:
  linear-gradient(135deg, #0F2040 0%, #1B3A6B 100%);

/* ── Section divider ── */
--gradient-divider:
  linear-gradient(90deg, transparent 0%, #CBD5E1 50%, transparent 100%);
```

#### 8.2.7 Color Contrast Compliance

| Text Color | Background | Ratio | WCAG Level |
|---|---|---|---|
| Gray 900 on White | `#111827` / `#FFFFFF` | 16.1:1 | AAA ✓ |
| White on Navy 700 | `#FFFFFF` / `#1B3A6B` | 9.8:1 | AAA ✓ |
| White on Navy 500 | `#FFFFFF` / `#2563EB` | 5.0:1 | AA ✓ |
| Gray 700 on Gray 100 | `#374151` / `#F3F4F6` | 6.4:1 | AA ✓ |
| White on Teal 500 | `#FFFFFF` / `#0D9488` | 4.6:1 | AA ✓ |
| Teal 700 on Teal 50 | `#0D5E59` / `#F0FDFA` | 8.1:1 | AAA ✓ |
| White on Danger 600 | `#FFFFFF` / `#DC2626` | 5.1:1 | AA ✓ |
| White on Success 600 | `#FFFFFF` / `#059669` | 4.5:1 | AA ✓ |
| Gray 500 on White | `#6B7280` / `#FFFFFF` | 4.6:1 | AA ✓ |

#### 8.2.8 Color Usage Rules

1. **Navy palette** = structure, authority, primary actions
2. **Teal palette** = AI-powered features ONLY — no decorative use
3. **Indigo palette** = blockchain/security features ONLY
4. **Semantic colors** = status communication ONLY — never decorative
5. **Never** use pure black `#000000` for text — use `--color-gray-900`
6. **Never** use pure white `#FFFFFF` for page backgrounds — use `--color-navy-50`
7. **Minimum contrast** 4.5:1 for all body text; 3:1 for large text and UI components
8. Color is never the **sole** indicator of state — always pair with icon or text

---

### 8.3 Typography System

#### 8.3.1 Typeface Selection

Three typefaces are used — each with a distinct, non-overlapping purpose.

---

**Display & Headings: `Sora`**

```
Import: https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&display=swap
Weights: SemiBold (600), Bold (700), ExtraBold (800)
```

Sora is a geometric sans-serif with slightly squared terminals that feel precise and modern without being cold. At large sizes it has excellent optical balance, and its numerals are highly legible for dashboard data. It has a distinctly non-generic character — hospitals using VoiceMed Pro will have a typeface that is immediately recognizable as theirs.

**Used for:** Hero headlines, page titles, section headings, dashboard KPI numbers, card titles

---

**Body & UI: `DM Sans`**

```
Import: https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap
Weights: Regular (400), Medium (500), SemiBold (600), Italic (400)
```

DM Sans is a humanist sans-serif with low contrast strokes optimized for screen readability at small sizes. Its slightly rounded forms add warmth — critical in healthcare contexts to prevent the interface from feeling sterile. It performs excellently at 14px under clinical lighting conditions.

**Used for:** Body text, form labels, input values, table cells, navigation labels, button text, tooltip text, captions

---

**Data & Code: `JetBrains Mono`**

```
Import: https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap
Weights: Regular (400), Medium (500)
```

Used exclusively for technical data that must be character-by-character legible: blockchain hashes, patient IDs, API keys, code blocks, timestamps in logs.

**Used for:** Blockchain hash display, patient/record IDs, code blocks, API endpoint labels, log timestamps

---

**Fallback Stack:**

```css
--font-display: 'Sora', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
--font-body:    'DM Sans', 'Helvetica Neue', Arial, sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
```

#### 8.3.2 Type Scale — Complete Reference

| Token | Size | rem | Line Height | Letter Spacing | Weight | Font | Usage |
|---|---|---|---|---|---|---|---|
| `--text-display-2xl` | 72px | 4.5rem | 1.08 | -0.03em | 800 | Sora | Landing hero (mobile: 40px) |
| `--text-display-xl` | 56px | 3.5rem | 1.1 | -0.025em | 800 | Sora | Section heroes (mobile: 36px) |
| `--text-display-lg` | 40px | 2.5rem | 1.15 | -0.02em | 700 | Sora | Page H1 titles (mobile: 28px) |
| `--text-display-md` | 32px | 2rem | 1.2 | -0.015em | 700 | Sora | Dashboard H2 headers (mobile: 24px) |
| `--text-display-sm` | 24px | 1.5rem | 1.3 | -0.01em | 600 | Sora | Card titles, H3 (mobile: 20px) |
| `--text-xl` | 20px | 1.25rem | 1.4 | -0.005em | 600 | Sora | H4, lead text, callouts |
| `--text-lg` | 18px | 1.125rem | 1.55 | 0 | 400 | DM Sans | Large body, doctor notes, EMR |
| `--text-base` | 16px | 1rem | 1.6 | 0 | 400 | DM Sans | Standard body text |
| `--text-sm` | 14px | 0.875rem | 1.5 | 0 | 400 | DM Sans | Form labels, table cells |
| `--text-xs` | 12px | 0.75rem | 1.4 | 0.01em | 500 | DM Sans | Captions, badges, metadata |
| `--text-2xs` | 10px | 0.625rem | 1.3 | 0.02em | 600 | DM Sans | Fine print (sparingly) |
| `--text-mono-sm` | 13px | 0.8125rem | 1.5 | 0 | 400 | JetBrains Mono | Hash truncation, short IDs |
| `--text-mono-base` | 14px | 0.875rem | 1.6 | 0 | 400 | JetBrains Mono | Full hashes, code blocks |

#### 8.3.3 Typography Utility Rules

| Rule | Specification |
|---|---|
| Minimum body text size | 14px — never smaller for clinical content |
| Optimal line length | 60–75 characters (`max-width: 65ch`) for body text |
| Heading hierarchy | Never skip levels: H1 → H2 → H3 → H4 in document order |
| Tabular numbers | Always `font-variant-numeric: tabular-nums` for dashboard stats and prices |
| Uppercase labels | DM Sans 500 weight, 0.08em letter-spacing, maximum 2 words |
| Italic usage | Body italic (DM Sans) for patient notes, disclaimers; never headings |
| Blockchain hashes | JetBrains Mono, truncate to first 8 + `…` + last 4 characters for display |
| Line clamping | EMR notes truncate at 3 lines with `line-clamp: 3` and expand on click |
| Text overflow | All table cells and badges: `text-overflow: ellipsis; overflow: hidden; white-space: nowrap` |

---

### 8.4 Spacing & Layout System

#### 8.4.1 Base Spacing Scale

All spacing is derived from a **4px base unit**. Every margin, padding, and gap value is a multiple of 4px. This creates perfect visual rhythm and makes spacing decisions unambiguous.

| Token | Value | px | Common Usage |
|---|---|---|---|
| `--space-px` | 1px | 1px | Borders, hairlines |
| `--space-0.5` | 0.125rem | 2px | Micro-gaps between inline elements |
| `--space-1` | 0.25rem | 4px | Icon internal padding |
| `--space-2` | 0.5rem | 8px | Icon-to-label gap, tight chip padding |
| `--space-3` | 0.75rem | 12px | Small button padding vertical |
| `--space-4` | 1rem | 16px | Standard padding, mobile margins |
| `--space-5` | 1.25rem | 20px | Comfortable button padding |
| `--space-6` | 1.5rem | 24px | Card inner padding (standard) |
| `--space-7` | 1.75rem | 28px | Form group vertical gap |
| `--space-8` | 2rem | 32px | Component section gap |
| `--space-10` | 2.5rem | 40px | Section inner padding |
| `--space-12` | 3rem | 48px | Large section vertical padding |
| `--space-14` | 3.5rem | 56px | Header height, major rhythm unit |
| `--space-16` | 4rem | 64px | Section-to-section margin |
| `--space-20` | 5rem | 80px | Page section vertical padding |
| `--space-24` | 6rem | 96px | Hero inner padding |
| `--space-32` | 8rem | 128px | Hero section total padding |

#### 8.4.2 Responsive Grid System

| Breakpoint | Token | Min Width | Columns | Gutter | Outer Margin |
|---|---|---|---|---|---|
| Mobile S | `xs` | 320px | 4 col | 16px | 16px |
| Mobile M | `sm` | 480px | 4 col | 16px | 20px |
| Mobile L | — | 640px | 4 col | 20px | 24px |
| Tablet | `md` | 768px | 8 col | 24px | 32px |
| Desktop S | `lg` | 1024px | 12 col | 24px | 40px |
| Desktop M | `xl` | 1280px | 12 col | 32px | 48px |
| Desktop L | `2xl` | 1440px | 12 col | 32px | 64px |
| Wide | `3xl` | 1920px | 12 col | 40px | auto (centered) |

**Max content width:** `1440px` — centered with auto margins above 1440px
**Dashboard sidebar (expanded):** `280px` fixed
**Dashboard sidebar (collapsed):** `72px` icon-only
**Dashboard content area:** `calc(100vw - 280px - 48px)`, max `1160px`
**Modal widths:** `sm: 400px` | `md: 560px` | `lg: 720px` | `xl: 900px` | `full: 100vw`

#### 8.4.3 Alignment System

**Horizontal Alignment**

| Context | Rule |
|---|---|
| Page content | Left-aligned within max-width container, never full-bleed text |
| Landing page headings | Center-aligned for hero + pricing; left-aligned for features section |
| Dashboard content | Left-aligned throughout — patients scan left-to-right |
| Form labels | Left-aligned, positioned directly above input (never inline right) |
| Table headers | Left-aligned for text; right-aligned for numbers and currency |
| Table cells | Left for text/names; center for status badges; right for numbers/currency |
| Buttons (primary CTA) | Right-aligned in form footers; left or full-width in modals |
| Badge/chip | Inline, vertically centered with adjacent text |
| Icons | Optically centered — use visual center, not mathematical center |

**Vertical Alignment**

| Context | Rule |
|---|---|
| Icon + label | `align-items: center` — icons align to x-height of adjacent text |
| Table rows | `vertical-align: middle` for all cells |
| Card content | Top-aligned by default; center-aligned for metric/stat cards |
| Form inputs | Label above, `8px` gap, input, `4px` gap, helper/error text |
| Navigation items | `align-items: center` with `56px` minimum height |
| Modal | Vertically centered on desktop; bottom-sheet on mobile |
| Toast notifications | Top-right on desktop; top-center on mobile |

**Content Hierarchy and Flow**

- Primary information at top-left (F-pattern scan path for dashboards)
- Most important action button: right side of header bars, bottom-right of forms
- Destructive actions: always visually separated from primary actions
- Empty states: center-aligned both horizontally and vertically
- Loading skeletons: exactly match the layout of loaded content

#### 8.4.4 Z-Index Layering

| Layer | Token | Value | Elements |
|---|---|---|---|
| Base | `--z-base` | 0 | Static page content |
| Raised | `--z-raised` | 10 | Cards on hover, floating labels |
| Floating | `--z-floating` | 50 | Sticky table headers |
| Dropdown | `--z-dropdown` | 100 | Select menus, autocomplete lists |
| Sticky | `--z-sticky` | 200 | App header, sticky sidebar |
| Overlay | `--z-overlay` | 300 | Modal/drawer backdrop |
| Drawer | `--z-drawer` | 400 | Side panels, filter drawers |
| Modal | `--z-modal` | 500 | Dialog boxes, lightboxes |
| Toast | `--z-toast` | 600 | Notification toasts |
| Tooltip | `--z-tooltip` | 700 | Hover tooltips |
| Voice | `--z-voice` | 800 | Voice AI overlay — always topmost |

---

### 8.5 Component Design Specifications

#### 8.5.1 Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--radius-none` | 0px | Tables, full-bleed images |
| `--radius-sm` | 4px | Small chips, tag badges |
| `--radius-md` | 8px | Buttons, inputs, small cards |
| `--radius-lg` | 12px | Standard cards, panels, dropdowns |
| `--radius-xl` | 16px | Feature cards, modals |
| `--radius-2xl` | 24px | Hero cards, overlay panels |
| `--radius-3xl` | 32px | Landing feature sections |
| `--radius-full` | 9999px | Pills, avatar circles, toggle switches |

#### 8.5.2 Shadow Elevation System

```css
/* Subtle depth for flat elements */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Default card resting state */
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.10),
             0 1px 2px -1px rgba(0, 0, 0, 0.06);

/* Raised interactive element */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.10),
             0 2px 4px -2px rgba(0, 0, 0, 0.06);

/* Card hover / elevated panel */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.10),
             0 4px 6px -4px rgba(0, 0, 0, 0.05);

/* Modals, dropdowns */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.10),
             0 8px 10px -6px rgba(0, 0, 0, 0.04);

/* Large modal dialogs */
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* ── Specialty Shadows ── */

/* AI-powered element glow — teal */
--shadow-ai-glow: 0 0 0 1px rgba(13, 148, 136, 0.2),
                  0 0 20px rgba(13, 148, 136, 0.35),
                  0 4px 12px rgba(13, 148, 136, 0.20);

/* AI glow on hover */
--shadow-ai-glow-hover: 0 0 0 1px rgba(20, 184, 166, 0.3),
                        0 0 30px rgba(13, 148, 136, 0.50),
                        0 8px 16px rgba(13, 148, 136, 0.25);

/* Primary action glow — navy blue */
--shadow-primary-glow: 0 0 0 1px rgba(37, 99, 235, 0.2),
                       0 0 20px rgba(37, 99, 235, 0.30),
                       0 4px 12px rgba(37, 99, 235, 0.15);

/* Blockchain element glow — indigo */
--shadow-blockchain-glow: 0 0 0 1px rgba(79, 70, 229, 0.2),
                          0 0 24px rgba(79, 70, 229, 0.35),
                          0 4px 12px rgba(79, 70, 229, 0.20);

/* Danger / critical alert */
--shadow-danger-glow: 0 0 0 1px rgba(220, 38, 38, 0.2),
                      0 0 16px rgba(220, 38, 38, 0.25);

/* Focus ring (keyboard nav) */
--shadow-focus: 0 0 0 3px rgba(37, 99, 235, 0.50);
--shadow-focus-teal: 0 0 0 3px rgba(13, 148, 136, 0.50);
```

#### 8.5.3 Button Component Specifications

**Variants**

| Variant | Background | Text Color | Border | Hover | Shadow | Use Case |
|---|---|---|---|---|---|---|
| **Primary** | `--gradient-btn-primary` | `#FFFFFF` | none | `--gradient-btn-primary-hover` + translateY(-1px) | `--shadow-primary-glow` | Main CTAs: Book, Save, Submit |
| **Secondary** | transparent | `--color-navy-700` | 2px `--color-navy-500` | `--color-navy-100` fill | `--shadow-sm` | Secondary actions |
| **AI / Teal** | `--gradient-btn-ai` | `#FFFFFF` | none | brighten + translateY(-1px) | `--shadow-ai-glow` | Voice, AI chat, RAG triggers |
| **Blockchain** | `--gradient-btn-blockchain` | `#FFFFFF` | none | brighten | `--shadow-blockchain-glow` | Verify hash, anchor record |
| **Danger** | `--color-danger-600` | `#FFFFFF` | none | `--color-danger-700` | `--shadow-danger-glow` | Delete, cancel, revoke |
| **Ghost** | transparent | `--color-gray-700` | 1.5px `--color-gray-300` | `--color-gray-100` fill | none | Tertiary/neutral actions |
| **Link** | transparent | `--color-navy-500` | none | underline | none | Inline contextual links |

**Sizes**

| Size | Height | Padding H | Font Size | Font Weight | Border Radius | Icon Size |
|---|---|---|---|---|---|---|
| `xs` | 28px | 10px | 12px | 600 | `--radius-sm` (4px) | 12px |
| `sm` | 34px | 14px | 13px | 600 | `--radius-md` (8px) | 14px |
| `md` | 42px | 20px | 14px | 600 | `--radius-md` (8px) | 16px |
| `lg` | 50px | 28px | 15px | 600 | `--radius-lg` (12px) | 18px |
| `xl` | 60px | 36px | 16px | 700 | `--radius-lg` (12px) | 20px |

**States**

| State | Visual Treatment |
|---|---|
| Default | Base styles as defined above |
| Hover | Lift `translateY(-1px)` + enhanced shadow + background shift |
| Active / Pressed | `translateY(0px)` + reduced shadow + slightly darker bg |
| Focus | Base + `--shadow-focus` ring (never remove, WCAG requirement) |
| Disabled | 40% opacity, `cursor: not-allowed`, no hover effects |
| Loading | Replace label with spinner (20px), maintain button width |

#### 8.5.4 Form Input Specifications

| Property | Value |
|---|---|
| Height (default) | 44px |
| Height (compact) | 36px |
| Height (large) | 52px |
| Background (default) | `--color-gray-100` |
| Background (focus) | `--color-white` |
| Border (default) | `1.5px solid --color-gray-300` |
| Border (focus) | `2px solid --color-navy-500` + `--shadow-focus` |
| Border (error) | `2px solid --color-danger-600` + `--shadow-danger-glow` |
| Border (success) | `1.5px solid --color-success-500` |
| Border (disabled) | `1.5px solid --color-gray-200`, bg `--color-gray-50` |
| Border radius | `--radius-md` (8px) |
| Padding | `12px 16px` |
| Font | DM Sans 14px / 400 / `--color-gray-900` |
| Placeholder | DM Sans 14px / 400 / `--color-gray-400` |
| Label | DM Sans 14px / 500 / `--color-gray-700`, above input, `8px` gap |
| Helper text | DM Sans 12px / 400 / `--color-gray-500`, below input, `4px` gap |
| Error text | DM Sans 12px / 500 / `--color-danger-600`, below input, `4px` gap |
| Transition | `border-color 150ms ease, box-shadow 150ms ease, background 150ms ease` |

**Select / Dropdown:** Same as input + chevron icon right-aligned 16px from edge
**Textarea:** Same border/color rules; min-height `120px`; resize: vertical only
**Checkbox / Radio:** 18×18px; `--color-navy-500` checked fill; `--radius-sm` for checkbox
**Toggle Switch:** 44×24px; teal fill when on (`--color-teal-500`); 200ms transition

#### 8.5.5 Card Component Specifications

**Standard Card**

| Property | Value |
|---|---|
| Background | `--color-white` |
| Border | `1px solid --color-gray-200` |
| Border radius | `--radius-xl` (16px) |
| Padding | `--space-6` (24px) |
| Shadow (default) | `--shadow-sm` |
| Shadow (hover) | `--shadow-lg` |
| Transform (hover) | `translateY(-2px)` |
| Transition | `transform 200ms ease, box-shadow 200ms ease` |

**AI Feature Card**

| Property | Value |
|---|---|
| Background | `--color-teal-50` |
| Border | `1px solid --color-teal-100` |
| Left accent | `4px solid --color-teal-500` (border-left) |
| Shadow | `--shadow-ai-glow` |
| Header icon color | `--color-teal-500` |

**Blockchain Record Card**

| Property | Value |
|---|---|
| Background | `--color-indigo-50` |
| Border | `1px solid --color-indigo-100` |
| Left accent | `4px solid --color-indigo-600` |
| Shadow | `--shadow-blockchain-glow` |
| Hash display | JetBrains Mono 13px, `--color-indigo-700` |

**Metric / KPI Card**

| Property | Value |
|---|---|
| Background | `--gradient-card-dark` (dark) or `--color-navy-100` (light) |
| Metric value | Sora 32px / 700 / white (dark) or navy-700 (light) |
| Metric label | DM Sans 13px / 500 / gray-400 (dark) or gray-600 (light) |
| Trend indicator | Arrow icon + DM Sans 12px / success or danger color |
| Padding | `--space-5` (20px) |

#### 8.5.6 Data Table Specifications

| Property | Value |
|---|---|
| Table header background | `--color-navy-900` |
| Header text | DM Sans 12px / 600 / `#FFFFFF` / uppercase / `0.06em` letter-spacing |
| Header padding | `12px 16px` |
| Row height (standard) | 56px |
| Row height (compact) | 44px |
| Row height (expanded) | auto, min 64px |
| Row background (default) | `--color-white` |
| Row background (alternate) | `--color-gray-50` |
| Row background (hover) | `--color-navy-50` |
| Row background (selected) | `--color-navy-100` with left `3px solid --color-navy-500` |
| Cell font | DM Sans 14px / 400 / `--color-gray-900` |
| Cell padding | `12px 16px` |
| Column divider | `1px solid --color-gray-200` |
| Row divider | `1px solid --color-gray-100` |
| Sticky header | `position: sticky; top: 0; z-index: var(--z-floating)` |
| Sort icon | Lucide `ArrowUpDown` / 14px / gray-400 (unsorted), navy-500 (sorted) |

#### 8.5.7 Badge / Status Chip Specifications

| Status | Background | Text Color | Icon | Usage |
|---|---|---|---|---|
| Confirmed / Active | `--color-success-100` | `--color-success-700` | `CheckCircle` | Confirmed appointments, active users |
| Pending | `--color-warning-100` | `--color-warning-700` | `Clock` | Awaiting confirmation |
| Cancelled | `--color-danger-100` | `--color-danger-700` | `XCircle` | Cancelled appointments |
| In Progress | `--color-info-100` | `--color-info-700` | `Loader2` (spin) | Live processes, calls in progress |
| AI Generated | `--color-teal-100` | `--color-teal-700` | `Sparkles` | AI-created content |
| Blockchain Verified | `--color-indigo-100` | `#3730A3` | `ShieldCheck` | Tamper-verified records |
| Rescheduled | `--color-warning-100` | `--color-warning-700` | `RefreshCw` | Rescheduled appointment |
| Completed | `--color-gray-100` | `--color-gray-700` | `CheckCheck` | Past completed appointments |

**Badge anatomy:** `[optional icon 12px] [label DM Sans 12px / 500]`, `padding: 4px 10px`, `border-radius: --radius-full`

#### 8.5.8 Navigation Sidebar Specifications

| Property | Value |
|---|---|
| Width (expanded) | 280px |
| Width (collapsed) | 72px |
| Background | `--gradient-sidebar` |
| Logo area | 64px height, 24px padding |
| Nav item height | 44px |
| Nav item border radius | `--radius-md` (8px) |
| Nav item padding | `0 12px` |
| Nav item font | DM Sans 14px / 500 / gray-300 |
| Nav item icon | 20px, gray-400 |
| Nav item hover | bg `rgba(255,255,255,0.08)`, text white, icon white |
| Nav item active | bg `--color-navy-700`, text white, icon `--color-teal-400`, left `3px solid --color-teal-500` |
| Section label | DM Sans 11px / 600 / gray-500 / uppercase / `0.08em` tracking |
| Section label padding | `20px 16px 8px` |
| Collapse button | Bottom of sidebar, 44px height, icon-only |
| Transition | `width 250ms ease` on collapse |

#### 8.5.9 Toast Notification Specifications

| Property | Value |
|---|---|
| Position (desktop) | Fixed, top-right, `24px` from top and right |
| Position (mobile) | Fixed, top-center, `16px` from top |
| Width | `360px` (desktop), `calc(100vw - 32px)` (mobile) |
| Border radius | `--radius-lg` (12px) |
| Padding | `16px` |
| Shadow | `--shadow-xl` |
| Icon | 20px, semantic color |
| Title | DM Sans 14px / 600 |
| Message | DM Sans 13px / 400 / gray-600 |
| Close button | 20px × 20px, gray-400, top-right |
| Auto-dismiss | 5 seconds (success/info), 8 seconds (warning), manual only (error) |
| Entry animation | Slide in from right + fade in, 300ms `--ease-out` |
| Exit animation | Fade out + slide up, 200ms `--ease-in` |
| Stack behavior | Up to 5 toasts, newer toasts push older ones down |

---

### 8.6 Alignment & Composition Rules

#### 8.6.1 The 8px Baseline Grid

All components align to an **8px baseline grid**. Every element's top edge, height, and spacing must be a multiple of 8px. This ensures perfect vertical rhythm across the entire interface.

```
Typography leading always rounds to nearest 8px multiple
Component heights: 32, 40, 44, 48, 56, 64, 72, 80px
Section padding: 32, 48, 64, 80, 96px
```

#### 8.6.2 Optical Alignment Principles

- **Icon + text:** Icons appear mathematically centered but are optically higher — offset by `1-2px` upward if they appear too low relative to cap height
- **Centered hero content:** Never exceed `720px` width for centered text blocks
- **Card grids:** Maintain consistent gutter using CSS Grid `gap` — never use margin hacks
- **Avatar images:** Always circle-cropped with `overflow: hidden; border-radius: 50%`
- **Number alignment in tables:** Right-align with `font-variant-numeric: tabular-nums` so decimal points align

#### 8.6.3 Whitespace Hierarchy

| Level | Amount | Used for |
|---|---|---|
| **Macro** | 64–96px | Between major page sections |
| **Section** | 32–48px | Between component groups within a section |
| **Component** | 16–24px | Between elements within a component |
| **Element** | 4–12px | Between tightly related items (label + input, icon + text) |
| **Micro** | 1–4px | Between extremely related elements (badge icon + label) |

#### 8.6.4 Visual Hierarchy Rules

1. Size contrast first: largest element draws eye first
2. Color contrast second: high-contrast elements command attention
3. Weight contrast third: bold vs. regular within same size
4. Color for status: semantic colors communicate state, not importance
5. Motion last: animation draws attention — use for highest-priority actions only
6. Negative space is active: empty space guides eye to content, don't fill it

---

### 8.7 Iconography System

#### 8.7.1 Primary Icon Library

**Library:** Lucide React (`lucide-react`)
**Style:** Outline stroke, consistent 2px stroke width, rounded line caps

#### 8.7.2 Icon Size Scale

| Context | Size | Stroke Width |
|---|---|---|
| Dashboard KPI icons | 40px | 1.5px |
| Feature section icons | 32px | 1.5px |
| Navigation sidebar | 22px | 2px |
| Button icons | 18px | 2px |
| Form field icons | 18px | 2px |
| Table action icons | 16px | 2px |
| Badge/chip icons | 14px | 2px |
| Status dot (not icon) | 8px circle | — |
| Inline text icons | 1em (matches font size) | 2px |

#### 8.7.3 Icon-to-Text Spacing

Always `8px` gap between icon and label (regardless of icon size).

#### 8.7.4 Core Icon Mapping

| Feature Area | Icon (Lucide) | Color |
|---|---|---|
| Appointments | `CalendarCheck` | Navy-500 |
| Patients | `Users` | Navy-500 |
| Doctors | `Stethoscope` | Navy-500 |
| EMR / Records | `FileText` | Navy-500 |
| AI Voice | `Mic` | Teal-500 |
| AI Calling | `Phone` | Teal-500 |
| Agentic AI | `Bot` | Teal-500 |
| RAG Knowledge | `BookOpen` | Teal-500 |
| AI Memory | `Brain` | Teal-500 |
| Blockchain | `ShieldCheck` | Indigo-600 |
| Billing | `CreditCard` | Navy-500 |
| Telemedicine | `Video` | Navy-500 |
| Notifications | `Bell` | Navy-500 |
| Analytics | `BarChart3` | Navy-500 |
| OCR | `Scan` | Navy-500 |
| Settings | `Settings` | Gray-500 |
| Logout | `LogOut` | Danger-600 |
| Verified | `CheckCircle` | Success-600 |
| Error | `XCircle` | Danger-600 |
| Warning | `AlertTriangle` | Warning-600 |
| Info | `Info` | Info-600 |
| Search | `Search` | Gray-500 |
| Upload | `Upload` | Gray-600 |
| Download | `Download` | Navy-500 |
| Hash / ID | `Hash` | Indigo-600 |

#### 8.7.5 Custom SVG Icons Required

The following icons require custom SVG design (not available in Lucide):

1. **Voice Waveform** — 5 vertical bars, animated; used in Voice AI overlay
2. **Blockchain Chain Link** — medical cross + chain link hybrid; used in blockchain nav
3. **Neural Network** — stylized nodes and connections; used in AI feature marketing
4. **AI Pulse** — heartbeat line that morphs to sine wave; used in hero animation

---

### 8.8 Motion & Animation

#### 8.8.1 Easing Functions

```css
--ease-linear:    linear;
--ease-default:   cubic-bezier(0.4, 0, 0.2, 1);   /* Balanced — general transitions */
--ease-in:        cubic-bezier(0.4, 0, 1, 1);      /* Accelerate — elements leaving */
--ease-out:       cubic-bezier(0, 0, 0.2, 1);      /* Decelerate — elements entering */
--ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1);    /* Both — drag, reposition */
--ease-bounce:    cubic-bezier(0.34, 1.56, 0.64, 1); /* Overshoot — playful interactions */
--ease-spring:    cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Spring — modal pop, notifications */
--ease-sharp:     cubic-bezier(0.4, 0, 0.6, 1);    /* Quick and precise — keyboard nav */
```

#### 8.8.2 Duration Scale

| Token | Duration | Usage |
|---|---|---|
| `--duration-instant` | 75ms | Button press feedback, checkbox tick |
| `--duration-fast` | 150ms | Hover state changes, tooltip appear |
| `--duration-normal` | 200ms | Standard UI transitions |
| `--duration-moderate` | 300ms | Dropdown open, panel expand |
| `--duration-slow` | 400ms | Modal open, route transitions |
| `--duration-slower` | 500ms | Page-level reveals |
| `--duration-ai` | 800ms | AI loading state entry |
| `--duration-pulse` | 1500ms | Background pulse loops |
| `--duration-wave` | 1200ms | Voice waveform cycle |

#### 8.8.3 Animation Definitions

**Dashboard Card Stagger Reveal (page load)**
```css
@keyframes slideInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Apply with animation-delay: 0, 60, 120, 180ms for each card */
animation: slideInUp 400ms var(--ease-out) both;
```

**Voice AI Waveform (active listening state)**
```css
@keyframes voiceBar {
  0%, 100% { transform: scaleY(0.3); opacity: 0.5; }
  50%       { transform: scaleY(1.0); opacity: 1.0; }
}
/* 5 bars — animation-delay: 0, 100, 200, 300, 400ms */
/* animation-duration: 1200ms, animation-iteration-count: infinite */
```

**AI Thinking Dots (AI is processing)**
```css
@keyframes aiDot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
  40%           { transform: scale(1.0); opacity: 1.0; }
}
/* 3 dots — animation-delay: 0, 160, 320ms */
/* animation-duration: 1400ms, infinite */
```

**Blockchain Hash Typewriter Reveal**
```css
/* JavaScript-driven: reveal characters one by one at 25ms intervals */
/* Font: JetBrains Mono — each character fades from opacity:0 to opacity:1 */
/* Add final full-hash glow on complete: box-shadow var(--shadow-blockchain-glow) */
```

**Teal AI Glow Pulse (ambient, background elements)**
```css
@keyframes aiGlowPulse {
  0%, 100% { box-shadow: var(--shadow-ai-glow); }
  50%       { box-shadow: var(--shadow-ai-glow-hover); }
}
animation: aiGlowPulse 3000ms var(--ease-in-out) infinite;
```

**Toast Notification Entry**
```css
@keyframes toastIn {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
animation: toastIn 300ms var(--ease-out);
```

**Toast Notification Exit**
```css
@keyframes toastOut {
  from { transform: translateX(0);   opacity: 1; max-height: 120px; }
  to   { transform: translateX(20%); opacity: 0; max-height: 0; margin: 0; }
}
animation: toastOut 200ms var(--ease-in) forwards;
```

**Modal Open**
```css
/* Backdrop */
@keyframes backdropIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
/* Dialog */
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1.00) translateY(0); }
}
```

#### 8.8.4 Motion Reduction

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  /* Exception: voice waveform shows static 3 bars instead of animating */
}
```

---

### 8.9 Dark Mode Design System

Dark mode is the **default** for all clinical dashboard screens. Light mode is the default for patient-facing portals. Users can toggle their preference.

#### 8.9.1 Dark Mode Color Mapping

| Semantic Role | Light Mode Value | Dark Mode Value |
|---|---|---|
| Page background | `#EFF6FF` (Navy-50) | `#050E1C` (Navy-950) |
| App shell / sidebar | `#0A1628` (Navy-900) | `#030712` (Gray-950) |
| Card surface | `#FFFFFF` (White) | `#0F2040` (Navy-800) |
| Card border | `#E5E7EB` (Gray-200) | `#1B3A6B` (Navy-700) |
| Elevated card | `#F9FAFB` (Gray-50) | `#132847` |
| Primary text | `#111827` (Gray-900) | `#F1F5F9` |
| Secondary text | `#374151` (Gray-700) | `#94A3B8` |
| Tertiary text | `#6B7280` (Gray-500) | `#64748B` |
| Placeholder text | `#9CA3AF` (Gray-400) | `#475569` |
| Input background | `#F3F4F6` (Gray-100) | `#1E3A5F` |
| Input border | `#D1D5DB` (Gray-300) | `#2563EB` at 30% opacity |
| Input focus border | `#2563EB` (Navy-500) | `#3B82F6` (Navy-400) |
| Section divider | `#E5E7EB` (Gray-200) | `#1B3A6B` (Navy-700) |
| Table header | `#0A1628` (Navy-900) | `#050E1C` (Navy-950) |
| Table alt row | `#F9FAFB` (Gray-50) | `#0D1F36` |
| Table hover row | `#EFF6FF` (Navy-50) | `#132847` |

#### 8.9.2 Dark Mode Surface Elevation

In dark mode, higher elevation surfaces are **lighter**, not darker (MD3 elevation system):

| Elevation | Navy Base | Overlay Opacity |
|---|---|---|
| Level 0 — Page | `#050E1C` | 0% |
| Level 1 — Cards | `#0A1628` | 5% white |
| Level 2 — Raised cards | `#0F2040` | 8% white |
| Level 3 — Modals | `#1B3A6B` | 11% white |
| Level 4 — Drawers | `#1E4D8C` at 60% | 14% white |

#### 8.9.3 Dark Mode Rules

- Sidebar: **always dark** (Navy-950), regardless of user mode preference
- Doctor, nurse, admin dashboards: **dark default**, user can switch to light
- Patient portal (booking, records, profile): **light default**, user can switch to dark
- AI chat interface: **always dark** with teal glow — this context is non-negotiable
- Blockchain verification page: **always dark** with indigo glow
- Landing/marketing pages: **always light** (brand authority)
- Never use pure white text on dark — use `#F1F5F9` as maximum brightness

---

### 8.10 Application Pages & Layout Specifications

#### 8.10.1 Public Landing Page

**Header / Navigation**

| Property | Value |
|---|---|
| Height | 72px |
| Background (default) | Transparent over hero gradient |
| Background (scrolled) | `--color-navy-900` with `backdrop-filter: blur(12px)` |
| Logo | Sora 20px / 700 / white |
| Nav links | DM Sans 14px / 500 / gray-300, hover white |
| CTA button | Primary button, `md` size |
| Behavior | Sticky, transforms on scroll |

**Hero Section**

| Property | Value |
|---|---|
| Height | `100vh`, min `680px` |
| Background | `--gradient-hero` |
| Layout | Two-column: text left (60%), animated mockup right (40%) |
| Headline | Sora 72px / 800 / white, max 2 lines |
| Subheadline | DM Sans 20px / 400 / gray-300, max 3 lines |
| CTA group | 2 buttons: Primary + Ghost, `lg` size, 12px gap |
| Trust bar | Gray-400 text "Trusted by X hospitals" + 5 hospital logos |

**Features Section**

| Property | Value |
|---|---|
| Background | `--color-white` |
| Section padding | 96px vertical |
| Section label | Teal-500 DM Sans 14px / 600 / uppercase |
| Section heading | Sora 40px / 700 / gray-900 |
| Grid | 3-column, 32px gap |
| Feature card | Standard card spec + AI card variant for AI features |

**Pricing Section**

| Tier | Card Style |
|---|---|
| Starter | Ghost border, gray, standard card |
| Professional (recommended) | `--gradient-btn-primary` header, navy card, ring `3px solid --color-navy-500` |
| Enterprise | `--gradient-ai-panel` header, "Contact Sales" |

---

#### 8.10.2 Patient Dashboard

**Layout Grid**

```
┌──────────┬──────────────────────────────────────────────────────┐
│          │  Header (64px)                                        │
│ Sidebar  ├──────────────────────────────────────────────────────┤
│  280px   │  Page Title + Breadcrumb (48px)                      │
│          ├────────┬────────┬────────┬────────────────────────── │
│          │ Stat 1 │ Stat 2 │ Stat 3 │ Stat 4                    │
│          ├────────┴────────┴────────┴────────────────────────── │
│          │                                   │                   │
│          │  Upcoming Appointments (60%)      │  AI Assistant     │
│          │                                   │  Panel (40%)      │
│          │                                   │                   │
│          ├───────────────────────────────────┴───────────────── │
│          │  Medical Records Table (full width)                   │
└──────────┴──────────────────────────────────────────────────────┘
```

**KPI Stat Cards Row:** 4 cards equal width, `--gradient-card-dark`, Sora 32px metric value

**Upcoming Appointments Panel:** Table with avatar, name, specialty, date/time, status badge, action buttons (Join, Reschedule, Cancel)

**AI Assistant Panel:** Dark teal-bordered panel, chat history, voice button, waveform. Always visible on dashboard.

**Recent Records Table:** Compact table, 44px row height. Columns: Date, Type, Doctor, Blockchain badge, Download icon.

---

#### 8.10.3 Doctor Dashboard

**Layout Grid**

```
┌──────────┬──────────────────────────────────────────────────────┐
│          │  Header (64px) — Patient Queue Summary in header     │
│ Sidebar  ├──────────────┬───────────────────────────────────────┤
│  280px   │ Patient      │  EMR Editor (65%)                      │
│          │ Queue (35%)  │                                         │
│          │              │  [Patient Info Header]                  │
│          │ Token cards  │  [Diagnosis ICD-10]                     │
│          │ Wait times   │  [Prescription Builder]                 │
│          │ Status chips │  [Lab Reports]                          │
│          │              │  [Action Bar: Save / Sign / Print]      │
│          ├──────────────┴───────────────────────────────────────┤
│          │  Today's Schedule — Timeline (full width)            │
└──────────┴──────────────────────────────────────────────────────┘
```

**Patient Queue Panel:** Live updating, each card 80px height. Shows: token number (Sora 24px / 700), patient name, wait time, status chip. Color: green (current), amber (next 3), gray (later).

**EMR Editor:** Rich text areas for diagnosis notes. ICD-10 autocomplete input with dropdown. Prescription section: drug search, dosage, frequency, duration. Blockchain anchor button (indigo) at save time.

---

#### 8.10.4 Admin Dashboard

**Layout**

```
┌──────────┬────────────┬────────────┬────────────┬──────────────┐
│          │  Revenue   │  Patients  │  AI Calls  │  Uptime      │
│ Sidebar  ├────────────┴────────────┴────────────┴──────────────┤
│          │                                    │                  │
│          │  Revenue Line Chart (60%)          │  Activity Feed  │
│          │                                    │  (40%)          │
│          ├────────────────────────────────────┤                 │
│          │  Appointments Bar Chart (60%)      │  Live stream    │
│          │                                    │  of audit_logs  │
│          ├────────────────────────────────────┴─────────────── │
│          │  Staff Table — All users, roles, last active         │
└──────────┴──────────────────────────────────────────────────────┘
```

---

#### 8.10.5 AI Assistant Page

| Element | Specification |
|---|---|
| Page background | `--color-navy-950` |
| Chat container | Max `720px` centered, `--radius-2xl`, `--gradient-card-dark` |
| User message bubble | Right-aligned, `--color-navy-700` bg, `--radius-xl` (`border-bottom-right-radius: 4px`) |
| AI message bubble | Left-aligned, `--color-teal-50` bg, `--color-teal-600` left border `3px`, `--radius-xl` (`border-bottom-left-radius: 4px`) |
| AI avatar | 36px circle, `--color-teal-500` bg, `Bot` icon white 18px |
| Voice button | 64px circle, `--gradient-btn-ai`, `--shadow-ai-glow`, pulsing `--shadow-ai-glow-hover` ring when active |
| Waveform visualizer | 5-bar SVG, `--color-teal-400`, animated when listening |
| Input bar | Full width, 52px height, `--color-navy-800` bg, right: mic icon + send icon |
| Thinking state | 3-dot animation in `--color-teal-100` bubble, `--color-teal-500` dots |

---

#### 8.10.6 Call Center Dashboard

| Element | Specification |
|---|---|
| Active call banner | Fixed top (below app header), `--color-success-600` bg, pulsing dot `--duration-pulse`, call timer |
| Queue list | Left panel 35%, each item 72px, draggable priority reorder |
| Active call panel | Right 65%, caller info header, live transcript (JetBrains Mono 13px), AI confidence meter, red "Handoff" button |
| Call outcome chips | Color-coded: AI Resolved (teal), Handed Off (amber), Missed (danger) |
| Call log table | Bottom full width, sortable, filterable by outcome/date/agent type |

---

#### 8.10.7 Blockchain Verification Page

| Element | Specification |
|---|---|
| Page background | `--color-navy-950` with subtle `--gradient-ai-glow` radial overlay in indigo |
| Heading | Sora 40px / 700 / white + `ShieldCheck` icon indigo-400 |
| Hash input | 60px height, `--color-navy-800` bg, `--color-indigo-300` border-focus, JetBrains Mono |
| Verify button | Full-width `lg`, `--gradient-btn-blockchain`, `--shadow-blockchain-glow` |
| Result — Verified | Card: `--color-indigo-50` bg, `--color-success-600` header, hash reveal animation |
| Result — Failed | Card: `--color-danger-50` bg, `--color-danger-600` header, error explanation |
| Chain animation | SVG chain links connect on verification success, indigo fill, 500ms |

---

#### 8.10.8 Analytics Dashboard

| Chart | Type | Colors |
|---|---|---|
| Patient volume over time | Line chart | Navy-500 line, Navy-100 fill |
| Revenue by month | Bar chart | Navy-500 bars, hover Navy-400 |
| Appointment outcomes | Donut chart | Success/Warning/Danger/Gray |
| AI call resolution rate | Gauge chart | Teal-500 fill |
| Top diagnoses | Horizontal bar | Teal gradient bars |
| Missed calls trend | Area chart | Danger-500 line, Danger-50 fill |

**Chart specifications:** Recharts library, 16px DM Sans axis labels, gray-300 grid lines, navy-900 tooltip background, 300ms animation on load.

---

### 8.11 Responsive Design System

| Rule | Specification |
|---|---|
| Sidebar — mobile | Drawer, slides in from left (`translateX(-100%)`), 280px, dark overlay backdrop |
| Sidebar — tablet | Collapsed (72px icons only) by default |
| Sidebar — desktop | Expanded (280px) by default |
| Hamburger button | 44×44px tap target, top-left, visible below `lg` breakpoint |
| Dashboard grid — xl+ | 4-column KPI cards |
| Dashboard grid — md | 2-column KPI cards |
| Dashboard grid — sm | 1-column KPI cards, panels stack vertically |
| Data tables — below md | Horizontal scroll container (`overflow-x: auto`) |
| Navigation — mobile | Full-screen drawer menu |
| Modal — mobile | Bottom sheet (slides from bottom), full width, `--radius-2xl` top corners only |
| Toast — mobile | Top-center, `calc(100vw - 32px)` width |
| Typography — mobile | Reduce display sizes by 25% (72px hero → 40px, 40px H1 → 28px) |
| Touch targets | Minimum 44×44px for **all** interactive elements (iOS HIG / WCAG 2.5.5) |
| Form inputs — mobile | Full width (`width: 100%`) on all viewports below `md` |
| Buttons — mobile | Full width for primary CTA on pages; auto-width in toolbars |

---

### 8.12 Accessibility Specifications

| Requirement | Specification |
|---|---|
| Color contrast | Minimum 4.5:1 for normal text, 3:1 for large text (>18px) and UI components |
| Focus ring | `2px solid --color-navy-500`, `3px offset` — visible on **all** focusable elements |
| Keyboard navigation | Complete app operability without mouse. Logical tab order. No keyboard traps. |
| Skip navigation | "Skip to main content" link as first focusable element on every page |
| Headings | One `<h1>` per page. Never skip levels. |
| Landmark roles | `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`, `<section>` used semantically |
| Icon buttons | Always `aria-label` on icon-only buttons |
| Form labels | Every input has explicit `<label>` or `aria-label` |
| Error identification | Never color alone — always pair with icon + text |
| Loading states | `aria-busy="true"` on loading containers, `aria-live="polite"` on updates |
| Status messages | `role="status"` or `role="alert"` for toasts and dynamic content |
| AI responses | `aria-live="polite"` on AI message container for screen reader announcement |
| Voice button | `aria-pressed` state, `aria-label="Start voice input"` / `"Stop voice input"` |
| Tables | `<thead>`, `<th scope="col/row">`, `caption` for screen reader context |
| Reduced motion | All animations respect `prefers-reduced-motion: reduce` |
| Font scaling | All sizes in `rem`. Layout must function at 200% browser text zoom. |
| Images | Descriptive `alt` text. Decorative images use `alt=""`. Charts use `aria-label` with data summary. |

---

### 8.13 Design Tokens — Master Reference (CSS Variables)

```css
:root {
  /* ── Color — Navy Primary ── */
  --color-navy-950: #050E1C;
  --color-navy-900: #0A1628;
  --color-navy-800: #0F2040;
  --color-navy-700: #1B3A6B;
  --color-navy-600: #1E4D8C;
  --color-navy-500: #2563EB;
  --color-navy-400: #3B82F6;
  --color-navy-300: #93C5FD;
  --color-navy-200: #BFDBFE;
  --color-navy-100: #DBEAFE;
  --color-navy-50:  #EFF6FF;

  /* ── Color — Teal AI ── */
  --color-teal-700: #0D5E59;
  --color-teal-600: #0D7377;
  --color-teal-500: #0D9488;
  --color-teal-400: #14B8A6;
  --color-teal-300: #2DD4BF;
  --color-teal-200: #99F6E4;
  --color-teal-100: #CCFBF1;
  --color-teal-50:  #F0FDFA;

  /* ── Color — Indigo Blockchain ── */
  --color-indigo-900: #1E1B4B;
  --color-indigo-700: #3730A3;
  --color-indigo-600: #4F46E5;
  --color-indigo-500: #6366F1;
  --color-indigo-400: #818CF8;
  --color-indigo-100: #E0E7FF;
  --color-indigo-50:  #EEF2FF;

  /* ── Color — Semantic ── */
  --color-success-700: #047857;
  --color-success-600: #059669;
  --color-success-500: #10B981;
  --color-success-100: #D1FAE5;
  --color-success-50:  #ECFDF5;
  --color-warning-700: #B45309;
  --color-warning-600: #D97706;
  --color-warning-500: #F59E0B;
  --color-warning-100: #FEF3C7;
  --color-warning-50:  #FFFBEB;
  --color-danger-700:  #B91C1C;
  --color-danger-600:  #DC2626;
  --color-danger-500:  #EF4444;
  --color-danger-100:  #FEE2E2;
  --color-danger-50:   #FEF2F2;
  --color-info-700:    #0369A1;
  --color-info-600:    #0284C7;
  --color-info-100:    #E0F2FE;
  --color-info-50:     #F0F9FF;

  /* ── Color — Neutrals ── */
  --color-gray-950: #030712;
  --color-gray-900: #111827;
  --color-gray-800: #1F2937;
  --color-gray-700: #374151;
  --color-gray-600: #4B5563;
  --color-gray-500: #6B7280;
  --color-gray-400: #9CA3AF;
  --color-gray-300: #D1D5DB;
  --color-gray-200: #E5E7EB;
  --color-gray-100: #F3F4F6;
  --color-gray-50:  #F9FAFB;
  --color-white:    #FFFFFF;

  /* ── Typography ── */
  --font-display: 'Sora', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body:    'DM Sans', 'Helvetica Neue', Arial, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  --text-display-2xl: 4.5rem;   /* 72px */
  --text-display-xl:  3.5rem;   /* 56px */
  --text-display-lg:  2.5rem;   /* 40px */
  --text-display-md:  2rem;     /* 32px */
  --text-display-sm:  1.5rem;   /* 24px */
  --text-xl:    1.25rem;        /* 20px */
  --text-lg:    1.125rem;       /* 18px */
  --text-base:  1rem;           /* 16px */
  --text-sm:    0.875rem;       /* 14px */
  --text-xs:    0.75rem;        /* 12px */
  --text-2xs:   0.625rem;       /* 10px */

  /* ── Spacing ── */
  --space-px:  1px;
  --space-0-5: 0.125rem;
  --space-1:   0.25rem;
  --space-2:   0.5rem;
  --space-3:   0.75rem;
  --space-4:   1rem;
  --space-5:   1.25rem;
  --space-6:   1.5rem;
  --space-7:   1.75rem;
  --space-8:   2rem;
  --space-10:  2.5rem;
  --space-12:  3rem;
  --space-14:  3.5rem;
  --space-16:  4rem;
  --space-20:  5rem;
  --space-24:  6rem;
  --space-32:  8rem;

  /* ── Border Radius ── */
  --radius-none: 0px;
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  24px;
  --radius-3xl:  32px;
  --radius-full: 9999px;

  /* ── Animation Timing ── */
  --ease-default:  cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:       cubic-bezier(0.4, 0, 1, 1);
  --ease-out:      cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce:   cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-spring:   cubic-bezier(0.175, 0.885, 0.32, 1.275);

  --duration-instant:  75ms;
  --duration-fast:     150ms;
  --duration-normal:   200ms;
  --duration-moderate: 300ms;
  --duration-slow:     400ms;
  --duration-slower:   500ms;
  --duration-ai:       800ms;
  --duration-pulse:    1500ms;
  --duration-wave:     1200ms;

  /* ── Z-Index ── */
  --z-base:       0;
  --z-raised:     10;
  --z-floating:   50;
  --z-dropdown:   100;
  --z-sticky:     200;
  --z-overlay:    300;
  --z-drawer:     400;
  --z-modal:      500;
  --z-toast:      600;
  --z-tooltip:    700;
  --z-voice:      800;
}
```

---

## 9. Product Roadmap

### 9.1 MVP Delivery Phases

| Phase | Timeline | Deliverables | Success Criteria |
|---|---|---|---|
| **Phase 1** | Weeks 1–6 | Auth, Patient & Doctor Management, Appointment & Queue, Billing basics | Core ops digitized; zero paper-based bookings |
| **Phase 2** | Weeks 7–12 | AI Voice Assistant, 24/7 AI Calling Agent, Full EMR, Notifications | 50% reduction in missed calls; voice booking live |
| **Phase 3** | Weeks 13–18 | Blockchain Security, OCR Scanner, Analytics Dashboard | Tamper-proof records live; admin KPIs visible |
| **Phase 4** | Weeks 19–26 | RAG Engine, Qdrant Memory, LangGraph Agentic AI, Telemedicine | Autonomous AI workflows; personalized patient experience |

### 9.2 Feature Priority Matrix

| Feature | Priority | Complexity | Phase |
|---|---|---|---|
| Authentication & RBAC | Critical | Medium | Phase 1 |
| Appointment & Queue | Critical | Medium | Phase 1 |
| Patient Management | Critical | Low | Phase 1 |
| Doctor Management | High | Low | Phase 1 |
| Billing & Payments | High | Medium | Phase 1 |
| EMR / Medical Records | Critical | High | Phase 2 |
| AI Voice Assistant | High | High | Phase 2 |
| 24/7 AI Calling Agent | High | High | Phase 2 |
| Notifications Engine | High | Medium | Phase 2 |
| Blockchain Medical Security | High | Very High | Phase 3 |
| Analytics Dashboard | Medium | Medium | Phase 3 |
| OCR Document Scanner | Low | Medium | Phase 3 |
| RAG Knowledge Engine | High | Very High | Phase 4 |
| AI Memory (Qdrant) | Medium | High | Phase 4 |
| Agentic AI (LangGraph) | High | Very High | Phase 4 |
| Telemedicine (WebRTC) | Medium | High | Phase 4 |

---

## 10. Testing Requirements

| Test Type | Scope | Tooling | Coverage Target |
|---|---|---|---|
| Unit Testing | Functions, utilities, services, components | Jest (backend), Karma/Jasmine (Angular frontend) | ≥ 80% |
| Integration Testing | API routes, database, auth flows, module interactions | Jest, Supertest | Key flows |
| API Testing | All REST endpoints, contracts, error handling | Postman, Newman (CI runner) | 100% endpoints |
| Security Testing | OWASP Top-10, injection, auth bypass, RBAC | OWASP ZAP, manual pen testing | Quarterly |
| Performance Testing | Load at 10,000 concurrent users, stress, spike | k6, Artillery | Per phase |
| Usability Testing | Patient and doctor user journey completion | User sessions, task analysis | Per phase |
| Accessibility Testing | WCAG 2.1 AA compliance, screen reader, keyboard | axe-core, Lighthouse, NVDA | Per release |
| AI Quality Testing | Hallucination rate, RAG grounding accuracy | Custom eval suite | Per AI release |
| Blockchain Testing | Smart contract logic, hash verification | Hardhat tests, Foundry | 100% contracts |

---

## 11. Success Metrics (KPIs)

### 11.1 Operational KPIs

| KPI | Baseline | Target | Measurement Method |
|---|---|---|---|
| Manual appointment booking rate | ~100% | < 30% | Booking source tagging |
| Missed call rate | ~30–40% | < 15% | Call log completion rate |
| Patient check-in to consultation time | Baseline TBD | 30% faster | Timestamp delta |
| System uptime | — | 99.9% SLA | Statuspage / Datadog |
| Patient satisfaction (NPS) | Baseline TBD | > 4.5 / 5.0 | In-app survey |
| AI call resolution without handoff | — | > 75% | Call outcome classification |
| Blockchain verification success rate | — | 100% | Smart contract event log |
| EMR digital adoption rate | — | > 90% of records | Record creation source |

### 11.2 Technical KPIs

- API P95 response time consistently below 2 seconds
- Zero critical CVEs in quarterly OWASP security audit
- AI response hallucination rate below 2% (RAG grounding check)
- Blockchain transaction confirmation under 30 seconds on Polygon
- Unit test coverage above 80% across all backend modules
- Lighthouse performance score above 90 on all pages
- WCAG AA audit: zero critical violations per release

---

## 12. Deployment & Infrastructure

| Component | Platform | Configuration |
|---|---|---|
| Frontend | Vercel | Auto-deploy from `main`, Preview deployments for PRs |
| Backend API | Render | Docker containers, autoscaling, health checks |
| Database | PostgreSQL 16 (Render / Supabase) | Automated daily backups, point-in-time restore, connection pooling |
| File Storage | AWS S3 + CloudFront CDN | AES-256 encryption, signed URL access, lifecycle policies |
| Vector DB | Qdrant Cloud | Managed cluster, auto-scaling collections |
| Blockchain | Polygon Mainnet + Amoy Testnet | Hardhat deployment pipeline, multi-sig upgrade authority |
| CI/CD | GitHub Actions | Lint → Test → Build → Deploy pipeline |
| Monitoring | Datadog (metrics) + Sentry (errors) | PagerDuty alerts for P0/P1 incidents |
| Secrets | AWS Secrets Manager / Render Env | Zero plaintext secrets in codebase |

### 12.1 Environment Strategy

| Environment | Branch | Purpose |
|---|---|---|
| Development | `feature/*` | Local development, hot reload |
| Staging | `develop` | Integration testing, QA review |
| Preview | PR branches | Per-PR preview deployments (Vercel) |
| Production | `main` | Live environment, guarded deployments |

---

## Appendix: Glossary

| Term | Definition |
|---|---|
| **Agentic AI** | AI systems capable of autonomous multi-step task execution without constant human input |
| **RAG** | Retrieval-Augmented Generation — LLM pattern that grounds responses in retrieved source documents |
| **EMR** | Electronic Medical Record — digitized longitudinal patient health information |
| **RBAC** | Role-Based Access Control — permission system tied to assigned user roles |
| **JWT** | JSON Web Token — compact, signed token for stateless API authentication |
| **Qdrant** | Open-source vector database used for semantic similarity search and AI memory storage |
| **LangGraph** | Framework for stateful, multi-actor AI agent orchestration using directed graphs |
| **LangChain** | Framework for composing LLM-powered chains, tools, and agents |
| **Polygon** | EVM-compatible Layer-2 blockchain for low-cost, fast smart contract execution |
| **WebRTC** | Web Real-Time Communication — browser-native protocol for P2P video and audio |
| **OCR** | Optical Character Recognition — technology to extract structured text from images |
| **ICD-10** | International Classification of Diseases, 10th revision — global medical diagnosis standard |
| **HIPAA** | Health Insurance Portability and Accountability Act — US healthcare data privacy regulation |
| **GDPR** | General Data Protection Regulation — EU data privacy and protection law |
| **WCAG** | Web Content Accessibility Guidelines — international web accessibility standard |
| **OWASP** | Open Web Application Security Project — web application security framework |
| **TLS** | Transport Layer Security — cryptographic protocol for secure internet communications |
| **PHI** | Protected Health Information — individually identifiable health data regulated by HIPAA |
| **FCP** | First Contentful Paint — Core Web Vitals metric for initial render performance |
| **SLA** | Service Level Agreement — contractual uptime and performance commitment |
| **RPO** | Recovery Point Objective — maximum acceptable data loss window in disaster scenarios |
| **STT** | Speech-to-Text — AI conversion of spoken audio to written text (Whisper) |
| **P95 / P90** | 95th / 90th percentile latency — how fast 95% / 90% of requests complete |
| **NPS** | Net Promoter Score — measure of patient satisfaction and loyalty |
| **CVE** | Common Vulnerabilities and Exposures — identifier for publicly known security vulnerabilities |
| **DXA** | Document eXtension Attribute unit — 1440 DXA = 1 inch (used in Office documents) |

---

*End of Document — VoiceMed Pro PRD v2.0*
*Confidential & Proprietary — For Internal Use Only*
*© 2025 VoiceMed Pro. All rights reserved.* 