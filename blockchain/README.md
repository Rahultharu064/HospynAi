# VoiceMed Pro — Blockchain Layer

Solidity smart contracts that give VoiceMed Pro's medical records, patient
consent, prescriptions, and audit trail a tamper-evident, timestamped anchor
on Polygon. The backend never stores clinical data on-chain — only hashes,
consent metadata, and access-control state live here.

Built with Hardhat 2 (`@nomicfoundation/hardhat-toolbox` classic bundle),
ethers v6, and OpenZeppelin Contracts 4.9.

## Contracts

| Contract | Purpose | Access control |
| --- | --- | --- |
| `MedicalRecordAnchor.sol` | Anchors SHA-256 hashes of medical records (EMR, prescriptions, lab reports) with revocation support and optional per-anchor fees. | `onlyAuthorizedProvider` (owner + explicitly authorized addresses) |
| `PatientConsent.sol` | Grants, revokes, and updates patient consent for a provider to access a record type at a given access level. | `onlyAuthorizedProvider` (owner + explicitly authorized addresses) |
| `PrescriptionVerifier.sol` | Tracks the prescription lifecycle: creation by a doctor, dispensing by a pharmacy, cancellation, refill counts. | `onlyDoctor` / `onlyPharmacy` (separate authorized-address sets) |
| `MedicalDataRegistry.sol` | Unified audit trail across all data operations, plus a provider directory. | `onlyRegisteredProvider` for writes; registration is self-service, deactivation/reactivation is owner-only |

All four contracts inherit OpenZeppelin's `Ownable`, `Pausable`, and
`ReentrancyGuard`. The contract owner can pause/unpause each contract
independently and manage its authorized-address set.

### Security model

Every state-changing entry point that touches patient data requires the
caller to be an explicitly authorized address (or the contract owner) —
there is no contract in this project where an arbitrary wallet can write
consent, anchor a record, or forge an audit-trail entry. The deployer wallet
is auto-authorized in each constructor, matching the single-signer pattern
used by the backend's `polygonClient.ts` integration, so no extra
authorization step is needed after a fresh deployment.

`MedicalDataRegistry.registerProvider()` is the one self-service exception:
any address can register itself as a provider, but once the owner
deactivates a provider (`deactivateProvider`), that address **cannot**
re-register itself back to active status — only `reactivateProvider`
(owner-only) can restore it. This prevents a deactivated/compromised
provider from silently undoing an admin's compliance action.

## Project layout

```
contracts/               Solidity sources
  interfaces/             Shared interfaces (IMedicalRecordAnchor, IPatientConsent)
scripts/deploy.ts         Deploys all 4 contracts with one signer, writes deployments/<network>.json
test/                     Mocha + chai integration tests (one file per contract)
deployments/              Deployment output per network (gitignored except structure)
hardhat.config.cts        Networks, compiler, Etherscan/Polygonscan verification config
```

## Setup

```shell
npm install
cp .env.example .env   # fill in your own values — see below
```

`.env` variables:

| Variable | Required for | Notes |
| --- | --- | --- |
| `BLOCKCHAIN_PRIVATE_KEY` | Deploying to Amoy/Polygon | Dedicated deployer key. **Never** reuse a personal wallet or commit this file. |
| `POLYGON_AMOY_RPC` / `POLYGON_MAINNET_RPC` | Deploying to Amoy/Polygon | Alchemy (or any) RPC endpoint. |
| `PLATFORM_WALLET` | `MedicalRecordAnchor` deployment | Receives anchor fees; can be a multisig. |
| `POLYGONSCAN_API_KEY` | Contract verification | Used by `hardhat-verify`. |

`.env` is gitignored. Only `.env.example` (placeholder values) is tracked.

## Usage

### Compile

```shell
npm run compile
```

### Test

```shell
npm test              # full mocha + chai suite, one file per contract
npm run test:coverage # solidity-coverage report
```

### Local node + deploy

```shell
npm run node                 # starts a local Hardhat chain
npm run deploy:local          # deploys all 4 contracts to it
```

### Testnet / mainnet deploy

```shell
npm run deploy:amoy      # Polygon Amoy testnet
npm run deploy:polygon   # Polygon mainnet
```

`scripts/deploy.ts` deploys `MedicalRecordAnchor`, `PatientConsent`,
`PrescriptionVerifier`, and `MedicalDataRegistry` in sequence from the same
signer, writes the resulting addresses to `deployments/<network>.json`, and
prints a ready-to-paste `.env` snippet for the backend
(`BLOCKCHAIN_*_ADDRESS` variables consumed by
`backend/src/integration/blockchain/polygonClient.ts`).

### Verify on Polygonscan

```shell
npm run verify:amoy -- <address> <constructor-args...>
npm run verify:polygon -- <address> <constructor-args...>
```

### Contract size check

```shell
npm run size
```

## CI

`.github/workflows/blockchain-ci.yml` compiles the contracts and runs the
full test suite on every PR/push that touches `blockchain/`.
