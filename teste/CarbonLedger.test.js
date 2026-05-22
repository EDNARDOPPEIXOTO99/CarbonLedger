const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonLedger", function () {
  let carbonLedger;

  beforeEach(async function () {
    const CarbonLedger = await ethers.getContractFactory("CarbonLedger");
    carbonLedger = await CarbonLedger.deploy();
  });

  it("Deve registrar um crédito de carbono", async function () {
    await carbonLedger.registerCarbon("Projeto Solar Ceará", 100);
    const total = await carbonLedger.totalRecords();
    expect(total).to.equal(1);
  });

  it("Deve retornar os dados do registro corretamente", async function () {
    await carbonLedger.registerCarbon("Projeto Eólico Nordeste", 250);
    const record = await carbonLedger.getRecord(0);
    expect(record[0]).to.equal("Projeto Eólico Nordeste");
    expect(record[1]).to.equal(250n);
  });

  it("Deve emitir evento ao registrar carbono", async function () {
    await expect(carbonLedger.registerCarbon("Projeto H2V Pecém", 500))
      .to.emit(carbonLedger, "CarbonRegistered")
      .withArgs(
        "Projeto H2V Pecém",
        500n,
        (await ethers.getSigners())[0].address,
        await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)
      );
  });
});