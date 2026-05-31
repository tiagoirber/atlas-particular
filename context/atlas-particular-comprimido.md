# Atlas Particular
> Comprimido em: 2026-05-31 | Sessão: typecheck/lint validados, foto de capa da atração corrigida, limite de foto aumentado para 12 MB, deploy via API GitHub

## Objetivo do projeto
App de diário de viagens privado. Usuários registram viagens, documentam dias com fotos/vídeos e publicam uma página pública da viagem.

## Stack e configurações
- **Frontend**: Next.js 14.2.13, React 18.3.1, TypeScript 5 (strict)
- **Styling**: CSS Modules + identidade visual "Arquivo Pessoal" (areia envelhecida `#f5f0e8`, vermelho queimado, Libre Baskerville + Azeret Mono)
- **Backend**: Firebase (Auth email/password, Firestore, Cloud Storage)
- **Deploy**: Vercel — https://atlas-particular.vercel.app/ (auto-deploy no merge em `main`)
- **Repo**: `tiagoirber/atlas-particular` (main protegida — sempre via PR)
- **Node.js**: em `C:\Program Files\nodejs` (não está no PATH padrão do PowerShell — adicionar manualmente)
- **Deploy via API**: usar Windows Credential Manager para token + `Invoke-RestMethod` com JSON como string literal (não `ConvertTo-Json` com corpo complexo)

## Estrutura de arquivos relevante
```
types/
  attraction.ts     — AttractionBase com photos: Photo[] e videos: Video[]
  photo.ts          — interface Photo
  video.ts          — interface Video (criado nesta sprint)
utils/
  validators.ts     — validateImageFile (max 12MB), validateVideoFile (max 500MB)
lib/
  storage-service.ts     — upload com uploadBytesResumable para vídeos
  attractions-service.ts — CRUD + setAttractionPhotos + setAttractionVideos
components/
  attractions/attractions-manager.tsx  — formulário com seção de vídeos
  photos/photo-uploader.tsx
  photos/photo-gallery.tsx
  photos/video-uploader.tsx    — novo, progresso em tempo real
  photos/video-gallery.tsx     — novo, player <video controls>
  photos/video-gallery.module.css — novo
app/
  trips/[id]/attractions/[attractionId]/page.tsx         — página pública da atração
  trips/[id]/attractions/[attractionId]/attraction-viewer.module.css — hero flex+auto (sem corte)
  globals.css        — CSS vars identidade visual Arquivo Pessoal
```

## Decisões tomadas
- **Foto de capa da atração**: usar `display: flex + width/height: auto + max-height: 90vh` (igual à capa de viagem) — NÃO usar `object-fit: cover` (corta a imagem)
- **Upload de vídeos**: por atração, múltiplos, via `uploadBytesResumable` com callback de progresso
- **Limite de foto**: 12 MB (era 8 MB) — definido em `utils/validators.ts`
- **Deploy**: nunca push direto em main; criar branch → PR → merge via API GitHub
- **JSON para API GitHub**: construir como string literal — `ConvertTo-Json` causa erro de parsing na API
- **Token GitHub**: armazenado no Windows Credential Manager, lido via `CMDeploy` (classe C# inline com `CredRead`)
- **Node.js no PowerShell**: adicionar `$env:PATH = "C:\Program Files\nodejs;" + $env:PATH` antes de rodar npm

## Regras e restrições
- Nunca push direto em `main`
- CSS Modules: sem seletores HTML bare, sempre classes
- Cores sempre via `var(--nome)` — nunca hardcode (exceto `#000` em background de hero)
- `createdAt` pode ser `string | Date | Timestamp` — usar `toDate()?.getTime() ?? 0`
- Não usar `.toMillis()` diretamente
- `AttractionFormData`: `photos?` e `videos?` são opcionais; `AttractionBase` exige ambos como arrays
- Documentos antigos do Firestore sem campo `videos` → tratar com `att.videos || []`

## Estado atual
- ✅ Auth, CRUD de viagens/dias/atrações, upload de fotos e vídeos por atração
- ✅ Identidade visual Arquivo Pessoal aplicada em todo o app
- ✅ Firebase API Key rotacionada e confirmada em produção
- ✅ Foto de capa da atração exibe inteira (PR #9 mergeado)
- ✅ Limite de upload de fotos: 12 MB (PR #10 mergeado)
- ✅ Typecheck e lint passando sem erros
- ✅ App em produção: https://atlas-particular.vercel.app/

## Pendências
1. Deletar `/app/test/` (página temporária de testes)
2. Testar golden paths na URL de produção após os últimos deploys
3. Dark mode toggle UI (atualmente só por preferência do sistema)
4. Paginação no dashboard (sem urgência, para quando houver 100+ viagens)
