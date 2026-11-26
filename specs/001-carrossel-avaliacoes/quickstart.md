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
2. **Quantidade responsiva**: abaixo de 600px, aparece um card por vez; entre 600px e 1023px, dois; a partir de 1024px, quatro quando disponíveis. Com menos cards que o limite da tela, aparecem todos os disponíveis.
3. **Navegação**: com mais cards que a quantidade simultânea da tela, o carrossel permite percorrer o conjunto exibido.
4. **Limite do carrossel**: com 15 avaliações, todas aparecem no carrossel. Com 16 ou mais, aparecem somente as 15 mais recentes; as demais não aparecem nesta tela.
5. **Ordem**: os cards seguem o ID decrescente da resposta pública, do mais recente ao mais antigo.
6. **Snapshot e recarga**: depois de carregar a tela, disponibilize uma avaliação mais recente. Navegar no carrossel não muda a lista; recarregar a página inclui a avaliação nova na posição apropriada e mantém o limite de 15.
7. **Erro**: faça a chamada falhar ou retornar HTTP não bem-sucedido; a interface mostra uma mensagem de erro distinta do estado vazio.
8. **Teclado**: percorra os controles do carrossel com Tab e use as teclas de navegação; foco permanece visível e os controles têm nomes acessíveis.

Consulte [o modelo de dados](./data-model.md) para as regras do snapshot e do limite de cards e [o contrato da interface](./contracts/avaliacoes-ui.md) para a API existente.
