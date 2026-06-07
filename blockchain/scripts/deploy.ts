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
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

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

  console.log("📝 Deployment addresses saved to deployments/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });