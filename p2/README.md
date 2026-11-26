# Projeto P2 — Testes e Qualidade de Software (UNISAGRADO, 2026)

## 1. Integrantes
Luiz Guilherme Silva Caride; Pedro Marques Correa Domingues; João Matheus Verissimo Francisco; Thiago Galli; Caio Coló; Eduardo Bishop.

## 2. Sistema e versão
OWASP Juice Shop 20.2.0 — commit base `1618a61`; alterações do grupo na branch `p2/finalizacao-2026`.

## 3. Repositório
https://github.com/DevGuiCoder/juice-shop (branch `p2/finalizacao-2026`)

## 4. Tecnologias
Angular, Node.js, Express, SQLite/Sequelize; testes com node:test + tsx (unidade), Postman/Newman 6.2.1 (API), Selenium WebDriver 4.29 (interface); GitHub Actions; SonarQube Community.

## 5. Pré-requisitos
Node.js 22 ou 24, npm, Git e Google Chrome atualizado.

## 6. Instalação
```bash
git clone https://github.com/DevGuiCoder/juice-shop
cd juice-shop
git checkout p2/finalizacao-2026
npm install
npm install --prefix p2
```
No Windows com PowerShell, usar `npm.cmd` se `npm.ps1` estiver bloqueado.

## 7. Configuração
Nenhuma variável obrigatória. O ambiente Postman está em `p2/postman.environment.json` (`baseUrl = http://127.0.0.1:3000`). Os scripts recusam qualquer host que não seja loopback (`p2/local-only.mjs`).

## 8. Banco e dados
SQLite recriado a cada `npm start`, o que restaura o estado entre execuções. Os testes criam contas fictícias `@example.test` com carimbo de tempo.

## 9. Execução do sistema
```bash
npm start   # http://localhost:3000
```

## 10. Execução dos testes (com a aplicação rodando)
```bash
cd p2
npm run test:unit   # U-01 a U-12
npm run test:api    # API-01 a API-10 (Newman)
npm run test:ui     # UI-01 a UI-05 (Selenium, Chrome headless)
npm run test:nf     # NF-01, NF-02, NF-05, NF-06
node compatibility.mjs   # NF-03, NF-04
```
As evidências são gravadas em `p2/evidence/`.

## 11. Pipeline
- `.github/workflows/p2.yml` — instalação, unitários, API, interface e não funcionais; dispara em push para `p2/**`, pull request ou manualmente (opção `controlled_failure` para demonstrar falha).
- `.github/workflows/p2-sonar.yml` — SonarQube: análise do baseline `1618a61` e da revisão posterior.
- Execuções: https://github.com/DevGuiCoder/juice-shop/actions

## 12. Localização dos documentos
Pasta do Google Drive `P2_TQS_2026_TURMA_GRUPOXX_OWASP-JUICE-SHOP`, subpastas 00 a 16 (seção 11.3 do manual).

## 13. Rastreabilidade dos testes automatizados
| Teste | Requisito | Caso manual |
|---|---|---|
| U-01 a U-06 | Regra interna `toISO8601` (TDD) | — |
| U-07 a U-12 | Regras internas de `lib/utils` | — |
| API-01, API-07 | RF-01 | CT-01, CT-04 |
| API-02, API-03 | RF-02 | CT-10, CT-11 |
| API-04, API-05 | RF-03 | CT-14, CT-15 |
| API-06, API-08 | RF-05 | CT-20 |
| API-09, API-10 | RF-06 | CT-23 |
| UI-01 / UI-02 / UI-03 / UI-04 / UI-05 | RF-01 / RF-02 / RF-03 / RF-05 / RF-06 | CT-01 / CT-10 / CT-14 / CT-20 / CT-23 |
| NF-01, NF-02 | RNF-01 | — |
| NF-03, NF-04 | RNF-02 | — |
| NF-05 | RNF-03 | — |
| NF-06 | RNF-04 | — |

## 14. Credenciais fictícias
Senha padrão dos testes: `P2teste123!` (contas `@example.test` criadas a cada execução). Nenhum dado real é utilizado.

## 15. Problemas conhecidos
- O Juice Shop contém vulnerabilidades intencionais para fins educacionais; elas não são registradas como defeitos.
- A instalação baixa muitas dependências e compila o frontend Angular; pode levar vários minutos.
- O GitHub Actions do fork pode ficar suspenso por limite de uso.

## 16. Contato
Grupo P2 — e-mail: [preencher]
