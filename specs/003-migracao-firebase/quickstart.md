# Quickstart de validação — Migração de dados e contas

Este guia será executável após implementação. Ele descreve a validação e não realiza importação nem habilita serviços pagos por si só. Use ambiente de desenvolvimento e projeto Firebase/Cloudinary de teste, nunca as contas/dados reais.

## Pré-requisitos

- Node.js/NPM compatíveis com o projeto, dependências frontend/backend instaladas.
- Firebase Authentication e Firestore de teste ou Firebase Emulator Suite configurados.
- Cloudinary Free configurado somente após autorização, sem cartão/addon/plano pago; confirme que o uso projetado cabe nos 25 créditos compartilhados e limite de 10 MB por imagem. Exceder créditos pode levar a restrição/desabilitação da conta.
- Cópia isolada da base SQLite de teste aprovada. Não usar os bancos de origem em produção para ensaio.
- Variáveis locais em arquivos ignorados pelo Git. Nunca colocar service account/Cloudinary secret em variável `REACT_APP_*`.

## Configuração local

1. Configure `REACT_APP_API_URL=http://localhost:3002` e os `REACT_APP_FIREBASE_*` públicos para projeto de teste/Emulator.
2. Configure backend `PORT=3002`, `CORS_ORIGINS` para origem local de frontend, credenciais Firebase Admin de teste e credenciais Cloudinary Free de teste.
3. Confirme que a build de produção usa API pública Render e não contém `localhost` nem segredos no bundle.

## Verificações automatizadas

```sh
cd my-app
npm test -- --watchAll=false
```

Resultado esperado: Jest/React Testing Library aprova login, cadastro, perfil, logout, criação, lista geral/pessoal, detalhes, URL de API por ambiente e tratamento de erros.

```sh
cd back-end
npm test
```

Resultado esperado: `node:test` aprova autenticação, owner UID, admin claim, validação de input/upload, preservação de rotas admin, erro de quota, persistência e contrato de respostas.

Os testes HTTP das rotas reais do Express usam somente Authentication e Firestore Emulator. Requerem Node.js/npm do projeto, dependências instaladas em `back-end/` e Firebase CLI disponível via dependência local. Execute:

```sh
cd back-end
npm run test:routes:emulators
```

O comando inicia os emuladores com o projeto `demo-lac-star`, executa `tests/integration/rotasFirebaseHttp.test.js` e encerra os emuladores ao fim. O teste exige `FIREBASE_AUTH_EMULATOR_HOST` e `FIRESTORE_EMULATOR_HOST`, recusa `NODE_ENV=production`, exige projeto `demo-*` e rejeita hosts de emulador não locais antes de inicializar Firebase Admin. Ele cria identidades/perfis/avaliações temporários e os remove ao terminar. Não configure credenciais de produção nesse processo.

Para executar todos os testes de backend, incluindo os testes que dependem dos emuladores:

```sh
cd back-end
npm run test:emulators
```

Resultado esperado dos testes HTTP: rotas SQLite antigas retornam `410`; rotas reais de perfil, listagem pública/pessoal e administração exercitam seus handlers, validam tokens/claim, autoria e isolamento de dados. O Auth Emulator aceita tokens não assinados, portanto suas variáveis nunca podem estar definidas no Render/produção.

## Prévia e importação

1. Rode o importador em modo dry-run com a cópia aprovada.
2. Confirme que o relatório contém contagens de origem e destino previsto para usuários, avaliações, vínculos e imagens; exceções identificadas por motivo; nenhum segredo; e nenhum arquivo/documento de origem alterado.
3. Rode o apply somente em destino isolado. Reexecute o mesmo comando e confirme idempotência (nenhuma duplicação).
4. Compare contagens por entidade, cada vínculo usuário-avaliação e imagens entregues; verifique associação apenas a UID de e-mail verificado.
5. Qualquer divergência permanece como exceção e bloqueia aprovação/limpeza até ser investigada.

`migrarSQLiteParaFirestore.js` permanece restrito a uma cópia SQLite fechada e aos emuladores Firebase. A cópia precisa estar fora do caminho do banco usado pelo backend e não pode ter arquivos `-wal` ou `-journal`. O processo nunca seleciona a coluna `senha`, não escreve no SQLite e verifica SHA-256 antes/depois. Esse comando não importa dados para projetos reais.

Exemplo de prévia com uma cópia e imagens previamente autorizadas:

```sh
cd back-end
node scripts/migrarSQLiteParaFirestore.js \
  --source-copy /caminho/aprovado/copia.sqlite \
  --source-approval-reference APROVACAO-DA-COPIA \
  --images-directory /caminho/aprovado/uploads \
  --mode dry-run \
  --target-project demo-lac-star \
  --report /caminho/seguro/relatorio.json
```

O comando exige `GCLOUD_PROJECT=demo-lac-star`, `FIREBASE_AUTH_EMULATOR_HOST` e `FIRESTORE_EMULATOR_HOST`. O arquivo do relatório é criado sem sobrescrever arquivos existentes e com permissão restrita. Para executar `apply` somente no emulador, também são obrigatórios `MIGRATION_APPLY_APPROVED=true` e `--approval-reference`; isso não autoriza produção nem ativa Cloudinary. O upload continua bloqueado até aprovação independente de `CLOUDINARY_FREE_PLAN_APPROVED=true` e configuração de credenciais somente no backend. Não executar `apply` ou habilitar serviços pagos sem aprovação explícita.

O relatório contém contagens, mapeamentos técnicos de IDs legados para UIDs/documentos Firebase, hashes das imagens, normalizações e exceções por entidade, sem senhas ou e-mails. Contas sem correspondência Firebase única e verificada, avaliações com autoria ambígua, categorias/campos incompatíveis e imagens ausentes permanecem como exceções.

### Fluxo real futuro — bloqueado até aprovação assinada

O fluxo separado `back-end/scripts/importarSQLiteParaFirestoreReal.js` não deve ser executado agora. Ele falha fechado sem todos os itens abaixo e não altera/remova a cópia SQLite:

- Manifesto JSON versionado, assinado com Ed25519 por chave privada mantida fora do repositório. O backend recebe somente a chave pública `MIGRATION_APPROVAL_PUBLIC_KEY`.
- Identificador único da aprovação, nome/identificação da pessoa aprovadora, datas de aprovação e expiração, ID e referência da cópia, SHA-256 exato da cópia, das imagens e do relatório `dry-run`, projeto/destino aprovado e ambiente (`staging` ou `production`).
- Aprovação explícita de todos os gates: origem autorizada; destino autorizado; integridade verificada; mapeamento de identidades e administradores revisado; cota Cloudinary Free aprovada; ambiente validado; testes obrigatórios aprovados; prévia e reconciliação revisadas; importação autorizada.
- `MIGRATION_REAL_IMPORT_ENABLED=true`, `MIGRATION_EXPECTED_TARGET_PROJECT` e `MIGRATION_TARGET_ENVIRONMENT` correspondentes ao manifesto e à configuração Firebase. Qualquer host de emulador, projeto `demo-*`, projeto divergente, assinatura inválida, gate ausente, aprovação expirada ou confirmação diferente do ID assinado bloqueia o fluxo.
- Confirmação explícita do ID da aprovação na linha de comando. O relatório final não pode sobrescrever arquivos, é gravado com permissão restrita, inclui hashes do manifesto/assinatura/prévia, identidade aprovadora e resultado; o terminal recebe somente um resumo, não o mapeamento de UIDs. Conflitos de documentos com origem diferente bloqueiam a escrita; falhas parciais deixam resultado `incomplete`, código de saída não-zero e exigem reconciliação antes de nova tentativa ou limpeza.

Antes de qualquer uso futuro, a aprovação deve ser emitida fora do processo e vinculada ao relatório de prévia imutável. A implementação e os testes locais das proteções não constituem autorização para staging, produção, Cloudinary ou importação real.

## Verificações manuais de segurança e ponta a ponta

1. Criar uma conta de teste, verificar e-mail, fazer login, abrir perfil, sair e confirmar que áreas privadas não reutilizam a sessão.
2. Enviar avaliação sem UID e, em teste negativo, com UID de outra conta; o backend deve sempre atribuir o UID do token e negar sessão ausente/inválida.
3. Confirmar lista geral pública e lista pessoal restrita à identidade autenticada; conta B não pode consultar avaliações de A.
4. Consultar `/admin/avaliacoes` e `/admin/usuarios` com token normal (esperar `403`); tentar enviar `admin: true` no corpo/header (esperar negação); depois usar conta de teste com claim concedida no backend e confirmar respostas corretas sem senha.
5. Upload de imagem de teste de até 10 MB; confirmar URL durável em sessão/dispositivo separado. Testar recusa para arquivo acima do limite e quota indisponível, com erro explícito, sem upgrade ou cobrança.
6. Confirmar cadastro e chamadas de todas as telas no ambiente local e em staging/produção; verificar CORS e que cada ambiente aponta para seu backend correto.

## Gate de publicação e limpeza

- 100% dos testes funcionais e de segurança obrigatórios passam; nenhuma falha conhecida de autenticação, autoria, privacidade ou persistência permanece.
- Relatório final e exceções são revisados/aprovados; banco e imagens da origem continuam intactos antes da aprovação.
- Todos os fluxos e imagens são verificados em produção. Só com aprovação explícita remover rotas, dependências e arquivos SQLite; depois repetir testes de fumaça em produção e verificar ausência de imports/SQL/rotas antigas.
