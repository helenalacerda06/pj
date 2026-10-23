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
| `descricao`, `feedback`, `principais_pontos`, `lancamento`, `duracao`, `estrelas` | Colunas da avaliação | Dados disponíveis para o card atual ou extensões posteriores; não alteram o limite do carrossel |

**Validation and ordering**:

- Cada avaliação apresentada deve possuir `id` para manter uma identidade única entre cards.
- A ordem fornecida pela API é decrescente por `id`; manter essa ordem na lista em memória.
- Avaliações não devem ser removidas, duplicadas ou reordenadas ao navegar.
- O carrossel apresenta no máximo as primeiras 15 avaliações dessa lista; itens mais antigos não são apresentados nesta tela.

## Lista carregada

Snapshot em memória da resposta bem-sucedida de `GET /avaliacao` para a montagem atual da tela.

**States**:

1. **Loading**: busca inicial pendente; não declarar a lista vazia.
2. **Loaded**: resposta válida armazenada e usada por todas as navegações até desmontagem/recarregamento.
3. **Empty**: resposta válida sem avaliações; mostrar estado vazio e ocultar navegação sem destino.
4. **Error**: falha de rede, HTTP ou formato de resposta; mostrar mensagem explícita, distinta do estado vazio.

Uma atualização só ocorre após uma nova montagem da página provocada por recarregamento; mudar a posição do carrossel não atualiza o snapshot.

## Conjunto destacado do carrossel

Subsequência formada pelas primeiras 15 avaliações da lista carregada, ou pela lista inteira quando contém menos de 15 itens.

**Rules**:

- Preservar a ordem mais recente primeiro.
- O carrossel apresenta um card por vez abaixo de 600px, dois entre 600px e 1023px e até quatro a partir de 1024px.
- A navegação percorre somente esse conjunto destacado.
- Acessar os cards excedentes por uma página separada é comportamento futuro e não possui estado ou transição nesta funcionalidade.
