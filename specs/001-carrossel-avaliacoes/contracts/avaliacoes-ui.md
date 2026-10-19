# Contract: Avaliações públicas e controles de navegação

## API existente usada pela interface

### `GET https://lacstar-backend.onrender.com/avaliacao`

- **Request**: sem parâmetros, corpo ou autenticação exigidos pela tela atual.
- **Success**: HTTP 2xx com array JSON ordenado por `id` decrescente.
- **Item**: contém `id`, `categoria`, `nome`, `descricao`, `feedback`, `principais_pontos`, `imagem`, `lancamento`, `duracao`, `estrelas` e `data`. `data` é a menor data de criação do relacionamento com usuário, ou `""` se não houver relacionamento.
- **Failure**: resposta HTTP não bem-sucedida ou erro de rede; interface apresenta mensagem de erro e não converte a falha em estado vazio.
- **Change policy**: este recurso reutiliza a API sem acrescentar parâmetros nem alterar seu formato. A resposta é lida uma vez para a montagem da tela; mudanças de carrossel ou página não refazem a chamada.

## Contrato da interface

- O carrossel apresenta até quatro cards por posição e permite percorrer todos os cards da página selecionada.
- Cada página de navegação contém até 15 avaliações consecutivas do array em memória.
- Controles de carrossel e paginação possuem nomes acessíveis, foco visível e operação por teclado.
- Controles sem destino não são apresentados como ações disponíveis. O estado vazio e o erro são identificáveis e distintos.
- A seleção de página não altera a lista carregada. Recarregar a página solicita novamente a lista mais recente.
