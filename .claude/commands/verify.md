---
name: verify
description: >
  Verifica internamente se a tarefa foi concluída corretamente antes de entregá-la.
  Lê os arquivos modificados, tenta rodar typecheck/lint, checa o commit no Git
  e reporta honestamente o que foi e o que NÃO foi possível verificar.
  Use sempre antes de declarar uma tarefa como pronta.
---

# Verify — Checklist de entrega

Você é responsável por verificar o trabalho feito antes de declarar que a tarefa está pronta. Execute cada etapa abaixo e reporte os resultados de forma honesta.

---

## Passo 1 — Reler os arquivos modificados

Para cada arquivo que foi alterado nesta sessão:

```powershell
# Liste os arquivos alterados no último commit
$git = "C:\Users\irber\AppData\Local\Programs\Git\bin\git.exe"
Set-Location "c:\Users\irber\OneDrive\1) APPs\Claude Code\Atlas Particular"
& $git diff HEAD~1 HEAD --name-only
```

Para cada arquivo listado:
- Leia o arquivo inteiro com o Read tool
- Verifique se a mudança está correta, completa e não introduz bugs óbvios
- Confirme que a lógica do código resolve o problema reportado
- Verifique se há regressões em outras partes do mesmo arquivo

Se encontrar um problema: **corrija antes de continuar**.

---

## Passo 2 — Tentar typecheck e lint

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Set-Location "c:\Users\irber\OneDrive\1) APPs\Claude Code\Atlas Particular"
npm run typecheck
npm run lint
```

- Se Node.js não estiver disponível: **registre explicitamente** — "typecheck não executado: Node.js indisponível"
- Se houver erros de TypeScript ou lint: **pare, corrija, recomece do Passo 1**
- Se passar: registre como ✅

---

## Passo 3 — Confirmar o commit no Git

```powershell
$git = "C:\Users\irber\AppData\Local\Programs\Git\bin\git.exe"
Set-Location "c:\Users\irber\OneDrive\1) APPs\Claude Code\Atlas Particular"
& $git log --oneline -5
& $git status
```

Confirme:
- A branch está correta (main ou a branch esperada)
- O working tree está limpo (sem arquivos modificados não commitados)
- O commit com as mudanças está presente

---

## Passo 4 — Verificar commits recentes no GitHub

```powershell
$code = @"
using System; using System.Runtime.InteropServices; using System.Text;
public class CMVerify {
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
$token = [CMVerify]::Get("git:https://github.com")
$headers = @{ Authorization = "token $token"; Accept = "application/vnd.github+json" }
$commits = Invoke-RestMethod -Uri "https://api.github.com/repos/tiagoirber/atlas-particular/commits?per_page=3" -Headers $headers
$commits | ForEach-Object { Write-Output "$($_.sha.Substring(0,7)) $($_.commit.message.Split([char]10)[0])" }
```

Confirme que o commit da tarefa está no topo da lista.

---

## Passo 5 — Verificação de lógica (checklist manual)

Responda cada pergunta honestamente:

**Para mudanças de código:**
- [ ] A mudança resolve o problema exato que foi reportado?
- [ ] Existem outros caminhos de código (outros componentes, hooks, páginas) com o mesmo bug?
- [ ] A mudança pode quebrar algum golden path (login, criação de viagem, upload de capa, dashboard)?
- [ ] A mudança introduz algum risco de segurança?

**Para mudanças de CSS:**
- [ ] A mudança afeta apenas os elementos pretendidos?
- [ ] Há risco de quebrar layout em mobile?

**Para mudanças de regras do Firebase:**
- [ ] As regras no arquivo `.rules` foram aplicadas manualmente no Firebase Console?
- [ ] As regras bloqueiam acessos não autorizados?

---

## Passo 6 — Relatório final honesto

Apresente ao usuário um relatório estruturado:

```
## Resultado da verificação

### ✅ Verificado e correto
- (lista o que foi confirmado)

### ⚠️ Não foi possível verificar
- (lista o que não pôde ser testado e POR QUÊ)
- (inclui instruções específicas para o usuário verificar manualmente)

### 🔴 Pendências encontradas
- (se houver problemas encontrados durante a verificação)
```

**Regra de ouro**: Se não puder verificar algo, diga explicitamente. Nunca declare "funciona" sem evidência. Nunca omita limitações.

---

## Regras importantes

- **Nunca declare a tarefa pronta sem executar este checklist**
- **Se Node.js não estiver disponível, diga isso** — não simule o typecheck
- **Se não puder abrir o browser, diga isso** — não simule o teste de UI
- **Se encontrar um problema durante a verificação, corrija antes de reportar**
- **O relatório final deve separar claramente o que foi verificado do que não foi**
