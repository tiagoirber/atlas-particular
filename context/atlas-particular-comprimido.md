# Atlas Particular
> Comprimido em: 2026-06-02 | Sessão: PWA instalável + dark mode toggle manual implementados; aguardando deploy

## Objetivo do projeto
App de diário de viagens privado. Usuários registram viagens, documentam dias com fotos/vídeos e publicam uma página pública da viagem.

## Stack e configurações
- **Frontend**: Next.js 14.2.13, React 18.3.1, TypeScript 5 (strict)
- **Styling**: CSS Modules + identidade visual "Arquivo Pessoal" (areia envelhecida, vermelho queimado, Libre Baskerville + Azeret Mono)
- **Backend**: Firebase (Auth email/password, Firestore, Cloud Storage)
- **Deploy**: Vercel — https://atlas-particular.vercel.app/ (auto-deploy no merge em `main`)
- **Repo**: `tiagoirber/atlas-particular` (main protegida — sempre via PR)
- **Node.js**: em `C:\Program Files\nodejs` (não está no PATH padrão do PowerShell — adicionar `$env:PATH = "C:\Program Files\nodejs;" + $env:PATH`)
- **Deploy via API**: usar skill `/deploy`; token via Windows Credential Manager (classe `CMDeploy` C# inline); JSON do PR como string literal — `ConvertTo-Json` causa erro de parsing na API GitHub

## Estrutura de arquivos relevante
```
types/
  video.ts          — interface Video { url, storagePath, youtubeId?, caption, order, uploadedAt }
  attraction.ts     — AttractionBase: photos: Photo[], videos: Video[]
  photo.ts          — interface Photo

utils/
  validators.ts     — validateImageFile (max 12 MB), validateVideoFile (max 500 MB)

lib/
  storage-service.ts      — uploadBytesResumable para vídeos com callback de progresso
  attractions-service.ts  — setAttractionPhotos, setAttractionVideos, deleteAttraction (limpa storage)

components/
  attractions/attractions-manager.tsx   — CRUD de atrações + handlers de vídeo (upload + YouTube)
  photos/photo-uploader.tsx / video-uploader.tsx / photo-gallery.tsx / video-gallery.tsx
  photos/video-uploader.module.css      — CSS próprio (não depende do photo-uploader.module.css)
  photos/video-gallery.module.css       — iframeWrapper 16:9 via padding-bottom: 56.25%
  pwa-register.tsx                      — registra SW + auto-reload em nova versão
  header.tsx                            — dark mode toggle (sol/lua, ThemeProvider)

app/
  trips/[id]/attractions/[attractionId]/page.tsx
  trips/[id]/attractions/[attractionId]/attraction-viewer.module.css — hero flex+auto (sem corte)
  globals.css       — CSS vars identidade visual Arquivo Pessoal

public/
  manifest.json     — PWA manifest
  sw.js             — service worker (cache-first _next/static, network-first nav)
  offline.html      — página exibida sem conexão
  icons/            — ícones PWA: 180, 192, 512, maskable-512 (icon.png 1254×1254 px, diário "AP")
```

## Decisões tomadas
- **Dark mode**: botão sol/lua no Header, persiste em localStorage, fallback para `prefers-color-scheme`
- **PWA**: manifest + service worker + ícones reais + safe areas iOS/Android + offline fallback
- **Ícone real**: `public/icons/icon.png` (1254×1254, diário de couro com monograma "AP")
- **Vídeos YouTube**: `youtubeId` no tipo `Video`; `url`/`storagePath` vazios; remoção/legenda usa `youtubeId` como chave
- **Embed YouTube**: iframe 16:9 via `padding-bottom: 56.25%`
- **Foto de capa da atração**: `display: flex + width/height: auto` — NÃO usar `object-fit: cover`
- **Limite de foto**: 12 MB em `utils/validators.ts`
- **Deploy**: skill `/deploy`; JSON para API GitHub como string literal

## Regras e restrições
- Nunca push direto em `main`
- CSS Modules: sem seletores HTML bare, sempre classes
- Cores sempre via `var(--nome)` — nunca hardcode (exceto `#000` em backgrounds de hero)
- `createdAt` pode ser `string | Date | Timestamp` — usar `toDate()?.getTime() ?? 0`
- `AttractionFormData`: `photos?` e `videos?` opcionais; `AttractionBase` exige ambos obrigatórios
- Documentos Firestore antigos sem `videos` → tratar com `att.videos || []`
- Vídeos YouTube não têm `storagePath` — não tentar deletar do Storage

## Estado atual
- ✅ Auth, CRUD de viagens/dias/atrações totalmente funcional
- ✅ Upload de fotos (12 MB) e vídeos (500 MB) por atração, com progresso
- ✅ Link do YouTube como alternativa ao upload (iframe 16:9)
- ✅ Identidade visual Arquivo Pessoal em todo o app
- ✅ Firebase API Key rotacionada e confirmada em produção
- ✅ Foto de capa da atração exibe inteira (sem corte)
- ✅ Dark mode toggle manual (sol/lua, localStorage) — implementado, não deployado
- ✅ PWA instalável (manifest, SW, ícones, offline) — implementado, não deployado
- ⚠️ Typecheck/lint não rodados na última sessão (Node.js fora do PATH)

## Pendências
1. **[URGENTE]** Rodar `npm run typecheck && npm run lint`
2. **[URGENTE]** Deploy da PWA + dark mode via `/deploy`
3. Verificar PWA no mobile após deploy (Chrome DevTools → Application → Manifest; instalar iOS/Android)
4. Paginação no dashboard (sem urgência)
