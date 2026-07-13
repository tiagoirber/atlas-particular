# Design: Melhoria de UX da página pública de visualização de viagem

**Data**: 2026-07-13
**Arquivo principal**: `app/trips/[id]/page.tsx` + `app/trips/[id]/trip-viewer.module.css`

## Contexto e objetivo

A página pública de viagem (`/trips/[id]`) é o principal ponto de contato de terceiros com o app — o link é compartilhado e usado como referência/portfólio. O uso é majoritariamente **mobile** (link aberto via WhatsApp/Instagram). O objetivo é tornar a primeira visita mais agradável e a navegação mais fácil, sem alterar o modelo de dados ou as regras de acesso (Firestore rules seguem intocadas — viagem só é pública se `status === "published" && isPublic === true`).

Prioridades definidas com o usuário: primeira impressão/carregamento, navegação entre dias, compartilhamento, ergonomia mobile dos controles.

## 1. Estado de carregamento (skeleton)

Hoje: `<main>Carregando…</main>` — texto solto sem estrutura visual.

Trocar por um skeleton screen que reproduz o layout final (hero + título + linhas de texto + grid de cards), usando blocos com `background: var(--bg-secondary)` e a animação `pulse` já existente em `app/globals.css`. Objetivo: a página nunca parece "quebrada" durante o carregamento inicial.

## 2. Hero + botão Compartilhar

- **Crop do hero**: trocar `.heroImg` de `object-fit: contain` (max-width/max-height + fundo preto) para `object-fit: cover`, preenchendo 100% da área do hero sem letterboxing. Aplica-se em todos os tamanhos de tela (decisão do usuário: cover sempre, não híbrido).
- **Botão "Compartilhar"**: posicionado sobre o hero (canto superior direito, sobre o `.heroOverlay`), com fundo semi-transparente/blur para contraste sobre qualquer foto.
  - Comportamento: se `navigator.share` existir (checar via `"share" in navigator` por causa do strict mode), chama `navigator.share({ title: trip.title, url: location.href })` — abre o menu nativo do SO.
  - Fallback (desktop / API ausente): `navigator.clipboard.writeText(location.href)` + toast de sucesso ("Link copiado!"), reaproveitando `useToast` + `ToastsContainer` de `components/toast.tsx` (mesmo padrão já usado em outras partes do admin).

## 3. Navegação sticky por dias (scrollspy)

- Barra de pills (`Dia 1 · Dia 2 · Dia 3...`) inserida no topo da seção "Roteiro", logo acima da timeline.
- `position: sticky`, com `top` ajustado para grudar logo abaixo do `PublicHeader` (que já é sticky, `top: 0`, `z-index: 100`) — offset a calibrar visualmente durante implementação (aprox. altura do header).
- Só renderiza se `days.length >= 2` (evita ruído em viagens de 1 dia só).
- Scrollspy: um `IntersectionObserver` observa cada `.dayBlock`; a pill do dia mais visível recebe estado "ativo" (destaque visual).
- Clique na pill: `scrollIntoView({ behavior: "smooth" })` até o bloco do dia correspondente.

## 4. Controles simplificados (busca + tipo)

- **Remove o `<select>` de filtro por dia** (`dayFilter`) — a navegação por pills (item 3) cobre esse caso de uso ("ir para o dia X"), então o filtro fica redundante e a UI tem um controle a menos.
- Mantém: busca por texto (`searchTerm`) + filtro por tipo de atração (`typeFilter`).
- `visible`/`byDay` deixam de filtrar por `dayFilter`; a listagem por dia volta a sempre mostrar todos os dias (sem esconder dias via filtro — só via scroll/pill).
- Ajuste de ergonomia mobile: inputs/selects com `min-height` maior (~44px, alvo de toque adequado) e empilhamento full-width abaixo de um breakpoint, em vez do wrap apertado atual.

## Fora de escopo

- Sem mudança no modelo de dados do Firestore (seção 5.4 do CLAUDE.md — área intocável).
- Sem mudança nas regras do Firestore (seção 5.1 — área intocável).
- Sem paginação (item já listado como "Known Issue" separado no CLAUDE.md, não faz parte deste esforço).
- Página de atração individual (`app/trips/[id]/attractions/[attractionId]/page.tsx`) não faz parte deste design.

## Verificação (sem suíte automatizada — convenção do projeto)

1. `npm run dev`, abrir uma viagem publicada com 3+ dias e várias atrações.
2. Testar em viewport mobile (DevTools): skeleton durante throttle de rede, hero sem barras pretas, pills sticky + scrollspy destacando o dia correto, busca/filtro de tipo funcionando, botão compartilhar (testar fallback de clipboard no desktop).
3. Confirmar que viagem não-pública continua bloqueada para não-admin (regra de `canView` inalterada).
4. `npm run typecheck && npm run lint` — ambos devem passar.
5. Teste manual do golden path 4.7 (CLAUDE.md) completo antes de considerar pronto.
