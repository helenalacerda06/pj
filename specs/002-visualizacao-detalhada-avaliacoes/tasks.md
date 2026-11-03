# Tasks: Visualização detalhada de avaliações

**Input**: Documentos de design em `specs/002-visualizacao-detalhada-avaliacoes/`

**Pré-requisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md` e `contracts/avaliacao-detalhes-ui.md`

**Organização**: Tarefas agrupadas por história de usuário para que cada etapa entregue um comportamento verificável.

## Formato das tarefas

Cada tarefa tem um identificador sequencial, caminho de arquivo e objetivo. `[P]` marca tarefas que podem ser feitas em paralelo com outra tarefa marcada `[P]`, pois atuam em arquivos diferentes e não dependem uma da outra. `[US1]` e `[US2]` ligam a tarefa às histórias da especificação.

## Fase 1: Setup

**Objetivo**: Preparar dependências ou estrutura compartilhada antes da funcionalidade.

Não é necessária uma tarefa de setup: React, Material UI, Jest e React Testing Library já estão configurados em `my-app/package.json`.

## Fase 2: Fundação

**Objetivo**: Criar pré-requisitos que bloqueiem todas as histórias.

Não é necessária uma alteração de fundação: o carrossel compartilhado já recebe os dados completos das avaliações, e a janela não exige mudança de API, banco de dados ou dependências.

---

## Fase 3: História 1 - Consultar os detalhes de uma avaliação (Prioridade: P1)

**Objetivo**: Abrir, a partir de qualquer card, uma janela com apenas os dados da avaliação selecionada e um botão X para voltar à lista.

**Teste independente**: Com dois ou mais cards, abrir cada um e conferir que nome e demais campos exibidos pertencem ao item escolhido; fechar pelo X e confirmar que a lista permanece no mesmo ponto.

### Testes da História 1

- [X] T001 [US1] Criar testes de interação em `my-app/src/componentes/pages/cardsAva/carouselAva.test.js` para abrir cards diferentes e verificar que o detalhe apresenta exclusivamente os dados de cada avaliação, incluindo os campos disponíveis, e que o X fecha a janela.

### Implementação da História 1

- [X] T002 [P] [US1] Tornar a área principal do card em `my-app/src/componentes/pages/cardsAva/cardsMaisAva.js` um acionador acessível por mouse e teclado que informe ao componente pai qual avaliação foi selecionada, mantendo ações internas separadas.
- [X] T003 [P] [US1] Criar `my-app/src/componentes/pages/cardsAva/visualizacaoDetalhesAvaliacao.js` para apresentar, a partir da propriedade `avaliacao`, nome, imagem, categoria, lançamento, duração, nota, descrição, feedback e principais pontos quando disponíveis, seguindo a composição da prévia existente.
- [X] T004 [P] [US1] Adicionar em `my-app/src/componentes/pages/cardsAva/cardsAva.css` os estilos da janela de detalhes, preservando a identidade visual e permitindo rolagem em telas estreitas ou com textos longos.
- [X] T005 [US1] Guardar a avaliação selecionada e exibir uma única janela centralizada em `my-app/src/componentes/pages/cardsAva/carouselAva.js`, conectando o acionador do card ao componente de detalhes e incluindo o botão X que limpa a seleção.

**Checkpoint**: A pessoa consegue abrir qualquer card, consultar os dados corretos e fechar a janela pelo X sem perder o ponto do carrossel.

---

## Fase 4: História 2 - Fechar os detalhes e continuar navegando (Prioridade: P2)

**Objetivo**: Tornar a janela modal operável por teclado e assegurar que a navegação retorne ao card de origem, sem permitir interação com os cards ao fundo.

**Dependência**: Requer a janela e a seleção da História 1.

**Teste independente**: Abrir um card pelo teclado, fechar com Escape e confirmar que o diálogo some, o foco retorna ao acionador e os cards do fundo não podem ser acionados enquanto a janela está aberta.

### Testes da História 2

- [X] T006 [US2] Ampliar `my-app/src/componentes/pages/cardsAva/carouselAva.test.js` para verificar o nome acessível do botão X, fechamento com Escape, bloqueio de interação no fundo e retorno do foco ao card acionado.

### Implementação da História 2

- [X] T007 [US2] Completar o comportamento modal e o fechamento acessível em `my-app/src/componentes/pages/cardsAva/carouselAva.js`, conectando o fechamento do diálogo ao estado selecionado e garantindo Escape, conteúdo de fundo inativo e restauração do foco ao acionador.

**Checkpoint**: X e Escape fecham a janela; o foco retorna ao card original e o carrossel não muda de posição.

---

## Fase 5: Polish e validação entre telas

**Objetivo**: Confirmar que o comportamento compartilhado atende às duas listas e que os fluxos existentes permanecem intactos.

- [X] T008 [P] Executar os testes de `my-app/src/componentes/pages/cardsAva/paginasCardsAva.test.js` e `my-app/src/componentes/pages/minhasAva/minhasAva.test.js` junto aos testes do card, corrigindo regressões no comportamento público ou pessoal.
- [X] T009 [P] Seguir os cenários de `specs/002-visualizacao-detalhada-avaliacoes/quickstart.md` para conferir campos ausentes, imagem ausente, textos longos, tela estreita e continuidade da navegação em ambas as listas.

## Dependências e ordem de execução

### Dependências entre fases

- **Setup (Fase 1)**: já atendido pelo projeto; nenhuma instalação é necessária.
- **Fundação (Fase 2)**: já atendida pelo carrossel e pelos dados existentes; nenhuma alteração de API ou armazenamento é necessária.
- **História 1 (Fase 3)**: independente de outras histórias; entrega a visualização principal.
- **História 2 (Fase 4)**: depende da História 1 porque aprimora a janela que ela cria.
- **Polish (Fase 5)**: depende das histórias implementadas.

### Ordem das tarefas

1. Concluir T001 antes da implementação para registrar o comportamento esperado e identificar o que ainda falta.
2. T002, T003 e T004 podem ser trabalhadas em paralelo após T001: acionador, conteúdo da janela e estilo têm arquivos distintos.
3. T005 integra o acionador e a apresentação; depende de T002 e T003.
4. Concluir T006 antes de T007 para verificar os comportamentos de teclado e foco.
5. T007 depende de T005 e T006.
6. T008 e T009 podem ser feitos em paralelo após as duas histórias.

### Oportunidades de paralelismo

- **História 1**: após T001, T002, T003 e T004 são paralelizáveis; T005 integra o trabalho.
- **História 2**: o teste T006 precede T007; não há paralelismo dentro desta história.
- **Validação final**: T008 (testes automatizados) e T009 (cenários manuais) são independentes.

## Estratégia de implementação

### MVP

1. Fazer T001 para fixar como reconhecer a avaliação certa na janela.
2. Fazer T002–T005 para abrir os detalhes do card selecionado e fechar pelo X.
3. Validar o checkpoint da História 1 antes de seguir.

O X faz parte do MVP porque uma janela de consulta precisa oferecer um meio visível de voltar à lista. Escape, foco e bloqueio do fundo são concluídos na História 2.

### Entrega incremental

1. **História 1**: disponibiliza a consulta dos dados e o fechamento pelo X.
2. **História 2**: completa a experiência modal para teclado e foco acessível.
3. **Polish**: confirma o uso nas listas pública e pessoal e os casos de tela pequena e dados incompletos.

## Notas para aprender durante a implementação

- **Props**: a avaliação selecionada passa de um componente para outro; por isso, o detalhe recebe uma propriedade chamada `avaliacao`.
- **Estado React**: o carrossel guarda a avaliação atualmente selecionada. Sem seleção, não há janela; com seleção, a janela mostra aquele item.
- **Eventos**: o acionador do card comunica a seleção ao carrossel; o botão X e Escape comunicam o fechamento.
- **Renderização condicional**: a janela aparece somente enquanto houver uma avaliação selecionada.
- **Acessibilidade**: um diálogo modal controla o foco e o teclado; o foco deve voltar à origem depois que a consulta termina.
