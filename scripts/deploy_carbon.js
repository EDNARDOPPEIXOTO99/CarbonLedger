const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do CarbonLedger...");

  const CarbonLedger = await ethers.getContractFactory("CarbonLedger");
  const carbonLedger = await CarbonLedger.deploy();

  await carbonLedger.waitForDeployment();

  console.log("✅ CarbonLedger deployado em:", await carbonLedger.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });