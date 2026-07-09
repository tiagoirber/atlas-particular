# CLAUDE.md — Atlas Particular

**⚠️ INSTRUÇÃO PERMANENTE E IMUTÁVEL**: Você deve conversar APENAS em **Português do Brasil**. Não importa a língua da pergunta ou contexto — responda sempre em pt-BR. Esta é uma regra fixa.

**⚠️ REGRA PERMANENTE — VERIFICAÇÃO OBRIGATÓRIA ANTES DE ENTREGAR**: Antes de declarar qualquer tarefa como pronta ou concluída, você DEVE executar o checklist de verificação abaixo. Nunca diga "está funcionando" sem evidência concreta. Se não puder testar algo (ex: Node.js indisponível, sem acesso ao browser), diga isso explicitamente e instrua o usuário sobre o que verificar manualmente. Use `/verify` para o processo completo.

### Checklist mínimo de entrega (obrigatório em toda tarefa):
1. **Reler os arquivos modificados** — confirmar que a mudança está correta e completa
2. **Tentar typecheck/lint** — `npm run typecheck && npm run lint` (se Node.js disponível)
3. **Confirmar commit no Git** — `git log --oneline -3` e `git status` limpo
4. **Verificar lógica** — a mudança resolve o problema? quebra algum golden path?
5. **Reportar honestamente** — separar o que foi verificado do que não foi possível verificar

---

This document is the source of truth for context, conventions, and guardrails. Read it before substantial changes. Update it when you discover new patterns or issues.

---

## 1. Overview

**Atlas Particular** is a private travel diary app. Users register trips, document daily experiences with photos, write descriptions, tag attractions, and publish a beautiful public-facing trip page.

**Core purpose**: Record and revive travel memories with a modern, elegant interface.

**Stack**:
- **Frontend**: Next.js 14.2.13, React 18.3.1, TypeScript 5
- **Styling**: CSS Modules + Claymorphism design system
- **Auth & Backend**: Firebase (Authentication, Firestore, Cloud Storage)
- **Deployment**: Vercel (auto-redeploy on push to main)
- **Design**: Modern Emerald color palette (esmeralda #055e3d, menta #34d399, ouro #d4a574)

**Key characteristics**:
- Production-ready, live on Vercel
- 2-person team, feature-branch workflow
- No automated tests (manual verification only)
- TypeScript strict mode, ESLint enabled

---

## 2. Stack & Commands

### Commands (exact, copy-paste ready):

```bash
# Development
npm run dev              # Start Next.js dev server on http://localhost:3000

# Production
npm run build            # Build for production (runs on Vercel auto-deploy)
npm run start            # Start production server locally

# Code quality
npm run lint             # Run ESLint on all files
npm run typecheck        # Run TypeScript compiler (no emit) — catches type errors

# Manual verification workflow
# (No automated test suite; validation is manual + code review)
```

### Key dependencies:
- `firebase@^11.10.0` — Auth, Firestore, Storage
- `next@14.2.13` — React framework, API routes (if needed)
- `react@18.3.1`, `react-dom@18.3.1`
- `typescript@^5` — Type safety

**Before committing**: Always run `npm run typecheck` and `npm run lint` locally. Both must pass.

**Automação**: Um hook `PostToolUse` (`.claude/settings.json`) já roda `typecheck` + `lint` automaticamente após qualquer edição em `.ts`/`.tsx` (não bloqueia, só reporta). Hooks neste projeto usam `node -e` para parsear o JSON do stdin — `jq` **não está instalado** neste ambiente Windows/Git Bash.

---

## 3. Folder Structure

```
Atlas Particular/
├── app/                          # Next.js app directory (pages + layouts)
│   ├── (public)/                 # Public pages (no auth required)
│   │   ├── viagens/              # Trip listing page (search + filters)
│   │   └── trips/[id]/           # Public trip viewer
│   ├── admin/                    # Admin dashboard (auth required)
│   │   ├── dashboard/            # Main dashboard + recent trips
│   │   ├── trips/                # Trip CRUD pages
│   │   │   ├── new/              # Create trip (wizard)
│   │   │   └── [id]/             # Edit trip (wizard)
│   │   ├── settings/             # User settings (account, password, theme)
│   ├── preview-colors/           # [TEMPORARY] Color palette preview (delete after use)
│   ├── globals.css               # Global styles + CSS vars + animations
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                   # Reusable React components
│   ├── auth/
│   │   ├── auth-guard.tsx        # Route protection wrapper
│   │   ├── login-form.tsx        # Login UI
│   │   ├── logout-button.tsx     # Logout action
│   │   └── change-password-form.tsx
│   ├── trips/
│   │   ├── trip-form-wizard.tsx  # 6-step creation/edit wizard
│   │   ├── trip-form-wizard.module.css
│   │   ├── trip-card.tsx         # Card for trip grid
│   │   ├── trip-card.module.css
│   │   └── trip-card-grid.tsx    # Grid layout
│   ├── ui/
│   │   ├── confirmation-dialog.tsx    # Reusable modal dialog
│   │   ├── confirmation-dialog.module.css
│   │   ├── toast.tsx             # Toast notification system
│   │   └── toast.module.css
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.tsx               # Auth state (wrapped by AuthContext)
│   ├── useTrips.tsx              # Fetch trips from Firestore
│   ├── useToast.tsx              # Toast notifications
│   └── (others as needed)
│
├── lib/                          # Utilities & Firebase setup
│   ├── auth-context.tsx          # Firebase Auth context
│   ├── firebase.ts               # Firebase config & init
│   ├── firestore.ts              # Firestore helpers (CRUD)
│   ├── storage.ts                # Cloud Storage helpers
│   └── (other utilities)
│
├── utils/                        # Pure utility functions
│   ├── date.ts                   # Date parsing & formatting
│   ├── validation.ts             # Input validation
│   └── (other helpers)
│
├── public/                       # Static assets (images, fonts)
│
├── CLAUDE.md                     # This file
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
├── next.config.js                # Next.js config
└── .eslintrc.json                # ESLint rules
```

**Golden rule**: Pages go in `app/`, components in `components/`, utilities in `lib/` and `utils/`.

**Automação Claude Code** (`.claude/`):
- `commands/`: `deploy`, `deploy-template`, `verify`, `inicio`, `fim`, `ui-style-system`, `migrar-schema-firestore`, `novo-componente`
- `agents/testador-golden-path.md`: percorre os golden paths (seção 4) via Chrome DevTools MCP
- `settings.json`: hooks de typecheck/lint automático e confirmação obrigatória para editar `.env.local`/`firestore.rules`

---

## 4. Funcionalidades Críticas (Golden Paths)

These flows **must never break**. Test them manually before every deploy.

### 4.1 Authentication
- **Path**: Login (email/password) → Dashboard → Settings → Logout
- **Files**: `auth-context.tsx`, `login-form.tsx`, `logout-button.tsx`, `auth-guard.tsx`
- **Verification**: Can log in, see dashboard, access settings, log out successfully

### 4.2 Trip Creation (Wizard)
- **Path**: Dashboard → "+ Nova viagem" → Step 1 (title, destination) → ... → Step 6 (review) → Save
- **Files**: `trip-form-wizard.tsx`, `trip-form-wizard.module.css`
- **Key steps**: Basic info → Dates → Description → Cover image → Tags/travelers → Review
- **Verification**: Can create trip in all 6 steps, validation works per-step, trip appears in dashboard

### 4.3 Trip Editing
- **Path**: Dashboard → Click trip → Edit → Modify in wizard → Save
- **Files**: Same wizard reused for create + edit
- **Verification**: Can edit all fields, changes persist

### 4.4 Day/Attraction CRUD (within trip edit)
- **Path**: Trip editor → Add day → Add attraction to day → Edit/delete attraction → Save trip
- **Files**: Part of `trip-form-wizard.tsx` (Step 3: Descrição)
- **Verification**: Can add 3+ days, add multiple attractions per day, edit/delete them

### 4.5 Photo Upload
- **Path**: Trip editor → Step 4 (Capa) → Upload cover image → Confirm upload
- **Files**: Part of `trip-form-wizard.tsx`, `storage.ts`
- **Verification**: Upload works, image appears in preview, URL is saved to Firestore

### 4.6 Dashboard (Admin)
- **Path**: Login → Dashboard loads
- **Key sections**: Last voyage card, pending drafts, stats, all trips with search/filter
- **Files**: `app/admin/dashboard/page.tsx`, `dashboard.module.css`
- **Verification**: Page loads, trip list is sorted by createdAt (newest first), search + filters work

### 4.7 Public Trip Page
- **Path**: Click "Publicar" or share public link → View public trip page
- **Key sections**: Header, itinerary timeline (by day), attractions, photos, tags
- **Files**: `app/trips/[id]/page.tsx`, `trip-viewer.module.css`
- **Verification**: Public can view published trips (private trips blocked), timeline renders, images load

### 4.8 Trip Search & Filtering
- **Path**: Dashboard → Search bar → Type / Filter by country, tags
- **Files**: `app/(public)/viagens/page.tsx`, `viagens.module.css`
- **Verification**: Search returns correct trips, filters work, clear filters resets

---

## 5. Áreas Intocáveis

Do **NOT** refactor, rename, or change these without explicit justification:

### 5.1 Firebase Security Rules
- **File**: `firestore.rules` (if exists) or Firebase Console
- **Why**: Controls access. Wrong rules = data leaks or blocked users.
- **Change protocol**: Write new rules, test in Firebase Console emulator, document in PR.

### 5.2 Authentication Context
- **Files**: `lib/auth-context.tsx`, `hooks/useAuth.tsx`
- **Why**: Changing auth state management breaks entire app.
- **Change protocol**: Only if migrating auth library (e.g., Firebase → Supabase). Requires full regression test.

### 5.3 Color Palette (CSS variables)
- **File**: `app/globals.css` (`:root` vars like `--accent`, `--bg-primary`)
- **Why**: Colors are part of brand identity. Changes affect entire visual hierarchy.
- **Change protocol**: Update **all** color refs together (light + dark mode). Preview on multiple pages before merge.

### 5.4 Trip Data Model (Firestore schema)
- **Structure**: `trips/{tripId}` with fields like `title`, `destination`, `startDate`, `days[]`, etc.
- **Why**: Backfill required if schema changes. Public pages depend on exact field names.
- **Change protocol**: Must write migration; notify other developer if doing this.

### 5.5 Deployed Firebase Project
- **What**: Project ID, API keys, Firestore database URL
- **Why**: Wrong project = app talks to wrong backend or test data.
- **Change protocol**: Never change in env files without coordination. Document in PR.

### 5.6 Proteção automática (hook)
- Um hook `PreToolUse` (`.claude/settings.json`) exige confirmação explícita antes de editar `.env.local` ou `firestore.rules`, mesmo em modo de permissão mais permissivo. Não remova esse hook sem justificativa.

---

## 6. Convenções de Código

### TypeScript
- **Strict mode always**: `"strict": true` in tsconfig.json
- **Type everything**: No `any` except in truly unavoidable cases (then comment why)
- **Optional chaining + nullish coalescing**: Use `?.` and `??` extensively
- **Example**: 
  ```typescript
  const date = toDate(trip.createdAt)?.getTime() ?? 0;
  // Better than: new Date(trip.createdAt).getTime()
  ```

### React Components
- **Functional components + hooks only** (no class components)
- **Props typed explicitly**:
  ```typescript
  interface TripCardProps {
    trip: Trip;
    onEdit?: () => void;
  }
  ```
- **Use `"use client"` at top of files with interactivity** (Next.js 14 app directory)
- **Extract reusable logic to hooks** (e.g., `useTrips`, `useToast`)

### CSS Modules
- **Kebab-case class names** → **camelCase in imports** (Next.js standard):
  ```css
  /* preview.module.css */
  .palette-card { /* ... */ }
  .palette-card:hover { /* ... */ }
  ```
  ```typescript
  // page.tsx
  import styles from './preview.module.css';
  <div className={styles.paletteCard}>
  ```
- **No global class names in CSS Modules** (use BEM or descriptive names)
- **Animations via `@keyframes` in globals.css** (reusable: `fadeIn`, `slideUp`, `pulse`, etc.)

### Naming
- **Functions**: `camelCase`, verb-first (e.g., `formatDateRange`, `applyPalette`)
- **Components**: `PascalCase` (e.g., `TripFormWizard`, `ConfirmationDialog`)
- **Constants**: `UPPER_SNAKE_CASE` if truly constant across sessions
- **Files**: Match component name (e.g., `TripCard.tsx`, `trip-card.module.css`)

### Imports
- **Relative imports** for local files: `import { X } from '@/lib/...'`
- **Absolute imports** using `@/` alias (configured in tsconfig.json)
- **Group imports**: React → Next → lib → components → styles

---

## 7. Workflow Obrigatório

### Branch Strategy (Option A: Main Protected)

1. **main branch is protected**:
   - No direct pushes allowed
   - Requires PR review before merge
   - Vercel auto-deploys on merge

2. **Feature branches**:
   - Create from main: `git checkout -b feature/your-feature-name`
   - Make changes, commit, push to GitHub
   - Open PR with clear description
   - Link to any relevant issues/tasks
   - Request review from other team member
   - Resolve any conflicts/feedback
   - Merge via GitHub (not local)

3. **Commit discipline**:
   - **Atomic commits**: One logical change per commit
   - **Clear messages**:
     ```
     add trip search and filtering on viagens page
     
     - implement search input with debounce
     - add country + tags dropdown filters
     - fix sorting to use createdAt
     ```
   - **No WIP commits on main** (squash before merge if needed)

4. **Before pushing**:
   - [ ] `npm run typecheck` passes
   - [ ] `npm run lint` passes
   - [ ] Manual test: Run `npm run dev`, exercise the golden path you changed
   - [ ] No console errors/warnings

5. **Vercel deployment**:
   - After merge to main, Vercel auto-builds
   - Check Vercel dashboard for build status
   - If build fails, check Vercel logs → create hotfix PR
   - Manual verification on Vercel deployment URL before considering done

---

## 8. O que NÃO fazer

### Anti-patterns (learned from bugs/regressions)

1. **Don't use `.toMillis()` on createdAt**
   - `createdAt` can be `string | Date | Timestamp`
   - Use: `toDate(createdAt)?.getTime() ?? 0`
   - **Why**: Type safety; not all types have `.toMillis()`

2. **Don't use bare HTML selectors in CSS Modules**
   ```css
   /* ❌ WRONG — CSS Modules reject this */
   fieldset { }
   
   /* ✅ RIGHT */
   .fieldset { }
   ```
   - **Why**: CSS Modules require at least one local class or ID per selector

3. **Don't hardcode colors**
   - Use CSS variables: `background: var(--bg-primary);`
   - Update in `globals.css` only
   - **Why**: Maintaining single source of truth; dark mode support

4. **Don't mutate Firebase docs directly**
   - Always use `firestore.ts` helper functions (CRUD wrappers)
   - Example: `createTrip()`, `updateTrip()`, `deleteTrip()`
   - **Why**: Ensures consistent data structure, easier to debug

5. **Don't assume Firestore field presence**
   - Always check with optional chaining: `trip?.coverImageUrl`
   - Use fallbacks: `trip?.title ?? 'Untitled'`
   - **Why**: Older trips might not have newer fields

6. **Don't trigger component state updates in loops**
   - Use `useMemo` for filtering/sorting (as in dashboard)
   - Avoid re-rendering on every keystroke
   - **Why**: Performance; prevents memory leaks

7. **Don't mix styled-jsx with CSS Modules**
   - Pick one approach per file
   - Currently using CSS Modules + inline styles (for dynamic colors)
   - **Why**: Avoids specificity conflicts, easier to debug

8. **Don't delete pages without updating navigation**
   - `/preview-colors/` is temporary; remove it + check for links to it
   - **Why**: Broken links break trust in production

9. **Don't expose Firebase secrets in client code**
   - Config is in `.env.local` (gitignored), loaded at build time
   - No API keys in comments or console logs
   - **Why**: Security; secrets leak easily

10. **Don't skip the PR review process**
    - Merge directly to main only in true emergencies (documented in Slack)
    - **Why**: Catch bugs early; distribute knowledge

11. **Don't leave `/fim`'s CLAUDE.md update uncommitted**
    - Se as mudanças do Passo 2 do `/fim` não forem commitadas (ex.: descartadas numa sessão seguinte por parecerem "sobra"), a próxima sessão parte de informação desatualizada — foi o que aconteceu com dark mode/PWA/responsividade, que ficaram implementados no código mas nunca documentados aqui até esta sessão
    - **Why**: O `/fim` atual já força commit + push só dos arquivos de continuidade (Passo 4) exatamente para evitar isso

---

## 9. Disciplina de Contexto

This section is about **preventing regressions and maintaining productivity across conversations**.

### When you sit down for a session:

1. **Read this file first** (CLAUDE.md)
2. **Understand the task** — is it a feature, bugfix, or exploration?
3. **Decide: Plan Mode or Direct?**
   - **Use Plan Mode** if: multi-file changes, touching golden paths, architectural decisions, refactoring
   - **Direct**: small edits, single-file fixes, doc updates

4. **If modifying golden paths**, manually test the full flow before declaring done:
   ```bash
   npm run dev
   # Exercise the path in browser (login → trip creation → dashboard → logout)
   ```

5. **Before committing**:
   - [ ] TypeScript passes (`npm run typecheck`)
   - [ ] Linting passes (`npm run lint`)
   - [ ] No console errors in dev mode
   - [ ] Golden path still works (manual 2-min test)

### Handling ambiguous requests:

If the user says "improve the dashboard" without specifics:
- Ask: What part? Colors? Speed? Layout? Functionality?
- Don't assume and code for 1 hour in the wrong direction
- Better to clarify 30 seconds upfront

### Regression prevention:

- **Color changes?** Update **all** color vars + test light/dark modes
- **Changing data model?** Check all pages that use that model
- **Removing a component?** Search the codebase for imports of it
- **Modifying auth flow?** Re-test login, logout, protected routes

---

## 10. Plan Mode & Checkpoints

### When to Enter Plan Mode

Use `/enter-plan-mode` if:
- Touching > 3 files
- Modifying a golden path (auth, wizard, dashboard)
- Architectural decision (e.g., "should we use Context for theme?")
- Uncertainty about approach ("is this the right pattern?")

### Plan Checklist

Before implementing, confirm:
1. **Files to modify**: Which files change? (not guessing)
2. **Breaking changes**: Will this break existing functionality?
3. **Data migrations**: Do Firestore docs need backfill?
4. **Design consistency**: Does this fit the existing style (colors, spacing, interactions)?
5. **Scope**: Is this the minimal change needed or am I gold-plating?

### Checkpoints During Work

Mark these moments in your work:
- **After reading related code**: "Found X component, it already does Y"
- **Before major refactor**: "Plan: move Z from file A to file B"
- **After first implementation**: "Basic feature works; now testing edge cases"
- **Before commit**: "All files changed; typecheck + lint pass; golden path tested"

---

## 11. Comunicação (2-Person Team)

### Async Communication (Preferred)

- **PR descriptions** are your main channel
  - Who: Changes made
  - Why: Motivation (feature/bugfix/perf)
  - How: Technical approach
  - Test: What to verify

- **Commit messages** should be clear enough to understand 6 months later
  - Not: "fix bug"
  - Yes: "fix: createdAt sorting in dashboard by using toDate() helper"

### Before Pushing to Main

- Notify the other developer (Slack/Discord/email) with:
  - PR link
  - What changed
  - Any manual testing they should do

- Wait 24 hours for review if possible (unless urgent)
- If urgent (hotfix), document in the PR why it's urgent

### Meetings/Sync (If Needed)

- Architecture changes: Discuss async in PR or schedule 15min call
- Major refactors: Align on approach before starting (use Plan Mode)
- Stuck on a problem: Ask for a second opinion (share error + context)

### Knowledge Sharing

- Document new patterns in CLAUDE.md as you discover them
- Update this file when you find a bug caused by not following a convention
- Link to this file in PR descriptions if you're introducing a new pattern

---

## 12. Estado Atual & Próximos Passos

### Current State (as of 2026-07-09)

✅ **Implemented**:
- Authentication (Firebase email/password)
- Trip CRUD with 6-step wizard
- Day/attraction CRUD within wizard
- Photo upload to Cloud Storage (limite: 12 MB por foto)
- Admin dashboard with search + filters
- Public trip viewing
- Identidade visual "Arquivo Pessoal" — areia envelhecida, vermelho queimado, Libre Baskerville + Azeret Mono (light + dark modes)
- Responsive design (mobile-first CSS)
- Toast notifications + confirmation dialogs
- Deployed to Vercel — https://atlas-particular.vercel.app/
- Delete de viagens implementado
- Upload de galeria durante criação de atração (auto-save antes do upload)
- **Upload de vídeos por atração** (múltiplos, MP4/WebM/MOV, até 500 MB, progresso em tempo real)
- **Link do YouTube como vídeo** (alternativa ao upload direto — embed iframe 16:9, sem custo de storage)
- **Firebase API Key rotacionada** (chave antiga revogada e excluída do Google Cloud)
- **Foto de capa da atração exibe inteira** (sem corte — igual à capa de viagem)
- **`/app/test/` removido** (PR #12)
- **Dark mode toggle manual** no Header (sol/lua, localStorage) (PR #12)
- **PWA instalável** (manifest, service worker, ícones reais, offline fallback) (PR #14)
- **Responsividade mobile corrigida** — hamburger menu no header/admin-nav, step indicators com scroll horizontal (PR #15)
- **Automação Claude Code** (PR #16): hooks de typecheck/lint + proteção de arquivo sensível, skills `/migrar-schema-firestore` e `/novo-componente`, subagent `testador-golden-path`, MCP `context7` (instalado só localmente nesta máquina — não compartilhado via `.mcp.json`)

⚠️ **Known Issues**:
- No pagination on large trip lists (could be slow 100+ trips)
- Branches locais antigas (`chore/skills-de-deploy`, `chore/verify-skill-e-regra-claude`, `design/arquivo-pessoal`, `fix/hero-foto-inteira`, `fix/layout-e-videos`, `fix/photo-upload-filelist`, `fix/storage-rules-videos`) ainda não verificadas quanto a estarem mescladas — não deletar sem antes conferir `git diff origin/main..<branch> --stat`

### Immediate Next Steps

1. Verificar e limpar as branches locais antigas listadas acima
2. **Test the golden paths** on production Vercel URL (usar o subagent `testador-golden-path` ou testar manualmente)

### Future Considerations

- **Pagination**: If trip count grows, add pagination to dashboard
- **Analytics**: Track user behavior (trips published, days edited, etc.)
- **Sharing**: Generate shareable links with expiry
- **Comments**: Allow public comments on trips (guestbook)
- **context7 MCP compartilhado com o time**: hoje é config local; se quiser compartilhar, adicionar via `.mcp.json` no repo

---

## 13. Segurança — Rotação da Firebase API Key (✅ CONCLUÍDA em 2026-05-21)

### Contexto

O GitHub enviou alerta de segurança: a chave de API do Firebase estava exposta no arquivo `add_env.sh`, que foi commitado por engano.

**O que foi feito:**
- `add_env.sh` removido do repositório (commit `c6e9bd0`) e adicionado ao `.gitignore`
- Nova chave gerada no Google Cloud Console em 2026-05-21
- Chave antiga (`AIzaSyALm1hc4e61BPKo2jRtAEt1e8VwDsr0XS4`) **excluída do Google Cloud**
- `.env.local` atualizado com a nova chave
- Variável `NEXT_PUBLIC_FIREBASE_API_KEY` atualizada na Vercel + redeploy confirmado
- App verificado em produção — login funcionando com a nova chave

**Tudo concluído.** Alerta no GitHub dismissado com motivo "Revoked" em 2026-05-21.

---

## How to Use This File

- **Before coding**: Read sections 6–8 (conventions, workflow, anti-patterns)
- **During coding**: Refer to section 4 (golden paths) to avoid regressions
- **After coding**: Use section 9 (discipline) checklist before committing
- **When stuck**: Check section 8 (what not to do) — your issue might be listed
- **Onboarding new person**: Read this → read the codebase → implement first task under review

---

**Last updated**: 2026-07-09 (automação Claude Code: hooks, skills, subagent, context7; correção de estado atual desatualizado)  
**Maintained by**: Tiago + Team  
**Review frequency**: Update when patterns emerge or bugs are attributed to missing guidance
