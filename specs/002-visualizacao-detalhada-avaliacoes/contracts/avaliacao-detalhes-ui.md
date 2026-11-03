# Contrato da interface: detalhes de avaliação

## Escopo e integração

- A ação de abrir detalhes está disponível nos cards renderizados pelo carrossel compartilhado.
- O mesmo comportamento deve estar presente nas listas pública e pessoal, sem duplicação por página.
- Abrir a janela utiliza a avaliação que já está no card; não faz outra solicitação de dados.
- A lista, sua ordem, seu limite e a posição atual do carrossel permanecem preservados durante a consulta.

## Abrir e apresentar

- Acionar a área interativa do card abre um único diálogo centralizado sobre a lista.
- O diálogo apresenta exclusivamente os dados do card acionado, se disponíveis: nome, imagem, categoria, lançamento, duração, nota, descrição, feedback e principais pontos.
- A composição visual segue a prévia já existente em `criarAvaliacao/visualizacaoAvaliacao/visualizacaoAvaliacao.css`, respeitando a identidade visual e contraste legível.
- Campos vazios são identificados de forma clara, sem esconder os demais dados; uma imagem ausente não produz imagem quebrada.
- Conteúdo extenso pode ser percorrido com rolagem e não fica permanentemente inacessível em telas menores.

## Fechar e operar com acessibilidade

- Um botão com nome acessível equivalente a “Fechar detalhes” e ícone “X” fica no canto superior do diálogo.
- Escape também fecha a janela.
- Enquanto a janela está aberta, o conteúdo ao fundo não recebe interação.
- Ao fechar, o diálogo desaparece, o carrossel permanece no mesmo ponto e o foco volta ao card que abriu os detalhes.
- A área acionadora deve ser operável por teclado e ter indicação semântica apropriada. A implementação não deve criar botões interativos aninhados.

## Estados e erros

- Sem card selecionado, nenhum diálogo de detalhes é mostrado.
- Selecionar um card diferente apresenta apenas os dados do novo item.
- Se faltarem campos opcionais, a janela continua operável e mostra os demais dados sem erro.
- Falhas de carregamento da lista permanecem sob responsabilidade dos estados de erro já existentes; não são convertidas em detalhes ou em lista vazia pela janela.

## Verificações de aceitação

1. Abrir o primeiro e outro card em sequência e conferir título, categoria e conteúdo exclusivos de cada item.
2. Confirmar a presença dos campos de detalhe disponíveis e do ícone X na janela.
3. Fechar pelo X e por Escape; verificar lista, ponto do carrossel e retorno do foco.
4. Tentar acionar conteúdo do fundo com a janela aberta e confirmar que a lista está inativa.
5. Testar avaliações sem imagem ou com campos vazios e textos longos.
6. Repetir os casos nas listas pública e pessoal e em largura de tela estreita.
