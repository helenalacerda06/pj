# Tasks: Carrossel de avaliações recentes

**Input**: Design documents from `/specs/001-carrossel-avaliacoes/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: A especificação não solicita testes automatizados. As tarefas incluem validação manual pelos cenários do guia quickstart.

**Organization**: Tarefas agrupadas por história para permitir entregas incrementais.

## Phase 1: Setup

**Purpose**: Preparar dependências e estrutura da aplicação.

Nenhuma tarefa de setup é necessária: React, Material UI, Swiper e as ferramentas de teste já estão declaradas em `my-app/package.json`.

## Phase 2: Foundational

**Purpose**: Infraestrutura compartilhada necessária antes das histórias.

Nenhuma mudança de infraestrutura, API ou banco de dados é necessária. O endpoint público existente já fornece as avaliações ordenadas por ID decrescente.

---

## Phase 3: User Story 1 - Navegar pelas avaliações recentes (Priority: P1) 🎯 MVP

**Goal**: Carregar as avaliações públicas e percorrê-las em cards acessíveis, com quatro cards visíveis por vez.

**Independent Test**: Com pelo menos cinco avaliações, abrir a tela, confirmar a ordem decrescente de criação e percorrer o carrossel. Confirmar também os estados vazio e de erro e operar os controles por teclado.

### Implementation for User Story 1

- [ ] T001 [US1] Carregar uma vez a lista de `GET /avaliacao` ao montar a tela, manter estados distintos de carregamento, vazio e erro, e passar a lista carregada para o carrossel em `my-app/src/componentes/pages/cardsAva/paginasCardsAva.js`
- [ ] T002 [US1] Refatorar o componente em `my-app/src/componentes/pages/cardsAva/cardsMaisAva.js` para renderizar um card por avaliação recebida por propriedade, preservando os campos e a apresentação existentes
- [ ] T003 [US1] Criar um slide Swiper por avaliação e exibir quatro slides por vez, com navegação por teclado e controles acessíveis, em `my-app/src/componentes/pages/cardsAva/carouselAva.js`
- [ ] T004 [P] [US1] Ajustar dimensões, espaçamento, foco visível e adaptação do carrossel aos estilos existentes em `my-app/src/componentes/pages/cardsAva/cardsAva.css` e `my-app/src/componentes/pages/cardsAva/paginasCardsAva.css`

**Checkpoint**: A lista carregada aparece em ordem do mais recente ao mais antigo; o usuário percorre os cards, vê estados vazio/erro distintos e consegue operar o carrossel pelo teclado.

---

## Phase 4: User Story 2 - Acessar páginas de avaliações mais antigas (Priority: P1)

**Goal**: Limitar cada página a 15 avaliações e permitir navegar entre todas as páginas sem lacunas ou duplicatas.

**Independent Test**: Com 15 avaliações, confirmar que não há página seguinte; com 16, confirmar 15 cards na primeira página e um na segunda; avançar e retornar sem repetir nem omitir cards.

### Implementation for User Story 2

- [ ] T005 [US2] Adicionar estado de página, dividir a lista carregada em grupos consecutivos de no máximo 15 avaliações e oferecer controles acessíveis de página anterior/próxima em `my-app/src/componentes/pages/cardsAva/paginasCardsAva.js`
- [ ] T006 [US2] Reiniciar o carrossel no primeiro card ao mudar de página e impedir navegação para páginas fora dos limites em `my-app/src/componentes/pages/cardsAva/paginasCardsAva.js` e `my-app/src/componentes/pages/cardsAva/carouselAva.js`

**Checkpoint**: Com 15 ou 16 avaliações, a paginação respeita o limite e a sequência; cada página continua oferecendo o carrossel de até quatro cards simultâneos.

---

## Phase 5: User Story 3 - Manter os cards estáveis até recarregar (Priority: P2)

**Goal**: Garantir que o snapshot carregado não mude durante a navegação e que o recarregamento obtenha as avaliações mais recentes.

**Independent Test**: Após carregar a tela, disponibilizar uma avaliação mais recente; navegar pelo carrossel e pelas páginas e confirmar que a lista não muda. Recarregar e confirmar que a nova avaliação aparece em primeiro lugar.

### Validation for User Story 3

- [ ] T007 [US3] Executar o cenário de snapshot e recarga do guia `specs/001-carrossel-avaliacoes/quickstart.md`, confirmando que carrossel e paginação não disparam nova busca e que recarregar obtém a lista atualizada

**Checkpoint**: A ordenação e o conteúdo permanecem estáveis durante a navegação e são atualizados após recarregar a tela.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validar o comportamento integrado e a aderência ao guia da funcionalidade.

- [ ] T008 Executar os cenários de estados vazio/erro, limites de cards, ordenação e teclado descritos em `specs/001-carrossel-avaliacoes/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Nenhuma tarefa; dependências já estão presentes.
- **Foundational (Phase 2)**: Nenhuma tarefa; API, banco e infraestrutura atuais são suficientes.
- **User Stories**: A User Story 1 estabelece o carregamento e o carrossel; a User Story 2 depende dessa lista e desses componentes para paginar. A validação da User Story 3 depende da navegação do carrossel e das páginas implementadas.
- **Polish (Phase 6)**: Depende da conclusão das histórias que forem incluídas na entrega.

### User Story Dependencies

- **User Story 1 (P1)**: Pode começar imediatamente; nenhuma dependência de outras histórias.
- **User Story 2 (P1)**: Depende da User Story 1 para receber a lista carregada e renderizar os cards no carrossel.
- **User Story 3 (P2)**: Valida o comportamento combinado das User Stories 1 e 2; não introduz uma segunda busca nem persistência adicional.

### Within Each User Story

- Para US1, concluir o fluxo de carregamento antes de conectar o renderizador e o carrossel.
- Para US2, concluir a partição da lista e os controles de página antes de validar os limites e o reinício do carrossel.
- Executar a validação manual de US3 após a implementação das duas formas de navegação.

### Parallel Opportunities

- **US1**: T004 pode ser desenvolvido em paralelo com as alterações JavaScript T001–T003, pois altera apenas CSS e os seletores existentes.
- **US2**: T005 e T006 afetam o estado e a integração dos mesmos componentes; devem ser executados em sequência.
- **Entre histórias**: Não há paralelismo seguro entre US1 e US2, pois a paginação depende do contrato de dados e do carrossel entregues em US1. US3 e Polish são validações posteriores.

---

## Implementation Strategy

### MVP First (User Story 1)

1. Concluir T001–T004 para carregar e percorrer as avaliações recentes.
2. Validar a US1 independentemente com pelo menos cinco avaliações e os estados vazio/erro.
3. A entrega da US1 é o MVP do carrossel; a navegação por páginas pertence à US2.

### Incremental Delivery

1. Implementar e validar US1.
2. Implementar US2 para disponibilizar todo o conteúdo em páginas de até 15 cards.
3. Executar a validação de estabilidade e recarga da US3.
4. Executar a validação integrada do quickstart.

---

## Notes

- `[P]` indica tarefas em arquivos diferentes que podem ser executadas em paralelo.
- Cada tarefa de história usa o rótulo `[US1]`, `[US2]` ou `[US3]` correspondente.
- Não são necessárias mudanças em `back-end/index.js`, no esquema SQLite ou nas dependências.
