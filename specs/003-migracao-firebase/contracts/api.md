# Contrato da API — Migração de dados e contas

**Base**: API Express no Render. Payloads JSON salvo uploads `multipart/form-data`.  
**Autenticação**: Nas rotas protegidas, o cabeçalho `Authorization` carrega um Firebase ID token no esquema de token padrão.  
**Erros**: JSON com mensagem de erro sem detalhes internos, senha, token ou credencial. Erro nunca retorna sucesso parcial.

## Perfil

### `POST /usuario/firebase`

Cria ou finaliza perfil complementar da conta autenticada. UID e e-mail devem ser obtidos do token/conta verificados, não confiados do corpo.

- Requer ID token Firebase válido.
- Corpo: `{ "nome": string, "aniversario": string }`.
- Sucesso: `201` com `{ "mensagem": string, "uid": string }`.
- Erros: `400` entrada inválida; `401` token ausente/inválido; `409` perfil conflitante; `500` falha explícita de persistência.

### `GET /usuario/firebase`

Retorna apenas o perfil do UID autenticado.

- Requer ID token Firebase válido.
- Não aceita ID numérico nem UID alternativo para ler outro perfil.
- Sucesso `200`: `{ "uid": string, "nome": string, "email": string, "aniversario": string }`.
- Erros: `401` token inválido; `404` perfil não localizado; `500` falha explícita.

## Avaliações

### `GET /avaliacao`

Lista avaliações públicas com os campos consumidos nos cards/detalhes: `id` (document ID), `usuarioUid`, `categoria`, `nome`, `descricao`, `feedback`, `principais_pontos`, `imagemUrl`, `lancamento`, `duracao`, `estrelas`, `dataCriacao`.

- Sem autenticação se mantida como listagem pública atual.
- Ordenação decrescente de criação; limite conforme comportamento atual da interface.
- `200` retorna array JSON, inclusive vazio. `500` retorna erro JSON explícito.

### `POST /avaliacao`

Cria avaliação pelo UID autenticado e, opcionalmente, um arquivo de imagem.

- Requer ID token Firebase válido.
- Conteúdo multipart com campos da entidade avaliação; `usuarioUid` enviado pelo cliente é ignorado/rejeitado e não altera autoria.
- Imagem opcional; validar tipo real e limite do Cloudinary Free de 10 MB por imagem antes de confirmar criação. Confirmar política de bytes e quota de crédito configurada no ambiente.
- Sucesso `201`: `{ "mensagem": string, "id": string, "imagemUrl": string | null }`.
- Se upload ou gravação falhar, não deixar estado de sucesso parcial sem um comportamento de compensação definido e testado; falha na exclusão compensatória de ativo órfão entra no relatório de exceção.
- Erros: `400` campos/arquivo inválidos; `401` sem token; `413` imagem acima de 10 MB; `429` upload pausado por limite/quota Free; `502/503` provedor indisponível ou conta bloqueada; `500` falha inesperada.

### `GET /avaliacoes_usuario`

Lista avaliações do UID autenticado; substitui a rota antiga baseada em ID numérico.

- Requer ID token Firebase válido.
- Não aceita UID arbitrário; usa somente UID do token.
- `200` array em ordem decrescente de criação; mantém limite visual atual (15 cards na página pessoal).
- `401` sem token; `500` falha explícita.

## Administração

Os caminhos existentes são preservados:

### `GET /admin/avaliacoes`

Retorna avaliações e os campos de autoria administrativa já previstos.

### `GET /admin/usuarios`

Retorna nome, e-mail e aniversário, sem senha ou credenciais.

Ambas as rotas exigem ID token válido e `admin: true` em custom claim conferida pelo backend. Claims só podem ser definidas por processo confiável no backend. Um campo enviado no frontend não concede permissão. Erros de autorização retornam `401` (token inválido/ausente) ou `403` (usuário válido sem claim).

## Rotas legadas em descontinuação

- `POST /usuario`, `GET /usuario/:id`, `POST /login`, `POST /avaliacoes_usuario` e `GET /avaliacoes_usuarios/:id_usuario` são dependências SQLite/ID numérico.
- Remover somente após troca dos consumidores, verificação de inexistência de cliente externo em uso, testes aprovados e validação em produção.
- As rotas `/admin/*` não podem ser removidas nem renomeadas nesta migração.

## Contrato de ambiente

- Frontend: `REACT_APP_API_URL`, `REACT_APP_FIREBASE_*` no build correspondente ao ambiente.
- Backend: `PORT`, `CORS_ORIGINS`, credencial Firebase Admin e credenciais Cloudinary apenas como variáveis/secret files de servidor.
- Não publicar segredos em bundle `REACT_APP_*`, logs, relatórios ou respostas.
- Produção não pode usar fallback `localhost`; URL incorreta/missing deve falhar de modo explícito no build/deploy ou health-check.
