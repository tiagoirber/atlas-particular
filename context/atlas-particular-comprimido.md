# Atlas Particular
> Comprimido em: 2026-07-14 | Sessão: melhoria de UX da página pública de visualização de viagem (fluxo brainstorming → spec → plano → implementação → PR #17 mergeado)

## Objetivo do projeto
App de diário de viagens privado. Usuários registram viagens, documentam dias com fotos/vídeos e publicam uma página pública da viagem.

## Stack e configurações
- **Frontend**: Next.js 14.2.13, React 18.3.1, TypeScript 5 (strict)
- **Styling**: CSS Modules + identidade visual "Arquivo Pessoal" (areia envelhecida, vermelho queimado, Libre Baskerville + Azeret Mono)
- **Backend**: Firebase (Auth email/password, Firestore, Cloud Storage)
- **Deploy**: Vercel — https://atlas-particular.vercel.app/ (auto-deploy no merge em `main`)
- **Repo**: `tiagoirber/atlas-particular` (main protegida — sempre via PR)
- **Node.js**: em `C:\Program Files\nodejs` — já está no PATH do Git Bash
- **jq NÃO está instalado** neste ambiente — hooks e scripts devem parsear JSON via `node -e`, não `jq`
- **Deploy via API**: usar skill `/deploy`; token via Windows Credential Manager (classe C# inline, ex. `CMDeployPR`/`CMDeployMerge` — reusar nome se já definido na sessão dá erro, trocar o nome); `gh` CLI **não está instalado**, sempre usar a API REST direto (confirmado nesta sessão)
- **`npm run build` local pode falhar** com `SELF_SIGNED_CERT_IN_CHAIN` ao buscar fontes do Google (`next/font`) — rede/antivírus da máquina interceptando TLS, não é bug do código; usar Vercel como fonte de verdade do build
- **MCP instalados**: `context7` (doc lookup, escopo local), `chrome-devtools` (plugin ecc, usado pelo subagent `testador-golden-path`) — **nem sempre conectado na sessão**; confirmar disponibilidade antes de prometer verificação visual (aconteceu nesta sessão: nem a sessão principal nem o subagent tinham acesso)

## Estrutura de arquivos relevante
```
app/trips/[id]/
  page.tsx                    — trip viewer público; hero+share button, DayNav, skeleton, filtros (busca+tipo, SEM dropdown de dia)
  trip-viewer.module.css       — .hero/.heroImg agora object-fit: cover (não mais contain); .skeleton*; .heroActions

components/trips/
  share-button.tsx / .module.css   — botão compartilhar: navigator.share (mobile) → fallback clipboard+toast (desktop)
  day-nav.tsx / .module.css        — nav sticky por dia + scrollspy via IntersectionObserver; só renderiza com 2+ dias

components/toast.tsx
  — useToast() retorna { toasts, addToast, removeToast }; ToastsContainer renderiza a lista (usado pelo share-button via page.tsx)

docs/superpowers/
  specs/2026-07-13-trip-viewer-ux-design.md   — spec da melhoria de UX (novo padrão de pasta no projeto)
  plans/2026-07-13-trip-viewer-ux.md          — plano de implementação task-a-task

types/
  video.ts          — Video { url, storagePath, youtubeId?, caption, order, uploadedAt }
  attraction.ts     — AttractionBase: photos: Photo[], videos: Video[]

utils/
  validators.ts     — validateImageFile (max 12 MB), validateVideoFile (max 500 MB)

lib/
  storage-service.ts      — uploadBytesResumable para vídeos com callback de progresso
  attractions-service.ts  — setAttractionPhotos, setAttractionVideos, deleteAttraction

components/
  header.tsx / admin-nav.tsx  — hamburger ≤640px
  attractions/attractions-manager.tsx   — CRUD de atrações + handlers de vídeo
  photos/video-uploader.tsx / video-gallery.tsx

.claude/commands/
  deploy.md, deploy-template.md, verify.md, inicio.md, fim.md, ui-style-system.md
  migrar-schema-firestore.md, novo-componente.md

.claude/agents/
  testador-golden-path.md — percorre golden paths via Chrome DevTools MCP (ferramenta nem sempre disponível, ver acima)

.claude/settings.json
  hooks.PostToolUse — typecheck+lint automático em .ts/.tsx (não bloqueia)
  hooks.PreToolUse  — exige confirmação para editar .env.local ou firestore.rules
```

## Decisões tomadas
- **Hero da VIAGEM (trip viewer) agora usa `object-fit: cover`** — preenche o hero sem letterbox, cropa fotos verticais. Isso **reverte** a decisão antiga ("nunca usar object-fit: cover no hero, sempre contain"); motivo: uso do app como portfólio/link compartilhado, primeira impressão mobile importa mais que ver a foto inteira. **A foto de capa da ATRAÇÃO não mudou** — continua em `contain` (mostra inteira, sem cortar).
- **Navegação por dia na página pública**: pills sticky com scrollspy (`DayNav`) substituem o antigo dropdown "Todos os dias" — dropdown foi removido do `page.tsx`. Só aparece com 2+ dias.
- **Compartilhamento**: botão único inteligente — `navigator.share()` se disponível (mobile), senão `navigator.clipboard.writeText()` + toast. Não usar botões separados por rede social.
- **Skeleton de carregamento**: usa a animação `pulse` já existente em `globals.css` (opacity 1↔0.5) — não criar keyframe novo.
- **Fluxo de trabalho para features novas**: brainstorming (spec em `docs/superpowers/specs/`) → writing-plans (plano em `docs/superpowers/plans/`) → executing-plans (branch + commits por task) → finishing-a-development-branch (PR). **Criar a branch de feature ANTES de commitar o spec/plano** — nesta sessão os 2 primeiros commits foram feitos na `main` local por engano, exigindo `git reset --hard origin/main` depois do squash-merge pra reconciliar (conteúdo não foi perdido, mas deu trabalho extra).
- **PR sem `gh` CLI**: token do GitHub via Windows Credential Manager (P/Invoke `CredRead`), request direto pra API REST (`POST /repos/.../pulls`, `PUT /repos/.../pulls/{n}/merge` com `merge_method: squash`) via `Invoke-RestMethod` — usar `[System.Text.Encoding]::UTF8.GetBytes()` no body pra não corromper acentos.
- **Branches locais squash-mergeadas**: `git branch -d` avisa "not fully merged" mesmo já estando 100% no `main` (comportamento normal do squash) — confirmar com `git diff origin/main..<branch> --stat` antes de forçar delete.

## Regras e restrições
- Nunca push direto em `main`
- CSS Modules: sem seletores HTML bare, sempre classes
- Cores sempre via `var(--nome)` — nunca hardcode
- `createdAt` pode ser `string | Date | Timestamp` — usar `toDate()?.getTime() ?? 0`
- Documentos Firestore antigos sem `videos` → tratar com `att.videos || []`
- Mudança de schema Firestore → usar skill `/migrar-schema-firestore` (checklist obrigatório)
- Editar `.env.local` ou `firestore.rules` → hook vai pedir confirmação explícita, é esperado
- Antes de afirmar que testou algo no navegador, confirmar que as ferramentas de browser (Chrome DevTools MCP) estão realmente conectadas nesta sessão — não presumir

## Estado atual
- ✅ Auth, CRUD de viagens/dias/atrações, upload de fotos/vídeos, YouTube embed — em produção
- ✅ Dark mode, PWA, responsividade mobile — em produção (PRs #12, #14, #15)
- ✅ Automação Claude Code (hooks, skills, subagent, MCP context7) — em produção (PR #16)
- ✅ **Melhoria de UX da página pública de viagem — em produção (PR #17, mergeado 2026-07-14)**: hero cover, skeleton, botão compartilhar, nav sticky por dia, filtros simplificados
- ✅ Typecheck e lint passando sem erros em todas as mudanças
- ⚠️ **Verificação visual em produção do PR #17 ainda NÃO foi feita** — implementado sem acesso a navegador nesta sessão; usuário disse que vai testar depois do deploy
- ⚠️ 7 branches locais antigas não verificadas (lista nas Pendências)

## Pendências (em ordem de prioridade)
1. **Testar visualmente em produção as 5 mudanças do PR #17** (hero sem barra preta, skeleton, botão compartilhar + toast, pills sticky com scrollspy, busca/filtro sem dropdown de dia) — usuário ficou de fazer isso
2. Verificar e limpar branches locais antigas: `chore/skills-de-deploy`, `chore/verify-skill-e-regra-claude`, `design/arquivo-pessoal`, `fix/hero-foto-inteira`, `fix/layout-e-videos`, `fix/photo-upload-filelist`, `fix/storage-rules-videos`
3. Testar os demais golden paths na URL de produção (usar subagent `testador-golden-path`, confirmando antes que o Chrome DevTools MCP está conectado)
4. Paginação no dashboard (sem urgência, só quando houver 100+ viagens)
