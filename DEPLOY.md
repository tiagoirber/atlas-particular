# Deploy — Atlas Particular

Duas opções recomendadas. Escolha **uma**.

---

## Opção A · Vercel (recomendada)

Vercel é a forma mais simples para um app Next.js com rotas dinâmicas.

### Passos

1. Suba o projeto para um repositório Git (privado).
2. Importe em [vercel.com/new](https://vercel.com/new).
3. Em **Environment Variables**, cole todas as chaves de `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_ADMIN_UIDS`
4. Deploy → URL pronta.

### Domínio do Auth

No console Firebase → Authentication → Settings → **Authorized domains**, adicione o domínio que a Vercel gerar (`*.vercel.app` ou seu domínio custom). Sem isso, login falha.

---

## Opção B · Firebase Hosting (app dinâmico, mais trabalho)

Como o Atlas Particular tem rotas dinâmicas (`/trips/[id]`), o hosting estático puro **não basta**. As páginas hoje são CSR — então é possível, mas exige `output: "export"` e rewrite global.

### Passos

1. Instale a CLI:
   ```bash
   npm i -g firebase-tools
   firebase login
   ```
2. Edite [next.config.mjs](next.config.mjs) e adicione `output: "export"`:
   ```js
   const nextConfig = {
     output: "export",
     reactStrictMode: true,
     images: {
       unoptimized: true,
       remotePatterns: [{ protocol: "https", hostname: "firebasestorage.googleapis.com" }],
     },
   };
   ```
3. Gere o build estático:
   ```bash
   npm run build
   ```
   Isso produz a pasta `out/`.
4. Inicialize Firebase Hosting (uma vez):
   ```bash
   firebase use --add  # selecione o projeto
   ```
   O [firebase.json](firebase.json) já está pronto para servir `out/` com rewrite SPA.
5. Publique:
   ```bash
   firebase deploy --only hosting
   ```

### Limitação

Com `output: "export"`, **rotas dinâmicas precisam ser pre-renderizadas ou tratadas pelo cliente** — como nosso viewer usa CSR (`useEffect`), funciona via rewrite SPA: qualquer URL cai em `index.html` e o React resolve.

---

## Regras de Segurança (Firestore + Storage)

**Aplicar antes do primeiro deploy público**:

```bash
# Edite firestore.rules e storage.rules trocando REPLACE_WITH_ADMIN_UID_1
firebase deploy --only firestore:rules,storage
```

Confirme no console Firebase que as regras foram publicadas. **Sem elas, o banco fica permissivo.**

---

## Checklist final pré-deploy

- [ ] `.env.local` com valores reais (nunca commitado)
- [ ] Variáveis de ambiente cadastradas na Vercel/host
- [ ] UID do admin substituído em `firestore.rules` e `storage.rules`
- [ ] `firebase deploy --only firestore:rules,storage` executado
- [ ] Domínio adicionado em Firebase Auth → Authorized domains
- [ ] Authentication → Sign-in method → Email/Password habilitado
- [ ] Pelo menos um usuário criado em Authentication → Users
- [ ] UID desse usuário em `NEXT_PUBLIC_ADMIN_UIDS`
- [ ] `npm run build` passando localmente
