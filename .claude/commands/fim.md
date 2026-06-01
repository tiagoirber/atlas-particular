---
description: Atualiza CLAUDE.md e gera context compressor ao finalizar a sessão
allowed-tools: Read, Write, Glob, Bash
---

Ao receber este comando, execute os seguintes passos em ordem:

## PASSO 1 — Revisão da sessão

Analise tudo que aconteceu nesta sessão e identifique:
- Decisões estruturais tomadas (arquitetura, padrões, regras novas)
- Arquivos criados ou modificados com impacto no projeto
- Problemas resolvidos que não devem se repetir
- Mudanças de direção ou pivôs importantes

## PASSO 2 — Atualização do CLAUDE.md

Leia o CLAUDE.md atual na raiz do projeto.

Atualize APENAS o que mudou nesta sessão. Não reescreva o que já estava correto. Regras:
- Adicione novas decisões estruturais como seções ou itens nas seções existentes
- Remova ou corrija instruções que foram explicitamente revogadas nesta sessão
- Mantenha o formato e a estrutura original do arquivo
- Não adicione floreios, comentários ou explicações desnecessárias

Salve o CLAUDE.md atualizado.

## PASSO 3 — Geração do context compressor

Gere um arquivo Markdown comprimido com o estado atual completo do projeto seguindo este formato:

# [Nome do Projeto]
> Comprimido em: [data de hoje] | Sessão: [resumo de uma linha do que foi feito hoje]

## Objetivo do projeto
[uma ou duas linhas]

## Stack e configurações
[tecnologias, URLs, credenciais de projeto, variáveis de ambiente relevantes]

## Estrutura de arquivos relevante
[apenas os arquivos que importam para continuidade]

## Decisões tomadas
[lista de decisões concretas, sem o debate que as gerou]

## Regras e restrições
[o que não pode mudar, limites, constraints]

## Estado atual
[onde o projeto está agora, o que funciona, o que não funciona]

## Pendências
[lista priorizada do que falta fazer]

Salve o arquivo em `context/[nome-do-projeto]-comprimido.md`.
Se a pasta `context/` não existir, crie-a.

## PASSO 4 — Confirmação final

Responda com este bloco:

---
SESSÃO ENCERRADA
CLAUDE.md: atualizado
Alterações registradas:
- [mudança 1]
- [mudança 2]
- [mudança 3]
Context compressor: context/[nome-do-arquivo]
Pendências para próxima sessão:
- [pendência 1]
- [pendência 2]
- [pendência 3]
Pode fechar.
---
