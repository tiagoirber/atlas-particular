# Atlas Particular
> Comprimido em: 2026-07-09 | Sessão: limpeza de branches obsoletas + setup completo de automação Claude Code (hooks, skills, subagent, MCP) via PR #16

## Objetivo do projeto
App de diário de viagens privado. Usuários registram viagens, documentam dias com fotos/vídeos e publicam uma página pública da viagem.

## Stack e configurações
- **Frontend**: Next.js 14.2.13, React 18.3.1, TypeScript 5 (strict)
- **Styling**: CSS Modules + identidade visual "Arquivo Pessoal" (areia envelhecida, vermelho queimado, Libre Baskerville + Azeret Mono)
- **Backend**: Firebase (Auth email/password, Firestore, Cloud Storage)
- **Deploy**: Vercel — https://atlas-particular.vercel.app/ (auto-deploy no merge em `main`)
- **Repo**: `tiagoirber/atlas-particular` (main protegida — sempre via PR)
- **Node.js**: em `C:\Program Files\nodejs` — já está no PATH do Git Bash (não precisa do hack de PATH que era necessário no PowerShell puro)
- **jq NÃO está instalado** neste ambiente — hooks e scripts devem parsear JSON via `node -e`, não `jq`
- **Deploy via API**: usar skill `/deploy`; token via Windows Credential Manager (classe `CMDeploy` C# inline); `gh` CLI não está instalado, sempre usar a API REST direto
- **MCP instalados**: `context7` (doc lookup, escopo local desta máquina), `chrome-devtools` (plugin ecc, usado pelo subagent `testador-golden-path`)

## Estrutura de arquivos relevante
```
types/
  video.ts          — Video { url, storagePath, youtubeId?, caption, order, uploadedAt }
  attraction.ts     — AttractionBase: photos: Photo[], videos: Video[]

utils/
  validators.ts     — validateImageFile (max 12 MB), validateVideoFile (max 500 MB)

lib/
  storage-service.ts      — uploadBytesResumable para vídeos com callback de progresso
  attractions-service.ts  — setAttractionPhotos, setAttractionVideos, deleteAttraction

components/
  header.tsx / header.module.css        — hamburger ≤640px, safe-area-inset-top, ThemeProvider (dark mode toggle)
  admin-nav.tsx / admin-nav.module.css  — hamburger ≤640px, dropdown vermelho
  attractions/attractions-manager.tsx   — CRUD de atrações + handlers de vídeo (upload + YouTube)
  photos/video-uploader.tsx             — upload arquivo + input link YouTube
  photos/video-gallery.tsx              — <video> para upload direto, <iframe> para YouTube
  pwa-register.tsx                      — registra SW + auto-reload em nova versão
  footer.tsx                            — footer do app

app/
  layout.tsx        — Viewport cover, PWA metadata, PwaRegister, ThemeProvider
  globals.css       — CSS vars identidade visual Arquivo Pessoal
  (app/test/ foi REMOVIDO — não existe mais)

public/
  manifest.json / sw.js / offline.html / icons/ — PWA completo

.claude/commands/
  deploy.md, deploy-template.md, verify.md, inicio.md, fim.md, ui-style-system.md
  migrar-schema-firestore.md  — checklist de migração segura de schema Firestore (novo)
  novo-componente.md          — gera par .tsx + .module.css na convenção do projeto (novo)

.claude/agents/
  testador-golden-path.md — percorre os 8 golden paths via Chrome DevTools MCP (novo)

.claude/settings.json
  hooks.PostToolUse — typecheck+lint automático em .ts/.tsx (não bloqueia)
  hooks.PreToolUse  — exige confirmação para editar .env.local ou firestore.rules
```

## Decisões tomadas
- **Hamburger menu**: breakpoint `≤ 640px`; fecha em Escape + clique fora + seleção de link + mudança de rota
- **Step indicators mobile**: `overflow-x: auto` + `scrollbar-width: none` em `≤ 480px`; labels ocultos
- **Vídeos YouTube**: `youtubeId` no tipo `Video`; embed iframe 16:9 via `padding-bottom: 56.25%`
- **Foto de capa**: `display: flex + width/height: auto + max-height: 90vh` — NÃO usar `object-fit: cover`
- **Limite de foto**: 12 MB em `utils/validators.ts`
- **Deploy**: skill `/deploy`; JSON para API GitHub como string literal; sem `gh` CLI disponível
- **Token GitHub**: Windows Credential Manager via classe C# inline `CMDeploy`
- **Branches locais squash-mergeadas**: `git branch -d` sempre falha nelas ("not fully merged") mesmo já estando 100% no `main` — antes de `git branch -D`, confirmar com `git diff origin/main..<branch> --stat` que não sobra conteúdo exclusivo
- **Hooks**: usar `node -e` para parsear stdin JSON (não `jq`, que não existe neste ambiente); hook de typecheck/lint é não-bloqueante (`|| true` / `; true`) para não travar edições em andamento
- **context7 MCP**: instalado em escopo local (`claude mcp add`), não compartilhado com o outro dev via `.mcp.json`

## Regras e restrições
- Nunca push direto em `main`
- CSS Modules: sem seletores HTML bare, sempre classes
- Cores sempre via `var(--nome)` — nunca hardcode
- `createdAt` pode ser `string | Date | Timestamp` — usar `toDate()?.getTime() ?? 0`
- Documentos Firestore antigos sem `videos` → tratar com `att.videos || []`
- Vídeos YouTube não têm `storagePath` — não tentar deletar do Storage
- Mudança de schema Firestore → usar skill `/migrar-schema-firestore` (checklist obrigatório)
- Editar `.env.local` ou `firestore.rules` → hook vai pedir confirmação explícita, é esperado

## Estado atual
- ✅ Auth, CRUD de viagens/dias/atrações, upload de fotos/vídeos, YouTube embed — tudo funcional e em produção
- ✅ Dark mode toggle, PWA instalável, responsividade mobile — em produção (PRs #12, #14, #15)
- ✅ `app/test/` removido
- ✅ Automação Claude Code completa: hooks + 2 skills novas + 1 subagent + MCP context7 — em produção (PR #16)
- ✅ Typecheck e lint passando sem erros
- ⚠️ 7 branches locais antigas não verificadas (ver Pendências)

## Pendências (em ordem de prioridade)
1. Verificar e limpar branches locais antigas: `chore/skills-de-deploy`, `chore/verify-skill-e-regra-claude`, `design/arquivo-pessoal`, `fix/hero-foto-inteira`, `fix/layout-e-videos`, `fix/photo-upload-filelist`, `fix/storage-rules-videos`
2. Testar os golden paths na URL de produção (usar subagent `testador-golden-path`)
3. Decidir se `context7` MCP deve virar compartilhado via `.mcp.json` para o outro dev
4. Paginação no dashboard (sem urgência, só quando houver 100+ viagens)
