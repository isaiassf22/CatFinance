# CatFinance — Regras de Negócio e Modelo de Dados (SDD v1.0)

## 1. Visão Geral e Público-Alvo
Aplicação web responsiva de controle financeiro pessoal e educação financeira para adultos brasileiros iniciantes absolutos, com interface gamificada e acolhedora inspirada no Duolingo (sem jargões contábeis e sem tom de julgamento).

## 2. Regras de Negócio Consolidadas
1. **Autenticação e Conta (RF-01, RF-19):**
   - Cadastro e login com `email` e `password` (Bcrypt >= 10 rounds, JWT Bearer Token de 7 dias).
   - Sem verificação de e-mail e sem recuperação de senha no MVP inicial.
   - Exclusão de conta (`DELETE /api/v1/me`) executa **Hard Delete atômico** (`ON DELETE CASCADE`) de todos os dados do usuário após confirmação explícita.
2. **Categorias (RF-07, RF-08, RF-12):**
   - **14 Categorias Padrão do Sistema (`isSystem = true`, `userId = null`, imutáveis):**
     - *5 Despesas Essenciais (`type = EXPENSE`, `isEssential = true`):* Moradia, Alimentação, Transporte, Saúde, Educação.
     - *4 Despesas Adicionais (`type = EXPENSE`, `isEssential = false`):* Dívidas e cartão de crédito, Lazer, Cuidados pessoais, Outras despesas.
     - *5 Receitas Padrão (`type = INCOME`, `isEssential = false`):* Salário, Investimentos, Pensão/auxílio, Dividendos, Outras receitas.
   - **Categorias Personalizadas (`isSystem = false`, `userId = ID_DO_USUARIO`):**
     - Pertencem estritamente a um único `type` (`INCOME` ou `EXPENSE`).
     - O usuário pode criar uma categoria com o mesmo nome em `INCOME` e em `EXPENSE`, mas não pode duplicar nomes (normalizados com `trim` + `lowercase`) dentro do mesmo `type` (nem repetir nomes das categorias padrão daquele `type`).
     - Não podem ser renomeadas no MVP.
     - Podem ser excluídas após aviso de impacto (`delete-preview`, alertando inclusive se houver recorrência ativa). A exclusão apaga atomicamente (`prisma.$transaction`) a categoria, suas regras de recorrência e todos os lançamentos vinculados.
3. **Planilhas Mensais e Navegação em "Pastas" Ano -> Mês (RF-13, RF-16, RF-21):**
   - Navegação em estrutura lógica de pastas/grupos: o usuário seleciona o **Ano** (ex.: `2026`) e vê os **Meses das planilhas já criadas** naquele ano.
   - O botão **"Criar planilha mensal"** permite escolher o Ano e apenas meses ainda não criados (`UNIQUE(userId, year, month)`).
   - Cada planilha possui um **Ícone de Opções** com: (1) *Recuperar lançamentos recorrentes* e (2) *Deletar planilha* (apaga atomicamente a planilha, lançamentos e declarações daquele mês após confirmação, preservando regras de recorrência para outros meses).
4. **Lançamentos Financeiros Reais (RF-02 a RF-05):**
   - Campos: `description`, `amountCents` (inteiro >= 1, rejeitando zero/negativos), `type` (`INCOME` | `EXPENSE`), `categoryId` (compatível com o `type`), `transactionDate` (`YYYY-MM-DD`), `notes` (opcional).
   - **Restrição Estrita de Data:** Tanto na criação quanto na edição, `transactionDate` deve pertencer obrigatoriamente ao `year` e `month` da planilha aberta. Datas futuras são permitidas dentro do mês da planilha ou criando-se a planilha do mês futuro correspondente.
   - Ordenação na planilha: `transactionDate DESC`, desempatando por `createdAt DESC`.
5. **Declaração "Não tenho esse gasto" e Desbloqueio do Dashboard (RF-09 a RF-11):**
   - Aplicável apenas às 5 categorias essenciais de despesa, especificamente por planilha mensal. Não é transação financeira e jamais altera saldos ou gráficos.
   - **Mutuamente Exclusiva com Despesa Real no Mês:** Se o usuário declarou *"Não tenho esse gasto"* e depois registra (ou importa via recorrência) uma despesa real naquela categoria/mês, o sistema remove automaticamente a declaração de ausência. Se já houver despesa real na categoria/mês, bloqueia a declaração de ausência.
   - **Desbloqueio do Dashboard:** Liberado permanentemente (`dashboardUnlocked = true`) na primeira vez que o usuário concluir todas as 5 categorias essenciais **dentro de uma mesma planilha mensal** (por despesa real ou declaração).
6. **Recorrência Mensal Assistida (RF-14, RF-15):**
   - Ativar `isRecurring = true` cria uma regra ativa em `RecurrenceRule` (`dayOfMonth` de 1 a 31, `startYear`, `startMonth`, `isActive = true`).
   - Ao abrir/criar planilha de mês posterior (`sheet_period > start_period`), se houver regras ativas pendentes e `recurrencePromptDismissed == false`, pergunta se deseja reaproveitá-las.
   - Se recusar, define `recurrencePromptDismissed = true`, mas permite importar depois pelo **Ícone de Opções da Planilha -> Recuperar lançamentos recorrentes** (que recria apenas as regras ativas ausentes naquela planilha no momento).
   - **Datas em Meses Curtos:** `dayOfMonth = 31` ajusta a ocorrência gerada para `28`/`29` em fevereiro e `30` em meses de 30 dias, preservando `31` na regra matriz.
   - **Edição e Cancelamento:** Editar valor/descrição/data de uma ocorrência afeta apenas aquele mês. Desmarcar *"Repetir mensalmente"* ao editar desativa a regra (`isActive = false`) para os próximos meses após confirmação.
7. **Dashboard Mensal e Anual (RF-06, RF-16, RF-17):**
   - Exige `dashboardUnlocked == true`. O seletor de períodos do Dashboard lista apenas meses/anos que possuam movimentações financeiras reais (`Transaction`). Se ainda não houver movimentações reais, exibe estado vazio explicativo.
8. **Educação Financeira, Onboarding e Feedback (RF-18, RF-20):**
   - 5 módulos iniciais no seed. Primeira jornada sequencial; revisitas livres após conclusão.
   - Aulas em cartões + pergunta aberta de reflexão (resposta não é salva no banco).
   - Quiz ao final de cada aula contendo **entre 3 e 8 questões** de múltipla escolha.
   - Correção no backend (`>= 70%`, `ceil(totalQuestions * 0.7)`). Nunca envia `correctOptionId` ao cliente e, ao reprovar, indica questões certas/erradas sem revelar qual alternativa era a correta nas erradas.
   - Uma vez aprovado (`isCompleted = true`), tentativas futuras reprovadas nunca removem a conclusão.

## 3. Modelo de Dados (Prisma + Supabase PostgreSQL)
- `datasource db`: deve conter `url = env("DATABASE_URL")` e `directUrl = env("DIRECT_URL")`.
- `User`: `id`, `email` (unique), `passwordHash`, `dashboardUnlocked` (default false), `dashboardUnlockedAt`, `onboardingCompleted` (default false), `createdAt`, `updatedAt`.
- `Category`: `id`, `userId` (nullable), `name`, `normalizedName`, `type` (`INCOME`|`EXPENSE`), `isSystem` (default false), `isEssential` (default false), `createdAt`. Unique: `(userId, type, normalizedName)`.
- `MonthlySheet`: `id`, `userId`, `year`, `month`, `recurrencePromptDismissed` (default false), `createdAt`, `updatedAt`. Unique: `(userId, year, month)`.
- `RecurrenceRule`: `id`, `userId`, `categoryId` (Cascade), `type`, `description`, `amountCents`, `notes`, `dayOfMonth`, `startYear`, `startMonth`, `isActive` (default true), `createdAt`, `updatedAt`.
- `Transaction`: `id`, `userId`, `sheetId` (Cascade), `categoryId` (Cascade), `recurrenceRuleId` (SetNull), `description`, `amountCents`, `type`, `transactionDate` (Date), `notes`, `createdAt`, `updatedAt`. Partial Unique Index: `(sheetId, recurrenceRuleId) WHERE recurrenceRuleId IS NOT NULL`.
- `EssentialDeclaration`: `id`, `userId`, `sheetId` (Cascade), `categoryId` (Restrict), `createdAt`. Unique: `(sheetId, categoryId)`.
- `Lesson`, `LessonCard`, `QuizQuestion`, `UserLessonProgress` (`UNIQUE(userId, lessonId)`), `Feedback` (`processedByAgent` default false).