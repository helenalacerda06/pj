# Modelo de dados: Migração de dados e contas

**Status**: Modelo proposto para implementação, conforme [especificação](./spec.md) e [pesquisa](./research.md).

## Entidades alvo

### Conta de autenticação

Autenticada por Firebase Authentication. Não é uma coleção de perfil nem recebe senha importada.

| Atributo | Tipo | Regras |
| --- | --- | --- |
| `uid` | string | Identificador Firebase imutável; único. |
| `email` | string | E-mail da conta; associação com dados legados exige e-mail verificado. |
| `emailVerified` | boolean | Deve estar verdadeiro antes de associar dados legados ao UID. |
| `customClaims.admin` | boolean opcional | Permissão administrativa definida exclusivamente por processo confiável no backend. Não aceitar valor vindo do cliente. |

Senhas legadas não entram nesta entidade. Conta legada com senha não reconhecida requer criação/verificação ou redefinição de senha pelo fluxo Firebase.

### Perfil — `usuarios/{uid}`

Um perfil complementar por conta Firebase. ID do documento igual ao UID.

| Campo | Tipo | Regras |
| --- | --- | --- |
| `uid` | string | Igual ao ID do documento. Obrigatório. |
| `nome` | string | Nome de exibição; validar tamanho/formato conforme formulário. |
| `email` | string | E-mail de perfil; sincronizado com conta após validação. |
| `aniversario` | string ISO date ou vazio | Campo opcional conforme legado/formulário. |
| `criadoEm` | Firestore Timestamp | Data original preservada quando verificável; usar data de importação identificada nos casos ausentes, com exceção no relatório. |

Não armazenar senha, ID token, service account, segredo de upload ou campo de role no perfil do cliente.

### Avaliação — `avaliacoes/{documentId}`

Um documento para cada avaliação. `usuarioUid` é o autor canônico do fluxo atual. A coleção de vínculos mantém o relacionamento legado verificável e permite conferir possíveis duplicidades/orfandades da antiga tabela join.

| Campo | Tipo | Regras |
| --- | --- | --- |
| `usuarioUid` | string | UID Firebase do autor. Obrigatório; derivado do token no CRUD novo. |
| `nome` | string | Valor do formulário atual; não apagar texto existente. |
| `descricao` | string | Campo de texto existente, pode estar vazio se origem permitir. |
| `feedback` | string | Campo de texto existente, pode estar vazio se origem permitir. |
| `principais_pontos` | string | Campo de texto existente, pode estar vazio se origem permitir. |
| `imagemUrl` | string ou null | URL durável no Cloudinary; ausência permitida. |
| `imagemPublicId` | string ou null | Identificador do ativo para conferência/migração e eventual operação futura; segredo não é incluído. |
| `categoria` | string | Valores atuais do formulário: `Filme`, `Série`, `Livro`; preservar registros legados fora da lista como exceções, sem descarte. |
| `estrelas` | number | Preservar frações de meia estrela; validar faixa suportada pelo componente. |
| `lancamento` | string `YYYY-MM-DD` ou vazio | Preservar valor do input `date`; não converter com afinidade SQLite INTEGER. |
| `duracao` | string `HH:mm` ou vazio | Preservar valor do input `time`; não converter com afinidade SQLite INTEGER. |
| `dataCriacao` | Firestore Timestamp | Usar data do vínculo legado validada; se ausente/inválida, registrar exceção e aplicar fallback explícito de importação. |
| `origemId` | string opcional | Referência técnica/hash determinístico de origem para importação idempotente; nunca usado como autorização nem exposto como UID legado do cliente. |

O ID do documento é a identidade da avaliação. IDs antigos servem apenas à reconciliação e não devem ser usados pelo cliente após o período de migração.

### Vínculo de usuário e avaliação — `avaliacoes_usuario/{linkDocumentId}`

Um documento por linha SQLite para preservar e reconciliar a tabela `avaliacoes_usuario`; a chave determinística deriva da identidade da linha de origem, não apenas do par usuário-avaliação. Usar `rowid` na cópia imutável se disponível; caso contrário, combinar hash da linha canônica com ordinal determinístico entre duplicatas idênticas. É registro de associação, não permissão declarada pelo cliente.

| Campo | Tipo | Regras |
| --- | --- | --- |
| `usuarioUid` | string | UID Firebase verificado da conta associada. |
| `avaliacaoId` | string | ID do documento na coleção `avaliacoes`. |
| `dataCriacao` | Firestore Timestamp | Data preservada do vínculo; vínculo sem data válida gera exceção auditada. |
| `origemId` | string opcional | Identificador/hash da linha de origem para idempotência e reconciliação somente; não usar como autorização nem expor como ID de usuário/avaliação. |

Cada avaliação criada no novo fluxo grava avaliação e vínculo coerente numa única operação de escrita atômica Firestore. Uma avaliação com mais de um vínculo legado preserva todos os vínculos na coleção e entra como exceção para confirmar a autoria canônica antes de exposição em listas pessoais.

### Ativo de imagem

Arquivo de mídia gerenciado pelo Cloudinary Free, associado a uma avaliação por `imagemUrl` e `imagemPublicId`.

- O upload é opcional e deve validar tipo real de mídia e tamanho antes de envio.
- Segredo Cloudinary fica somente no backend.
- A URL de entrega não pode apontar para diretório temporário Render.
- Cota de crédito é compartilhada; uploads novos devem parar se o limite aprovado for excedido.
- Falha de upload não pode retornar sucesso de avaliação com URL inválida.

### Relatório de migração

Artefato de processo local, não é documento de produto nem fonte de autorização.

| Campo conceitual | Conteúdo |
| --- | --- |
| `runId` | Identificador e instante da execução, sem segredo. |
| `source` | Identificador da fonte aprovada, não expor caminho/credencial desnecessariamente. |
| `counts` | Totais de origem, elegíveis, importados e exceções por usuários, avaliações, vínculos e imagens. |
| `records` | Referência técnica aos registros migrados, sem senha/token; não guardar e-mail se não for necessário para auditoria aprovada. |
| `exceptions` | ID legado/referência, classe de exceção e ação pendente; sem credencial ou dado sensível não necessário. |
| `approval` | Responsável/data de aprovação da conferência e da liberação, registrados fora de logs de segredo. |

## Relacionamentos

- Um UID de autenticação tem um perfil `usuarios/{uid}`.
- Uma conta pode ter zero ou muitos vínculos em `avaliacoes_usuario`.
- Cada avaliação ativa tem um UID autor validado e um vínculo canônico; vínculos múltiplos são preservados e bloqueiam associação automática até revisão.
- Cada avaliação pode ter zero ou um ativo de imagem.
- Admin é uma permissão da conta Firebase via custom claim, não uma relação de perfil e não um campo controlado pelo frontend.

## Mapeamento de origem

| SQLite | Firestore/Auth | Migração |
| --- | --- | --- |
| `usuarios.id` | UID resolvido por e-mail verificado | ID temporário para mapping; nunca exposto como identidade permanente. |
| `usuarios.nome`, `email`, `aniversario` | `usuarios/{uid}` | Preservar campos aplicáveis; `email` precisa corresponder à conta validada. |
| `usuarios.senha` | Nenhum campo de destino | Não ler para relatório nem importar. Classificar somente em análise segura; exigir fluxo de nova senha Firebase. |
| `avaliacao.id` | `avaliacoes/{documentId}` + origem temporária | Gerar ID determinístico não numérico a partir da chave de origem; preservar mapeamento para idempotência/reconciliação; não depender do número após corte. |
| Campos `categoria`, `nome`, `descricao`, `feedback`, `principais_pontos`, `imagem`, `lancamento`, `duracao`, `estrelas` | Campos de mesmo sentido na entidade Avaliação | Tratar `imagem` por migração de arquivo; datas/duração/estrelas conforme valores observados, não declaração SQLite. |
| `avaliacoes_usuario.id_usuario`, `id_avaliacao`, `data_criacao` | `avaliacoes_usuario/{linkDocumentId}` com `usuarioUid`, `avaliacaoId`, `dataCriacao` | Gerar ID determinístico por linha de origem (incluindo identificador estável da linha ou hash e ordinal de duplicata), validar ambos lados; preservar cada linha e registrar vínculos duplicados/inconsistentes como exceções. |

## Invariantes de validação

1. Nenhum UID de perfil/avaliação é escolhido pelo cliente como autoridade; deriva da identidade autenticada.
2. Associação de legado é permitida somente após `emailVerified` e correspondência única e aprovada.
3. Admin API exige token Firebase válido e claim administrativa verdadeira no backend.
4. Perfil não contém senha ou segredo; relatório não contém credenciais.
5. Avaliação não pode ser considerada importada se sua referência de imagem obrigatória conforme origem não foi validada; exceções explícitas são necessárias.
6. Falhas de importação são registradas e reexecutáveis; execução repetida não cria duplicatas e nunca apaga origem.
7. Limpeza do legado é operação posterior, separada e sujeita a aprovação.
