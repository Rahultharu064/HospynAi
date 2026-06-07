import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("MedicalDataRegistry", function () {
  it("Should record transactions correctly", async function () {
    const MedicalDataRegistry = await ethers.getContractFactory("MedicalDataRegistry");
    const registry = await MedicalDataRegistry.deploy();
    await registry.waitForDeployment();

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
});
