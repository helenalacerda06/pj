---

description: "Tarefas de implementação da migração SQLite para Firebase"
---

# Tasks: Migração de dados e contas

**Input**: Artefatos de design em `/specs/003-migracao-firebase/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api.md`, `quickstart.md`

**Tests**: Incluídos porque a especificação exige aprovação integral dos testes funcionais e de segurança antes da publicação e da limpeza do SQLite.

**Organization**: Tarefas agrupadas pelas três histórias de usuário da especificação. A limpeza do legado é uma fase final, separada e sujeita a gates de aprovação.

## Fase 1: Setup

**Objetivo**: Preparar configuração local/de produção e comandos de validação sem ativar serviços pagos nem alterar dados legados.

- [X] T001 Criar modelos de variáveis sem segredos em `my-app/.env.development.example`, `my-app/.env.production.example` e `back-end/.env.example`, documentando `REACT_APP_API_URL`, `REACT_APP_FIREBASE_*`, `PORT`, `CORS_ORIGINS` e segredos exclusivos do backend.
- [X] T002 Criar ou ajustar o comando `npm test` baseado em `node:test` em `back-end/package.json`, sem remover dependências SQLite enquanto houver referências ativas.
- [ ] T003 Registrar no `README.md` os comandos existentes do frontend/backend e os pré-requisitos da Emulator Suite, sem incluir credenciais reais ou arquivos de serviço.

## Fase 2: Fundacional

**Objetivo**: Entregar infraestrutura compartilhada que bloqueia o trabalho das histórias até que autenticação, configuração e ambiente de teste sejam consistentes.

- [X] T004 Implementar configuração centralizada e validação fail-fast das variáveis de ambiente em `my-app/src/services/api.js` e `my-app/src/firebase/config.js`, impedindo fallback de `localhost` em produção.
- [X] T005 Implementar cliente compartilhado de API com obtenção do Firebase ID token e cabeçalho `Authorization` em `my-app/src/services/api.js`, preservando erros HTTP explícitos.
- [X] T006 Fortalecer a verificação de Firebase ID token e disponibilizar UID autenticado às rotas protegidas em `back-end/autenticarUsuario.js`, sem aceitar identidade do corpo, query ou `localStorage`.
- [X] T007 Configurar CORS por `CORS_ORIGINS`, validação de configuração Firebase Admin e rejeição de variáveis de emulador em produção em `back-end/index.js` e `back-end/firebase.js`.
- [X] T008 Configurar Authentication/Firestore Emulator Suite isolada em `firebase.json` e scripts de execução em `back-end/package.json`, garantindo que os testes não usem projeto nem usuários de produção.
- [X] T009 Criar helpers de teste isolados para tokens e Firestore em `back-end/tests/helpers/firebaseEmulator.js`, sem inserir credenciais ou desligar verificações de produção.

## Fase 3: História 1 — Acessar a conta e o próprio perfil (P1)

**Goal**: Cadastro, login, recuperação/verificação de acesso, leitura de perfil e logout usam Firebase Authentication e o UID autenticado.

**Independent Test**: Criar conta de teste, verificar e-mail, abrir perfil, encerrar sessão e autenticar novamente; em outra conta, confirmar que nenhum perfil privado é retornado.

### Testes da História 1

- [X] T010 [P] [US1] Criar testes frontend de cadastro, login, sessão encerrada, recuperação/verificação por e-mail e ausência de senha legada em `my-app/src/componentes/auth.test.js`.
- [X] T011 [P] [US1] Criar testes de contrato do perfil para token ausente/inválido, UID próprio, UID alternativo e persistência em `back-end/tests/contract/perfil.test.js`.
- [X] T012 [P] [US1] Criar testes de integração Authentication/Firestore para isolamento de perfil entre duas contas em `back-end/tests/integration/perfil.test.js`.

### Implementação da História 1

- [X] T013 [US1] Implementar leitura e persistência de perfil em `back-end/services/perfilService.js`, usando documento `usuarios/{uid}` e validando `nome` como “Nome de exibição; validar tamanho/formato conforme formulário”, `email` sincronizado à conta verificada e `aniversario` como “string ISO date ou vazio”.
- [X] T014 [US1] Implementar `POST /usuario/firebase` e `GET /usuario/firebase` protegidas pelo middleware em `back-end/index.js`, derivando UID/e-mail do token verificado e retornando erros previstos em `specs/003-migracao-firebase/contracts/api.md`.
- [X] T015 [US1] Integrar criação/verificação de conta Firebase e gravação do perfil, com erro explícito e possibilidade de retomar se a persistência falhar, em `my-app/src/componentes/cadastrar.js` e `my-app/src/firebase/auth.js`.
- [X] T016 [US1] Substituir login SQLite por Firebase Authentication e remover armazenamento/consulta de `id_usuario` em `my-app/src/componentes/login.js` e `my-app/src/firebase/auth.js`.
- [X] T017 [US1] Buscar e exibir somente o perfil da sessão Firebase e conectar a ação visível de logout a `signOut` em `my-app/src/componentes/Header.js`.
- [X] T018 [US1] Implementar fluxos de verificação de e-mail e redefinição de senha sem reutilizar, ler ou registrar senhas legadas em `my-app/src/firebase/auth.js` e `my-app/src/componentes/login.js`.
- [ ] T019 [US1] Executar os testes de T010–T012 e validar isolamento de duas contas, persistência de perfil e encerramento real da sessão em `my-app/src/componentes/auth.test.js` e `back-end/tests/`.

## Fase 4: História 2 — Publicar e consultar avaliações (P1)

**Goal**: Criar avaliações com autoria da identidade autenticada, listar avaliações públicas e pessoais, exibir detalhes e manter imagens duráveis no plano gratuito autorizado.

**Independent Test**: Publicar avaliação autenticada com imagem de até 10 MB e confirmar listagem pública, ordenação recente, detalhes e lista pessoal de até 15 itens; negar autoria falsificada, upload acima do limite e acesso pessoal por outra conta.

### Testes da História 2

- [X] T020 [P] [US2] Criar testes backend de autoria, validação, criação atômica de avaliação/vínculo e falhas Firestore em `back-end/tests/contract/avaliacao.test.js`.
- [X] T021 [P] [US2] Criar testes de integração para lista pública, ordem decrescente, lista pessoal isolada e limite de 15 itens em `back-end/tests/integration/avaliacoes.test.js`.
- [X] T022 [P] [US2] Criar testes de upload para tipo inválido, arquivo acima de 10 MB, quota indisponível e compensação de ativo órfão em `back-end/tests/contract/imagem.test.js`.
- [X] T023 [P] [US2] Criar testes frontend de criação, listagem, detalhes, lista pessoal, URL da imagem e estados de erro em `my-app/src/componentes/pages/avaliacoes.test.js`.

### Implementação da História 2

- [X] T024 [US2] Implementar persistência Firestore de avaliações e vínculo `avaliacoes_usuario` atômicos em `back-end/services/avaliacaoService.js`; validar `categoria` com valores atuais `Filme`, `Série`, `Livro`, `estrelas` conforme faixa suportada pelo componente, `lancamento` como `YYYY-MM-DD` ou vazio e `duracao` como `HH:mm` ou vazio.
- [X] T025 [US2] Implementar consulta pública ordenada por `dataCriacao` decrescente, projeção dos campos do contrato e tratamento de datas/imagens ausentes em `back-end/services/avaliacaoService.js`.
- [X] T026 [US2] Implementar consulta pessoal exclusivamente pelo UID autenticado e limite atual de 15 cartões em `back-end/services/avaliacaoService.js`.
- [X] T027 [US2] Implementar serviço Cloudinary servidor-a-servidor em `back-end/services/imagemService.js`, validar tipo real e limite de 10 MB, parar uploads quando a quota Free aprovada estiver indisponível e não habilitar cartão, addon ou upgrade.
- [X] T028 [US2] Implementar `GET /avaliacao`, `POST /avaliacao` e `GET /avaliacoes_usuario` em `back-end/index.js`, seguindo autenticação, autoria e códigos de erro de `specs/003-migracao-firebase/contracts/api.md`.
- [X] T029 [US2] Migrar envio de avaliação e imagem para a API autenticada e eliminar a chamada separada de vínculo por ID numérico em `my-app/src/componentes/pages/criarAvaliacao/criarAvaliacao.js`.
- [X] T030 [US2] Migrar listagem inicial, cartões e detalhes para os campos e URLs duráveis do Firestore em `my-app/src/componentes/pages/cardsAva/paginasCardsAva.js`, `my-app/src/componentes/pages/cardsAva/cardsMaisAva.js` e `my-app/src/componentes/pages/cardsAva/visualizacaoDetalhesAvaliacao.js`.
- [X] T031 [US2] Migrar “Minhas avaliações” para identidade Firebase e preservar limite/ordem atuais em `my-app/src/componentes/pages/minhasAva/minhasAva.js` e `my-app/src/componentes/pages/cardsAva/cardsAva.js`.
- [ ] T032 [US2] Executar T020–T023 e validar publicação, consultas, propriedade, erros de upload/quota e apresentação de imagens em `back-end/tests/` e `my-app/src/componentes/pages/avaliacoes.test.js`.

## Fase 5: História 3 — Manter administração e migrar os dados existentes (P2)

**Goal**: Preservar consultas administrativas com autorização confiável e importar perfis, avaliações, vínculos e imagens com relatório reconciliável, sem alterar a origem.

**Independent Test**: Negar acesso administrativo sem claim e permitir com claim confiável; executar dry-run e apply repetível numa cópia aprovada, reconciliar contagens/vínculos/imagens e confirmar que a origem permanece intacta.

### Testes da História 3

- [X] T033 [P] [US3] Criar testes de autorização para `/admin/avaliacoes` e `/admin/usuarios`, incluindo token inválido, usuário sem claim e tentativa de forjar `admin: true` pelo cliente em `back-end/tests/contract/admin.test.js`.
- [X] T034 [P] [US3] Criar testes de migração para relatório, exceções, vínculo duplicado, mapeamento de e-mail verificado, imagem e fonte imutável em `back-end/tests/integration/migracao.test.js`.
- [X] T035 [P] [US3] Criar testes do provisionamento/remoção de custom claim, preservação das demais claims e revogação de refresh tokens em `back-end/tests/contract/adminClaims.test.js`.

### Implementação da História 3

- [X] T036 [US3] Implementar verificação de `admin: true` no token validado pelo backend e verificação de revogação nas consultas administrativas em `back-end/services/adminService.js`.
- [X] T037 [US3] Implementar ferramenta operacional confiável para conceder/remover custom claim via Firebase Admin, preservar claims existentes e revogar refresh tokens ao remover acesso em `back-end/scripts/gerenciarAdmin.js`; não criar endpoint público de promoção.
- [X] T038 [US3] Migrar `/admin/avaliacoes` e `/admin/usuarios` para Firestore mantendo caminhos/campos úteis e excluindo senhas/segredos em `back-end/index.js` e `back-end/services/adminService.js`.
- [X] T039 [US3] Implementar CLI de dry-run/apply em `back-end/scripts/migrarSQLiteParaFirestore.js`, com origem/snapshot explicitamente selecionados, leitura somente da cópia aprovada, checksum e nenhuma operação de escrita/exclusão SQLite.
- [X] T040 [US3] Implementar mapeamento de usuários legado somente para conta Firebase de e-mail correspondente e `emailVerified` verdadeiro em `back-end/scripts/migrarSQLiteParaFirestore.js`; deixar contas ausentes, ambíguas ou não verificadas como exceções, sem importar senhas.
- [X] T041 [US3] Implementar importação idempotente de perfis e avaliações com IDs de destino determinísticos e correspondência de referência em `back-end/scripts/migrarSQLiteParaFirestore.js`.
- [X] T042 [US3] Implementar importação de cada linha `avaliacoes_usuario` com chave determinística baseada em `rowid` da cópia imutável ou hash canônico e ordinal para duplicatas idênticas, preservando todos os vínculos e registrando inconsistências em `back-end/scripts/migrarSQLiteParaFirestore.js`.
- [X] T043 [US3] Implementar cópia/verificação de imagens e relatório de contagens de usuários, avaliações, vínculos e imagens com exceções por motivo em `back-end/scripts/migrarSQLiteParaFirestore.js` e `back-end/services/imagemService.js`.
- [ ] T044 [US3] Executar T033–T035 com Authentication/Firestore Emulator Suite e corrigir qualquer falha de privacidade, autorização, idempotência ou integridade em `back-end/tests/`.
- [ ] T045 [US3] Executar dry-run e apply somente numa cópia isolada previamente aprovada, repetir apply para comprovar idempotência e reconciliar relatório sem alterar a origem em `specs/003-migracao-firebase/quickstart.md`.

## Fase 6: Finalização, publicação e limpeza condicionada

**Objetivo**: Demonstrar aprovação integral e operação em produção antes de remover qualquer dependência ou arquivo legado.

- [ ] T046 Registrar evidência de fonte de produção autorizada, relatório de reconciliação aprovado, exceções resolvidas/aprovadas, Cloudinary Free dentro da cota e autorização explícita de limpeza em `specs/003-migracao-firebase/diagnostico.md`.
- [ ] T047 Executar a suíte funcional e de segurança completa, confirmar 100% dos testes obrigatórios aprovados e ausência de falhas conhecidas de autenticação, autoria, privacidade ou persistência em `my-app/`, `back-end/` e `specs/003-migracao-firebase/quickstart.md`.
- [ ] T048 Validar em staging e produção URLs da API, CORS, cadastro, login/logout, perfil, avaliações, administração e imagens; confirmar que produção não usa `localhost` nem variáveis de emulador em `specs/003-migracao-firebase/quickstart.md`.
- [ ] T049 Remover rotas SQL, conexão SQLite, dependência `sqlite3` e código legado somente após T045–T048 aprovados, mantendo backups/dados de origem intactos até autorização explícita em `back-end/index.js`, `back-end/package.json`, `back-end/package-lock.json` e arquivos SQLite identificados no diagnóstico.
- [ ] T050 Remover do frontend chamadas, estados e referências exclusivamente numéricas somente após confirmar que nenhum fluxo ativo as utiliza em `my-app/src/` e atualizar documentação de implantação em `README.md`.
- [ ] T051 Executar busca final de imports SQLite, SQL, rotas antigas, URLs locais de produção e credenciais expostas; repetir testes de fumaça pós-limpeza e registrar resultado em `specs/003-migracao-firebase/quickstart.md`.

## Dependências e ordem de execução

### Dependências das fases

- **Setup (Fase 1)**: independente; não migra nem modifica dados.
- **Fundacional (Fase 2)**: depende do Setup e bloqueia todas as histórias.
- **US1 (Fase 3, P1)**: depende do Fundacional; é o MVP de identidade/perfil.
- **US2 (Fase 4, P1)**: depende do Fundacional e do contrato de identidade da US1 para operações autenticadas.
- **US3 (Fase 5, P2)**: depende da US1 para associação de contas verificadas e da US2 para schema/serviços de avaliações e imagens.
- **Finalização (Fase 6)**: depende das três histórias, da reconciliação aprovada e dos gates de testes/produção. A remoção SQLite em T049/T050 não pode ser antecipada.

### Grafo das histórias

```text
Setup -> Fundacional -> US1 (P1) -> US2 (P1) -> US3 (P2) -> Gates de produção/aprovação -> Limpeza SQLite
                                      \______________________________/
```

US2 pode preparar componentes sem dependência de UI da US1, mas sua integração autenticada só é liberada após o middleware/token e o contrato de identidade fundacional estarem concluídos. US3 exige avaliações e imagens definidas pela US2.

## Oportunidades de paralelismo

- Na Fase 1, T001 e T002 podem ocorrer em paralelo; T003 pode começar após identificar os comandos existentes.
- Na Fase 2, T008 e T009 podem ocorrer em paralelo; T004/T005 dependem da configuração de frontend estabelecida em T004 e T006/T007 da configuração backend.
- Na US1, T010, T011 e T012 podem ser escritos em paralelo; implementação de frontend e serviço de perfil pode avançar em paralelo após os contratos de teste, integrando em T019.
- Na US2, T020–T023 são independentes e podem ser escritos em paralelo. `avaliacaoService.js` e `imagemService.js` são arquivos distintos; a integração das rotas e telas depende dos serviços e contratos.
- Na US3, T033–T035 podem ser escritos em paralelo. Admin e importador usam arquivos/serviços distintos, mas o importador depende dos modelos estabilizados na US1/US2.
- Não executar em paralelo tarefas que alterem o mesmo `back-end/index.js`, nem iniciar T049/T050 antes de todos os gates.

## Estratégia de implementação

### MVP

1. Concluir Setup e Fundacional.
2. Concluir apenas US1 e validar cadastro/verificação, login, perfil privado e logout.
3. Não migrar ou excluir SQLite como parte do MVP de autenticação.

### Entrega incremental

1. Adicionar US2 após US1 e provar autoria, listagens, detalhes e imagens duráveis sem exceder cotas gratuitas.
2. Adicionar US3 para administração e importação auditável numa cópia isolada; revisar e aprovar o relatório antes de qualquer tráfego de produção.
3. Validar todos os fluxos em produção e obter aprovação explícita de reconciliação/limpeza.
4. Executar a limpeza SQLite como etapa posterior, seguida de nova suíte completa e smoke tests.

### Critérios independentes de aceite por história

- **US1**: conta verificada autentica em sessões distintas, perfil corresponde ao UID autenticado, logout invalida o estado privado e nenhum fluxo lê/transporta senha legada.
- **US2**: avaliação nova recebe somente UID do token, aparece na lista geral/detalhes e apenas na lista pessoal do autor; ordenação/limite são preservados e upload respeita tipo, 10 MB e cota aprovada.
- **US3**: admin sem claim recebe `403`, claim é concedida somente por processo confiável, e relatório contabiliza 100% dos registros/arquivos como migrados ou exceções; apply repetido não duplica e a origem permanece intacta.

## Validação do formato

Todas as tarefas usam checkbox, ID sequencial, marcador `[P]` somente quando paralelizáveis, etiqueta `[US1]`/`[US2]`/`[US3]` nas histórias e caminho de arquivo explícito. Tarefas de Setup, Fundacional e Finalização não usam rótulo de história.

## Fase 7: Convergence

- [X] T052 Bloquear as rotas SQLite legadas não usadas pelo frontend Firebase para impedir cadastro/login com senha em texto puro e leitura/escrita de perfis e vínculos por ID, mantendo os arquivos e dados de origem intactos até a aprovação de limpeza em `back-end/index.js` e `back-end/tests/contract/` per FR-001/FR-007 (contradicts).
- [X] T053 Preservar avaliações sem imagem migrável e registrar somente a exceção da imagem, em vez de excluir a avaliação e seus vínculos do plano ou pular sua gravação após falha de upload, em `back-end/services/migrationService.js`, `back-end/scripts/migrarSQLiteParaFirestore.js` e `back-end/tests/integration/migracao.test.js` per FR-008/US2-AC3 (contradicts).
- [X] T054 Importar avaliações com data de criação ausente/inválida usando fallback explícito de data de importação e registrar a exceção correspondente, em vez de descartar a avaliação, em `back-end/services/migrationService.js` e `back-end/tests/integration/migracao.test.js` per SC-001/plan-data-model (contradicts).
- [X] T055 Validar datas de lançamento como datas de calendário válidas e duração dentro dos limites `00:00`–`23:59`, adicionando testes para valores impossíveis, em `back-end/services/avaliacaoService.js` e `back-end/tests/contract/avaliacao.test.js` per FR-004/Constitution-IV (partial).

## Phase 8: Convergence

- [X] T056 Adicionar teste HTTP de integração para comprovar que as rotas SQLite legadas retornam `410` sem autenticação e que `/usuario/firebase` e `/avaliacoes_usuario` continuam alcançando seus handlers Firebase em `back-end/index.js` e `back-end/tests/` per FR-007/T052 (partial).
- [X] T057 Verificar no relatório serializado que avaliações com data de criação ausente ou inválida são preservadas, que cada data original e o fallback utilizado aparecem nas exceções e que as contagens correspondentes permanecem corretas em `back-end/tests/integration/migracao.test.js` per SC-001/T054 (partial).

## Phase 9: Convergence

- [X] T058 Extrair uma fábrica ou registro testável da aplicação Express com dependências isoladas e adicionar testes HTTP de integração contra as rotas Firebase reais de perfil, avaliações e administração; confirmar autenticação, autorização, handlers alcançados e isolamento em Firebase Emulator, sem iniciar SQLite, listener de produção ou usar dados reais em `back-end/index.js` e `back-end/tests/integration/` per FR-001–FR-007/FR-012/T014/T028/T038/T056 (partial).

## Phase 10: Convergence

- [X] T059 Registrar no `README.md` os comandos existentes do frontend/backend e os pré-requisitos para executar a Emulator Suite, sem incluir credenciais reais ou arquivos de serviço, per T003 (partial).
- [X] T060 Adicionar testes de integração com Firebase Authentication Emulator e SDK Web real para cadastro/login/logout, persistência da sessão e isolamento de perfil, per T019/US1 (partial).
- [X] T061 Estender os testes HTTP das rotas reais do Express para enviar tokens Firebase inválidos/expirados às rotas protegidas e confirmar respostas de negação sem mutação de dados, per T058/FR-007 (partial).

## Phase 11: Convergence

- [X] T062 Adicionar testes de integração isolados com Authentication/Firestore Emulator para validar operações reais de custom claims administrativas e persistência/idempotência da importação com fixtures sintéticas, sem acessar produção ou dados reais, per T044/FR-007/FR-008/FR-018 (partial).
- [ ] T063 Validar em staging explicitamente autorizado o upload e a entrega durável de imagem Cloudinary no plano Free, incluindo cota, erro de indisponibilidade e apresentação no cliente; não ativar cobrança ou upgrade, per T032/T048/SC-003/FR-009/FR-015 (partial). Bloqueada em 2026-11-05: não há endpoint de staging, credenciais Cloudinary nem aprovação do plano disponíveis neste ambiente; testes contratuais locais não comprovam entrega durável.
- [X] T064 Alinhar as rotas reais de perfil Firebase ao contrato `/usuario/firebase`, preservando o alias plural autenticado, e validar respostas HTTP de autenticação com a Emulator Suite, per T061/FR-007 (partial).

## Phase 12: Convergence

- [X] T065 Exigir que `FIREBASE_AUTH_EMULATOR_HOST` e `FIRESTORE_EMULATOR_HOST` apontem para loopback também na CLI de migração e cobrir hosts remotos com testes, impedindo prévias/importações fora do ambiente local isolado, per FR-018/plan: isolation guard (partial).
- [X] T066 Remover conteúdo React solto do início de `README.md` e manter a documentação de execução/testes como Markdown legível, per T003/Constitution V (unrequested).

## Phase 13: Convergence

- [X] T067 Definir e implementar um fluxo separado para importação real somente após aprovação explícita, validando destino autorizado, mantendo a origem imutável e gerando relatório reconciliável; cobrir as proteções com testes sem executar importação real, per FR-008/FR-016/T039/T045 (missing).
