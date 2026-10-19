# CatFinance

Aplicação web fullstack voltada à organização financeira pessoal e à educação financeira básica[cite: 1, 2]. O projeto tem como público prioritário adultos brasileiros iniciantes na gestão das próprias finanças, unindo o controle prático de fluxo de caixa com conteúdos educativos curtos para apoiar decisões financeiras mais conscientes[cite: 1, 2].

O desenvolvimento segue a metodologia **Specification-Driven Development (SDD)**, na qual requisitos, regras de negócio, casos de borda, modelagem de dados, contratos de API e arquitetura são especificados e validados antes da implementação[cite: 1, 2].

---

## Sumário

1. [Problema e Proposta de Valor](#problema-e-proposta-de-valor)
2. [Funcionalidades do MVP](#funcionalidades-do-mvp)
3. [Princípios de Produto e Regras de Negócio](#princípios-de-produto-e-regras-de-negócio)
4. [Arquitetura e Stack Tecnológica](#arquitetura-e-stack-tecnológica)
5. [Estrutura do Repositório e Governança SDD](#estrutura-do-repositório-e-governança-sdd)
6. [Como Executar Localmente](#como-executar-localmente)
7. [Roadmap de Implementação](#roadmap-de-implementação)
8. [Segurança, Privacidade e Aviso Legal](#segurança-privacidade-e-aviso-legal)

---

## Problema e Proposta de Valor

Pessoas com pouca familiaridade com finanças pessoais frequentemente enfrentam dificuldades para saber quanto recebem e gastam, esquecem despesas recorrentes ou pequenos gastos relevantes e não sabem por onde começar a organizar a vida financeira[cite: 1].

O **CatFinance** reduz essa barreira por meio de uma interface interativa, guiada, acolhedora e livre de jargões contábeis ou julgamentos sobre hábitos de consumo, ajudando o usuário a[cite: 1]:
1. Registrar receitas e despesas com facilidade[cite: 1].
2. Identificar suas principais categorias de gastos[cite: 1].
3. Compreender saldo e distribuição das despesas no tempo[cite: 1].
4. Reduzir trabalho repetitivo por meio de lançamentos recorrentes assistidos[cite: 1].
5. Aprender conceitos financeiros básicos em aulas curtas e objetivas[cite: 1].
6. Construir o hábito de acompanhar as próprias finanças[cite: 1].

---

## Funcionalidades do MVP

### Gestão Financeira e Planilhas Mensais
- **Organização por Ano e Mês:** Navegação estruturada por ano e planilhas mensais, permitindo criar apenas períodos ainda não existentes[cite: 1, 2].
- **Fluxo de Caixa Real:** Registro, edição e exclusão de receitas e despesas em reais (BRL), processados internamente em centavos inteiros para precisão aritmética e restritos ao calendário do mês aberto[cite: 2].
- **Categorias Padrão e Personalizadas:**
  - *5 Categorias Essenciais de Despesa:* Moradia, Alimentação, Transporte, Saúde e Educação[cite: 1, 2].
  - *4 Categorias Adicionais de Despesa:* Dívidas e cartão de crédito, Lazer, Cuidados pessoais e Outras despesas[cite: 1, 2].
  - *5 Categorias Padrão de Receita:* Salário, Investimentos, Pensão/auxílio, Dividendos e Outras receitas[cite: 1, 2].
  - *Categorias Personalizadas:* Criadas pelo usuário especificamente para receita ou despesa, com exclusão atômica após confirmação de impacto sobre lançamentos e recorrências vinculadas[cite: 2].
- **Declaração Mensal "Não tenho esse gasto":** Permite concluir a revisão mensal de qualquer uma das 5 categorias essenciais quando o usuário não possui custo naquela área, sem criar transações artificiais de valor zero e sem distorcer saldos ou gráficos[cite: 1, 2].
- **Recorrência Mensal Assistida:** Ativação de repetição mensal para receitas e despesas, com confirmação de reaproveitamento ao abrir meses seguintes, recuperação manual sob demanda, prevenção de duplicidade (idempotência) e ajuste automático de datas para o último dia válido em meses curtos (ex.: dias 29, 30 e 31 ajustados em fevereiro)[cite: 1, 2].
- **Dashboard Mensal e Anual:** Desbloqueado permanentemente após a conclusão das 5 categorias essenciais dentro de um mesmo mês[cite: 1, 2]. Apresenta total de receitas, total de despesas, saldo do período, comparativo entre receitas e despesas e gráfico de distribuição por categoria[cite: 1, 2].

### Educação Financeira e Experiência do Usuário
- **Módulos em Cartões Explicativos:** Trilha educativa inicial sequencial (com revisitas livres após a conclusão), apresentando conteúdos curtos e perguntas abertas de reflexão (cujas respostas não são armazenadas por privacidade)[cite: 1, 2].
- **Quizzes de Validação:** Questionários de 3 a 8 perguntas de múltipla escolha ao final de cada módulo, validados no servidor com aprovação mínima de 70%, tentativas ilimitadas e preservação permanente da conclusão já conquistada[cite: 1, 2].
- **Onboarding e Feedback:** Guia inicial de primeiro acesso para orientar o preenchimento das categorias essenciais e caixa integrada para envio de sugestões durante a fase de validação[cite: 1, 2].

---

## Princípios de Produto e Regras de Negócio

- **Separação entre Controle e Movimentação Contábil:** O sistema distingue estritamente três conceitos: (1) uma planilha mensal preparada (que pode estar vazia), (2) uma declaração de ausência de gasto em categoria essencial e (3) uma movimentação financeira real[cite: 1, 2]. Apenas movimentações reais entram nos somatórios e filtros do Dashboard[cite: 1, 2].
- **Autonomia sobre Automação Oculta:** Recorrências não alteram lançamentos passados silenciosamente e edições em uma ocorrência mensal afetam exclusivamente aquele registro[cite: 1, 2].
- **Precisão Monetária e Temporal:** Rejeição estrita de valores iguais ou inferiores a zero (`<= 0`) e tratamento de datas de movimentação como datas puras de calendário (`YYYY-MM-DD`), imunes a desvios de fuso horário[cite: 2].

---

## Arquitetura e Stack Tecnológica

O sistema utiliza uma arquitetura em **Monólito Modular** com separação física entre Backend (API REST stateless preparada para futura expansão mobile) e Frontend Web, mantendo baixo custo operacional e alta testabilidade[cite: 1, 2].

| Camada | Tecnologias e Ferramentas |
| :--- | :--- |
| **Backend (`backend/`)** | Node.js, **NestJS (Express)**, TypeScript, **Prisma ORM**, **Zod** (validação de schemas e contratos), **JWT + Bcrypt** (autenticação e hash seguro), **Pino** (logs estruturados com ocultação de dados sensíveis) e Rate Limiting[cite: 2]. |
| **Banco de Dados** | **PostgreSQL 16+** gerenciado na nuvem via **Supabase**, utilizando transações ACID, restrições de integridade referencial e índices únicos parciais para idempotência. |
| **Frontend (`frontend/`)** | **React**, Vite, TypeScript, **Tailwind CSS**, Design System de componentes táteis e acessíveis, **React Router**, **TanStack React Query**, Axios, **Recharts** e Lucide Icons. |
| **Testes Automatizados** | Testes Unitários (regras financeiras, cálculo de quizzes e calendário), Testes de Integração de API/Banco (isolamento entre usuários, atomicidade e concorrência) e Testes Ponta a Ponta (Playwright)[cite: 1, 2]. |

---

## Estrutura do Repositório e Governança SDD

A implementação é guiada pelos artefatos de especificação localizados no próprio repositório:

```text
CatFinance/
├── AGENTS.md                                  # Diretrizes operacionais e restrições de escopo do agente
├── .antigravity/
│   └── skills/sdd-guardian/SKILL.md           # Protocolo de verificação de segurança, isolamento e testes
├── docs/
│   ├── RULES.md                               # Regras de negócio consolidadas, casos de borda e modelo de dados
│   ├── MEMORY.md                              # Registro rastreável de decisões técnicas (DEC-01 a DEC-40)
│   └── API_CONTRACTS.md                       # Contratos REST (/api/v1), payloads e tratamento de erros
├── backend/                                   # API REST modular em NestJS + Prisma ORM
└── frontend/                                  # Aplicação web responsiva em React + TypeScript
```

---

## Como Executar Localmente

### 1. Pré-requisitos
- **Node.js** (v20 ou superior)
- Instância **PostgreSQL** (local ou projeto gratuito no **Supabase**)

### 2. Variáveis de Ambiente
Crie os arquivos `.env` e `.env-test` na pasta `backend/` e o arquivo `.env` na pasta `frontend/` seguindo o modelo dos arquivos `.env.example`:

**`backend/.env` (Desenvolvimento):**
```env
NODE_ENV="development"
PORT=3333
DATABASE_URL="postgresql://postgres.[ID]:[SENHA]@[aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public](https://aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public)"
DIRECT_URL="postgresql://postgres.[ID]:[SENHA]@[aws-0-sa-east-1.pooler.supabase.com:5432/postgres?schema=public](https://aws-0-sa-east-1.pooler.supabase.com:5432/postgres?schema=public)"
JWT_SECRET="sua_chave_secreta_com_pelo_menos_32_caracteres"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```
*(Para `backend/.env-test`, utilize a mesma estrutura apontando para `schema=test`).*

**`frontend/.env`:**
```env
VITE_API_URL="http://localhost:3333/api/v1"
```

### 3. Instalação e Inicialização
```bash
# Backend: instalar dependências, gerar cliente Prisma, aplicar migrações e popular dados base
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Em um segundo terminal:
```bash
# Frontend: instalar dependências e iniciar servidor de desenvolvimento
cd frontend
npm install
npm run dev
```

### 4. Execução dos Testes
```bash
cd backend
npm test
```

---

## Roadmap de Implementação

- [ ] **Etapa 1:** Configuração da estrutura Backend/Frontend, Schema Prisma/Supabase, Autenticação JWT/Bcrypt e Exclusão de Conta[cite: 2].
- [ ] **Etapa 1.5:** Fundação de componentes visuais interativos, roteamento no Frontend e camada de comunicação HTTP.
- [ ] **Etapa 2:** Seed das 14 categorias padrão, CRUD de categorias personalizadas e gestão de planilhas mensais organizadas por ano e mês[cite: 1, 2].
- [ ] **Etapa 3:** Lançamentos financeiros em centavos, declarações *"Não tenho esse gasto"* e regra de desbloqueio permanente do Dashboard[cite: 1, 2].
- [ ] **Etapa 4:** Motor de recorrência mensal assistida, ajuste de calendário para meses curtos e importação idempotente[cite: 1, 2].
- [ ] **Etapa 5:** Dashboard financeiro mensal e anual com agregações e gráficos por categoria[cite: 1, 2].
- [ ] **Etapa 6:** Módulos de educação financeira, quizzes dinâmicos (3 a 8 questões), onboarding guiado, caixa de feedback e rotinas utilitárias de auditoria[cite: 1, 2].

---

## Segurança, Privacidade e Aviso Legal

- **Privacidade e LGPD:** O sistema coleta apenas os dados estritamente necessários ao funcionamento da conta, garante o isolamento total de recursos por usuário autenticado, omite dados sensíveis e valores financeiros em registros de log e oferece exclusão definitiva da conta e de todos os dados vinculados mediante confirmação[cite: 1, 2].
- **Limites do Produto:** O CatFinance tem caráter exclusivamente educativo e de organização pessoal de fluxo de caixa, não oferecendo consultoria financeira individualizada, recomendações de investimento ou parecer contábil/jurídico[cite: 1, 2].
