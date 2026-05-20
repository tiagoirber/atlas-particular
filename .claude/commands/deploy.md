---
name: deploy
description: >
  Faz o deploy completo do projeto Atlas Particular: verifica mudanças, cria branch,
  faz commits atômicos, cria PR via API do GitHub e faz o merge. Use sempre que o
  usuário pedir para fazer deploy, commitar, publicar ou enviar mudanças para produção.
---

# Deploy — Atlas Particular

Você é responsável por executar o processo completo de deploy deste projeto no Vercel via GitHub.

---

## Contexto do projeto

- **Repo**: `tiagoirber/atlas-particular`
- **Branch principal (protegida)**: `main`
- **Deploy**: automático no Vercel após merge em `main`
- **Git**: `C:\Users\irber\AppData\Local\Programs\Git\bin\git.exe`
- **Node.js**: pode não estar no PATH — tente `npm run typecheck` e `npm run lint`, mas se falhar, registre e prossiga (mudanças só de CSS/config não precisam de typecheck)
- **GitHub web**: bloqueado pela rede corporativa — usar sempre a API REST do GitHub
- **GitHub CLI (`gh`)**: não disponível

---

## Passo a passo obrigatório

### 1. Verificar mudanças

```powershell
$git = "C:\Users\irber\AppData\Local\Programs\Git\bin\git.exe"
Set-Location "c:\Users\irber\OneDrive\1) APPs\Claude Code\Atlas Particular"
& $git status
& $git diff --stat
```

Se não houver mudanças, informe o usuário e encerre.

### 2. Tentar typecheck e lint

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
npm run typecheck
npm run lint
```

Se Node.js não estiver disponível, registre e continue. Se houver erros de TypeScript ou lint, **pare e informe o usuário antes de continuar**.

### 3. Definir nome da branch

Use o padrão `fix/`, `feat/` ou `chore/` seguido de uma descrição curta em kebab-case.
Pergunte ao usuário se não estiver claro qual usar.

Verifique se a branch já existe:
```powershell
& $git branch -a
```

Se existir, mude para ela. Se não, crie:
```powershell
& $git config windows.appendAtomically false
& $git checkout -b nome-da-branch
# ou
& $git switch nome-da-branch
```

### 4. Fazer commits atômicos

Agrupe as mudanças por contexto lógico. Exemplos de agrupamentos:
- Arquivos de uma nova feature juntos
- Fixes de CSS juntos
- Mudanças de configuração separadas

```powershell
& $git add caminho/do/arquivo1 caminho/do/arquivo2
& $git commit -m @'
tipo: descrição curta

- detalhe 1
- detalhe 2
'@
```

Repita para cada grupo lógico.

### 5. Push da branch

```powershell
& $git push origin nome-da-branch
```

### 6. Recuperar token do GitHub

O token está armazenado no Windows Credential Manager. Use este código C# inline:

```powershell
$code = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CMDeploy {
    [DllImport("advapi32.dll", EntryPoint="CredReadW", CharSet=CharSet.Unicode, SetLastError=true)]
    static extern bool CredRead(string target, int type, int flags, out IntPtr cred);
    [DllImport("advapi32.dll", EntryPoint="CredFree")]
    static extern void CredFree(IntPtr buf);
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
    struct CRED { public int F,T; public string TN,C; public System.Runtime.InteropServices.ComTypes.FILETIME LW; public int BS; public IntPtr B; public int P,AC; public IntPtr A; public string TA,UN; }
    public static string Get(string target) {
        IntPtr p; if (!CredRead(target,1,0,out p)) return null;
        try { var c=Marshal.PtrToStructure<CRED>(p); if(c.BS==0) return null; var b=new byte[c.BS]; Marshal.Copy(c.B,b,0,c.BS); return Encoding.Unicode.GetString(b); }
        finally { CredFree(p); }
    }
}
"@
Add-Type -TypeDefinition $code -ErrorAction Stop
$token = [CMDeploy]::Get("git:https://github.com")
```

**Importante**: nunca exiba o token completo na saída. Use sempre `$token.Substring(0,8)...` para confirmar que foi encontrado.

### 7. Criar o PR via API

```powershell
$headers = @{ Authorization = "token $token"; Accept = "application/vnd.github+json" }
$body = @{
    title = "titulo do PR"
    head  = "nome-da-branch"
    base  = "main"
    body  = "descricao das mudancas"
} | ConvertTo-Json

$resp = Invoke-RestMethod -Uri "https://api.github.com/repos/tiagoirber/atlas-particular/pulls" -Method Post -Headers $headers -Body $body -ContentType "application/json"
Write-Output "PR #$($resp.number) criado"
```

### 8. Fazer o merge via API

```powershell
$mergeBody = @{
    commit_title = "titulo do commit de merge (#numero)"
    merge_method = "squash"
} | ConvertTo-Json

$resp = Invoke-RestMethod -Uri "https://api.github.com/repos/tiagoirber/atlas-particular/pulls/NUMERO/merge" -Method Put -Headers $headers -Body $mergeBody -ContentType "application/json"
Write-Output "Merge concluido: $($resp.sha)"
```

### 9. Confirmar ao usuário

Informe:
- Quais commits foram feitos
- Número e título do PR
- SHA do merge
- Que o Vercel vai fazer o deploy automaticamente em alguns minutos

---

## Regras importantes

- **Nunca faça push direto em `main`** — sempre via PR
- **Commits atômicos** — um contexto lógico por commit
- **Mensagens de commit em português ou inglês**, no formato `tipo: descrição curta`
- **Se typecheck ou lint falhar com erros reais**, pare e corrija antes de continuar
- **Sempre execute os passos 6, 7 e 8 na mesma chamada PowerShell** — o token não persiste entre execuções
- **Se o Add-Type falhar** (classe já definida na sessão), use um nome diferente para a classe (ex: `CMDeploy2`, `CMDeploy3`)
