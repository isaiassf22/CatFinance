---
name: sdd-guardian
description: Skill de verificação obrigatória de integridade financeira, isolamento entre usuários (IDOR), respeito ao Supabase/.env e UI estilo Duolingo.
---

# Skill: Guardião SDD do CatFinance

Antes de considerar qualquer etapa concluída, execute obrigatoriamente este checklist:
1. **Confinamento e Segredos:** Confirme que nenhum arquivo fora de `CatFinance/` foi acessado e que `.env` / `.env-test` não foram lidos ou alterados.
2. **Isolamento (IDOR):** Confirme que todas as queries do Prisma filtram por `userId` do token JWT e que há teste automatizado provando que `Usuario_B` não acessa dados do `Usuario_A`.
3. **Precisão Monetária e Datas:** Confirme que `amountCents <= 0` é rejeitado com HTTP `422` e que datas `YYYY-MM-DD` estão restritas ao mês/ano da planilha.
4. **Padrão Visual Duolingo:** No frontend, confirme o uso de botões táteis 3D (`TactileButton`), cards selecionáveis coloridos e ícones do `lucide-react`.
5. **Testes e Memória:** Rode os testes no terminal usando `.env-test` e atualize `docs/MEMORY.md`.