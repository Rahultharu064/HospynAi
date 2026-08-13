import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

async function deployRegistry() {
  const [owner, provider, outsider] = await ethers.getSigners();
  const MedicalDataRegistry = await ethers.getContractFactory("MedicalDataRegistry");
  const registry = await MedicalDataRegistry.deploy();
  await registry.waitForDeployment();
  return { registry, owner, provider, outsider };
}

describe("MedicalDataRegistry", function () {
  it("Should record transactions correctly", async function () {
    const { registry } = await deployRegistry();

    const dataHash = "0x7f83b1657ff1fc53b92f41ec4388e367806fde12b9c8b7f83b1657ff1fc53b92";
    const dataType = "EMR";
    const operation = "CREATE";
    const patientId = "patient-123";
    const targetProvider = ethers.ZeroAddress;
    const metadata = '{"notes": "Initial EMR record"}';

    const tx = await registry.recordTransaction(
      dataHash,
      dataType,
      operation,
      patientId,
      targetProvider,
      metadata
    );
    await tx.wait();

    expect(await registry.getTotalTransactions()).to.equal(1n);

    const stats = await registry.getStats();
    expect(stats._totalTransactions).to.equal(1n);
    expect(stats._totalProviders).to.equal(1n);
  });

  describe("access control (regression: recordTransaction must be gated)", function () {
    it("rejects recordTransaction from an unregistered address", async function () {
      const { registry, outsider } = await deployRegistry();
      await expect(
        registry
          .connect(outsider)
          .recordTransaction("hash", "EMR", "CREATE", "patient-1", ethers.ZeroAddress, "{}")
      ).to.be.revertedWith("Not a registered provider");
    });

    it("allows a self-registered active provider to record transactions", async function () {
      const { registry, provider } = await deployRegistry();
      await registry.connect(provider).registerProvider("City Clinic", "CLINIC");

      await expect(
        registry
          .connect(provider)
          .recordTransaction("hash", "EMR", "CREATE", "patient-1", ethers.ZeroAddress, "{}")
      ).to.not.be.reverted;
    });
  });

  describe("registerProvider (regression: providerList must grow, no self-reactivation)", function () {
    it("adds a newly self-registered provider to the provider list", async function () {
      const { registry, provider } = await deployRegistry();
      await registry.connect(provider).registerProvider("City Clinic", "CLINIC");

      const all = await registry.getAllProviders();
      expect(all.length).to.equal(2); // deployer + new provider
      expect(all.some((p) => p.providerAddress === provider.address)).to.equal(true);

      const stats = await registry.getStats();
      expect(stats._totalProviders).to.equal(2n);
    });

    it("rejects registering twice while active", async function () {
      const { registry, provider } = await deployRegistry();
      await registry.connect(provider).registerProvider("City Clinic", "CLINIC");
      await expect(
        registry.connect(provider).registerProvider("City Clinic", "CLINIC")
      ).to.be.revertedWith("Already registered");
    });

    it("blocks a deactivated provider from self-reactivating via registerProvider", async function () {
      const { registry, owner, provider } = await deployRegistry();
      await registry.connect(provider).registerProvider("City Clinic", "CLINIC");
      await registry.connect(owner).deactivateProvider(provider.address, "compliance hold");

      await expect(
        registry.connect(provider).registerProvider("City Clinic", "CLINIC")
      ).to.be.revertedWith("Provider was deactivated; ask an admin to reactivate");
    });

    it("lets the owner reactivate a deactivated provider", async function () {
      const { registry, owner, provider } = await deployRegistry();
      await registry.connect(provider).registerProvider("City Clinic", "CLINIC");
      await registry.connect(owner).deactivateProvider(provider.address, "compliance hold");

      await expect(registry.connect(owner).reactivateProvider(provider.address)).to.emit(
        registry,
        "ProviderReactivated"
      );

      const info = await registry.getProvider(provider.address);
      expect(info.isActive).to.equal(true);

      // provider list should not have grown again on reactivation
      const all = await registry.getAllProviders();
      expect(all.length).to.equal(2);
    });

    it("rejects a non-owner reactivating a provider", async function () {
      const { registry, owner, provider, outsider } = await deployRegistry();
      await registry.connect(provider).registerProvider("City Clinic", "CLINIC");
      await registry.connect(owner).deactivateProvider(provider.address, "compliance hold");

      await expect(
        registry.connect(outsider).reactivateProvider(provider.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
