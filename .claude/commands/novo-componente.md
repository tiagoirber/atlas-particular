---
description: Cria um novo componente React seguindo as convenções do projeto (PascalCase + CSS Module kebab-case + props tipadas)
allowed-tools: Write, Read, Glob
---

# Novo componente

Recebe o nome do componente e a pasta de destino (ex.: `components/trips/`) e gera o par de arquivos seguindo a convenção da seção 6 do CLAUDE.md.

## Passo 1 — Perguntar o que falta

Se o usuário não especificou, pergunte:
- Nome do componente (PascalCase, ex.: `TripBadge`)
- Pasta de destino (ex.: `components/trips/`)
- É interativo (precisa de `"use client"`) ou puramente apresentacional?
- Recebe props? Quais e de que tipo?

## Passo 2 — Verificar se já existe

Use Glob para confirmar que não existe um componente com nome igual ou muito parecido na pasta de destino antes de criar.

## Passo 3 — Gerar o arquivo do componente

Arquivo: `<pasta>/<kebab-case-do-nome>.tsx`

```tsx
'use client'; // apenas se for interativo — remover se for puramente apresentacional

import styles from './<kebab-case-do-nome>.module.css';

interface <NomeComponente>Props {
  // props tipadas explicitamente
}

export function <NomeComponente>({ }: <NomeComponente>Props) {
  return (
    <div className={styles.container}>
      {/* conteúdo */}
    </div>
  );
}
```

## Passo 4 — Gerar o CSS Module

Arquivo: `<pasta>/<kebab-case-do-nome>.module.css`

```css
.container {
  /* usar sempre var(--nome) para cores — nunca hardcode */
}
```

Regras obrigatórias (seção 6 e 8 do CLAUDE.md):
- Nunca usar seletor HTML bare (`fieldset { }`) — sempre uma classe
- Cores sempre via `var(--accent)`, `var(--bg-primary)` etc.

## Passo 5 — Confirmar

Reporte os dois arquivos criados e pergunte se o componente deve ser importado em algum lugar específico agora.
