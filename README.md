# DecisionsMemory

**DecisionsMemory transforma cada commit do Git em uma memória técnica do projeto.**

Ele cria Markdown legível por IA e páginas HTML/CSS para pessoas, mantendo um diário de mudanças junto do código. É uma ferramenta de desenvolvimento: roda no repositório local e não vai para produção.

## Instalação rápida

```sh
npx decisionsmemory init
```

Esse único comando adiciona `decisionsmemory` em `devDependencies`, configura
um hook `post-commit` local e preserva qualquer hook existente. O fluxo não
depende de `postinstall`, portanto funciona com npm 12+.

## Para que serve

Use quando quiser que o histórico responda claramente:

- o que mudou em cada commit;
- quais arquivos foram envolvidos;
- qual foi o impacto técnico;
- onde encontrar uma mudança anterior.

Isso permite que uma IA retome contexto e que pessoas naveguem alterações sem
depender somente de mensagens curtas de commit ou de diffs antigos.

## O que vem no pacote

O pacote contém somente o necessário para usá-lo:

- o comando `decisionsmemory` / `npx decisionsmemory`;
- o instalador do hook Git;
- a captura segura de metadados do commit;
- a integração com Codex para resumir mudanças;
- os geradores de Markdown, HTML e CSS do Journal.

Arquivos de desenvolvimento deste repositório — como `superpowers`, planos,
testes internos e ADRs — **não** são enviados pelo npm.

## Pré-requisitos

- Node.js 20 ou superior;
- Git;
- Codex CLI instalado e autenticado na máquina.

Por padrão, o pacote usa Codex com modelo Luna e esforço de raciocínio baixo.

## O que é criado

Depois de um commit, o Journal terá esta estrutura:

```text
docs/dev-journal/
├── index.md
├── index.html
└── entries/
    └── 2026-10-01-corrige-login-a1b2c3d/
        ├── entry1.md
        ├── index.html
        └── styles.css
```

- `entryN.md` é a fonte canônica, fácil para IA ler.
- `index.html` e `styles.css` são a visão visual daquela mudança.
- A numeração dos `entryN` continua globalmente entre todas as pastas.
- Os dois arquivos `index` na raiz são o índice geral do Journal.

O pacote cria um commit `chore(decisionsmemory): ...` para o Journal e ignora
esse próprio commit, evitando recursão.

## Configuração opcional

Crie `decisionsmemory.json` na raiz do repositório para alterar opções não
secretas:

```json
{
  "executor": {
    "command": "codex",
    "model": "gpt-6-luna",
    "reasoningEffort": "low"
  },
  "journalDirectory": "docs/dev-journal"
}
```

Credenciais ficam no ambiente do Codex, nunca neste arquivo.

## Comandos úteis

```sh
npx decisionsmemory status
```

Mostra se a pasta atual é um repositório Git, se a configuração é válida e se o hook está instalado.

```sh
npx decisionsmemory install
```

Reinstala somente o hook quando o pacote já está no `node_modules`.

## Limites e segurança

- Diffs completos e credenciais não são salvos.
- Se o Codex falhar, o commit original permanece válido e um aviso é mostrado.
- Se o Journal estiver sujo, a geração é ignorada para não misturar conteúdo manual e gerado.
- Histórico anterior à instalação não é importado.
