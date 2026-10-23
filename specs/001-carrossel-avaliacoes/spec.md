# Feature Specification: Carrossel de avaliações recentes

**Feature Branch**: `Not created`

**Created**: 2026-10-19

**Status**: Draft

**Input**: Escopo atualizado após esclarecimento: apresentar no carrossel no máximo 15 avaliações mais recentes, em ordem decrescente de ID, mantendo a lista carregada estável até recarregar. Acesso às avaliações excedentes por outra página fica para uma feature futura.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar pelas avaliações recentes (Priority: P1)

Como visitante, quero ver as avaliações mais recentes em um carrossel que se adapte ao tamanho da tela, para encontrar conteúdo novo e navegar pelos cards sem perder o contexto.

**Why this priority**: Exibir e percorrer as avaliações recentes é o valor principal da funcionalidade.

**Independent Test**: Com pelo menos cinco avaliações disponíveis, abrir a página em larguras abaixo de 600px, entre 600px e 1023px, e a partir de 1024px; confirmar que aparecem, respectivamente, um, dois e quatro cards por vez, e que os demais podem ser acessados.

**Acceptance Scenarios**:

1. **Given** que existem avaliações disponíveis, **When** o visitante abre a página, **Then** as avaliações mais recentes aparecem primeiro e a quantidade simultânea respeita o tamanho da tela: uma abaixo de 600px, duas entre 600px e 1023px e quatro a partir de 1024px.
2. **Given** que há mais avaliações do que cabem na posição atual, **When** o visitante avança ou retrocede o carrossel, **Then** pode percorrer os cards apresentados sem alterar sua ordem decrescente de ID.
3. **Given** que há menos avaliações do que a quantidade simultânea prevista para a tela, **When** o visitante abre a página, **Then** todos os cards disponíveis são exibidos e nenhum card inexistente é apresentado.
4. **Given** que o visitante usa um teclado, **When** navega pelos controles do carrossel, **Then** consegue avançar e retornar com controles identificáveis e operáveis.
5. **Given** que não existem avaliações, **When** o visitante abre a página, **Then** vê uma mensagem de estado vazio sem controles que não tenham destino.
6. **Given** que a busca de avaliações falha, **When** a página tenta carregar os cards, **Then** informa que não foi possível carregá-los e não apresenta a falha como uma lista vazia bem-sucedida.

### User Story 2 - Limitar os cards às avaliações mais recentes (Priority: P1)

Como visitante, quero ver no carrossel somente as 15 avaliações mais recentes, para que a área de destaque permaneça concisa e priorize conteúdo novo.

**Why this priority**: O limite mantém o carrossel focado e evita que uma lista extensa de avaliações ocupe a área de destaque.

**Independent Test**: Com mais de 15 avaliações disponíveis, abrir a tela e confirmar que o carrossel contém exatamente as 15 mais recentes, sem apresentar as mais antigas nesta área.

**Acceptance Scenarios**:

1. **Given** que existem até 15 avaliações, **When** o visitante abre a página, **Then** todos os cards disponíveis aparecem no carrossel.
2. **Given** que existem mais de 15 avaliações, **When** o visitante abre a página, **Then** o carrossel apresenta somente as 15 mais recentes, mantendo a ordem decrescente de ID fornecida pelo endpoint.
3. **Given** que existem mais de 15 avaliações, **When** o visitante percorre o carrossel, **Then** nenhuma avaliação além das 15 mais recentes aparece nesta área.

### User Story 3 - Manter os cards estáveis até recarregar (Priority: P2)

Como visitante, quero que a lista não mude enquanto navego, para que novos cards não desloquem o conteúdo que estou consultando; quero ver atualizações ao recarregar a página.

**Why this priority**: Uma lista estável torna previsível a navegação pelo carrossel, enquanto o recarregamento oferece uma forma clara de obter novidades.

**Independent Test**: Abrir a página, registrar os cards exibidos, disponibilizar uma avaliação mais recente e navegar pelo carrossel sem recarregar; confirmar que a lista permanece igual. Recarregar a página e confirmar que a nova avaliação passa a aparecer.

**Acceptance Scenarios**:

1. **Given** que a lista foi carregada e uma nova avaliação fica disponível, **When** o visitante avança ou retorna no carrossel, **Then** a lista atual permanece inalterada.
2. **Given** que há novas avaliações disponíveis desde a última carga, **When** o visitante recarrega a página, **Then** a lista é atualizada e as avaliações mais recentes passam a ocupar as primeiras posições.

### Edge Cases

- Com zero avaliações, a página apresenta uma mensagem clara de estado vazio e não exibe controles de navegação sem destino.
- Com exatamente 15 avaliações, todas aparecem no carrossel.
- Com 16 avaliações, o carrossel mostra apenas as 15 primeiras da ordem decrescente de ID; a avaliação restante não aparece nesta área.
- Ao percorrer o carrossel, a lista carregada permanece consistente até o recarregamento.
- Se a busca de avaliações falhar, a página informa que não foi possível carregar os cards e não apresenta o erro como uma lista vazia bem-sucedida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A página MUST exibir as avaliações em cards e apresentar um card por vez abaixo de 600px, dois entre 600px e 1023px e até quatro a partir de 1024px.
- **FR-002**: A lista MUST começar pelas avaliações mais recentes, mantendo a ordem decrescente de ID retornada pelo endpoint público.
- **FR-003**: O carrossel MUST apresentar no máximo 15 avaliações, selecionando as 15 mais recentes quando o conjunto disponível exceder esse limite; avaliações mais antigas ficam fora do escopo desta tela.
- **FR-004**: A navegação do carrossel MUST permitir percorrer todos os cards apresentados sem omitir ou repetir cards.
- **FR-006**: A lista de avaliações MUST permanecer igual durante a navegação e MUST ser atualizada somente quando o visitante recarregar a página.
- **FR-007**: A página MUST apresentar um estado vazio compreensível quando não houver avaliações e uma mensagem de erro compreensível quando a busca falhar.
- **FR-008**: Os controles do carrossel MUST ser compreensíveis e operáveis por teclado.

### Key Entities *(include if data involved)*

- **Avaliação**: Conteúdo apresentado em um card, incluindo os dados necessários para identificação, exibição e ordenação cronológica.
- **Conjunto destacado**: As primeiras 15 avaliações da lista carregada, em ordem decrescente de ID; avaliações adicionais não são apresentadas pelo carrossel desta funcionalidade.
- **Lista carregada**: Conjunto ordenado de avaliações apresentado durante uma visita à página e mantido estável até o recarregamento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Com cards suficientes, são apresentados um card abaixo de 600px, dois entre 600px e 1023px e quatro a partir de 1024px.
- **SC-002**: O carrossel apresenta no máximo 15 avaliações e, quando há mais de 15 disponíveis, apresenta exatamente as 15 mais recentes.
- **SC-003**: Em uma lista de teste com pelo menos 16 avaliações, o carrossel apresenta somente as 15 primeiras da ordem decrescente de ID, sem duplicatas.
- **SC-004**: Em 100% dos testes de navegação sem recarregamento, a ordem e o conteúdo da lista carregada permanecem inalterados, mesmo quando uma avaliação mais recente fica disponível.
- **SC-005**: Em uma verificação com 10 participantes, pelo menos 9 conseguem avançar e retornar no carrossel usando seus controles identificados, sem orientação.

## Assumptions

- "Mais recentes" significa a ordem decrescente de ID fornecida pelo endpoint público, que representa a ordem de criação usada pela aplicação.
- O limite de 15 aplica-se ao conjunto exibido pelo carrossel; avaliações mais antigas excedentes ficam fora desta funcionalidade.
- Uma página separada para acessar avaliações além das 15 mais recentes é uma possibilidade futura e não faz parte do escopo desta feature.
- O carregamento inicial da página define a lista que será usada durante a navegação; novos cards não devem aparecer antes de um recarregamento explícito da página.
- A quantidade simultânea de cards é responsiva: um abaixo de 600px, dois entre 600px e 1023px e quatro a partir de 1024px; essa adaptação não altera o limite total de 15 avaliações no carrossel.
- A funcionalidade usa o conjunto de avaliações que a página já apresenta; criação, edição, exclusão e busca textual de avaliações não fazem parte deste escopo.
