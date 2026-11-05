# Research: Migração de dados e contas

**Data**: 2026-11-04  
**Escopo**: decisões técnicas para implementar a especificação; nenhuma importação foi executada.

## 1. Migração segura de contas antigas

**Decision**: Não usar a importação em massa `Auth.importUsers()` para os registros locais, pois os formatos de senha não foram reconhecidos e não há parâmetros de hash validados. Não copiar senha para Firestore, relatórios ou logs. A pessoa deve provar controle do e-mail pelo fluxo de verificação Firebase (cadastro por e-mail/senha seguido de verificação); somente então mapear UID ao perfil e avaliações SQLite. O reset de senha é recuperação de uma identidade Firebase existente, não é o fluxo de claim da conta SQLite. Sem e-mail verificado ou com associação ambígua, manter usuário/avaliações como exceção pendente e não associar automaticamente.

**Rationale**: O banco local íntegro contém 14 senhas em formato não reconhecido como hash usual; os dois outros DBs locais estão corrompidos. Firebase Admin oferece importação de usuários com hash somente quando o formato e algoritmo são conhecidos. Para este caso, redefinição/verificação reduz risco de credenciais legadas expostas e de takeover por associação apenas baseada em e-mail digitado.

**Alternatives considered**:

- Importar usuários com senha fornecida pelo banco: rejeitado, pois o formato/algoritmo não é conhecido nem comprovado como hash seguro.
- Criar contas automaticamente e marcar e-mail como verificado: rejeitado; isso não comprova controle do endereço.
- Vincular por nome ou ID numérico: rejeitado; IDs são locais e nome não prova identidade.
- Enviar reset de senha como mecanismo de vinculação: rejeitado; reset aplica-se a uma identidade Firebase existente. Contas sem identidade Firebase iniciam cadastro e verificam e-mail antes de receber conteúdo legado.

**Operational note**: Use mensagens de autenticação que não revelem se um e-mail existe. Não atribuir conteúdo pendente até conclusão verificável do fluxo.

**Sources**:

- [Firebase Admin: Import users](https://firebase.google.com/docs/auth/admin/import-users)
- [Firebase Authentication: Password reset](https://firebase.google.com/docs/auth/web/manage-users#send_a_password_reset_email)
- [Firebase Authentication: Email verification](https://firebase.google.com/docs/auth/web/manage-users#send_a_user_a_verification_email)
- [Firebase Authentication: Email-link sign-in](https://firebase.google.com/docs/auth/web/email-link-auth)
- [Firebase Authentication: Account linking](https://firebase.google.com/docs/auth/web/account-linking)

## 2. Autorização administrativa

**Decision**: Manter `GET /admin/avaliacoes` e `GET /admin/usuarios`. Exigir ID token validado pelo Firebase Admin e `admin: true` em custom claim do token. Atribuição/remoção da claim só por ferramenta/ação administrativa executada em ambiente confiável com Firebase Admin; não criar rota pública de promoção. Cliente não pode definir role. `setCustomUserClaims` substitui o conjunto atual de claims, então concessão/remoção precisa preservar claims legítimas. Ao retirar admin, limpar a claim e revogar refresh tokens; as rotas administrativas validam revogação. Claims novas só aparecem em token após novo login/refresh; o cliente deve renovar token depois de receber permissão.

**Rationale**: Firebase documenta claims como mecanismo de controle de acesso definido por ambiente privilegiado e entregue no ID token. As claims levam tempo até entrar em tokens existentes; sign-in/refresh ou refresh forçado é necessário. Admin SDK ignora Firestore Rules, então autorização precisa ser aplicada em cada rota administrativa.

**Alternatives considered**:

- Confiar em `isAdmin`/papel no corpo, query, localStorage ou UI: rejeitado por ser controlável pelo cliente.
- Manter segredo estático como autorização final: rejeitado como identidade individual e difícil de revogar; manter em paralelo apenas durante transição, rotacionando-o após validação do novo mecanismo.
- Consultar coleção Firestore com papel: possível alternativa, mas Admin SDK ainda precisa autorização explícita e claims fornecem verificação direta no token; não adotar dois mecanismos sem necessidade.

**Sources**:

- [Firebase Admin: Custom claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firebase Admin: Verify ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Firebase Admin: Manage sessions and revoke tokens](https://firebase.google.com/docs/auth/admin/manage-sessions)

## 3. Imagens: comparação restrita a cotas gratuitas

**Decision**: Preferir Cloudinary Free como primeira opção, condicionada a medir o volume real e comprovar que armazenamento, transforms e tráfego cabem no limite gratuito. A FAQ oficial de onboarding confirma que a inscrição Free não requer cartão nem dados financeiros. A documentação do plano informa o orçamento compartilhado de créditos e o limite de arquivo; a medição real precisa ser conferida na conta autorizada antes da ativação. Não adicionar pagamento, addon ou upgrade automaticamente. Monitorar consumo e interromper novas gravações antes da cota estimada; se a projeção exceder a cota, pausar e solicitar aprovação.

O endpoint Admin API `/usage` documenta métricas `storage`, `bandwidth` e `transformations`, mas o formato de exemplo não inclui um campo agregado `credits`. Por isso o serviço não presume um total fixo de créditos: exige que a resposta identifique o plano `Free`, valide limite e uso de cada métrica e mantenha uma reserva interna de 5%; se o plano ou qualquer métrica não puder ser verificado, falha fechado. A API informa que os números são atualizados periodicamente, portanto essa barreira reduz risco, mas não garante controle exato sob concorrência nem substitui conferência/monitoramento manual. O serviço continua desligado até aprovação explícita e teste controlado.

Firebase Cloud Storage não é a opção padrão sem aprovação: a cota gratuita para novos buckets `*.firebasestorage.app` lista até 5 GB-mês armazenados, 100 GB/mês baixados, 5 mil uploads/mês e 50 mil downloads/mês apenas para regiões elegíveis (`us-central1`, `us-west1`, `us-east1`); uso do serviço requer plano Blaze associado a Cloud Billing. Isso não satisfaz o requisito de não assumir risco de cobrança sem consentimento.

**Rationale**: Cloudinary Free reduz o risco financeiro imediato (não solicita cartão), embora tenha limite compartilhado de 25 créditos. A conta consome crédito conforme uso: 1 crédito equivale a 1.000 transforms ou 1 GB de armazenamento gerenciado ou 1 GB de banda entregue (combinação proporcional). Transformações e tráfego são medidos em janela móvel de 30 dias; armazenamento é total atual. Firebase Storage tem cotas gratuitas somente com billing/Blaze; excedentes podem ser cobrados. O volume atual e região do bucket Firebase não são conhecidos, logo escolha final depende de medição.

**Alternatives considered**:

- Firebase Storage com Blaze: rejeitado sem aprovação explícita de cobrança; região e custo excedente desconhecidos.
- Armazenamento local Render: rejeitado por não ser persistente/durável para o requisito.
- Base64/bytes no Firestore: rejeitado; amplia documentos e não é armazenamento de mídia apropriado.

**Sources**:

- [Cloudinary Free plan, credits and billing](https://cloudinary.com/documentation/developer_onboarding_faq)
- [Cloudinary pricing details and limits](https://cloudinary.com/documentation/pricing.md)
- [Cloudinary Admin API usage response](https://cloudinary.com/documentation/admin_api_usage.md)
- [Firebase pricing](https://firebase.google.com/pricing)
- [Firebase Storage billing requirements and quotas](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)
- [Google Cloud Storage pricing](https://cloud.google.com/storage/pricing)

## 4. Importação repetível e relatório

**Decision**: Criar CLI separada de modo preview/dry-run e apply, identificada por origem/snapshot aprovado. Criar IDs determinísticos de documento a partir de chaves de origem estáveis e armazenar a origem somente como metadado de reconciliação, não autorização. Manter documentos explícitos para cada linha de vínculo legado em `avaliacoes_usuario`; a chave deriva de identificador estável da linha (`rowid` na cópia imutável, se disponível) ou de hash canônico com ordinal determinístico para duplicatas idênticas, nunca apenas do par usuário-avaliação. Preservar duplicidades e relações ambíguas como exceções identificáveis sem sobrescrever linhas. Importação pode ser repetida sem duplicar registros; para volume maior, usar BulkWriter/concorrência limitada e registrar progresso, tentativa/sucesso/falha por documento. A CLI nunca apaga nem modifica a origem. Ela gera relatório dry-run/final com checksum da fonte, totais, mapeamentos, validação/checksum de imagem, erros e exceções por motivo; nenhum segredo vai ao relatório. A aprovação humana da reconciliação é gate antes de tráfego/limpeza.

**Rationale**: Uma migração de múltiplas coleções/arquivos não cabe numa única operação atômica Firestore e pode falhar parcialmente. Idempotência e relatório permitem reexecução segura e conferência. Firestore tem limite de documento 1 MiB e requisição 10 MiB, além de limites de operação/tempo; usar payloads e lotes medidos e checkpoints em vez de assumir atomicidade global. Imagens são copiadas em etapa separada; verificar integridade de bytes, não marcar a avaliação completa até que o ativo seja acessível.

**Alternatives considered**:

- Importação manual sem inventário/relatório: rejeitada por não ser auditável e dificultar identificar órfãos.
- Apagar SQLite depois de um código de saída zero: rejeitada; não prova reconciliação nem acessibilidade das imagens.
- Fazer uma transação atômica para toda a base: rejeitada por volume/limites e por envolver upload de mídia externo ao Firestore.

**Sources**:

- [Firestore batched writes and transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firestore quotas and limits](https://firebase.google.com/docs/firestore/quotas)
- [Firestore best practices](https://firebase.google.com/docs/firestore/best-practices)
- [Node.js Firestore BulkWriter](https://cloud.google.com/nodejs/docs/reference/firestore/latest/firestore/bulkwriter)
- [Firestore count aggregation](https://firebase.google.com/docs/firestore/query-data/aggregation-queries)
- [Cloud Storage data validation](https://cloud.google.com/storage/docs/data-validation)

## 5. Configuração de ambiente

**Decision**: `REACT_APP_API_URL` define host API no frontend build-time; `REACT_APP_FIREBASE_*` define configuração pública do cliente. Backend usa `PORT`, `CORS_ORIGINS`, `GOOGLE_APPLICATION_CREDENTIALS`/secret file e `CLOUDINARY_URL` ou credenciais equivalentes só no servidor, nunca bundle frontend. Nenhum segredo Admin, token, chave Cloudinary secreta ou credencial de conta pode usar prefixo `REACT_APP_`. Produção exige valores próprios e build/deploy com config correto; nenhum fallback para `localhost`.

**Rationale**: Create React App substitui variáveis `REACT_APP_*` no build e as expõe no bundle. Render oferece Environment Variables e Secret Files no runtime. Isso separa dados públicos de configuração de credenciais administrativas e evita URLs divergentes embutidas nos componentes.

**Alternatives considered**:

- URL hardcoded em páginas/componentes: rejeitada; já há host diferente e `localhost` no cadastro.
- Variável `REACT_APP_*` contendo service account/Cloudinary secret: proibida porque valores são públicos no bundle.
- Frontend carregar URL pela configuração backend runtime: possível, mas demanda novo endpoint/configuração; variável build-time é suficiente para a publicação estática atual.

**Sources**:

- [Create React App: Adding custom environment variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Render: Configure environment variables](https://render.com/docs/configure-environment-variables)

## 6. Testes e isolamento

**Decision**: Reutilizar Jest/React Testing Library já instalados no frontend; backend usa `node:test` e `assert` nativos. Para integração real de tokens/Firestore, usar Firebase Emulator Suite em projeto local isolado; somente adicionar Firebase CLI como ferramenta de desenvolvimento se necessário para os testes. Não tocar produção nem usar conta de usuário real em testes. Testes de smoke em produção usam contas dedicadas e dados marcados/removíveis, sem escrita em nome de terceiros.

**Rationale**: O frontend já tem ambiente Jest; o backend não declara suíte nem test runner. Node nativo evita dependência adicional para unidade/contrato. Emuladores isolam testes que precisam verificar claims e efeitos de API do Admin SDK; testes de staging cobrem CORS, Render env e configuração real.

**Alternatives considered**:

- Testes apenas com mocks: insuficientes para provar fluxo de token/claim e comportamento integrado.
- Rodar teste destrutivo em produção: rejeitado; viola isolamento e risco de dados.
- Novo framework de teste backend: rejeitado enquanto `node:test` atender.

**Sources**:

- [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Firebase Authentication Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth)
- [Node.js test runner](https://nodejs.org/api/test.html)
- [React Scripts test](https://create-react-app.dev/docs/running-tests/)

## 7. Gates ainda operacionais

O desenho resolve opções técnicas sem autorizar operações externas. Antes da execução, a pessoa responsável precisa fornecer/aprovar: localização do banco e uploads de produção; lista de administradores a promover; disponibilidade dos e-mails e fluxo de verificação; medição de uso e criação/configuração Cloudinary Free sem cobrança; valores de produção para CORS/API URL e credenciais Admin via Render; e a aprovação do relatório final. Não remover qualquer origem até aprovação explícita.

O nome `firebase-tools`/Firebase Emulator Suite é apenas ferramenta de desenvolvimento/teste; variáveis `FIREBASE_AUTH_EMULATOR_HOST` e `FIRESTORE_EMULATOR_HOST` nunca podem existir na implantação de produção, pois o Auth Emulator aceita tokens de teste não assinados.
