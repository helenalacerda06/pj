# Modelo de dados: Visualização detalhada de avaliações

## Avaliação

É o item já carregado e exibido em um card. A janela não cria nem persiste uma cópia da avaliação: recebe o item selecionado e o apresenta enquanto permanecer aberto.

| Campo | Uso na janela | Regra de apresentação |
|---|---|---|
| `id` | Identificar unicamente o card e manter associação com a avaliação escolhida | Obrigatório para identificar cada item da coleção; não precisa aparecer ao usuário |
| `nome` | Título da avaliação | Exibir o valor quando disponível |
| `imagem` | Imagem da obra | Exibir quando houver caminho válido; não deixar imagem quebrada quando ausente |
| `categoria` | Categoria da obra | Exibir quando disponível |
| `lancamento` | Data de lançamento | Exibir quando disponível |
| `duracao` | Duração | Exibir quando disponível |
| `estrelas` | Nota | Exibir como classificação visual quando disponível |
| `descricao` | Descrição | Exibir quando disponível |
| `feedback` | Opinião sobre a obra | Exibir quando disponível |
| `principais_pontos` | Principais pontos da avaliação | Exibir quando disponível |
| `data` | Data usada atualmente no card | Permanece na listagem; a especificação não exige exibi-la no detalhe |

## Estado da visualização

| Estado | Significado | Transição |
|---|---|---|
| Nenhuma avaliação selecionada | Diálogo fechado | Selecionar um card → avaliação selecionada |
| Avaliação selecionada | Diálogo aberto e vinculado a exatamente um item | Fechar pelo X ou Escape → nenhuma avaliação selecionada |

## Regras

- A avaliação selecionada deve ser o mesmo item associado ao card acionado, independentemente de a lista ser pública ou pessoal.
- Abrir outro card deve substituir a seleção anterior; dados de dois itens nunca são combinados.
- Fechar limpa a seleção temporária e não altera dados persistidos.
- Campos descritivos opcionais vazios não impedem que os outros campos sejam consultados; sua apresentação segue um marcador/placeholder legível do padrão visual.
- A ausência de imagem não deve resultar em URL de imagem quebrada.
- O estado de seleção é local à interface e não demanda alteração no banco ou no formato da API.
