# Implementation Plan: Carrossel de avaliações recentes

**Branch**: `001-carrossel-avaliacoes` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-carrossel-avaliacoes/spec.md`

## Summary

Completar o carrossel de avaliações públicas para mostrar quatro cards por vez, com páginas de até 15 avaliações, ordenadas das mais recentes para as mais antigas. Reutilizar o Swiper e o endpoint público existente; buscar a lista uma vez quando a tela é carregada e navegar sobre essa cópia em memória, sem novas buscas durante a navegação. O recarregamento da página inicia uma nova busca.

## Technical Context

**Language/Version**: JavaScript (frontend React 19; backend Node.js)

**Primary Dependencies**: React, React Router, Material UI e Swiper, já presentes na aplicação frontend.

**Storage**: SQLite existente no backend; nenhuma mudança de esquema é necessária.

**Testing**: React Testing Library com Jest via `react-scripts test`; validação manual integrada para navegação e atualização da lista. O backend não declara testes automatizados.

**Target Platform**: Aplicação web React em navegadores desktop e móveis.

**Project Type**: Aplicação web com frontend e API backend existentes.

**Performance Goals**: Mostrar quatro cards simultaneamente quando houver pelo menos quatro na página atual; carregar a lista uma vez por montagem da tela e não fazer novas requisições ao navegar.

**Constraints**: No máximo 15 avaliações por página; ordenar as avaliações da mais recente para a mais antiga; preservar a biblioteca e a API existentes; os controles devem funcionar por teclado e manter legibilidade.

**Scale/Scope**: Avaliações públicas na página de cards, navegação de carrossel e paginação. Não inclui edição, exclusão, busca ou mudança nas avaliações do usuário.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Approved Technology Stack**: PASS — permanece em React no frontend, Node/Express no backend e SQLite para dados persistentes; não requer mudança de stack nem esquema.
- **Clear Responsibility and Reuse**: PASS — reaproveita `CarouselAva`, `cardsMaisAva`, Swiper e o endpoint público `GET /avaliacao`; as mudanças ficam no fluxo atual de cards.
- **Accessible, Legible Interface**: PASS — os controles de avanço, retorno e paginação devem ter nomes acessíveis, foco visível e operação por teclado, preservando o estilo e contraste atuais.
- **Safe Backend and Behavior Preservation**: PASS — não introduz entrada de backend nem altera endpoints; estados vazio e de erro devem permanecer distintos e explícitos.
- **Simplicity and Maintainability**: PASS — paginação em memória evita novo endpoint, estado duplicado no servidor ou persistência desnecessária.

No constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/001-carrossel-avaliacoes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── avaliacoes-ui.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
my-app/src/
├── componentes/pages/cardsAva/
│   ├── carouselAva.js
│   ├── cardsMaisAva.js
│   ├── paginasCardsAva.js
│   ├── cardsAva.css
│   └── paginasCardsAva.css
└── App.test.js

back-end/
└── index.js                 # GET /avaliacao existente; sem mudança de contrato planejada
```

**Structure Decision**: Aplicação web existente em `my-app/` com API Express em `back-end/`. Implementar o comportamento nos componentes de cards já usados na tela; manter o backend e o contrato de rede intactos.

## Complexity Tracking

Não há violações da constituição que exijam justificativa.
