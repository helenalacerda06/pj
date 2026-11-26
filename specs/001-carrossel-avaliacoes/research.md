# Research: Carrossel de avaliações recentes

## Ordenação e origem dos dados

- **Decision**: Reutilizar `GET /avaliacao` e sua ordenação decrescente por `avaliacao.id` como a ordenação pública das avaliações mais recentes.
- **Rationale**: O endpoint já retorna a lista completa ordenada por ID decrescente. O ID é atribuído quando a avaliação é inserida e, portanto, representa a ordem de criação da avaliação sem depender do relacionamento opcional com um usuário.
- **Alternatives considered**: Ordenar pelo campo `data` retornado pela API. Esse campo é a menor data de relacionamento da avaliação com um usuário e pode estar vazio; portanto, não representa de forma consistente a criação da avaliação pública. Alterar o endpoint para paginação também foi considerado, mas seria desnecessário para manter uma cópia estável da lista durante a sessão de navegação.

## Limite do carrossel e estabilidade da lista

- **Decision**: Buscar a lista uma vez ao montar a tela e mantê-la em memória; apresentar no carrossel somente as primeiras 15 avaliações da resposta, que já vem ordenada da mais recente para a mais antiga. Uma página futura para acessar as demais não faz parte deste escopo.
- **Rationale**: O limite restringe a área de destaque às avaliações recentes, e manter uma única lista em memória impede que novos itens alterem o conteúdo durante a navegação. Uma recarga do navegador inicia uma nova busca.
- **Alternatives considered**: Dividir toda a lista em grupos de até 15 e permitir navegar entre eles. Essa opção foi descartada para a feature atual; a página para avaliações excedentes será decidida e especificada futuramente. Buscar a API durante cada navegação também foi descartado porque poderia alterar a sequência corrente.

## Biblioteca de interface e acessibilidade

- **Decision**: Reutilizar Swiper, já referenciado pelo carrossel existente, e usar controles de navegação da página com rótulos acessíveis e operação por teclado.
- **Rationale**: Mantém o padrão iniciado no projeto e evita introduzir uma segunda biblioteca ou controles inacessíveis.
- **Alternatives considered**: Implementar um carrossel novo sem biblioteca ou adicionar outra dependência. Nenhuma alternativa traz benefício suficiente para substituir a integração já iniciada.

## Testes

- **Decision**: Validar busca, estados de carregamento/erro/vazio, quantidade visível, limite de 15 avaliações mais recentes, estabilidade da lista e acessibilidade dos controles usando os padrões de teste do frontend; complementar com verificação integrada manual.
- **Rationale**: A aplicação usa Jest e React Testing Library por `react-scripts`; não há script de teste declarado no backend.
- **Alternatives considered**: Adicionar framework de testes de API ou uma nova infraestrutura E2E. Isso não é necessário para a alteração de interface e aumentaria o escopo.
