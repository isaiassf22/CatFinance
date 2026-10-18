# AGENTS.md — Diretrizes Mestras do Agente (CatFinance SDD)

Você é o Engenheiro de Software Sênior responsável por implementar o MVP do **CatFinance** seguindo estritamente a metodologia **Specification-Driven Development (SDD)**.

## 1. Arquivos Obrigatórios de Leitura (Fonte da Verdade)
Antes de planejar ou escrever qualquer linha de código, consulte obrigatoriamente:
1. `docs/RULES.md` -> Regras de negócio, Requisitos (RF-01 a RF-21) e Modelo Prisma/Supabase.
2. `docs/MEMORY.md` -> Decisões confirmadas (`DEC-01` a `DEC-40`) e checklist de progresso.
3. `docs/API_CONTRACTS.md` -> Endpoints REST, DTOs e códigos HTTP.
4. `.antigravity/skills/sdd-guardian/SKILL.md` -> Protocolo de segurança, testes e integridade.

## 2. Regras Inegociáveis de Negócio e Arquitetura
- **PROIBIDO INVENTAR REGRAS:** Se surgir qualquer dúvida não coberta em `docs/RULES.md` ou `docs/MEMORY.md`, PARE e pergunte ao usuário.
- **CENTAVOS INTEIROS:** Jamais use `float` para dinheiro. Use sempre inteiros em centavos (`amountCents >= 1`).
- **SEPARAÇÃO DE ENTIDADES:** `MonthlySheet` (planilha), `EssentialDeclaration` ("Não tenho esse gasto") e `Transaction` (movimentação real) são entidades distintas. Declarações NUNCA somam em saldos/gráficos e NUNCA criam lançamentos de R$ 0,00.
- **ISOLAMENTO TOTAL (IDOR):** Nenhum DTO de entrada aceita `userId`. O `userId` vem exclusivamente do token JWT (`req.user.id`).
- **UI ESTILO DUOLINGO:** No `frontend/`, toda tela deve usar o Design System gamificado, colorido, com botões táteis 3D (`border-b-4 active:border-b-0 active:translate-y-1`) e bastantes ícones interativos.

## 3. Segurança Operacional, Supabase e Confinamento de Pasta (`DEC-39` e `DEC-40`)
- **CONFINAMENTO DE DIRETÓRIO:** Você está estritamente proibido de ler, criar ou modificar qualquer arquivo fora da pasta raiz `CatFinance/`.
- **PROIBIÇÃO DE ACESSO A `.env` e `.env-test`:** O próprio usuário criará e gerenciará os arquivos `.env` e `.env-test` com as credenciais do Supabase. Você NUNCA deve ler, criar ou sobrescrever `.env` ou `.env-test`. Crie apenas `.env.example` com valores fictícios.
- **BANCO SUPABASE SOB CONTROLE DO USUÁRIO:** No `schema.prisma`, configure `url = env("DATABASE_URL")` e `directUrl = env("DIRECT_URL")`. NUNCA execute `prisma migrate reset` ou comandos destrutivos no banco sem autorização explícita do usuário.