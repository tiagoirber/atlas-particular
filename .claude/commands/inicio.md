---
description: Carrega CLAUDE.md e o context compressor mais recente do projeto
allowed-tools: Read, Glob
---

Ao iniciar esta sessão, execute os seguintes passos em ordem:

1. Leia o arquivo CLAUDE.md na raiz do projeto atual e internalize todas as instruções e regras definidas nele.

2. Procure o arquivo de contexto comprimido mais recente seguindo esta ordem de busca:
   - Pasta `context/` na raiz, arquivo com "comprimido" ou "context" no nome
   - Raiz do projeto, arquivo com "comprimido" ou "context" no nome
   - Se não encontrar nenhum, informe que nenhum context compressor foi localizado e pergunte se deseja criar um agora.

3. Leia o arquivo encontrado e internalize o estado atual do projeto.

4. Responda com um bloco de confirmação neste formato exato:

---
SESSÃO INICIADA
Projeto: [nome do projeto]
CLAUDE.md: carregado
Contexto: [nome do arquivo] | [data no arquivo ou "sem data"]
Pendências: 
- [pendência 1]
- [pendência 2]
- [pendência 3]
Pronto para continuar.
---
