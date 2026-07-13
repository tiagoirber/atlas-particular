# Trip Viewer UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar a usabilidade da página pública de visualização de viagem (`/trips/[id]`) — carregamento, hero, navegação entre dias e compartilhamento — conforme `docs/superpowers/specs/2026-07-13-trip-viewer-ux-design.md`.

**Architecture:** Duas peças novas e isoladas (`ShareButton`, `DayNav`) em `components/trips/`, cada uma com seu próprio CSS Module; o resto é edição direta de `app/trips/[id]/page.tsx` e `app/trips/[id]/trip-viewer.module.css`. Nenhuma mudança de schema, de regra do Firestore, ou de rota.

**Tech Stack:** Next.js 14 (App Router, `"use client"`), React 18, TypeScript strict, CSS Modules, Web Share API + Clipboard API, `IntersectionObserver`.

## Global Constraints

- Este projeto **não tem suíte de testes automatizada** (CLAUDE.md seção 2) — cada tarefa abaixo substitui "escrever teste failing → implementar → rodar teste" por "implementar → `npm run typecheck && npm run lint` → verificar manualmente no navegador (`npm run dev`)". Isso é intencional, não uma lacuna do plano.
- TypeScript strict mode sempre; sem `any`.
- Cores só via `var(--...)` de `app/globals.css` — nunca hardcode (CLAUDE.md seção 8.3).
- `"use client"` no topo de todo arquivo com interatividade (CLAUDE.md seção 6).
- Nome de arquivo casa com nome do componente; CSS Module em kebab-case importado como camelCase (CLAUDE.md seção 6).
- Não alterar `firestore.rules`, o modelo de dados de `trips/{tripId}`, nem a lógica de `canView` em `page.tsx` (áreas intocáveis, CLAUDE.md seção 5).

---

### Task 1: Hero preenche sem barras pretas (crop to cover)

**Files:**
- Modify: `app/trips/[id]/trip-viewer.module.css:15-40`

**Interfaces:**
- Não produz nem consome nada de outras tasks — mudança de CSS pura, isolada.

- [ ] **Step 1: Editar as classes `.hero`, `.heroImg` e `.heroPlaceholder`**

Substituir (linhas 15–40 de `trip-viewer.module.css`):

```css
.hero {
  position: relative;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.heroImg {
  display: block;
  max-width: 100%;
  max-height: 90vh;
  width: auto;
  height: auto;
}

.heroPlaceholder {
  min-height: 380px;
  height: 60vh;
  max-height: 640px;
  width: 100%;
  background: var(--bg-secondary);
}
```

por:

```css
.hero {
  position: relative;
  width: 100%;
  height: 60vh;
  min-height: 380px;
  max-height: 640px;
  overflow: hidden;
  background: var(--bg-secondary);
}

.heroImg {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.heroPlaceholder {
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
}
```

- [ ] **Step 2: Verificar visualmente**

Rodar `npm run dev`, abrir uma viagem publicada que tenha foto de capa **vertical** (retrato). Confirmar que a imagem preenche o hero inteiro, sem faixas pretas nas laterais, e sem esticar/distorcer (crop, não stretch).

- [ ] **Step 3: Typecheck + lint**

```bash
npm run typecheck
npm run lint
```

Esperado: ambos sem erros (mudança é só CSS, não deve haver impacto).

- [ ] **Step 4: Commit**

```bash
git add "app/trips/[id]/trip-viewer.module.css"
git commit -m "fix: hero da viagem publicada preenche sem letterbox (object-fit cover)"
```

---

### Task 2: Estado de carregamento com skeleton

**Files:**
- Modify: `app/trips/[id]/page.tsx:89-96` (bloco de loading)
- Modify: `app/trips/[id]/trip-viewer.module.css` (adicionar classes de skeleton ao final do arquivo)

**Interfaces:**
- Não depende de nenhuma outra task. Produz o componente local `TripViewerSkeleton` (função dentro de `page.tsx`, mesmo padrão de `AttractionCard` já existente no arquivo) — não é exportado, só usado neste arquivo.

- [ ] **Step 1: Adicionar classes de skeleton ao CSS**

Ao final de `app/trips/[id]/trip-viewer.module.css`, adicionar:

```css
.skeletonHero {
  width: 100%;
  height: 60vh;
  min-height: 380px;
  max-height: 640px;
  background: var(--bg-secondary);
  animation: pulse 1.6s ease-in-out infinite;
}

.skeletonSection {
  max-width: 880px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeletonLine {
  height: 1rem;
  border-radius: 6px;
  background: var(--bg-secondary);
  animation: pulse 1.6s ease-in-out infinite;
}

.skeletonLine.wide {
  width: 70%;
  height: 1.75rem;
}

.skeletonLine.short {
  width: 40%;
}
```

`pulse` já existe em `app/globals.css:229-232` (`opacity: 1` ↔ `opacity: 0.5`) — não precisa ser recriado.

- [ ] **Step 2: Substituir o bloco de loading em `page.tsx`**

Em `app/trips/[id]/page.tsx`, substituir (linhas 89–96):

```typescript
  if (loading) {
    return (
      <>
        <PublicHeader />
        <main className={styles.main}>Carregando…</main>
      </>
    );
  }
```

por:

```typescript
  if (loading) {
    return (
      <>
        <PublicHeader />
        <TripViewerSkeleton />
      </>
    );
  }
```

- [ ] **Step 3: Adicionar o componente `TripViewerSkeleton`**

No final de `app/trips/[id]/page.tsx` (depois da função `AttractionCard`, que termina na última linha do arquivo), adicionar:

```typescript
function TripViewerSkeleton() {
  return (
    <div className={styles.skeletonHero}>
      <div className={styles.skeletonSection}>
        <div className={`${styles.skeletonLine} ${styles.wide}`} />
        <div className={`${styles.skeletonLine} ${styles.short}`} />
      </div>
    </div>
  );
}
```

Nota: este skeleton mostra só o hero + duas linhas (título/meta) — suficiente para não parecer quebrado no primeiro instante, sem tentar replicar o layout inteiro (YAGNI).

- [ ] **Step 4: Verificar visualmente com rede lenta**

Rodar `npm run dev`. No Chrome DevTools, aba Network, marcar throttling "Slow 3G". Abrir uma viagem publicada e confirmar que aparece o skeleton pulsante (não o texto "Carregando…") enquanto os dados carregam.

- [ ] **Step 5: Typecheck + lint**

```bash
npm run typecheck
npm run lint
```

Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add "app/trips/[id]/page.tsx" "app/trips/[id]/trip-viewer.module.css"
git commit -m "feat: skeleton de carregamento na página de visualização de viagem"
```

---

### Task 3: Botão de compartilhar

**Files:**
- Create: `components/trips/share-button.tsx`
- Create: `components/trips/share-button.module.css`
- Modify: `app/trips/[id]/page.tsx` (imports, hero JSX, toast state)
- Modify: `app/trips/[id]/trip-viewer.module.css` (classe `.heroActions`)

**Interfaces:**
- Produz: `ShareButton` — `components/trips/share-button.tsx`, props `{ title: string; onCopied: () => void }`, exportado como named export `ShareButton`.
- Consome (em `page.tsx`): `useToast` e `ToastsContainer` de `components/toast.tsx` (já existentes — `useToast()` retorna `{ toasts, addToast, removeToast }`; `addToast(message: string, type?: "success"|"error"|"info", duration?: number)`).

- [ ] **Step 1: Criar `components/trips/share-button.module.css`**

```css
.shareBtn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  min-height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease;
}

.shareBtn:hover {
  background: rgba(0, 0, 0, 0.5);
}

.shareBtn:disabled {
  opacity: 0.6;
  cursor: default;
}
```

- [ ] **Step 2: Criar `components/trips/share-button.tsx`**

```typescript
"use client";

import { useState } from "react";
import styles from "./share-button.module.css";

interface ShareButtonProps {
  title: string;
  onCopied: () => void;
}

export function ShareButton({ title, onCopied }: ShareButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
    } finally {
      setBusy(false);
    }
    await navigator.clipboard.writeText(url);
    onCopied();
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={styles.shareBtn}
      aria-label="Compartilhar viagem"
      disabled={busy}
    >
      <span aria-hidden="true">⤴</span> Compartilhar
    </button>
  );
}
```

- [ ] **Step 3: Adicionar `.heroActions` ao CSS da página**

Em `app/trips/[id]/trip-viewer.module.css`, logo após a classe `.hero` (a que foi editada na Task 1), adicionar:

```css
.heroActions {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 2;
}
```

- [ ] **Step 4: Importar `ShareButton`, `useToast` e `ToastsContainer` em `page.tsx`**

No topo de `app/trips/[id]/page.tsx`, adicionar aos imports existentes:

```typescript
import { ShareButton } from "@/components/trips/share-button";
import { useToast, ToastsContainer } from "@/components/toast";
```

- [ ] **Step 5: Adicionar o hook de toast no componente**

Dentro de `TripViewerPage`, logo abaixo da linha `const { user, isAdmin } = useAuth();`, adicionar:

```typescript
  const { toasts, addToast, removeToast } = useToast();
```

- [ ] **Step 6: Renderizar `ShareButton` sobre o hero e `ToastsContainer` no fim da árvore**

No JSX de `page.tsx`, dentro de `<header className={styles.hero}>`, logo depois do bloco `{trip.coverImageUrl ? (...) : (...)}` e antes de `<div className={styles.heroOverlay}>`, adicionar:

```jsx
          <div className={styles.heroActions}>
            <ShareButton
              title={trip.title}
              onCopied={() => addToast("Link copiado!", "success")}
            />
          </div>
```

E logo antes do fechamento de `</article>` no final do JSX, adicionar:

```jsx
        <ToastsContainer toasts={toasts} onClose={removeToast} />
```

- [ ] **Step 7: Verificar manualmente**

Rodar `npm run dev`. Em uma viagem publicada:
- No DevTools em modo mobile (ou celular real): clicar em "Compartilhar" deve abrir o menu nativo de compartilhamento do sistema.
- No desktop (Chrome sem suporte a `navigator.share` em `http://localhost`, ou forçando via DevTools): clicar deve copiar o link e mostrar o toast "Link copiado!" — colar em algum lugar para confirmar que é a URL correta.

- [ ] **Step 8: Typecheck + lint**

```bash
npm run typecheck
npm run lint
```

Esperado: sem erros. Se o TypeScript reclamar que `navigator.share` não existe no tipo `Navigator`, adicionar a checagem `"share" in navigator` no lugar de `if (navigator.share)` no Step 2 e ajustar a chamada com `(navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share(...)` — só fazer isso se o typecheck realmente falhar.

- [ ] **Step 9: Commit**

```bash
git add components/trips/share-button.tsx components/trips/share-button.module.css "app/trips/[id]/page.tsx" "app/trips/[id]/trip-viewer.module.css"
git commit -m "feat: botão de compartilhar na página de visualização de viagem"
```

---

### Task 4: Navegação sticky por dias (scrollspy)

**Files:**
- Create: `components/trips/day-nav.tsx`
- Create: `components/trips/day-nav.module.css`
- Modify: `app/trips/[id]/page.tsx` (imports, `id` nos blocos de dia, renderização do `DayNav`)

**Interfaces:**
- Produz: `DayNav` — `components/trips/day-nav.tsx`, named export, props `{ items: DayNavItem[] }` onde `DayNavItem = { id: string; label: string }`. Também exporta o tipo `DayNavItem`.
- Consome: espera que, no momento em que seu `useEffect` rodar, já existam elementos no DOM com `id` igual a cada `item.id` (produzido por `page.tsx` nesta mesma task, via `id={day.id}` no `<li>` de cada bloco de dia).

- [ ] **Step 1: Criar `components/trips/day-nav.module.css`**

```css
.dayNav {
  position: sticky;
  top: 64px;
  z-index: 50;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.75rem 0;
  margin-bottom: 1.5rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  scrollbar-width: none;
}

.dayNav::-webkit-scrollbar {
  display: none;
}

.pill {
  flex: 0 0 auto;
  padding: 0.5rem 1rem;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--clay-soft);
  color: var(--text-primary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.pill:hover {
  background: var(--bg-hover);
}

.active {
  background: var(--accent);
  color: white;
}
```

- [ ] **Step 2: Criar `components/trips/day-nav.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import styles from "./day-nav.module.css";

export interface DayNavItem {
  id: string;
  label: string;
}

interface DayNavProps {
  items: DayNavItem[];
}

export function DayNav({ items }: DayNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length < 2) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav className={styles.dayNav} aria-label="Navegação entre dias">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={item.id === activeId ? `${styles.pill} ${styles.active}` : styles.pill}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Importar `DayNav` em `page.tsx`**

Adicionar aos imports:

```typescript
import { DayNav, type DayNavItem } from "@/components/trips/day-nav";
```

- [ ] **Step 4: Montar a lista de itens do nav**

Dentro de `TripViewerPage`, logo abaixo do `const usedTypes = ...` (linha 125), adicionar:

```typescript
  const dayNavItems: DayNavItem[] = days.map((d) => ({
    id: d.id,
    label: `Dia ${d.order + 1}`,
  }));
```

- [ ] **Step 5: Renderizar `<DayNav>` e adicionar `id` aos blocos de dia**

No JSX, dentro da seção "Roteiro", logo depois do fechamento de `</div>` dos `.controls` (depois do último `<select>`) e antes do bloco `{days.length === 0 && attractions.length === 0 ? (...)}`, adicionar:

```jsx
          <DayNav items={dayNavItems} />
```

E no `<li key={day.id} className={styles.dayBlock}>` (dentro do `.map((day) => ...)` da timeline), adicionar o atributo `id`:

```jsx
                  <li key={day.id} id={day.id} className={styles.dayBlock}>
```

- [ ] **Step 6: Verificar manualmente**

Rodar `npm run dev`. Abrir uma viagem publicada com 3+ dias:
- Confirmar que a barra de pills aparece logo acima da timeline, gruda (sticky) ao rolar, e some quando a "Roteiro" section termina.
- Rolar manualmente pela página e confirmar que a pill do dia visível fica destacada (fundo `--accent`).
- Clicar em uma pill de um dia mais abaixo e confirmar que rola suavemente até o bloco correto.
- Abrir uma viagem de 1 dia só e confirmar que a barra **não aparece**.

- [ ] **Step 7: Typecheck + lint**

```bash
npm run typecheck
npm run lint
```

Esperado: sem erros.

- [ ] **Step 8: Commit**

```bash
git add components/trips/day-nav.tsx components/trips/day-nav.module.css "app/trips/[id]/page.tsx"
git commit -m "feat: navegação sticky entre dias com scrollspy na página de viagem"
```

---

### Task 5: Simplificar filtros e melhorar ergonomia mobile

**Files:**
- Modify: `app/trips/[id]/page.tsx` (remover `dayFilter`)
- Modify: `app/trips/[id]/trip-viewer.module.css` (`.controls`, `.search`, `.select`)

**Interfaces:**
- Depende da Task 4 já estar aplicada (o `<select>` de dia está sendo removido porque `DayNav` já cobre a navegação por dia).
- Não produz nada consumido por outra task.

- [ ] **Step 1: Remover o estado `dayFilter`**

Em `app/trips/[id]/page.tsx`, remover a linha:

```typescript
  const [dayFilter, setDayFilter] = useState("");
```

- [ ] **Step 2: Remover o filtro de dia da função `visible`**

Substituir:

```typescript
  const visible = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return attractions.filter((a) => {
      if (dayFilter && a.dayId !== dayFilter) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (!term) return true;
      return (
        a.title?.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term) ||
        a.locationName?.toLowerCase().includes(term) ||
        a.notes?.toLowerCase().includes(term)
      );
    });
  }, [attractions, searchTerm, dayFilter, typeFilter]);
```

por:

```typescript
  const visible = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return attractions.filter((a) => {
      if (typeFilter && a.type !== typeFilter) return false;
      if (!term) return true;
      return (
        a.title?.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term) ||
        a.locationName?.toLowerCase().includes(term) ||
        a.notes?.toLowerCase().includes(term)
      );
    });
  }, [attractions, searchTerm, typeFilter]);
```

- [ ] **Step 3: Remover o `<select>` de dia e o `if (dayFilter...)` do render da timeline**

Remover do JSX o bloco:

```jsx
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos os dias</option>
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  Dia {d.order + 1} · {d.title || formatLongDate(d.date)}
                </option>
              ))}
            </select>
```

E, no `.map((day) => ...)` da timeline, remover a linha:

```jsx
                if (dayFilter && day.id !== dayFilter) return null;
```

E no bloco `{(byDay.get("__none__") || []).length > 0 && !dayFilter && (`, trocar por:

```jsx
              {(byDay.get("__none__") || []).length > 0 && (
```

- [ ] **Step 4: Ajustar CSS de `.controls`, `.search`, `.select` para mobile**

Em `app/trips/[id]/trip-viewer.module.css`, substituir:

```css
.search,
.select {
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  border: none;
  background: var(--clay-soft);
  color: var(--text-primary);
  font-size: 0.93rem;
  font-family: inherit;
  transition: all 0.2s ease;
}
```

por:

```css
.search,
.select {
  padding: 0.75rem 0.9rem;
  min-height: 44px;
  border-radius: 10px;
  border: none;
  background: var(--clay-soft);
  color: var(--text-primary);
  font-size: 0.93rem;
  font-family: inherit;
  transition: all 0.2s ease;
}

@media (max-width: 480px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search,
  .select {
    width: 100%;
  }
}
```

- [ ] **Step 5: Verificar que o `formatLongDate` ainda é usado**

Depois de remover o `<select>` de dia (que usava `formatLongDate(d.date)`), checar se `formatLongDate` continua sendo usado em outro lugar de `page.tsx` (é usado em `.dayDate` — linha ~272). Se o ESLint acusar import não utilizado, é sinal de que essa checagem falhou — não deveria acontecer, mas confirmar no lint do Step 7.

- [ ] **Step 6: Verificar manualmente**

Rodar `npm run dev`. Confirmar:
- O dropdown de dia sumiu; restam busca + filtro de tipo.
- Buscar um termo continua funcionando (título/descrição/local/notas).
- Filtrar por tipo continua funcionando.
- Em viewport mobile (~375px), os controles empilham em coluna cheia, sem aperto.
- Uma viagem com atrações "sem dia" (`dayId` vazio) continua aparecendo na seção "Sem dia".

- [ ] **Step 7: Typecheck + lint**

```bash
npm run typecheck
npm run lint
```

Esperado: sem erros, sem imports não utilizados.

- [ ] **Step 8: Commit**

```bash
git add "app/trips/[id]/page.tsx" "app/trips/[id]/trip-viewer.module.css"
git commit -m "refactor: remove filtro de dia redundante e melhora ergonomia mobile dos controles"
```

---

## Verificação final (golden path 4.7 completo)

Depois das 5 tasks, rodar uma vez o fluxo completo do golden path "Página Pública de Viagem" (CLAUDE.md seção 4.7): abrir `/viagens`, entrar numa viagem publicada, conferir hero, roteiro, navegação por dias, compartilhar, e confirmar que uma viagem **não publicada** continua bloqueada para quem não é admin.
