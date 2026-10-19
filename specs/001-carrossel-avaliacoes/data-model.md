# Data Model: Carrossel de avaliações recentes

## Avaliação pública

Representa uma avaliação retornada pela API e exibida como um card.

| Campo | Origem | Uso nesta funcionalidade |
|---|---|---|
| `id` | `avaliacao.id` | Identidade estável do card e critério de ordenação por criação |
| `nome` | `avaliacao.nome` | Título do card |
| `categoria` | `avaliacao.categoria` | Subtítulo do card |
| `imagem` | `avaliacao.imagem` | Imagem opcional do card |
| `data` | Menor `data_criacao` associada, ou string vazia | Data apresentada atualmente; não é usada para ordenar a lista pública |
| `descricao`, `feedback`, `principais_pontos`, `lancamento`, `duracao`, `estrelas` | Colunas da avaliação | Dados disponíveis para o card atual ou extensões posteriores; não alteram a paginação |

**Validation and ordering**:

- Cada avaliação apresentada deve possuir `id` para manter uma identidade única entre cards.
- A ordem fornecida pela API é decrescente por `id`; manter essa ordem na lista em memória e ao separar as páginas.
- Avaliações não devem ser removidas, duplicadas ou reordenadas ao navegar.

## Lista carregada

Snapshot em memória da resposta bem-sucedida de `GET /avaliacao` para a montagem atual da tela.

**States**:

1. **Loading**: busca inicial pendente; não declarar a lista vazia.
2. **Loaded**: resposta válida armazenada e usada por todas as navegações até desmontagem/recarregamento.
3. **Empty**: resposta válida sem avaliações; mostrar estado vazio e ocultar navegação sem destino.
4. **Error**: falha de rede, HTTP ou formato de resposta; mostrar mensagem explícita, distinta do estado vazio.

Uma atualização só ocorre após uma nova montagem da página provocada por recarregamento; mudar o carrossel ou a página não atualiza o snapshot.

## Página de avaliações

Partição da lista carregada para apresentação.

| Propriedade | Regra |
|---|---|
| `items` | Subsequência contígua da lista carregada, com no máximo 15 avaliações |
| `pageIndex` | Índice da página selecionada, começando em zero |
| `pageCount` | Teto do total de avaliações dividido por 15; zero se a lista estiver vazia |
| Ordem | Mantém a ordem da lista carregada, mais recente primeiro |

**Transitions**:

- Selecionar página seguinte/anterior altera `pageIndex` sem buscar dados novamente.
- Alterar a página selecionada reinicia a posição interna do carrossel para o início da página.
- Não permitir uma transição para índice fora do intervalo de páginas existentes.
- O carrossel apresenta até quatro `items` por vez e permite percorrer todos os itens da página.
