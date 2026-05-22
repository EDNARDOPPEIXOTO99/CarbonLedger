const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonLedger", function () {
  let carbonLedger, owner, org1, org2, validador;

  beforeEach(async function () {
    [owner, org1, org2, validador] = await ethers.getSigners();
    const CarbonLedger = await ethers.getContractFactory("CarbonLedger");
    carbonLedger = await CarbonLedger.deploy();
  });

  // ─── TOKEN METADATA ───────────────────────────────────────────
  describe("Token Metadata", function () {
    it("Deve ter nome Carbon Credit Token", async function () {
      expect(await carbonLedger.name()).to.equal("Carbon Credit Token");
    });
    it("Deve ter simbolo CCT", async function () {
      expect(await carbonLedger.symbol()).to.equal("CCT");
    });
    it("Deve ter decimals 0", async function () {
      expect(await carbonLedger.decimals()).to.equal(0);
    });
  });

  // ─── ORGANIZACOES ─────────────────────────────────────────────
  describe("Organizacoes", function () {
    it("Deve registrar organizacao", async function () {
      await carbonLedger.connect(org1).registrarOrganizacao("ONG Verde", "ONG");
      const org = await carbonLedger.organizacoes(org1.address);
      expect(org.nome).to.equal("ONG Verde");
      expect(org.ativa).to.equal(true);
    });
    it("Deve emitir evento OrganizacaoRegistrada", async function () {
      await expect(carbonLedger.connect(org1).registrarOrganizacao("ONG Verde", "ONG"))
        .to.emit(carbonLedger, "OrganizacaoRegistrada")
        .withArgs(org1.address, "ONG Verde", "ONG");
    });
    it("Nao deve registrar organizacao duplicada", async function () {
      await carbonLedger.connect(org1).registrarOrganizacao("ONG Verde", "ONG");
      await expect(
        carbonLedger.connect(org1).registrarOrganizacao("ONG Verde", "ONG")
      ).to.be.revertedWith("Organizacao ja registrada");
    });
  });

  // ─── ACOES AMBIENTAIS ─────────────────────────────────────────
  describe("Acoes Ambientais", function () {
    beforeEach(async function () {
      await carbonLedger.connect(org1).registrarOrganizacao("ONG Verde", "ONG");
    });
    it("Deve registrar acao ambiental", async function () {
      await carbonLedger.connect(org1).registrarAcao(
        "Plantio de arvores", "Reflorestamento", 100, "ipfs://hash123"
      );
      expect(await carbonLedger.totalRecords()).to.equal(1);
    });
    it("Deve emitir evento AcaoRegistrada", async function () {
      await expect(
        carbonLedger.connect(org1).registrarAcao(
          "Plantio de arvores", "Reflorestamento", 100, "ipfs://hash123"
        )
      ).to.emit(carbonLedger, "AcaoRegistrada");
    });
    it("Nao deve registrar acao com toneladas zero", async function () {
      await expect(
        carbonLedger.connect(org1).registrarAcao(
          "Plantio de arvores", "Reflorestamento", 0, "ipfs://hash123"
        )
      ).to.be.revertedWith("Toneladas deve ser maior que zero");
    });
    it("Nao deve registrar acao sem ser organizacao", async function () {
      await expect(
        carbonLedger.connect(org2).registrarAcao(
          "Plantio de arvores", "Reflorestamento", 100, "ipfs://hash123"
        )
      ).to.be.revertedWith("Organizacao nao registrada ou inativa");
    });
  });

  // ─── VALIDACAO + MINT ─────────────────────────────────────────
  describe("Validacao e Mint", function () {
    beforeEach(async function () {
      await carbonLedger.connect(org1).registrarOrganizacao("ONG Verde", "ONG");
      await carbonLedger.connect(org1).registrarAcao(
        "Plantio de arvores", "Reflorestamento", 100, "ipfs://hash123"
      );
    });
    it("Deve validar acao e mintar tokens", async function () {
      await carbonLedger.connect(owner).validarAcao(0);
      expect(await carbonLedger.balanceOf(org1.address)).to.equal(100n);
    });
    it("Deve emitir evento AcaoAprovada", async function () {
      await expect(carbonLedger.connect(owner).validarAcao(0))
        .to.emit(carbonLedger, "AcaoAprovada");
    });
    it("Nao deve validar acao duplicada", async function () {
      await carbonLedger.connect(owner).validarAcao(0);
      await expect(
        carbonLedger.connect(owner).validarAcao(0)
      ).to.be.revertedWith("Acao ja aprovada");
    });
    it("Nao deve validar sem ser validador", async function () {
      await expect(
        carbonLedger.connect(org1).validarAcao(0)
      ).to.be.revertedWith("Apenas validador autorizado");
    });
  });

  // ─── RESGATE + CERTIFICADO ────────────────────────────────────
  describe("Resgate e Certificado", function () {
    beforeEach(async function () {
      await carbonLedger.connect(org1).registrarOrganizacao("ONG Verde", "ONG");
      await carbonLedger.connect(org1).registrarAcao(
        "Plantio de arvores", "Reflorestamento", 100, "ipfs://hash123"
      );
      await carbonLedger.connect(owner).validarAcao(0);
    });
    it("Deve resgatar creditos e emitir certificado", async function () {
      await carbonLedger.connect(org1).resgatarCreditos(50, 0);
      expect(await carbonLedger.balanceOf(org1.address)).to.equal(50n);
    });
    it("Deve emitir evento CreditosResgatados", async function () {
      await expect(carbonLedger.connect(org1).resgatarCreditos(50, 0))
        .to.emit(carbonLedger, "CreditosResgatados");
    });
    it("Nao deve resgatar com saldo insuficiente", async function () {
      await expect(
        carbonLedger.connect(org1).resgatarCreditos(200, 0)
      ).to.be.revertedWith("Saldo insuficiente");
    });
  });

  // ─── VERIFICACAO ──────────────────────────────────────────────
  describe("Verificacao de Certificado", function () {
    it("Deve verificar certificado autentico", async function () {
      await carbonLedger.connect(org1).registrarOrganizacao("ONG Verde", "ONG");
      await carbonLedger.connect(org1).registrarAcao(
        "Plantio", "Reflorestamento", 100, "ipfs://hash123"
      );
      await carbonLedger.connect(owner).validarAcao(0);
      const tx = await carbonLedger.connect(org1).resgatarCreditos(100, 0);
      const receipt = await tx.wait();
      const evento = receipt.logs.find(
        l => l.fragment && l.fragment.name === "CreditosResgatados"
      );
      const codigo = evento.args[3];
      const resultado = await carbonLedger.verificarCertificado(codigo);
      expect(resultado[0]).to.equal(true);
    });
    it("Deve retornar falso para codigo invalido", async function () {
      const resultado = await carbonLedger.verificarCertificado("codigo-falso");
      expect(resultado[0]).to.equal(false);
    });
  });

  // ─── ERC-20 ───────────────────────────────────────────────────
  describe("ERC-20", function () {
    beforeEach(async function () {
      await carbonLedger.connect(org1).registrarOrganizacao("ONG Verde", "ONG");
      await carbonLedger.connect(org1).registrarAcao(
        "Plantio", "Reflorestamento", 100, "ipfs://hash123"
      );
      await carbonLedger.connect(owner).validarAcao(0);
    });
    it("Deve transferir tokens", async function () {
      await carbonLedger.connect(org1).transfer(org2.address, 30);
      expect(await carbonLedger.balanceOf(org2.address)).to.equal(30n);
    });
    it("Deve aprovar e transferFrom", async function () {
      await carbonLedger.connect(org1).approve(org2.address, 50);
      await carbonLedger.connect(org2).transferFrom(org1.address, org2.address, 50);
      expect(await carbonLedger.balanceOf(org2.address)).to.equal(50n);
    });
  });

  // ─── METRICAS ─────────────────────────────────────────────────
  describe("Metricas", function () {
    it("Deve retornar metricas corretas", async function () {
      await carbonLedger.connect(org1).registrarOrganizacao("ONG Verde", "ONG");
      await carbonLedger.connect(org1).registrarAcao(
        "Plantio", "Reflorestamento", 100, "ipfs://hash123"
      );
      await carbonLedger.connect(owner).validarAcao(0);
      await carbonLedger.connect(org1).resgatarCreditos(100, 0);
      const [acoes, supply, resgatadas, certs] = await carbonLedger.metricas();
      expect(acoes).to.equal(1n);
      expect(supply).to.equal(0n);
      expect(resgatadas).to.equal(100n);
      expect(certs).to.equal(1n);
    });
  });
});