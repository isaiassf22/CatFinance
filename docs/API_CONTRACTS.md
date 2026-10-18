# CatFinance — Contratos da API REST (`/api/v1`)

## 1. Regras Globais
- **Autenticação:** `Authorization: Bearer <jwt_token>`. `userId` extraído exclusivamente do token JWT.
- **Rate Limiting:** Global `60 req/min`; Rotas `/auth/*` `10 req/15min`.
- **Erro Padrão:** `{ "error": { "code": "STRING_CODE", "message": "Mensagem amigável", "details": [] } }`

## 2. Endpoints
### Auth & Conta
- `POST /api/v1/auth/register` -> Body: `{ email, password (min 8) }` -> `201 { accessToken, user }`
- `POST /api/v1/auth/login` -> Body: `{ email, password }` -> `200 { accessToken, user }`
- `GET /api/v1/me` -> `200 { id, email, dashboardUnlocked, onboardingCompleted }`
- `PATCH /api/v1/me/onboarding` -> Body: `{ completed: true }` -> `200`
- `DELETE /api/v1/me` -> Body: `{ confirmationText: "EXCLUIR", currentPassword }` -> `204`

### Categorias
- `GET /api/v1/categories?type=INCOME|EXPENSE` -> `200 { items: [{ id, name, type, isSystem, isEssential }] }`
- `POST /api/v1/categories` -> Body: `{ name, type: "INCOME"|"EXPENSE" }` -> `201`
- `GET /api/v1/categories/:id/delete-preview` -> `200 { categoryId, linkedTransactionsCount, hasActiveRecurrence, affectedSheetsCount }`
- `DELETE /api/v1/categories/:id?confirm=true` -> `200`

### Planilhas Mensais e Declarações Essenciais
- `GET /api/v1/sheets?year=2026` -> `200 { yearsWithSheets: [2026], existingSheets: [{ id, year, month, hasRealTransactions, essentialProgress: { completed, total: 5 } }], availableMonthsToCreate: [1..12] }`
- `POST /api/v1/sheets` -> Body: `{ year, month }` -> `201`
- `GET /api/v1/sheets/:year/:month` -> `200 { sheet, summary: { incomeCents, expenseCents, balanceCents }, essentialsStatus: [...], transactions: [...], pendingRecurrences: [...] }`
- `DELETE /api/v1/sheets/:sheetId?confirm=true` -> `204`
- `POST /api/v1/sheets/:sheetId/essential-declarations` -> Body: `{ categoryId }` -> `201 { declarationId, dashboardUnlockedNow }`
- `DELETE /api/v1/sheets/:sheetId/essential-declarations/:categoryId` -> `204`

### Lançamentos e Recorrências
- `POST /api/v1/sheets/:sheetId/transactions` -> Body: `{ description, amountCents (>=1), type, categoryId, transactionDate ("YYYY-MM-DD"), notes?, isRecurring: boolean }` -> `201 { transaction, removedDeclaration, dashboardUnlockedNow }`
- `PATCH /api/v1/transactions/:id` -> Body: `{ description?, amountCents?, categoryId?, transactionDate?, notes?, isRecurring? }` -> `200 { transaction, recurrenceDeactivated }`
- `DELETE /api/v1/transactions/:id` -> `204`
- `POST /api/v1/sheets/:sheetId/recurrences/apply` -> Body: `{ ruleIds?: string[] }` -> `200 { generatedCount, transactions }`
- `POST /api/v1/sheets/:sheetId/recurrences/dismiss` -> `204`

### Dashboard, Aulas e Feedback
- `GET /api/v1/dashboard?view=MONTHLY|ANNUAL&year=2026&month=10` -> `200 { availablePeriods, incomeCents, expenseCents, balanceCents, expensesByCategory, hasData }`
- `GET /api/v1/lessons` -> `200 { items: [{ id, orderIndex, title, summary, isLocked, isCompleted, bestScorePercent, questionsCount }] }`
- `GET /api/v1/lessons/:id` -> `200` (Cartões + questões sem `correctOptionId`)
- `PATCH /api/v1/lessons/:id/progress` -> Body: `{ lastCardViewed }` -> `200`
- `POST /api/v1/lessons/:id/quiz-submissions` -> Body: `{ answers: [{ questionId, selectedOptionId }] }` -> `200 { scorePercent, correctCount, totalQuestions, approvedNow, isLessonCompleted, results: [{ questionId, isCorrect }] }`
- `POST /api/v1/feedbacks` -> Body: `{ message, pageContext? }` -> `201`