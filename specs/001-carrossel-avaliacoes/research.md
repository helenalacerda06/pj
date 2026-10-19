# Research: Carrossel de avaliações recentes

## Ordenação e origem dos dados

- **Decision**: Reutilizar `GET /avaliacao` e sua ordenação decrescente por `avaliacao.id` como a ordenação pública das avaliações mais recentes.
- **Rationale**: O endpoint já retorna a lista completa ordenada por ID decrescente. O ID é atribuído quando a avaliação é inserida e, portanto, representa a ordem de criação da avaliação sem depender do relacionamento opcional com um usuário.
- **Alternatives considered**: Ordenar pelo campo `data` retornado pela API. Esse campo é a menor data de relacionamento da avaliação com um usuário e pode estar vazio; portanto, não representa de forma consistente a criação da avaliação pública. Alterar o endpoint para paginação também foi considerado, mas seria desnecessário para manter uma cópia estável da lista durante a sessão de navegação.

## Paginação e estabilidade da lista

- **Decision**: Buscar a lista uma vez ao montar a tela e mantê-la em memória; separar essa lista em grupos consecutivos de no máximo 15 avaliações. O carrossel mostra até quatro cards simultaneamente na página selecionada.
- **Rationale**: A navegação local evita requisições quando o usuário muda a página e impede que avaliações novas alterem a sequência atual. Uma recarga do navegador volta a montar a tela e obter a lista mais recente.
- **Alternatives considered**: Buscar a API em cada página. Isso poderia acrescentar itens novos entre navegações e tornar instável a paginação. Persistir a lista em armazenamento do navegador impediria a atualização esperada no recarregamento.

## Biblioteca de interface e acessibilidade

- **Decision**: Reutilizar Swiper, já referenciado pelo carrossel existente, e usar controles de navegação da página com rótulos acessíveis e operação por teclado.
- **Rationale**: Mantém o padrão iniciado no projeto e evita introduzir uma segunda biblioteca ou controles inacessíveis.
- **Alternatives considered**: Implementar um carrossel novo sem biblioteca ou adicionar outra dependência. Nenhuma alternativa traz benefício suficiente para substituir a integração já iniciada.

## Testes

- **Decision**: Cobrir busca, estados de carregamento/erro/vazio, quantidade visível, limites de 15, continuidade entre páginas, estabilidade da lista e acessibilidade dos controles usando os padrões de teste do frontend; complementar com verificação integrada manual.
- **Rationale**: A aplicação usa Jest e React Testing Library por `react-scripts`; não há script de teste declarado no backend.
- **Alternatives considered**: Adicionar framework de testes de API ou uma nova infraestrutura E2E. Isso não é necessário para a alteração de interface e aumentaria o escopo.
