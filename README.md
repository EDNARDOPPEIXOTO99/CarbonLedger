# CarbonLedger 🌱

## Sobre o projeto
CarbonLedger é uma solução baseada em blockchain para registro transparente e imutável de créditos de carbono, desenvolvida para o Hackathon Web3 RESTIC 29.

## Objetivo
Transformar cada tonelada de CO₂ compensada em um token CCT (Carbon Credit Token) registrado na blockchain Sepolia — tornando o double spending tecnicamente impossível e a auditoria pública.

## Exemplos de aplicação
- Tokenização de créditos de carbono (ERC-20)
- Certificação automática on-chain de ações ambientais
- Rastreamento de emissões ESG auditável
- Registro de projetos de energia renovável
- Validação de iniciativas de hidrogênio verde
- Agricultura regenerativa e sequestro de carbono

## Tecnologias utilizadas
- Solidity 0.8.20
- Hardhat 2
- Sepolia Testnet
- Ethers.js
- MetaMask
- OpenZeppelin (padrões ERC-20)
- IPFS (hash de evidências)
- Node.js + Mocha + Chai

## Estrutura

```
/contratos       → Contratos inteligentes Solidity
/scripts         → Scripts de deploy
/teste           → Testes Hardhat
/front-end       → Interface do usuário
/documentos      → Documentação do projeto
/ativos          → Recursos visuais
```

## Contrato deployado
- **Rede:** Sepolia Testnet
- **Endereço:** '0x055cBCC3368F95bb2a9eA99C7420A77a8557BA05'
- **Etherscan:** [Ver contrato](https://sepolia.etherscan.io/address/0x055cBCC3368F95bb2a9eA99C7420A77a8557BA05)

## Como executar

### Clonar o repositório
```bash
git clone https://github.com/EDNARDOPPEIXOTO99/CarbonLedger
cd CarbonLedger
```

### Instalar dependências
```bash
npm install
```

### Configurar .env
RPC_URL=https://sepolia.infura.io/v3/SEU_ID
PRIVATE_KEY=sua_chave_privada_metamask

### Compilar contratos
```bash
npx hardhat compile
```

### Rodar testes
```bash
npx hardhat test
```

### Deploy na Sepolia
```bash
npx hardhat run scripts/deploy_carbon.js --network sepolia
```

### Verificar na Sepolia Etherscan
https://sepolia.etherscan.io/address/0x055cBCC3368F95bb2a9eA99C7420A77a8557BA05

## Requisitos mínimos
- [x] Uso de blockchain
- [x] Registro auditável
- [x] Smart contract funcional
- [x] Histórico verificável
- [x] README funcional
- [ ] Vídeo-pitch
- [ ] Slides

## Testes
✔ Deve registrar um crédito de carbono
✔ Deve retornar os dados do registro corretamente
✔ Deve emitir evento ao registrar carbono
3 passing

## Equipe
| Nome | Papel |
|------|-------|
| Ednardo Pinheiro Peixoto Líder Técnico | Líder Técnico / Desenvolvimento Smart Contracts / Repositório GitHub
| Alanio Ferreira de Lima | Desenvolvimento Blockchain / Documentação
| Patrício Robson dos Santos Alves | Produto / QA / Apresentação Slides e Pitch

## Licença
MIT