# Feature Specification: Visualização detalhada de avaliações

**Feature Branch**: `CarouselCards`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: Abrir uma janela centralizada ao selecionar um card de avaliação, mostrando os detalhes completos dessa avaliação no padrão visual da prévia existente, com um botão “X” para fechar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar os detalhes de uma avaliação (Priority: P1)

Como pessoa que navega pelos cards de avaliações, quero selecionar um card e consultar seus detalhes completos sem sair da lista, para entender melhor a avaliação escolhida.

**Why this priority**: A visualização detalhada é o objetivo principal da funcionalidade e deve funcionar para cada avaliação exibida.

**Independent Test**: Selecionar cards diferentes, um por vez, e confirmar que cada janela mostra os dados da avaliação selecionada e mantém a lista como contexto.

**Acceptance Scenarios**:

1. **Given** a lista de avaliações está visível, **When** a pessoa seleciona um card, **Then** uma janela aparece centralizada e mostra os dados da avaliação daquele card.
2. **Given** dois ou mais cards estão disponíveis, **When** a pessoa abre os detalhes de cards diferentes em sequência, **Then** cada janela mostra somente os dados da avaliação correspondente, sem manter dados da avaliação anterior.
3. **Given** a janela de detalhes está aberta, **When** a pessoa consulta seu conteúdo, **Then** encontra, quando disponíveis, nome, imagem, categoria, lançamento, duração, nota, descrição, feedback e principais pontos, organizados segundo o padrão visual da prévia de avaliação já existente.

### User Story 2 - Fechar os detalhes e continuar navegando (Priority: P2)

Como pessoa que está consultando uma avaliação, quero fechar a janela e retornar à lista no mesmo ponto, para continuar explorando os cards.

**Why this priority**: Fechar a janela é necessário para que a consulta não interrompa a navegação pela lista.

**Independent Test**: Abrir uma avaliação, fechar pelo “X” e confirmar que a lista reaparece no mesmo ponto de navegação.

**Acceptance Scenarios**:

1. **Given** a janela de detalhes está aberta, **When** a pessoa aciona o botão “X” no canto superior, **Then** a janela desaparece e a lista de cards volta a estar disponível no mesmo ponto.
2. **Given** a janela de detalhes está aberta, **When** a pessoa usa o teclado para fechá-la, **Then** a janela desaparece e o foco retorna ao card que a abriu.
3. **Given** uma janela de detalhes está aberta, **When** a pessoa tenta interagir com os cards ao fundo, **Then** esses cards não recebem a interação até a janela ser fechada.

### Edge Cases

- Se a avaliação não tiver imagem ou algum campo opcional, a janela continua utilizável e identifica claramente os dados ausentes, sem apresentar uma imagem quebrada.
- Se um texto for longo ou a janela não couber na altura da tela, todo o conteúdo continua acessível por rolagem, sem ficar cortado.
- Ao fechar uma avaliação e abrir outra, nenhum conteúdo da avaliação anterior permanece visível.
- Quando a lista não apresentar avaliações, a funcionalidade de detalhes não cria uma janela sem avaliação selecionada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A pessoa MUST conseguir abrir os detalhes ao selecionar qualquer card de avaliação exibido na lista.
- **FR-002**: A janela MUST aparecer centralizada sobre a lista, sem navegar para outra página.
- **FR-003**: A janela MUST mostrar exclusivamente os dados da avaliação selecionada.
- **FR-004**: A janela MUST apresentar todos os dados disponíveis da avaliação: nome, imagem, categoria, lançamento, duração, nota, descrição, feedback e principais pontos.
- **FR-005**: A organização e o estilo visual MUST seguir o padrão da prévia de avaliação existente, mantendo a identidade visual do projeto e a legibilidade em telas menores e maiores.
- **FR-006**: A janela MUST oferecer um botão “X” identificável no canto superior para fechar a visualização.
- **FR-007**: A pessoa MUST conseguir fechar a janela pelo teclado, e o foco MUST retornar ao card que abriu a janela.
- **FR-008**: Enquanto a janela estiver aberta, os cards ao fundo MUST permanecer inativos; ao fechá-la, a pessoa MUST retornar ao mesmo ponto da lista.
- **FR-009**: Campos opcionais ausentes MUST ser tratados de forma legível, sem interromper a visualização dos demais dados.

### Key Entities *(include if feature involves data)*

- **Avaliação**: Item selecionável da lista, com identidade própria e os dados descritivos, visuais e classificatórios apresentados na janela.
- **Visualização de detalhes**: Consulta temporária dos dados de uma única avaliação selecionada, encerrada quando a pessoa fecha a janela.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em testes com todos os cards exibidos, 100% das avaliações selecionadas apresentam os próprios dados, sem misturar informações de outros cards.
- **SC-002**: Em 95% das seleções testadas, a janela fica visível em até 1 segundo após o clique no card.
- **SC-003**: Pelo menos 90% das pessoas em um teste de uso conseguem identificar qual avaliação está aberta e voltar à lista sem ajuda.
- **SC-004**: Em telas menores e maiores, 100% dos campos disponíveis podem ser consultados sem conteúdo permanentemente cortado.

## Assumptions

- A funcionalidade vale para todos os cards que a listagem existente apresenta; não altera quais avaliações são carregadas nem o limite atual da listagem.
- Imagem e demais campos podem não estar preenchidos; os demais dados da avaliação devem continuar disponíveis mesmo nesse caso.
- A janela é temporária: abrir ou fechar detalhes não altera nem exclui a avaliação.
- A navegação deve seguir os requisitos de acessibilidade do projeto, incluindo operação por teclado e retorno do foco à origem.
