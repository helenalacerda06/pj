# Contract: Avaliações públicas e controles de navegação

## API existente usada pela interface

### `GET https://lacstar-backend.onrender.com/avaliacao`

- **Request**: sem parâmetros, corpo ou autenticação exigidos pela tela atual.
- **Success**: HTTP 2xx com array JSON ordenado por `id` decrescente.
- **Item**: contém `id`, `categoria`, `nome`, `descricao`, `feedback`, `principais_pontos`, `imagem`, `lancamento`, `duracao`, `estrelas` e `data`. `data` é a menor data de criação do relacionamento com usuário, ou `""` se não houver relacionamento.
- **Failure**: resposta HTTP não bem-sucedida ou erro de rede; interface apresenta mensagem de erro e não converte a falha em estado vazio.
- **Change policy**: este recurso reutiliza a API sem acrescentar parâmetros nem alterar seu formato. A resposta é lida uma vez para a montagem da tela; navegar pelo carrossel não refaz a chamada.

## Contrato da interface

- O carrossel apresenta um card por vez abaixo de 600px, dois entre 600px e 1023px e até quatro a partir de 1024px, e permite percorrer os cards exibidos.
- O conjunto do carrossel contém no máximo as 15 avaliações mais recentes do array em memória. Se houver menos de 15, apresenta todas.
- Avaliações mais antigas que excedam o limite de 15 não são acessíveis por esta tela; uma página separada para elas fica fora do escopo atual.
- Controles do carrossel possuem nomes acessíveis, foco visível e operação por teclado.
- Controles sem destino não são apresentados como ações disponíveis. O estado vazio e o erro são identificáveis e distintos.
- Navegar pelo carrossel não altera a lista carregada. Recarregar a página solicita novamente a lista mais recente.
