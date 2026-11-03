# Guia de validação: Visualização detalhada de avaliações

## Pré-requisitos

- Node.js e npm disponíveis.
- Dependências do frontend instaladas em `my-app/`.
- Para conferir os dados reais, backend acessível e avaliações disponíveis.

## Executar os testes

```bash
cd my-app
npm test -- --watchAll=false
```

Para executar um teste específico durante o desenvolvimento, use o caminho do teste criado/alterado com o filtro de execução do Jest:

```bash
npm test -- --watchAll=false --runTestsByPath src/componentes/pages/cardsAva/caminho-do-teste.test.js
```

**Esperado**: os testes verificam a interação e os dados que aparecem na tela; não deve haver falhas.

## Executar a aplicação

```bash
cd my-app
npm start
```

Abra uma tela com cards de avaliações públicas ou pessoais e confira as jornadas a seguir.

## Cenários de validação manual

1. **Seleção do item**: abra detalhes de dois cards diferentes. Cada diálogo deve mostrar os dados do item acionado, sem conteúdo do anterior.
2. **Conteúdo existente**: confira nome, imagem, categoria, lançamento, duração, nota, descrição, feedback e principais pontos quando preenchidos.
3. **Fechamento**: feche pelo botão X e pela tecla Escape. O diálogo deve sumir, o carrossel deve continuar no mesmo ponto e o foco deve retornar ao acionador.
4. **Fundo inativo**: com detalhes abertos, tente interagir com os cards ao fundo; eles não devem receber a interação.
5. **Campos ausentes**: use um item sem imagem e com alguns campos vazios. Os campos preenchidos continuam acessíveis e nenhuma imagem quebrada aparece.
6. **Conteúdo extenso e tela estreita**: valide textos longos e uma janela de navegador estreita; o conteúdo deve continuar acessível por rolagem.
7. **Duas listas**: repita os cenários em avaliações públicas e pessoais.
8. **Regressão**: confirme que estado vazio, erro de carregamento, navegação do carrossel e tela de criação continuam funcionando.

Consulte [o modelo de dados](./data-model.md) para os campos e estados e [o contrato da interface](./contracts/avaliacao-detalhes-ui.md) para comportamento e acessibilidade detalhados.
