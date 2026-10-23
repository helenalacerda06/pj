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

**Goal**: Carregar as avaliações públicas e percorrê-las em cards acessíveis, com quantidade responsiva: um card abaixo de 600px, dois entre 600px e 1023px e quatro a partir de 1024px.

**Independent Test**: Com pelo menos cinco avaliações, abrir a tela em larguras abaixo de 600px, entre 600px e 1023px e a partir de 1024px; confirmar a quantidade simultânea e percorrer o carrossel na ordem decrescente de ID. Confirmar também os estados vazio e de erro e operar os controles por teclado.

### Implementation for User Story 1

- [X] T001 [US1] Carregar uma vez a lista de `GET /avaliacao` ao montar a tela, manter estados distintos de carregamento, vazio e erro, e passar a lista carregada para o carrossel em `my-app/src/componentes/pages/cardsAva/paginasCardsAva.js`
- [X] T002 [US1] Refatorar o componente em `my-app/src/componentes/pages/cardsAva/cardsMaisAva.js` para renderizar um card por avaliação recebida por propriedade, preservando os campos e a apresentação existentes
- [X] T003 [US1] Criar um slide Swiper por avaliação e configurar navegação por teclado, controles acessíveis e quantidade responsiva (1/2/4) nos breakpoints definidos, em `my-app/src/componentes/pages/cardsAva/carouselAva.js`
- [X] T004 [P] [US1] Ajustar dimensões, espaçamento, foco visível e apresentação responsiva do carrossel nos estilos existentes em `my-app/src/componentes/pages/cardsAva/cardsAva.css` e `my-app/src/componentes/pages/cardsAva/paginasCardsAva.css`

**Checkpoint**: A lista carregada aparece em ordem do mais recente ao mais antigo; o usuário percorre os cards, vê estados vazio/erro distintos e consegue operar o carrossel pelo teclado.

---

## Phase 4: User Story 2 - Limitar o carrossel às 15 avaliações mais recentes (Priority: P1)

**Goal**: Apresentar no carrossel somente as 15 avaliações mais recentes, sem oferecer paginação para avaliações excedentes.

**Independent Test**: Com 15 avaliações, confirmar que todas aparecem; com 16 ou mais, confirmar que somente as 15 primeiras da ordem decrescente de ID aparecem no carrossel.

### Implementation and Validation for User Story 2

- [X] T005 [US2] Limitar a lista passada ao carrossel às 15 primeiras avaliações da resposta já ordenada pelo endpoint, mantendo a lista carregada em memória em `my-app/src/componentes/pages/cardsAva/paginasCardsAva.js`
- [X] T006 [US2] Validar os limites de 15 e 16 avaliações conforme o guia `specs/001-carrossel-avaliacoes/quickstart.md`, confirmando que o carrossel não apresenta avaliações além do limite nem oferece navegação para uma página de excedentes

**Checkpoint**: O carrossel apresenta todas as avaliações quando há até 15 e somente as 15 mais recentes quando há mais, sem navegação para páginas adicionais.

---

## Phase 5: User Story 3 - Manter os cards estáveis até recarregar (Priority: P2)

**Goal**: Garantir que o snapshot carregado não mude durante a navegação e que o recarregamento obtenha as avaliações mais recentes.

**Independent Test**: Após carregar a tela, disponibilizar uma avaliação mais recente; navegar pelo carrossel e confirmar que a lista não muda. Recarregar e confirmar que a nova avaliação aparece em primeiro lugar, respeitando o limite de 15.

### Validation for User Story 3

- [X] T007 [US3] Executar o cenário de snapshot e recarga do guia `specs/001-carrossel-avaliacoes/quickstart.md`, confirmando que navegar pelo carrossel não dispara nova busca e que recarregar obtém a lista atualizada

**Checkpoint**: A ordenação e o conteúdo permanecem estáveis durante a navegação e são atualizados após recarregar a tela.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validar o comportamento integrado e a aderência ao guia da funcionalidade.

- [X] T008 Executar os cenários integrados de estado vazio/erro, limites de cards, ordenação, responsividade e teclado descritos em `specs/001-carrossel-avaliacoes/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Nenhuma tarefa; dependências já estão presentes.
- **Foundational (Phase 2)**: Nenhuma tarefa; API, banco e infraestrutura atuais são suficientes.
- **User Stories**: A User Story 1 estabelece o carregamento e o carrossel; a User Story 2 depende dessa lista para limitar os cards às 15 avaliações mais recentes. A User Story 3 valida a estabilidade do conjunto até recarregar.
- **Polish (Phase 6)**: Depende da conclusão das histórias que forem incluídas na entrega.

### User Story Dependencies

- **User Story 1 (P1)**: Pode começar imediatamente; nenhuma dependência de outras histórias.
- **User Story 2 (P1)**: Depende da User Story 1 para receber a lista carregada e limitar o conjunto exibido no carrossel.
- **User Story 3 (P2)**: Valida a estabilidade do conjunto das User Stories 1 e 2; não introduz uma segunda busca nem persistência adicional.

### Within Each User Story

- Para US1, concluir o fluxo de carregamento antes de conectar o renderizador e o carrossel.
- Para US2, aplicar o limite de 15 à lista carregada antes de validar os limites de 15/16 avaliações.
- Executar a validação manual de US3 após concluir o carregamento e o limite do carrossel.

### Parallel Opportunities

- **US1**: T004 pode ser desenvolvido em paralelo com as alterações JavaScript T001–T003, pois altera apenas CSS e os seletores existentes.
- **US2**: T006 depende de T005; primeiro aplicar o limite e depois validar os casos de fronteira.
- **Entre histórias**: US2 depende da lista e do carrossel entregues em US1. US3 e Polish são validações posteriores.

---

## Implementation Strategy

### MVP First (User Story 1)

1. Concluir T001–T004 para carregar e percorrer as avaliações recentes.
2. Validar a US1 independentemente com pelo menos cinco avaliações e os estados vazio/erro.
3. A entrega da US1 é o MVP do carrossel; a seleção limitada às 15 avaliações mais recentes pertence à US2.

### Incremental Delivery

1. Implementar e validar US1.
2. Implementar US2 para limitar o carrossel às 15 avaliações mais recentes; avaliações excedentes ficam para uma feature futura.
3. Executar a validação de estabilidade e recarga da US3.
4. Executar a validação integrada do quickstart.

---

## Notes

- `[P]` indica tarefas em arquivos diferentes que podem ser executadas em paralelo.
- Cada tarefa de história usa o rótulo `[US1]`, `[US2]` ou `[US3]` correspondente.
- Não são necessárias mudanças em `back-end/index.js`, no esquema SQLite ou nas dependências.
