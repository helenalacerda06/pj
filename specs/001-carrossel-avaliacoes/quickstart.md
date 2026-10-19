# Quickstart: Carrossel de avaliações recentes

## Pré-requisitos

- Node.js e npm instalados.
- Dependências do frontend instaladas em `my-app/`.
- Para validação integrada, acesso ao backend configurado no frontend e avaliações públicas disponíveis.

## Executar testes do frontend

```bash
cd my-app
npm test -- --watchAll=false
```

**Esperado**: a suíte termina sem falhas. Os testes da funcionalidade devem validar os cenários da seção abaixo.

## Executar a interface

```bash
cd my-app
npm start
```

**Esperado**: a aplicação abre no navegador; ao acessar a tela pública de avaliações, solicita a lista e apresenta os cards.

## Cenários de validação

1. **Sem avaliações**: a interface mostra um estado vazio e nenhum controle de navegação inoperante.
2. **Uma a três avaliações**: cada card aparece sem espaços preenchidos com conteúdo falso; não há mais de quatro cards simultâneos.
3. **Quatro ou mais avaliações**: quatro cards aparecem simultaneamente quando disponíveis; os controles do carrossel percorrem os demais cards da página.
4. **Limite de página**: com 15 avaliações, a página não oferece página seguinte. Com 16, a primeira página tem 15 cards e a próxima tem um, sem repetição ou lacuna.
5. **Ordem**: os cards e páginas seguem o ID decrescente da resposta pública, do mais recente ao mais antigo.
6. **Snapshot e recarga**: depois de carregar a tela, disponibilize uma avaliação mais recente. Navegar no carrossel e entre páginas não muda a lista; recarregar a página inclui a avaliação nova na posição apropriada.
7. **Erro**: faça a chamada falhar ou retornar HTTP não bem-sucedido; a interface mostra uma mensagem de erro distinta do estado vazio.
8. **Teclado**: percorra os controles com Tab e use Enter/Espaço para acionar; foco permanece visível e os controles têm nomes acessíveis.

Consulte [o modelo de dados](./data-model.md) para as regras de estados e paginação e [o contrato da interface](./contracts/avaliacoes-ui.md) para a API existente.
