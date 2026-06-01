# Atlas Particular
> Comprimido em: 2026-05-31 | Sessão: suporte a link do YouTube como alternativa ao upload direto de vídeos por atração

## Objetivo do projeto
App de diário de viagens privado. Usuários registram viagens, documentam dias com fotos/vídeos e publicam uma página pública da viagem.

## Stack e configurações
- **Frontend**: Next.js 14.2.13, React 18.3.1, TypeScript 5 (strict)
- **Styling**: CSS Modules + identidade visual "Arquivo Pessoal" (areia envelhecida `#f5f0e8`, vermelho queimado, Libre Baskerville + Azeret Mono)
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
  photos/photo-uploader.tsx             — upload de imagens (aceita JPEG/PNG/WEBP)
  photos/photo-uploader.module.css
  photos/photo-gallery.tsx
  photos/video-uploader.tsx             — upload de arquivo + input de link YouTube
  photos/video-uploader.module.css      — CSS próprio (não depende do photo-uploader.module.css)
  photos/video-gallery.tsx              — <video> para upload direto, <iframe> para YouTube
  photos/video-gallery.module.css       — iframeWrapper 16:9 via padding-bottom: 56.25%

app/
  trips/[id]/attractions/[attractionId]/page.tsx          — página pública da atração
  trips/[id]/attractions/[attractionId]/attraction-viewer.module.css — hero flex+auto (sem corte)
  trips/[id]/trip-viewer.module.css
  globals.css       — CSS vars identidade visual Arquivo Pessoal
  (public)/viagens/ — página de listagem pública
  admin/dashboard/  — painel admin
```

## Decisões tomadas
- **Vídeos YouTube**: campo `youtubeId` no tipo `Video`; `url` e `storagePath` ficam vazios; remoção e edição de legenda identificam pelo `youtubeId` quando presente, pelo `storagePath` caso contrário
- **Embed YouTube**: `https://www.youtube.com/embed/{youtubeId}` em iframe 16:9 (`padding-bottom: 56.25%`)
- **Extração de ID YouTube**: regex `/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/` — aceita URLs longas, youtu.be, shorts e embed
- **Foto de capa da atração**: `display: flex + width/height: auto + max-height: 90vh` — NÃO usar `object-fit: cover` (corta a imagem)
- **Limite de foto**: 12 MB (definido em `utils/validators.ts`)
- **Deploy**: nunca push direto em main; usar skill `/deploy`; JSON para API GitHub como string literal
- **Token GitHub**: Windows Credential Manager via classe C# inline `CMDeploy`

## Regras e restrições
- Nunca push direto em `main`
- CSS Modules: sem seletores HTML bare, sempre classes
- Cores sempre via `var(--nome)` — nunca hardcode (exceto `#000` em backgrounds de hero)
- `createdAt` pode ser `string | Date | Timestamp` — usar `toDate()?.getTime() ?? 0`
- Não usar `.toMillis()` diretamente em timestamps
- `AttractionFormData`: `photos?` e `videos?` opcionais; `AttractionBase` exige ambos como arrays obrigatórios
- Documentos Firestore antigos sem campo `videos` → tratar com `att.videos || []`
- Vídeos YouTube não têm `storagePath` — não tentar deletar do Storage

## Estado atual
- ✅ Auth, CRUD de viagens/dias/atrações totalmente funcional
- ✅ Upload de fotos (12 MB) e vídeos (500 MB) por atração, com progresso
- ✅ Link do YouTube como alternativa ao upload (iframe 16:9, sem custo Firebase)
- ✅ Identidade visual Arquivo Pessoal em todo o app
- ✅ Firebase API Key rotacionada e confirmada em produção
- ✅ Foto de capa da atração exibe inteira (sem corte)
- ✅ Typecheck e lint passando sem erros
- ✅ App em produção: https://atlas-particular.vercel.app/
- ✅ PRs mergeados: #9 (foto capa), #10 (limite 12 MB), #11 (YouTube)

## Pendências
1. Deletar `/app/test/` (página temporária de testes)
2. Testar golden paths na URL de produção após os últimos deploys
3. Dark mode toggle UI (atualmente só por preferência do sistema)
4. Paginação no dashboard (sem urgência, para quando houver 100+ viagens)
