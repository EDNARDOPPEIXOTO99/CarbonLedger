// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CarbonLedger {

    // ─── TOKEN ERC-20 CCT ───────────────────────────────────────────
    string public name = "Carbon Credit Token";
    string public symbol = "CCT";
    uint8 public decimals = 0;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ─── STRUCTS ────────────────────────────────────────────────────
    struct AcaoAmbiental {
        uint256 id;
        string descricao;
        string categoria;
        uint256 toneladas;
        address responsavel;
        address validador;
        uint256 timestamp;
        bool aprovada;
        uint256 tokensMintados;
        string evidenciaHash;
    }

    struct Certificado {
        uint256 id;
        address titular;
        uint256 toneladas;
        uint256 acaoId;
        uint256 timestamp;
        string codigo;
        string descricaoAcao;
    }

    struct Organizacao {
        string nome;
        string tipo;
        bool ativa;
        uint256 totalTokensRecebidos;
        uint256 totalTokensResgatados;
        uint256 totalCertificados;
    }

    // ─── STORAGE ────────────────────────────────────────────────────
    address public owner;
    mapping(address => Organizacao) public organizacoes;
    mapping(address => bool) public validadores;
    AcaoAmbiental[] public acoes;
    Certificado[] public certificados;
    uint256 public totalToneladasResgatadas;

    // ─── EVENTOS ────────────────────────────────────────────────────
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OrganizacaoRegistrada(address indexed org, string nome, string tipo);
    event AcaoRegistrada(uint256 indexed id, address indexed responsavel, uint256 toneladas);
    event AcaoAprovada(uint256 indexed id, address indexed validador, uint256 tokensMintados);
    event CreditosResgatados(uint256 indexed certId, address indexed titular, uint256 toneladas, string codigo);

    // ─── MODIFICADORES ──────────────────────────────────────────────
    modifier apenasOwner() {
        require(msg.sender == owner, "Apenas owner");
        _;
    }

    modifier apenasValidador() {
        require(validadores[msg.sender], "Apenas validador autorizado");
        _;
    }

    modifier apenasOrganizacaoAtiva() {
        require(organizacoes[msg.sender].ativa, "Organizacao nao registrada ou inativa");
        _;
    }

    // ─── CONSTRUCTOR ────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
        validadores[msg.sender] = true;
    }

    // ─── ADMINISTRACAO ──────────────────────────────────────────────
    function adicionarValidador(address _validador) external apenasOwner {
        validadores[_validador] = true;
    }

    // ─── ORGANIZACOES ───────────────────────────────────────────────
    function registrarOrganizacao(string memory _nome, string memory _tipo) external {
        require(!organizacoes[msg.sender].ativa, "Organizacao ja registrada");
        organizacoes[msg.sender] = Organizacao(_nome, _tipo, true, 0, 0, 0);
        emit OrganizacaoRegistrada(msg.sender, _nome, _tipo);
    }

    // ─── ACOES AMBIENTAIS ───────────────────────────────────────────
    function registrarAcao(
        string memory _descricao,
        string memory _categoria,
        uint256 _toneladas,
        string memory _evidenciaHash
    ) external apenasOrganizacaoAtiva {
        require(_toneladas > 0, "Toneladas deve ser maior que zero");
        uint256 id = acoes.length;
        acoes.push(AcaoAmbiental({
            id: id,
            descricao: _descricao,
            categoria: _categoria,
            toneladas: _toneladas,
            responsavel: msg.sender,
            validador: address(0),
            timestamp: block.timestamp,
            aprovada: false,
            tokensMintados: 0,
            evidenciaHash: _evidenciaHash
        }));
        emit AcaoRegistrada(id, msg.sender, _toneladas);
    }

    function validarAcao(uint256 _acaoId) external apenasValidador {
        require(_acaoId < acoes.length, "Acao inexistente");
        AcaoAmbiental storage acao = acoes[_acaoId];
        require(!acao.aprovada, "Acao ja aprovada");

        acao.aprovada = true;
        acao.validador = msg.sender;
        acao.tokensMintados = acao.toneladas;

        // Mint tokens CCT
        balanceOf[acao.responsavel] += acao.toneladas;
        totalSupply += acao.toneladas;
        organizacoes[acao.responsavel].totalTokensRecebidos += acao.toneladas;

        emit Transfer(address(0), acao.responsavel, acao.toneladas);
        emit AcaoAprovada(_acaoId, msg.sender, acao.toneladas);
    }

    // ─── RESGATE + CERTIFICACAO ─────────────────────────────────────
    function resgatarCreditos(uint256 _toneladas, uint256 _acaoId) external apenasOrganizacaoAtiva {
        require(balanceOf[msg.sender] >= _toneladas, "Saldo insuficiente");
        require(_acaoId < acoes.length, "Acao inexistente");

        // Burn tokens
        balanceOf[msg.sender] -= _toneladas;
        totalSupply -= _toneladas;
        totalToneladasResgatadas += _toneladas;
        organizacoes[msg.sender].totalTokensResgatados += _toneladas;

        // Gera certificado
        string memory codigo = _gerarCodigo(msg.sender, _toneladas, _acaoId);
        uint256 certId = certificados.length;

        certificados.push(Certificado({
            id: certId,
            titular: msg.sender,
            toneladas: _toneladas,
            acaoId: _acaoId,
            timestamp: block.timestamp,
            codigo: codigo,
            descricaoAcao: acoes[_acaoId].descricao
        }));

        organizacoes[msg.sender].totalCertificados += 1;

        emit Transfer(msg.sender, address(0), _toneladas);
        emit CreditosResgatados(certId, msg.sender, _toneladas, codigo);
    }

    // ─── VERIFICACAO ────────────────────────────────────────────────
    function verificarCertificado(string memory _codigo) external view returns (bool, uint256, address, uint256) {
        for (uint256 i = 0; i < certificados.length; i++) {
            if (keccak256(bytes(certificados[i].codigo)) == keccak256(bytes(_codigo))) {
                return (true, certificados[i].toneladas, certificados[i].titular, certificados[i].timestamp);
            }
        }
        return (false, 0, address(0), 0);
    }

    // ─── METRICAS ───────────────────────────────────────────────────
    function metricas() external view returns (uint256, uint256, uint256, uint256) {
        return (acoes.length, totalSupply, totalToneladasResgatadas, certificados.length);
    }

    function totalRecords() public view returns (uint256) {
        return acoes.length;
    }

    // ─── ERC-20 ─────────────────────────────────────────────────────
    function transfer(address _to, uint256 _value) external returns (bool) {
        require(balanceOf[msg.sender] >= _value, "Saldo insuficiente");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) external returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) external returns (bool) {
        require(balanceOf[_from] >= _value, "Saldo insuficiente");
        require(allowance[_from][msg.sender] >= _value, "Allowance insuficiente");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    // ─── INTERNO ────────────────────────────────────────────────────
    function _gerarCodigo(address _titular, uint256 _toneladas, uint256 _acaoId) internal view returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(_titular, _toneladas, _acaoId, block.timestamp));
        return _bytes32ToString(hash);
    }

    function _bytes32ToString(bytes32 _bytes) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            str[i * 2] = alphabet[uint8(_bytes[i] >> 4)];
            str[i * 2 + 1] = alphabet[uint8(_bytes[i] & 0x0f)];
        }
        return string(str);
    }
}