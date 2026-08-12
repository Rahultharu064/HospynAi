import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HASH_C = "c".repeat(64);

async function deployAnchor() {
  const [owner, provider, , outsider] = await ethers.getSigners();
  const Anchor = await ethers.getContractFactory("MedicalRecordAnchor");
  const anchor = await Anchor.deploy(owner.address);
  await anchor.waitForDeployment();
  return { anchor, owner, provider, outsider };
}

describe("MedicalRecordAnchor", function () {
  describe("deployment", function () {
    it("sets the platform wallet and authorizes the deployer", async function () {
      const { anchor, owner } = await deployAnchor();
      expect(await anchor.platformWallet()).to.equal(owner.address);
      expect(await anchor.isAuthorizedProvider(owner.address)).to.equal(true);
      expect(await anchor.anchorFee()).to.equal(0n);
    });

    it("rejects a zero-address platform wallet", async function () {
      const Anchor = await ethers.getContractFactory("MedicalRecordAnchor");
      await expect(Anchor.deploy(ethers.ZeroAddress)).to.be.revertedWith("Invalid platform wallet");
    });
  });

  describe("anchorHash", function () {
    it("anchors a hash for an authorized provider", async function () {
      const { anchor, owner } = await deployAnchor();
      await expect(anchor.anchorHash(HASH_A, "EMR", "patient-1")).to.emit(anchor, "HashAnchored");

      const [exists, , anchoredBy, isRevoked] = await anchor.verifyHash(HASH_A);
      expect(exists).to.equal(true);
      expect(anchoredBy).to.equal(owner.address);
      expect(isRevoked).to.equal(false);
      expect(await anchor.getTotalRecords()).to.equal(1n);
    });

    it("rejects an unauthorized caller", async function () {
      const { anchor, outsider } = await deployAnchor();
      await expect(
        anchor.connect(outsider).anchorHash(HASH_A, "EMR", "patient-1")
      ).to.be.revertedWith("Not authorized provider");
    });

    it("rejects a hash that is not 64 characters", async function () {
      const { anchor } = await deployAnchor();
      await expect(anchor.anchorHash("too-short", "EMR", "patient-1")).to.be.revertedWith(
        "Invalid hash length (must be 64 chars)"
      );
    });

    it("rejects re-anchoring the same hash", async function () {
      const { anchor } = await deployAnchor();
      await anchor.anchorHash(HASH_A, "EMR", "patient-1");
      await expect(anchor.anchorHash(HASH_A, "EMR", "patient-1")).to.be.revertedWith(
        "Record already anchored"
      );
    });

    it("enforces the anchor fee once set", async function () {
      const { anchor, owner } = await deployAnchor();
      const fee = ethers.parseEther("0.01");
      await anchor.connect(owner).setAnchorFee(fee);

      await expect(anchor.anchorHash(HASH_A, "EMR", "patient-1")).to.be.revertedWith(
        "Insufficient anchor fee"
      );

      await expect(anchor.anchorHash(HASH_A, "EMR", "patient-1", { value: fee })).to.not.be.reverted;
    });

    it("does not require a fee while anchorFee is zero (default)", async function () {
      const { anchor } = await deployAnchor();
      await expect(anchor.anchorHash(HASH_A, "EMR", "patient-1")).to.not.be.reverted;
    });
  });

  describe("revokeHash", function () {
    it("allows the original anchorer to revoke", async function () {
      const { anchor } = await deployAnchor();
      await anchor.anchorHash(HASH_A, "EMR", "patient-1");
      await expect(anchor.revokeHash(HASH_A, "duplicate entry")).to.emit(anchor, "HashRevoked");

      const [, , , isRevoked] = await anchor.verifyHash(HASH_A);
      expect(isRevoked).to.equal(true);
    });

    it("rejects revocation by a provider who did not anchor it", async function () {
      const { anchor, owner, provider } = await deployAnchor();
      await anchor.anchorHash(HASH_A, "EMR", "patient-1");
      await anchor.connect(owner).addAuthorizedProvider(provider.address);

      await expect(anchor.connect(provider).revokeHash(HASH_A, "not mine")).to.be.revertedWith(
        "Only original anchorer or owner can revoke"
      );
    });

    it("rejects revoking a record that does not exist", async function () {
      const { anchor } = await deployAnchor();
      await expect(anchor.revokeHash(HASH_A, "n/a")).to.be.revertedWith("Record not found");
    });
  });

  describe("batchAnchorHash", function () {
    it("anchors multiple hashes in one call", async function () {
      const { anchor } = await deployAnchor();
      await expect(anchor.batchAnchorHash([HASH_A, HASH_B, HASH_C], ["EMR", "EMR", "LAB"], [
        "patient-1",
        "patient-1",
        "patient-2",
      ])).to.emit(anchor, "BatchAnchored");

      expect(await anchor.getTotalRecords()).to.equal(3n);
    });

    it("enforces the per-item fee for batches", async function () {
      const { anchor } = await deployAnchor();
      const fee = ethers.parseEther("0.001");
      await anchor.setAnchorFee(fee);

      await expect(
        anchor.batchAnchorHash([HASH_A, HASH_B], ["EMR", "EMR"], ["patient-1", "patient-1"], {
          value: fee,
        })
      ).to.be.revertedWith("Insufficient anchor fee");

      await expect(
        anchor.batchAnchorHash([HASH_A, HASH_B], ["EMR", "EMR"], ["patient-1", "patient-1"], {
          value: fee * 2n,
        })
      ).to.not.be.reverted;
    });

    it("rejects batches over the max size", async function () {
      const { anchor } = await deployAnchor();
      const hashes = Array.from({ length: 51 }, (_, i) => i.toString().padStart(64, "0"));
      const types = hashes.map(() => "EMR");
      const patients = hashes.map(() => "patient-1");
      await expect(anchor.batchAnchorHash(hashes, types, patients)).to.be.revertedWith(
        "Batch too large"
      );
    });
  });

  describe("provider authorization", function () {
    it("lets the owner add and remove authorized providers", async function () {
      const { anchor, owner, provider } = await deployAnchor();
      await anchor.connect(owner).addAuthorizedProvider(provider.address);
      expect(await anchor.isAuthorizedProvider(provider.address)).to.equal(true);

      await anchor.connect(owner).removeAuthorizedProvider(provider.address);
      expect(await anchor.isAuthorizedProvider(provider.address)).to.equal(false);
    });

    it("rejects a non-owner adding providers", async function () {
      const { anchor, outsider, provider } = await deployAnchor();
      await expect(
        anchor.connect(outsider).addAuthorizedProvider(provider.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("withdrawFees", function () {
    it("transfers the contract balance to the platform wallet via a safe call", async function () {
      const { anchor, owner } = await deployAnchor();
      const fee = ethers.parseEther("0.05");
      await anchor.setAnchorFee(fee);
      await anchor.anchorHash(HASH_A, "EMR", "patient-1", { value: fee });

      await expect(anchor.withdrawFees()).to.changeEtherBalances([anchor, owner], [-fee, fee]);
    });

    it("reverts when there is nothing to withdraw", async function () {
      const { anchor } = await deployAnchor();
      await expect(anchor.withdrawFees()).to.be.revertedWith("No fees to withdraw");
    });
  });

  describe("pausing", function () {
    it("blocks anchoring while paused", async function () {
      const { anchor, owner } = await deployAnchor();
      await anchor.connect(owner).pause();
      await expect(anchor.anchorHash(HASH_A, "EMR", "patient-1")).to.be.revertedWith(
        "Pausable: paused"
      );
    });
  });
});
