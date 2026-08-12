import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

const DATA_HASH = "d".repeat(64);
const PATIENT_ID = "patient-123";
const DRUG_NAME = "Amoxicillin 500mg";

async function deployVerifier() {
  const [owner, doctor, pharmacy, outsider] = await ethers.getSigners();
  const Verifier = await ethers.getContractFactory("PrescriptionVerifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  return { verifier, owner, doctor, pharmacy, outsider };
}

async function futureExpiry(daysFromNow = 30) {
  const latest = await ethers.provider.getBlock("latest");
  return BigInt(latest!.timestamp) + BigInt(daysFromNow * 24 * 60 * 60);
}

describe("PrescriptionVerifier", function () {
  describe("deployment", function () {
    it("authorizes the deployer as both doctor and pharmacy", async function () {
      const { verifier, owner } = await deployVerifier();
      expect(await verifier.isAuthorizedDoctor(owner.address)).to.equal(true);
      expect(await verifier.isAuthorizedPharmacy(owner.address)).to.equal(true);
    });
  });

  describe("createPrescription", function () {
    it("rejects an unauthorized doctor", async function () {
      const { verifier, outsider } = await deployVerifier();
      const expiresAt = await futureExpiry();
      await expect(
        verifier.connect(outsider).createPrescription(DATA_HASH, PATIENT_ID, DRUG_NAME, expiresAt, 0)
      ).to.be.revertedWith("Not authorized doctor");
    });

    it("creates a prescription for an authorized doctor", async function () {
      const { verifier, owner, doctor } = await deployVerifier();
      await verifier.connect(owner).addAuthorizedDoctor(doctor.address);
      const expiresAt = await futureExpiry();

      await expect(
        verifier.connect(doctor).createPrescription(DATA_HASH, PATIENT_ID, DRUG_NAME, expiresAt, 2)
      ).to.emit(verifier, "PrescriptionCreated");
    });

    it("rejects an invalid hash length", async function () {
      const { verifier, owner } = await deployVerifier();
      const expiresAt = await futureExpiry();
      await expect(
        verifier.connect(owner).createPrescription("short-hash", PATIENT_ID, DRUG_NAME, expiresAt, 0)
      ).to.be.revertedWith("Invalid hash");
    });

    it("rejects more than 12 refills", async function () {
      const { verifier, owner } = await deployVerifier();
      const expiresAt = await futureExpiry();
      await expect(
        verifier.connect(owner).createPrescription(DATA_HASH, PATIENT_ID, DRUG_NAME, expiresAt, 13)
      ).to.be.revertedWith("Too many refills");
    });
  });

  describe("dispensePrescription", function () {
    async function createActivePrescription() {
      const ctx = await deployVerifier();
      const expiresAt = await futureExpiry();
      const tx = await ctx.verifier.connect(ctx.owner).createPrescription(
        DATA_HASH,
        PATIENT_ID,
        DRUG_NAME,
        expiresAt,
        1
      );
      const receipt = await tx.wait();
      const prescriptionId = receipt!.logs
        .map((log) => {
          try {
            return ctx.verifier.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed?.name === "PrescriptionCreated")!.args.prescriptionId;
      return { ...ctx, prescriptionId };
    }

    it("rejects an unauthorized pharmacy", async function () {
      const { verifier, outsider, prescriptionId } = await createActivePrescription();
      await expect(
        verifier.connect(outsider).dispensePrescription(prescriptionId, 1, "n/a")
      ).to.be.revertedWith("Not authorized pharmacy");
    });

    it("dispenses to an authorized pharmacy and tracks refills", async function () {
      const { verifier, owner, pharmacy, prescriptionId } = await createActivePrescription();
      await verifier.connect(owner).addAuthorizedPharmacy(pharmacy.address);

      await expect(
        verifier.connect(pharmacy).dispensePrescription(prescriptionId, 30, "first fill")
      ).to.emit(verifier, "PrescriptionDispensed");

      const record = await verifier.getPrescription(prescriptionId);
      expect(record.refillsUsed).to.equal(1n);
      expect(record.status).to.equal("ACTIVE");

      await verifier.connect(pharmacy).dispensePrescription(prescriptionId, 30, "refill");
      const finalRecord = await verifier.getPrescription(prescriptionId);
      expect(finalRecord.status).to.equal("DISPENSED");
    });

    it("rejects dispensing after refills are exhausted", async function () {
      const { verifier, owner, pharmacy, prescriptionId } = await createActivePrescription();
      await verifier.connect(owner).addAuthorizedPharmacy(pharmacy.address);
      await verifier.connect(pharmacy).dispensePrescription(prescriptionId, 30, "fill 1");
      await verifier.connect(pharmacy).dispensePrescription(prescriptionId, 30, "fill 2");

      await expect(
        verifier.connect(pharmacy).dispensePrescription(prescriptionId, 30, "fill 3")
      ).to.be.revertedWith("Prescription not active");
    });
  });

  describe("cancelPrescription", function () {
    it("allows the prescribing doctor to cancel", async function () {
      const { verifier, owner } = await deployVerifier();
      const expiresAt = await futureExpiry();
      const tx = await verifier.connect(owner).createPrescription(DATA_HASH, PATIENT_ID, DRUG_NAME, expiresAt, 0);
      const receipt = await tx.wait();
      const prescriptionId = receipt!.logs
        .map((log) => {
          try {
            return verifier.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed?.name === "PrescriptionCreated")!.args.prescriptionId;

      await expect(verifier.connect(owner).cancelPrescription(prescriptionId, "entered in error")).to.emit(
        verifier,
        "PrescriptionCancelled"
      );

      const record = await verifier.getPrescription(prescriptionId);
      expect(record.status).to.equal("CANCELLED");
    });

    it("rejects cancellation from an unrelated address", async function () {
      const { verifier, owner, outsider } = await deployVerifier();
      const expiresAt = await futureExpiry();
      const tx = await verifier.connect(owner).createPrescription(DATA_HASH, PATIENT_ID, DRUG_NAME, expiresAt, 0);
      const receipt = await tx.wait();
      const prescriptionId = receipt!.logs
        .map((log) => {
          try {
            return verifier.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed?.name === "PrescriptionCreated")!.args.prescriptionId;

      await expect(
        verifier.connect(outsider).cancelPrescription(prescriptionId, "not mine")
      ).to.be.revertedWith("Only prescribing doctor or owner can cancel");
    });
  });
});
