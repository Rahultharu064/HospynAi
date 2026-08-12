import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

const PATIENT_ID = "patient-123";
const RECORD_TYPE = "EMR";

async function deployConsent() {
  const [owner, provider, otherProvider, outsider] = await ethers.getSigners();
  const Consent = await ethers.getContractFactory("PatientConsent");
  const consent = await Consent.deploy();
  await consent.waitForDeployment();
  return { consent, owner, provider, otherProvider, outsider };
}

async function futureExpiry(daysFromNow = 30) {
  const latest = await ethers.provider.getBlock("latest");
  return BigInt(latest!.timestamp) + BigInt(daysFromNow * 24 * 60 * 60);
}

describe("PatientConsent", function () {
  describe("deployment", function () {
    it("auto-authorizes the deployer as a provider", async function () {
      const { consent, owner } = await deployConsent();
      expect(await consent.isAuthorizedProvider(owner.address)).to.equal(true);
    });
  });

  describe("access control (regression: providers must be authorized)", function () {
    it("rejects grantConsent from an unauthorized address", async function () {
      const { consent, provider, outsider } = await deployConsent();
      const expiresAt = await futureExpiry();
      await expect(
        consent.connect(outsider).grantConsent(PATIENT_ID, provider.address, RECORD_TYPE, "READ", expiresAt)
      ).to.be.revertedWith("Not authorized provider");
    });

    it("rejects revokeConsent from an unauthorized address", async function () {
      const { consent, owner, provider, outsider } = await deployConsent();
      const expiresAt = await futureExpiry();
      const tx = await consent
        .connect(owner)
        .grantConsent(PATIENT_ID, provider.address, RECORD_TYPE, "READ", expiresAt);
      const receipt = await tx.wait();
      const consentId = receipt!.logs
        .map((log) => {
          try {
            return consent.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed?.name === "ConsentGranted")!.args.consentId;

      await expect(
        consent.connect(outsider).revokeConsent(consentId, "not authorized")
      ).to.be.revertedWith("Not authorized provider");
    });

    it("rejects updateConsent from an unauthorized address", async function () {
      const { consent, owner, provider, outsider } = await deployConsent();
      const expiresAt = await futureExpiry();
      const tx = await consent
        .connect(owner)
        .grantConsent(PATIENT_ID, provider.address, RECORD_TYPE, "READ", expiresAt);
      const receipt = await tx.wait();
      const consentId = receipt!.logs
        .map((log) => {
          try {
            return consent.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed?.name === "ConsentGranted")!.args.consentId;

      await expect(
        consent.connect(outsider).updateConsent(consentId, "WRITE", await futureExpiry(60))
      ).to.be.revertedWith("Not authorized provider");
    });

    it("allows the owner to authorize a new provider who can then grant consent", async function () {
      const { consent, owner, provider, otherProvider } = await deployConsent();
      await consent.connect(owner).addAuthorizedProvider(otherProvider.address);
      expect(await consent.isAuthorizedProvider(otherProvider.address)).to.equal(true);

      const expiresAt = await futureExpiry();
      await expect(
        consent
          .connect(otherProvider)
          .grantConsent(PATIENT_ID, provider.address, RECORD_TYPE, "READ", expiresAt)
      ).to.emit(consent, "ConsentGranted");
    });

    it("prevents removing the owner as an authorized provider", async function () {
      const { consent, owner } = await deployConsent();
      await expect(consent.connect(owner).removeAuthorizedProvider(owner.address)).to.be.reverted;
    });
  });

  describe("grantConsent", function () {
    it("grants consent and records it for the patient and provider", async function () {
      const { consent, owner, provider } = await deployConsent();
      const expiresAt = await futureExpiry();

      await expect(
        consent.connect(owner).grantConsent(PATIENT_ID, provider.address, RECORD_TYPE, "READ", expiresAt)
      ).to.emit(consent, "ConsentGranted");

      const [hasAccess, accessLevel] = await consent.checkConsent(PATIENT_ID, provider.address, RECORD_TYPE);
      expect(hasAccess).to.equal(true);
      expect(accessLevel).to.equal("READ");
    });

    it("rejects an invalid access level", async function () {
      const { consent, owner, provider } = await deployConsent();
      const expiresAt = await futureExpiry();
      await expect(
        consent.connect(owner).grantConsent(PATIENT_ID, provider.address, RECORD_TYPE, "ADMIN", expiresAt)
      ).to.be.revertedWith("Invalid access level");
    });

    it("rejects a zero provider address", async function () {
      const { consent, owner } = await deployConsent();
      const expiresAt = await futureExpiry();
      await expect(
        consent.connect(owner).grantConsent(PATIENT_ID, ethers.ZeroAddress, RECORD_TYPE, "READ", expiresAt)
      ).to.be.revertedWith("Provider address required");
    });

    it("replaces an existing active consent for the same patient/provider/recordType", async function () {
      const { consent, owner, provider } = await deployConsent();
      const expiresAt = await futureExpiry();
      await consent.connect(owner).grantConsent(PATIENT_ID, provider.address, RECORD_TYPE, "READ", expiresAt);
      await consent.connect(owner).grantConsent(PATIENT_ID, provider.address, RECORD_TYPE, "WRITE", expiresAt);

      const [hasAccess, accessLevel] = await consent.checkConsent(PATIENT_ID, provider.address, RECORD_TYPE);
      expect(hasAccess).to.equal(true);
      expect(accessLevel).to.equal("WRITE");

      const { records, total } = await consent.getPatientConsents(PATIENT_ID, 0, 10);
      expect(total).to.equal(2n);
      expect(records[0].isRevoked).to.equal(true);
      expect(records[1].isRevoked).to.equal(false);
    });
  });

  describe("revokeConsent", function () {
    it("revokes an active consent", async function () {
      const { consent, owner, provider } = await deployConsent();
      const expiresAt = await futureExpiry();
      const tx = await consent
        .connect(owner)
        .grantConsent(PATIENT_ID, provider.address, RECORD_TYPE, "READ", expiresAt);
      const receipt = await tx.wait();
      const consentId = receipt!.logs
        .map((log) => {
          try {
            return consent.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed?.name === "ConsentGranted")!.args.consentId;

      await expect(consent.connect(owner).revokeConsent(consentId, "patient request")).to.emit(
        consent,
        "ConsentRevoked"
      );

      const [hasAccess] = await consent.checkConsent(PATIENT_ID, provider.address, RECORD_TYPE);
      expect(hasAccess).to.equal(false);
    });
  });

  describe("pausing", function () {
    it("blocks grantConsent while paused", async function () {
      const { consent, owner, provider } = await deployConsent();
      await consent.connect(owner).pause();
      const expiresAt = await futureExpiry();
      await expect(
        consent.connect(owner).grantConsent(PATIENT_ID, provider.address, RECORD_TYPE, "READ", expiresAt)
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
