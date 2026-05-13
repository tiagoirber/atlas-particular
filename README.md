# Atlas Particular

Site privado de registro de viagens pessoais. Acervo, não rede social.

## Stack

- Next.js 14 (App Router) + TypeScript
- Firebase Authentication, Cloud Firestore, Firebase Storage
- CSS Modules (sem Tailwind)

## Setup

```bash
npm install
cp .env.local.example .env.local
# Preencher .env.local com credenciais do Firebase (ver seção abaixo)
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Edite `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ADMIN_UIDS=
```

### Onde encontrar cada valor

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e selecione/cria seu projeto.
2. Ícone de engrenagem → **Configurações do projeto** → aba **Geral**.
3. Em **Seus apps**, registre um Web App (`</>`) se ainda não houver.
4. Os 6 primeiros valores estão no objeto `firebaseConfig` exibido na configuração do app.
5. `NEXT_PUBLIC_ADMIN_UIDS`: lista separada por vírgula dos UIDs autorizados.
   - Crie um usuário em **Authentication → Users**.
   - Copie o UID dele para cá.

Você também precisa habilitar:

- **Authentication → Sign-in method → Email/Senha**.
- **Firestore Database** (qualquer região; modo de produção).
- **Storage** (qualquer região; modo de produção).

## Estrutura

```
app/
  (auth)/login          # tela de login
  (public)/             # áreas visíveis sem login
  admin/                # painel (rotas protegidas)
  trips/[tripId]        # visualização da viagem
components/
  admin/  auth/  trips/  days/  attractions/  photos/
lib/
  firebase.ts           # init
  auth-context.tsx      # provider de sessão
  auth-utils.ts         # login/admin check
  trips-service.ts      # CRUD viagens
  days-service.ts       # CRUD dias
  attractions-service.ts# CRUD atrações
  storage-service.ts    # upload + cleanup
types/
  trip.ts day.ts attraction.ts photo.ts user.ts
hooks/
  useAuth.ts useTrips.ts useDays.ts useAttractions.ts
utils/
  date.ts format.ts validators.ts
```

## Scripts

```bash
npm run dev         # ambiente local
npm run build       # build produção
npm run start       # servir build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
```

## Segurança

As `firestore.rules` e `storage.rules` são a única defesa real — a UI apenas reflete o que as regras permitem. UIDs autorizados são embutidos em ambas. Não publique este projeto sem aplicar as Rules.

## Deploy

Documentado em [Etapa 16](#etapa-16) — Firebase Hosting ou Vercel.
