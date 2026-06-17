import hardhat from "hardhat";
const { ethers } = hardhat as any;
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function main() {
  const networkName = process.env.HARDHAT_NETWORK || "unknown";

  let signers: Awaited<ReturnType<typeof ethers.getSigners>>;
  try {
    signers = await ethers.getSigners();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      networkName === "localhost" &&
      (message.includes("ECONNREFUSED") || message.includes("HH108"))
    ) {
      throw new Error(
        "Cannot reach Hardhat node at http://127.0.0.1:8545\n\n" +
          "Local deploy needs TWO terminals:\n" +
          "  Terminal 1:  npm run node          (leave running)\n" +
          "  Terminal 2:  npm run deploy:local\n\n" +
          "Or use one-shot in-memory deploy:  npm run deploy:hardhat"
      );
    }
    throw error;
  }

  const deployer = signers[0];
  if (!deployer) {
    throw new Error(
      "No deployer account found. Set BLOCKCHAIN_PRIVATE_KEY in blockchain/.env or backend/.env:\n" +
        "  BLOCKCHAIN_PRIVATE_KEY=0x<your-wallet-private-key>\n" +
        "  POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology\n" +
        "Fund the wallet with test MATIC on Amoy before deploying."
    );
  }

  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceMatic = ethers.formatEther(balance);
  console.log("Account balance:", balanceMatic, "MATIC");

  const isLocalNetwork = networkName === "localhost" || networkName === "hardhat";
  if (networkName === "localhost" && balance === 0n) {
    throw new Error(
      "Deployer has 0 ETH on the local Hardhat node.\n\n" +
        "Local deploy must use Hardhat's prefunded accounts, not your MetaMask wallet.\n" +
        "Ensure hardhat.config does not pass BLOCKCHAIN_PRIVATE_KEY to localhost,\n" +
        "then restart the node and run deploy again:\n\n" +
        "  Terminal 1:  npm run node\n" +
        "  Terminal 2:  npm run deploy:local"
    );
  }

  const minBalanceWei = ethers.parseEther("0.15");
  if (!isLocalNetwork && balance < minBalanceWei) {
    const explorerBase =
      networkName === "amoy"
        ? "https://amoy.polygonscan.com/address"
        : networkName === "polygon"
          ? "https://polygonscan.com/address"
          : null;

    throw new Error(
      `Insufficient MATIC for deployment (have ${balanceMatic}, need ~0.15+ MATIC).\n\n` +
        `Send test MATIC to: ${deployer.address}\n\n` +
        (networkName === "amoy"
          ? "Amoy faucets:\n" +
            "  • https://faucet.polygon.technology/ (select Polygon Amoy)\n" +
            "  • https://www.alchemy.com/faucets/polygon-amoy\n\n" +
            (explorerBase ? `Check balance: ${explorerBase}/${deployer.address}\n\n` : "")
          : networkName === "polygon"
            ? "Fund this wallet with MATIC on Polygon mainnet.\n\n"
            : "") +
        "Wait 1–2 minutes after the faucet, then run deploy again."
    );
  }

  const platformWallet = process.env.PLATFORM_WALLET || deployer.address;

  // Deploy MedicalRecordAnchor
  console.log("\n📦 Deploying MedicalRecordAnchor...");
  const MedicalRecordAnchor = await ethers.getContractFactory("MedicalRecordAnchor");
  const anchor = await MedicalRecordAnchor.deploy(platformWallet);
  await anchor.waitForDeployment();
  console.log("✅ MedicalRecordAnchor deployed to:", await anchor.getAddress());

  // Deploy PatientConsent
  console.log("\n📦 Deploying PatientConsent...");
  const PatientConsent = await ethers.getContractFactory("PatientConsent");
  const consent = await PatientConsent.deploy();
  await consent.waitForDeployment();
  console.log("✅ PatientConsent deployed to:", await consent.getAddress());

  // Deploy PrescriptionVerifier
  console.log("\n📦 Deploying PrescriptionVerifier...");
  const PrescriptionVerifier = await ethers.getContractFactory("PrescriptionVerifier");
  const verifier = await PrescriptionVerifier.deploy();
  await verifier.waitForDeployment();
  console.log("✅ PrescriptionVerifier deployed to:", await verifier.getAddress());

  // Deploy MedicalDataRegistry
  console.log("\n📦 Deploying MedicalDataRegistry...");
  const MedicalDataRegistry = await ethers.getContractFactory("MedicalDataRegistry");
  const registry = await MedicalDataRegistry.deploy();
  await registry.waitForDeployment();
  console.log("✅ MedicalDataRegistry deployed to:", await registry.getAddress());

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("MedicalRecordAnchor:  ", await anchor.getAddress());
  console.log("PatientConsent:       ", await consent.getAddress());
  console.log("PrescriptionVerifier: ", await verifier.getAddress());
  console.log("MedicalDataRegistry:  ", await registry.getAddress());
  console.log("=".repeat(60));

  // Save addresses
  const addresses = {
    network: process.env.HARDHAT_NETWORK || "unknown",
    medicalRecordAnchor: await anchor.getAddress(),
    patientConsent: await consent.getAddress(),
    prescriptionVerifier: await verifier.getAddress(),
    medicalDataRegistry: await registry.getAddress(),
    deployedAt: new Date().toISOString(),
  };

  const deployPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deployPath)) {
    fs.mkdirSync(deployPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deployPath, `${addresses.network}.json`),
    JSON.stringify(addresses, null, 2)
  );

  // Backend .env snippet for copy-paste
  const chainId =
    process.env.HARDHAT_NETWORK === "polygon"
      ? 137
      : process.env.HARDHAT_NETWORK === "amoy"
        ? 80002
        : 31337;

  console.log("\n📋 Add to backend/.env:");
  console.log("─".repeat(60));
  console.log("BLOCKCHAIN_ENABLED=true");
  console.log(`BLOCKCHAIN_NETWORK_ID=${chainId}`);
  if (process.env.HARDHAT_NETWORK === "localhost" || process.env.HARDHAT_NETWORK === "hardhat") {
    console.log("BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545");
    console.log(
      "# Local only — Hardhat account #0 (copy private key from `npm run node` output):"
    );
    console.log(`BLOCKCHAIN_PRIVATE_KEY=<hardhat-node-account-0-private-key>`);
    console.log(`# Deployer used: ${deployer.address}`);
    console.log("# Do NOT use your MetaMask key for localhost — it has 0 ETH on the local chain.");
  }
  console.log(`BLOCKCHAIN_DEPLOYMENTS_FILE=../blockchain/deployments/${addresses.network}.json`);
  console.log(`MEDICAL_RECORD_ANCHOR_ADDRESS=${addresses.medicalRecordAnchor}`);
  console.log(`PATIENT_CONSENT_ADDRESS=${addresses.patientConsent}`);
  console.log(`PRESCRIPTION_VERIFIER_ADDRESS=${addresses.prescriptionVerifier}`);
  console.log(`MEDICAL_DATA_REGISTRY_ADDRESS=${addresses.medicalDataRegistry}`);
  console.log("─".repeat(60));

  console.log("📝 Deployment addresses saved to deployments/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });