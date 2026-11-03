# Pesquisa: Visualização detalhada de avaliações

## Carrossel compartilhado entre telas

- **Decision**: Integrar a abertura dos detalhes no componente reutilizado pelos cards e no carrossel comum, em vez de criar fluxos diferentes para cada tela.
- **Rationale**: `cardsAva/carouselAva.js` é utilizado por `cardsAva/paginasCardsAva.js` e `minhasAva/minhasAva.js`; os dados completos chegam às duas listas e o card recebe cada avaliação como propriedade.
- **Alternatives considered**: Implementar a janela separadamente em cada página — rejeitada por duplicar comportamento e permitir divergências.

## Dados disponíveis e origem

- **Decision**: Apresentar os dados da avaliação já carregada pelo card, sem fazer nova chamada ao servidor na abertura.
- **Rationale**: A tela pública já busca o conjunto e entrega cada item ao card; o contrato existente identifica `id`, `categoria`, `nome`, `descricao`, `feedback`, `principais_pontos`, `imagem`, `lancamento`, `duracao`, `estrelas` e `data`.
- **Alternatives considered**: Buscar novamente os detalhes por identificador — rejeitada para esta funcionalidade porque não há necessidade descrita e acrescentaria latência e estados de carregamento.

## Apresentação modal e acessibilidade

- **Decision**: Preferir o diálogo/modal do Material UI já presente nas dependências, se a inspeção durante implementação confirmar que atende ao padrão instalado; fornecer rótulo acessível, fechamento por Escape, isolamento das interações de fundo e retorno do foco ao card.
- **Rationale**: A funcionalidade exige comportamento modal e a aplicação já usa Material UI. O foco e o teclado são requisitos do contrato do produto e da Constituição.
- **Alternatives considered**: Criar um modal manual só com CSS e eventos — rejeitada como primeira opção por duplicar comportamentos complexos de foco, teclado e fundo inativo.

## Padrão visual e responsividade

- **Decision**: Usar a prévia de `criarAvaliacao.js` e suas classes CSS como referência de composição; adequar a janela de detalhes para altura disponível, rolagem e largura móvel sem alterar a lista de cards.
- **Rationale**: Esse é o padrão visual indicado pelo usuário e já contém áreas para imagem, informações classificatórias e textos de avaliação.
- **Alternatives considered**: Criar um desenho visual independente — rejeitado por duplicar estilos e fugir do padrão existente.

## Testes

- **Decision**: Adicionar testes de interação com Jest e React Testing Library junto às superfícies de card/lista já cobertas, incluindo os consumidores público e pessoal do carrossel.
- **Rationale**: O frontend já usa essas ferramentas e os testes existentes verificam dados observáveis na tela e estados de carregamento.
- **Alternatives considered**: Validar somente por inspeção manual — insuficiente para garantir que cards diferentes mostrem sempre os dados corretos e que acessibilidade básica continue funcionando.
