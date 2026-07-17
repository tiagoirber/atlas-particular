# Atlas Particular
> Comprimido em: 2026-07-17 | Sessão: paginação do dashboard, revert do hero pra `contain`, e auditoria de UX (10 PRs #20–#29) com verificação por evidência antes de cada fix

## Objetivo do projeto
App de diário de viagens privado. Usuários registram viagens, documentam dias com fotos/vídeos e publicam uma página pública da viagem.

## Stack e configurações
- **Frontend**: Next.js 14.2.13, React 18.3.1, TypeScript 5 (strict)
- **Styling**: CSS Modules + identidade visual "Arquivo Pessoal" (areia envelhecida, vermelho queimado, Libre Baskerville + Azeret Mono)
- **Backend**: Firebase (Auth email/password, Firestore, Cloud Storage)
- **Deploy**: Vercel — https://atlas-particular.vercel.app/ (auto-deploy no merge em `main`)
- **Repo**: `tiagoirber/atlas-particular` (main protegida — sempre via PR)
- **Deploy via API**: skill `/deploy`; token via Windows Credential Manager (classe C# inline, trocar o nome da classe a cada uso na mesma sessão pra evitar erro de redefinição)
- **`npm run build` local pode falhar** com `SELF_SIGNED_CERT_IN_CHAIN` (next/font) — não é bug, Vercel builda normal; usar `npm run typecheck` + `npm run lint` localmente
- **Hook GateGuard ativo**: antes do primeiro `Bash`/`Edit`/`Write` em cada arquivo (às vezes de novo após compactação de contexto), exige declarar importadores/API afetada/schema/instrução do usuário em texto antes da chamada. Comandos destrutivos (`git reset --hard` etc.) exigem factos extras (o que muda, rollback, instrução verbatim). Responder e repetir a chamada — não é bug.
- **`git pull`/`git checkout` falhando com `unable to write new index file`**: travamento transitório (OneDrive/AV no `.git/index`), não corrupção. Confirmar com `git diff origin/main --stat` (vazio ou só CRLF/LF) antes de `git reset --hard origin/main`.
- **Chrome DevTools MCP**: `resize_page` não funcionou na sessão de 2026-07-17 (viewport não mudava) — provável causa de loop de screenshots num subagent anterior. Confirmar se voltou a funcionar antes de pedir verificação mobile.
- **Sem credenciais de login nesta sessão** — nem local nem produção. Golden paths autenticados (dashboard, wizard, CRUD) só foram verificados por typecheck/lint, não visualmente.

## Estrutura de arquivos relevante
```
app/admin/dashboard/page.tsx
  — paginação client-side (PAGE_SIZE=24, botão "Carregar mais"), filtro ?filter=draft
    funcional (useSearchParams, componente split em DashboardInner + Suspense wrapper),
    erro com role="alert", capa da última viagem em next/image (fill)
app/admin/dashboard/dashboard.module.css
  — .loadMoreWrap/.loadMoreBtn novos; .lastVoyageImage tem position:relative (pro fill)

app/trips/[id]/page.tsx (trip viewer público)
  — hero em object-fit: CONTAIN (revertido no PR #19, next/image fill + priority)
  — .attCover (card de atração) em next/image fill

app/(public)/viagens/page.tsx — card de capa em next/image fill; header duplicado (bug conhecido, não corrigido)

app/admin/trips/[id]/page.tsx — delete de viagem via ConfirmationDialog (não mais window.confirm/alert)

components/trips/trip-form-wizard.tsx (~700 linhas, refactor em hooks NÃO feito ainda)
  — canProceedFromStep(step) parametrizado; goToStep() valida steps intermediários
    antes de pular via indicador; handleSubmit revalida antes de status="published"
  — mensagem de autosave explícita ("já foi salva como rascunho... mesmo se sair agora")
  — cover preview + review image em next/image (fill, aspect-ratio 3/2 fixo)

components/attractions/attractions-manager.tsx (~900 linhas, refactor em hooks NÃO feito ainda)
  — persistedByUpload (state): true quando upload cria a atração automaticamente antes
    do "Salvar alterações"; cancel() deleta de verdade se esse flag estiver ativo
  — applyPersisted(update): sincroniza draft E originalDraft juntos sempre que algo já
    foi persistido (cover/fotos/vídeos) — corrige falso-positivo do dirty-check
  — delete via ConfirmationDialog; erros via describeFirebaseError()
  — cardCover (thumbnail da lista) em next/image fill; coverPreview (upload form)
    continua <img> cru DE PROPÓSITO — mostra foto em tamanho natural sem cortar

components/days/days-manager.tsx — delete via ConfirmationDialog, erros via describeFirebaseError(),
  labels com id/htmlFor, role="alert"

components/trips/trip-card-grid.tsx — delete via ConfirmationDialog; capa em next/image fill

components/photos/photo-uploader.tsx — progresso real (%) via onProgress, igual ao VideoUploader
components/photos/photo-gallery.tsx — fotos em next/image fill (novo wrapper .itemImage com
  position:relative no CSS module, já que aspect-ratio estava no <img> direto)
lib/storage-service.ts — uploadImage() agora usa uploadBytesResumable (progresso opcional);
  uploadTripCover/uploadAttractionCover/uploadAttractionPhoto propagam onProgress
lib/firebase-errors.ts (NOVO) — describeFirebaseError(err, fallback): traduz códigos comuns
  Firestore/Storage (permission-denied, unavailable, storage/*), mesmo padrão de
  translateAuthError em auth-utils.ts
lib/trips-service.ts — deleteTrip() loga (console.error) falhas do cascade delete via
  Promise.allSettled em vez de engolir em silêncio

components/confirmation-dialog.tsx — já existia, agora É USADO nos deletes de
  viagem/dia/atração (antes só window.confirm/alert nativos)

REMOVIDOS: components/attractions/attractions-manager-Casa.tsx,
  components/photos/photo-uploader-Casa.tsx (órfãos, não importados em lugar nenhum)

next.config.mjs — já tinha remotePatterns pra firebasestorage.googleapis.com, nenhuma
  mudança necessária pro next/image
```

## Decisões tomadas
- **Hero da viagem voltou a `object-fit: contain`** (PR #19) — reverte a decisão do PR #17 (`cover`). Pedido explícito do usuário. Capa de atração já era `contain` e não mudou.
- **Paginação é client-side (render em janelas), não Firestore cursor-based** — `listTrips()` continua buscando tudo de uma vez; a busca do dashboard já é 100% client-side sobre o array completo, então paginar o fetch quebraria a busca. Resolve o problema real (DOM grande), não o de leituras do Firestore.
- **Auditoria de UX de um agente externo ("codex"), 14 críticas — cada uma foi VERIFICADA contra o código real (3 subagents Explore, evidência arquivo:linha) antes de qualquer ação.** Resultado:
  - **Infundada**: item 1 (textos corrompidos/mojibake) — zero ocorrências encontradas.
  - **Fora de escopo por decisão do usuário**: item 8 (SSR das páginas públicas — precisa Firebase Admin SDK, credencial nova); item 10 (busca/paginação server-side — otimização prematura pra um diário pessoal).
  - **Corrigidos** (10 PRs, #20–#29): itens 2,3,4,5,6,7,9,11,12(parte1),13,14 — ver seção 12 do CLAUDE.md pra lista completa por PR.
  - **Adiado**: item 12 parte 2 (extrair hooks de trip-form-wizard.tsx/attractions-manager.tsx) — maior risco de regressão (sem testes), precisa de sessão dedicada com login pra verificação visual.
- **`ConfirmationDialog` (já existia, nunca era usado) agora é o padrão de confirmação de delete** em todo o projeto — não usar mais `window.confirm`/`alert` nativos em fluxos novos.
- **`describeFirebaseError()` (`lib/firebase-errors.ts`) é o padrão pra mensagens de erro** — tentar primeiro, cair pro fallback só se o código do erro não for reconhecido.
- **`applyPersisted()` é o padrão em formulários com auto-save parcial** (upload que persiste antes do save explícito) — sempre sincronizar o "original" (baseline do dirty-check) junto com o draft quando algo já foi salvo no backend, senão gera falso-positivo de "não salvo".
- **9 de 12 usos de `<img>` migrados pra `next/image`** — os 3 que sobraram (capa de atração/viagem no formulário, hero da página de atração) mostram a foto em proporção natural sem cortar; convertê-los exigiria fixar uma proporção e distorceria fotos não-4:3. Deixados como `<img>` de propósito, documentado no commit.
- **PRs pequenos e temáticos, um por item da auditoria** (não agrupados por golden path) — 10 PRs sequenciais, cada um: branch → typecheck/lint → commit → push → PR via API REST → squash-merge → sync da main local → apagar branch.

## Regras e restrições
- Nunca push direto em `main`
- CSS Modules: sem seletores HTML bare, sempre classes
- Cores sempre via `var(--nome)` — nunca hardcode
- `createdAt` pode ser `string | Date | Timestamp` — usar `toDate()?.getTime() ?? 0`
- Mudança de schema Firestore → usar skill `/migrar-schema-firestore`
- Editar `.env.local` ou `firestore.rules` → hook vai pedir confirmação explícita
- **Sempre `git checkout -b` antes do primeiro Edit de uma tarefa nova** — não confiar em lembrar depois (quase virou incidente nesta sessão: commit caiu direto na `main` local, só não foi problema porque percebido antes do push)
- Verificar `git diff origin/main --stat` antes de `git reset --hard` pra recuperar de erro de índice do git

## Estado atual
- ✅ Auth, CRUD de viagens/dias/atrações, upload de fotos/vídeos, YouTube embed — produção
- ✅ Dark mode, PWA, responsividade mobile — produção (PRs #12, #14, #15)
- ✅ Automação Claude Code (hooks, skills, subagent, MCP context7) — produção (PR #16)
- ✅ UX da página pública de viagem (skeleton, compartilhar, nav sticky) — produção (PR #17)
- ✅ Paginação client-side no dashboard admin — produção (PR #18)
- ✅ Hero da viagem revertido pra `contain` (foto inteira, sem cortar) — produção (PR #19)
- ✅ Auditoria de UX completa (10 PRs, #20–#29) — produção: link de rascunhos, ConfirmationDialog nas deleções, log de cascade delete, wizard valida steps, autosave explícito + cancelar real, upload de foto com progresso, mensagens de erro específicas, acessibilidade (labels + aria-live), next/image (9 pontos), código morto removido
- ✅ Typecheck e lint passando em todas as mudanças
- ⚠️ Golden paths autenticados (dashboard, wizard, CRUD) **não verificados visualmente** nesta sessão — sem credenciais de login
- ⚠️ Header duplicado em `/viagens` — bug encontrado, não corrigido
- ⚠️ Erro de console `Uncaught (in promise)` em `/viagens` — encontrado, causa não investigada
- ⚠️ `trip-form-wizard.tsx` e `attractions-manager.tsx` continuam grandes (700/900 linhas) — extração em hooks desenhada mas não executada

## Pendências (em ordem de prioridade)
1. **Extrair hooks de `trip-form-wizard.tsx` e `attractions-manager.tsx`** (useAttractionForm, useMediaUpload, useTripWizardForm) — precisa de sessão dedicada com login pra testar visualmente wizard completo + CRUD de atração depois do refactor
2. Corrigir header duplicado em `/viagens` (nav do layout raiz + PublicHeader)
3. Investigar erro de console `Uncaught (in promise)` em `/viagens`
4. Testar os golden paths autenticados em produção com credenciais reais de login (nunca verificados visualmente nesta sessão)
5. Converter `/viagens` e `/trips/[id]` pra Server Components (precisa Firebase Admin SDK — decisão explícita antes de começar)
6. Reconsiderar busca/paginação server-side só se o app virar multiusuário (hoje é diário pessoal, sem urgência)
