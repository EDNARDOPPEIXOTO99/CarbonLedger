const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do CarbonLedger...");
  console.log("📡 Rede:", network.name);

  // Deploy do contrato
  const CarbonLedger = await ethers.getContractFactory("CarbonLedger");
  const carbonLedger = await CarbonLedger.deploy();
  await carbonLedger.waitForDeployment();

  const endereco = await carbonLedger.getAddress();
  console.log("✅ CarbonLedger deployado em:", endereco);

  // Simulação do fluxo completo
  console.log("\n📋 Simulando fluxo completo...");
  const [owner] = await ethers.getSigners();
  console.log("👤 Owner:", owner.address);

  // 1. Registrar organização
  console.log("\n1️⃣  Registrando organização...");
  const tx1 = await carbonLedger.registrarOrganizacao("Hub H2V Pecém", "Energia");
  await tx1.wait();
  console.log("✅ Organização registrada: Hub H2V Pecém");

  // 2. Registrar ação ambiental
  console.log("\n2️⃣  Registrando ação ambiental...");
  const tx2 = await carbonLedger.registrarAcao(
    "Geração de energia por hidrogênio verde",
    "Energia Limpa",
    500,
    "ipfs://QmHash123evidencia"
  );
  await tx2.wait();
  console.log("✅ Ação registrada: 500 toneladas de CO₂");

  // 3. Validar ação e mintar tokens CCT
  console.log("\n3️⃣  Validando ação e mintando tokens CCT...");
  const tx3 = await carbonLedger.validarAcao(0);
  await tx3.wait();
  const saldo = await carbonLedger.balanceOf(owner.address);
  console.log("✅ Tokens CCT mintados:", saldo.toString());

  // 4. Resgatar créditos e emitir certificado
  console.log("\n4️⃣  Resgatando créditos e emitindo certificado...");
  const tx4 = await carbonLedger.resgatarCreditos(500, 0);
  const receipt = await tx4.wait();
  const evento = receipt.logs.find(
    l => l.fragment && l.fragment.name === "CreditosResgatados"
  );
  const codigo = evento.args[3];
  console.log("✅ Certificado emitido! Código:", codigo);

  // 5. Verificar certificado
  console.log("\n5️⃣  Verificando certificado...");
  const resultado = await carbonLedger.verificarCertificado(codigo);
  console.log("✅ Certificado válido:", resultado[0]);
  console.log("   Toneladas:", resultado[1].toString());
  console.log("   Titular:", resultado[2]);

  // 6. Métricas finais
  console.log("\n📊 Métricas finais:");
  const [acoes, supply, resgatadas, certs] = await carbonLedger.metricas();
  console.log("   Ações registradas:", acoes.toString());
  console.log("   Tokens em circulação:", supply.toString());
  console.log("   Toneladas resgatadas:", resgatadas.toString());
  console.log("   Certificados emitidos:", certs.toString());

  console.log("\n🎉 Fluxo completo executado com sucesso!");
  console.log("🔍 Verifique em: https://sepolia.etherscan.io/address/" + endereco);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });