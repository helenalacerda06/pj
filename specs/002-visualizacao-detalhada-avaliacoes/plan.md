# Implementation Plan: Visualização detalhada de avaliações

**Branch**: `CarouselCards` | **Date**: 2026-10-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-visualizacao-detalhada-avaliacoes/spec.md`

## Summary

Permitir abrir e fechar uma janela de detalhes a partir de qualquer card do carrossel, mostrando exclusivamente os dados da avaliação escolhida. O plano reutiliza o carrossel compartilhado entre as telas pública e pessoal e o padrão visual já aplicado à prévia de criação. A abertura usa os dados já carregados no card, sem uma nova consulta ao servidor.

## Technical Context

**Language/Version**: JavaScript; React 19.2.7

**Primary Dependencies**: Material UI 9.4.0, já usada nos cards; Create React App 5.0.1; Swiper 14.3.0

**Storage**: N/A; a avaliação selecionada é estado temporário de interface.

**Testing**: Jest e React Testing Library, executados pelos scripts existentes de `my-app/package.json`.

**Target Platform**: Aplicação web React em navegadores desktop e móveis.

**Project Type**: Aplicação web com frontend React e API existente.

**Performance Goals**: A janela deve aparecer sem nova chamada à API e em até 1 segundo na experiência normal, conforme SC-002.

**Constraints**: Manter o limite e a ordem atuais do carrossel; mostrar os campos presentes no objeto já recebido; não alterar a criação de avaliações; manter identidade visual, rolagem em telas pequenas, operação por teclado e foco acessível.

**Scale/Scope**: Um detalhe por vez para qualquer card atualmente renderizado no carrossel compartilhado nas telas pública e pessoal.

## Constitution Check

- **Approved Technology Stack**: PASS — manter React e dependências já utilizadas pelo frontend.
- **Clear Responsibility and Reuse**: PASS — inspecionar e integrar o comportamento no carrossel/card reutilizado, evitando duas implementações para as listas pública e pessoal. Usar o padrão visual da prévia já existente.
- **Accessible, Legible Interface**: PASS — a janela deve ter semântica de diálogo, fechamento por teclado, foco controlado e conteúdo responsivo mantendo o contraste do projeto.
- **Safe Backend and Behavior Preservation**: PASS — não adicionar chamadas nem alterar APIs; preservar lista, paginação/carrossel e formulário de criação.
- **Simplicity and Maintainability**: PASS — estado local de seleção e uma única apresentação de detalhes atendem ao escopo; não há necessidade de nova persistência.

**Gate result**: PASS. A solução fica dentro do stack e dos comportamentos existentes, sem justificativas de complexidade ou exceções necessárias.

## Project Structure

### Documentation (this feature)

```text
specs/002-visualizacao-detalhada-avaliacoes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── avaliacao-detalhes-ui.md
└── tasks.md
```

### Source Code (repository root)

```text
my-app/src/componentes/pages/
├── cardsAva/
│   ├── cardsMaisAva.js            # Apresentação e acionamento do card
│   ├── cardsAva.css               # Estilo do card
│   ├── carouselAva.js             # Lista compartilhada entre telas
│   ├── paginasCardsAva.js         # Lista pública
│   └── paginasCardsAva.test.js    # Testes da tela pública
├── minhasAva/
│   ├── minhasAva.js               # Lista pessoal que reutiliza o carrossel
│   └── minhasAva.test.js          # Testes da tela pessoal
└── criarAvaliacao/
    ├── criarAvaliacao.js          # Prévia atual usada como referência
    └── visualizacaoAvaliacao/
        └── visualizacaoAvaliacao.css
```

**Structure Decision**: A interação começa na implementação reutilizada do card/carrossel em `cardsAva/`, alcançando as duas listas que consomem `CarouselAva`. Os estilos detalhados existentes ficam como referência visual; qualquer compartilhamento adicional de apresentação deve ser decidido após comparar o JSX da prévia com os dados do card, sem refatorar o formulário além do necessário.

## Sequência didática da implementação

1. **Rastrear os dados e os pontos de reutilização** — comparar os campos recebidos pela lista, o componente do card, as duas telas que usam o carrossel e a prévia de criação. Conceito: *props* são dados que um componente recebe do componente que o utiliza. Isso ajuda a descobrir em qual nível todos os cards podem ganhar o mesmo comportamento.
2. **Representar qual avaliação está aberta** — usar um estado local que começa sem seleção e recebe a avaliação clicada. Conceito: `useState` guarda informação que muda durante o uso; em React, mudar o estado pede uma nova renderização. A própria avaliação selecionada pode representar tanto qual conteúdo exibir quanto se a janela está aberta.
3. **Ligar o card à seleção de forma acessível** — tornar a área que abre detalhes acionável por mouse e teclado sem aninhar controles interativos. Conceito: um manipulador de evento responde a uma ação, enquanto a semântica correta permite que tecnologias assistivas reconheçam a ação.
4. **Apresentar o detalhe com uma janela modal** — exibir apenas o objeto selecionado e reutilizar os nomes/campos e a identidade visual da prévia existente. Conceito: renderização condicional mostra a janela somente quando há uma seleção; propriedades levam os dados selecionados à apresentação.
5. **Fechar e devolver o foco** — limpar a seleção ao fechar, aceitar o “X” e a tecla Escape, bloquear interações no fundo e retornar o foco ao acionador. Conceito: fechar é outra transição de estado; foco indica onde o teclado continuará atuando.
6. **Ajustar telas e dados opcionais** — conferir rolagem, textos longos, imagem ausente e campos vazios em tamanhos diferentes. Conceito: CSS responsivo adapta a apresentação sem alterar o conteúdo de negócio.
7. **Validar os dois usos compartilhados** — testar abrir cada item, trocar de seleção, fechar por botão/teclado e confirmar que listas pública e pessoal continuam funcionando. Conceito: testes de interface simulam ações reais e verificam resultados observáveis, em vez de depender de detalhes internos.

**Constitution Check após o design**: PASS — o desenho preserva responsabilidades, reaproveita o carrossel existente, limita a mudança à interface e inclui acessibilidade e testes.

## Complexity Tracking

Nenhuma violação da Constituição ou estrutura adicional fora do escopo foi identificada.
