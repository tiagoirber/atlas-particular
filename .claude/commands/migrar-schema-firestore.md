---
description: Guia mudanças seguras no schema do Firestore (trips/atrações/dias) com migração, compatibilidade retroativa e aviso ao outro dev
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
---

# Migrar schema do Firestore — checklist obrigatório

O modelo de dados do Firestore (`trips/{tripId}`, dias, atrações) é uma área intocável (seção 5.4 do CLAUDE.md): páginas públicas dependem dos nomes exatos dos campos, e documentos antigos podem não ter os campos novos. Nunca mude o schema "no braço" — siga os passos abaixo.

## Passo 1 — Mapear o impacto

Antes de tocar em qualquer campo:
- Liste todos os arquivos que leem/escrevem o campo afetado (`grep` por `trip.`, `att.`, ou o nome do campo em `lib/`, `components/`, `app/`)
- Identifique toda página pública (`app/(public)/`, `app/trips/[id]/`) que depende do campo
- Confirme se o campo é opcional ou obrigatório no tipo TypeScript correspondente (`types/`)

## Passo 2 — Definir a estratégia de compatibilidade

Documentos antigos no Firestore não serão retroativamente atualizados a menos que você rode um backfill. Escolha uma:
- **Campo novo opcional**: tipar como `campo?: T` e tratar ausência com `?.` / `??` no código de leitura (padrão já usado no projeto, ex: `att.videos || []`)
- **Backfill real**: escrever um script one-off que itera os documentos existentes e preenche o campo novo com um valor padrão

Nunca assuma que todo documento já tem o campo novo.

## Passo 3 — Escrever a migração (se houver backfill)

- Script separado, não misturado com código de produção
- Roda contra o Firestore real (staging se existir, senão produção com cuidado)
- Idempotente — pode rodar mais de uma vez sem duplicar/corromper dados
- Reportar quantos documentos foram afetados

## Passo 4 — Atualizar os tipos e os helpers CRUD

- Atualize a interface em `types/`
- Atualize as funções em `lib/firestore.ts` / `lib/attractions-service.ts` (nunca mutar docs diretamente)
- Rode `npm run typecheck` — ele vai apontar todo lugar que ainda não trata o campo novo

## Passo 5 — Testar golden paths afetados

Rode manualmente (seção 4 do CLAUDE.md) qualquer golden path que toque no campo mudado: criação/edição de viagem, CRUD de dia/atração, página pública.

## Passo 6 — Avisar o outro dev

Antes de mergear: descreva na PR (seção 11 do CLAUDE.md)
- Qual campo mudou e por quê
- Se rodou backfill em produção (e quando)
- O que o outro dev precisa saber antes de puxar a branch

## Regra de ouro

Se não conseguir garantir compatibilidade com documentos antigos, **pare e pergunte ao usuário** antes de prosseguir — não é uma decisão para tomar sozinho.
