# CatFinance — Memória Arquitetural e Registro de Decisões (SDD)

## 1. Decisões Confirmadas (`DEC-01` a `DEC-40`)
- **DEC-01 a DEC-19:** Regras de negócio v0.4 + Planilhas com seleção Ano/Mês, Recorrência ativa sob demanda, 14 Categorias padrão globais, Categorias personalizadas tipadas (`INCOME`/`EXPENSE`), Centavos inteiros (`>= 1`), Transição automática em essenciais, Quizzes flexíveis de 3 a 8 perguntas, Data restrita ao mês da planilha e Menu de opções da planilha (Recuperar recorrentes e Deletar planilha).
- **DEC-20 a DEC-38:** Arquitetura separada em `backend/` (NestJS + Express + TypeScript + Prisma + Zod + JWT 7 dias + Bcrypt + Pino redact + Rate Limit 60 req/min) e `frontend/` (React + Vite + TypeScript + Tailwind CSS + Recharts), organização de planilhas em pastas Ano -> Mês, e desenvolvimento incremental.
- **DEC-39 (Segurança de Ambiente):** O usuário gerencia manualmente `.env` e `.env-test`. O agente é proibido de ler/editar `.env` ou sair da pasta `CatFinance/`.
- **DEC-40 (Supabase + UI Duolingo):** Banco PostgreSQL hospedado no Supabase (`DATABASE_URL` e `DIRECT_URL`) e interface frontend gamificada estilo Duolingo (botões 3D táteis, cores vibrantes, cards interativos e ícones).

## 2. Status de Execução dos Passos (Atualizado pelo Agente)
- [x] **Passo 1 (Concluído: 1A + 1B):** Setup inicial da raiz (`.gitignore`), `backend/` (NestJS, Prisma, Zod, Pino redaction, Rate Limiting), `frontend/` (React, Vite, TS, Tailwind CSS Duolingo), `schema.prisma` com todas as entidades para Supabase, endpoints Auth & Me (`/auth/register`, `/auth/login`, `/me`, `PATCH /me/onboarding`, `DELETE /me`), migration inicial aplicada no Supabase com índice parcial `uq_recurrence_per_sheet` em dev e test, e 42 testes automatizados (unitários + integração E2E com isolamento IDOR) 100% aprovados.
- [ ] **Passo 1.5:** Design System Gamificado (Estilo Duolingo), Rotas React e Camada Axios/React Query.
- [ ] **Passo 2:** Seed de 14 Categorias Padrão, Categorias Personalizadas e Planilhas Mensais (Pastas Ano/Mês + Deletar Planilha).
- [ ] **Passo 3:** Lançamentos em Centavos, Declarações "Não tenho esse gasto" e Desbloqueio do Dashboard.
- [ ] **Passo 4:** Motor de Recorrência Mensal (Meses curtos, Modal de confirmação e Recuperação manual idempotente).
- [ ] **Passo 5:** Dashboard Mensal e Anual com Gráficos e Estados Vazios.
- [ ] **Passo 6:** Educação Financeira (Aulas + Quizzes 3 a 8 questões), Onboarding Guiado, Caixa de Feedback e Agentes.