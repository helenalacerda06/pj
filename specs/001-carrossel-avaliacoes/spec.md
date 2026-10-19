# Feature Specification: Carrossel de avaliações recentes

**Feature Branch**: `Not created`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Quero criar um carrossel de cards usando uma biblioteca de UX, já comecei a fazer. Quero que apareçam 4 cards por vez, com no máximo 15 cards por página. Acima desse número, o usuário deve ir para outra página para ver os cards. O carrossel deve buscar os cards mais recentes e só atualizar quando o usuário recarregar a página."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar pelas avaliações recentes (Priority: P1)

Como visitante, quero ver as avaliações mais recentes em um carrossel de quatro cards por vez, para encontrar conteúdo novo e navegar pelos cards sem perder o contexto.

**Why this priority**: Exibir e percorrer as avaliações recentes é o valor principal da funcionalidade.

**Independent Test**: Com pelo menos cinco avaliações disponíveis, abrir a página e avançar o carrossel; quatro cards devem estar visíveis em cada posição e os cards seguintes devem poder ser acessados.

**Acceptance Scenarios**:

1. **Given** que existem avaliações disponíveis, **When** o visitante abre a página, **Then** os quatro cards mais recentes aparecem primeiro.
2. **Given** que existem mais de quatro avaliações na página atual, **When** o visitante avança ou retrocede o carrossel, **Then** ele pode percorrer os cards dessa página sem alterar a ordem por data de criação decrescente.
3. **Given** que existem menos de quatro avaliações na página atual, **When** o visitante abre a página, **Then** todos os cards disponíveis são exibidos e nenhum card inexistente é apresentado.
4. **Given** que o visitante usa um teclado, **When** navega pelos controles do carrossel ou da paginação, **Then** consegue avançar e retornar com controles identificáveis e operáveis.
5. **Given** que não existem avaliações, **When** o visitante abre a página, **Then** vê uma mensagem de estado vazio sem controles que não tenham destino.
6. **Given** que a busca de avaliações falha, **When** a página tenta carregar os cards, **Then** informa que não foi possível carregá-los e não apresenta a falha como uma lista vazia bem-sucedida.

### User Story 2 - Acessar páginas de avaliações mais antigas (Priority: P1)

Como visitante, quero encontrar as avaliações mais antigas em páginas seguintes quando houver mais de 15 avaliações, para que a página atual permaneça limitada e eu ainda possa acessar o conteúdo completo.

**Why this priority**: A paginação mantém a quantidade de cards por página previsível sem ocultar permanentemente avaliações antigas.

**Independent Test**: Com 16 ou mais avaliações, avançar para a página seguinte e confirmar que ela começa na avaliação seguinte à última da página anterior, sem repetir cards.

**Acceptance Scenarios**:

1. **Given** que existem até 15 avaliações, **When** o visitante abre a página, **Then** todos os cards ficam na página atual e não há uma página seguinte sem conteúdo.
2. **Given** que existem mais de 15 avaliações, **When** o visitante abre a página, **Then** no máximo 15 cards pertencem à página atual e há um controle para acessar as avaliações restantes.
3. **Given** que o visitante está na primeira página e há mais de 15 avaliações, **When** avança para a página seguinte, **Then** vê os cards seguintes em ordem decrescente de data, sem duplicatas ou lacunas entre páginas.
4. **Given** que o visitante está em uma página posterior, **When** retorna à página anterior, **Then** volta a ver os cards correspondentes àquela página.

### User Story 3 - Manter os cards estáveis até recarregar (Priority: P2)

Como visitante, quero que a lista não mude enquanto navego, para que novos cards não desloquem o conteúdo que estou consultando; quero ver atualizações ao recarregar a página.

**Why this priority**: Uma lista estável torna previsível a navegação pelo carrossel e pela paginação, enquanto o recarregamento oferece uma forma clara de obter novidades.

**Independent Test**: Abrir a página, registrar os cards exibidos, disponibilizar uma avaliação mais recente e navegar sem recarregar; confirmar que a lista permanece igual. Recarregar a página e confirmar que a nova avaliação passa a aparecer.

**Acceptance Scenarios**:

1. **Given** que a lista foi carregada e uma nova avaliação fica disponível, **When** o visitante avança ou retorna no carrossel ou na paginação, **Then** a lista atual permanece inalterada.
2. **Given** que há novas avaliações disponíveis desde a última carga, **When** o visitante recarrega a página, **Then** a lista é atualizada e as avaliações mais recentes passam a ocupar as primeiras posições.

### Edge Cases

- Com zero avaliações, a página apresenta uma mensagem clara de estado vazio e não exibe controles de navegação sem destino.
- Com exatamente 15 avaliações, todos os cards aparecem na página atual e não há página seguinte.
- Com 16 avaliações, a primeira página contém 15 cards e a segunda contém o card restante.
- Ao navegar para uma página posterior e voltar, a mesma lista carregada permanece consistente até o recarregamento.
- Se a busca de avaliações falhar, a página informa que não foi possível carregar os cards e não apresenta o erro como uma lista vazia bem-sucedida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A página MUST exibir as avaliações em cards e apresentar até quatro cards simultaneamente no painel do carrossel.
- **FR-002**: A lista MUST começar pelas avaliações mais recentes, ordenadas da data de criação mais nova para a mais antiga.
- **FR-003**: Cada página MUST conter no máximo 15 avaliações; quando houver mais de 15 no conjunto disponível, o visitante MUST poder acessar as avaliações restantes por páginas adicionais.
- **FR-004**: A navegação do carrossel MUST permitir percorrer todos os cards da página atual sem omitir ou repetir cards.
- **FR-005**: A navegação entre páginas MUST continuar a sequência ordenada, sem omitir nem repetir avaliações entre páginas.
- **FR-006**: A lista de avaliações MUST permanecer igual durante a navegação e MUST ser atualizada somente quando o visitante recarregar a página.
- **FR-007**: A página MUST apresentar um estado vazio compreensível quando não houver avaliações e uma mensagem de erro compreensível quando a busca falhar.
- **FR-008**: Os controles do carrossel e da paginação MUST ser compreensíveis e operáveis por teclado.

### Key Entities *(include if data involved)*

- **Avaliação**: Conteúdo apresentado em um card, incluindo os dados necessários para identificação, exibição e ordenação cronológica.
- **Página de avaliações**: Grupo ordenado de até 15 avaliações; páginas sucessivas contêm as avaliações seguintes da mesma lista carregada.
- **Lista carregada**: Conjunto ordenado de avaliações apresentado durante uma visita à página e mantido estável até o recarregamento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em qualquer posição do carrossel, são apresentados até quatro cards simultaneamente; quatro são apresentados quando há pelo menos quatro cards disponíveis na página.
- **SC-002**: Nenhuma página apresenta mais de 15 avaliações, e todas as avaliações disponíveis podem ser alcançadas pela navegação entre páginas.
- **SC-003**: Em uma lista de teste com pelo menos 16 avaliações, as páginas exibem todos os cards uma única vez, em ordem decrescente de data de criação.
- **SC-004**: Em 100% dos testes de navegação sem recarregamento, a ordem e o conteúdo da lista carregada permanecem inalterados, mesmo quando uma avaliação mais recente fica disponível.
- **SC-005**: Em um teste de usabilidade, pelo menos 90% dos participantes conseguem avançar e retornar no carrossel e acessar outra página sem orientação.

## Assumptions

- "Mais recentes" significa ordenação pela data de criação da avaliação, da mais nova para a mais antiga.
- O limite de 15 aplica-se a cada página, não ao total de avaliações disponíveis.
- O carregamento inicial da página define a lista que será usada durante a navegação; abrir outra página de avaliações não deve incorporar novos cards antes de um recarregamento explícito da página.
- O requisito de quatro cards descreve o painel padrão do carrossel; adaptações visuais para diferentes tamanhos de tela não alteram a navegação nem o limite de 15 por página.
- A funcionalidade usa o conjunto de avaliações que a página já apresenta; criação, edição, exclusão e busca textual de avaliações não fazem parte deste escopo.
