# Diagnóstico da migração de dados e contas

**Data da análise**: 2026-11-04

**Escopo**: inspeção estática do repositório e do esquema SQLite. Os valores de senha não foram exibidos nem registrados; somente quantidade, integridade e classificação de formato foram verificados.

## 1. Diagnóstico da arquitetura atual

- A aplicação tem frontend React e API Node.js/Express. O backend inicializa simultaneamente uma conexão SQLite e Firebase Admin/Firestore.
- O fluxo novo de cadastro, login, redefinição/verificação de e-mail e logout usa Firebase Authentication; o perfil usa `usuarios/{uid}` por rotas protegidas. As rotas legadas `/usuario`, `/login` e consultas por ID numérico ainda existem no backend e não devem ser removidas antes dos gates de reconciliação/produção.
- O Firebase Admin lê uma credencial local por arquivo. O arquivo está excluído por `back-end/.gitignore`; a configuração de produção ainda precisa ser confirmada para não depender de um arquivo local.
- O frontend usa token Firebase e cliente centralizado de API para perfil e avaliações; o UID numérico deixou de ser usado pelos fluxos migrados. O Header oferece logout.
- O upload novo usa memória e Cloudinary condicionado a uma aprovação explícita e validação de cota; nenhuma conta/credencial Cloudinary foi ativada. A rota e o diretório `/uploads` antigo continuam para não remover o legado prematuramente.
- A URL do backend e a configuração Firebase Web agora vêm de variáveis por ambiente. Os valores de produção ainda precisam ser configurados e validados em Render/staging; não houve implantação.
- O repositório agora contém regras Firestore que negam acesso direto de clientes e um índice composto para consulta pessoal ordenada. O Admin SDK contorna regras, portanto autenticação/autorização da API continua obrigatória.
- O esquema SQLite inspecionado tem três tabelas: `usuarios` (id numérico, nome, e-mail, senha e aniversário), `avaliacao` (id numérico e campos de conteúdo) e `avaliacoes_usuario` (IDs numéricos de usuário e avaliação e data de criação). A tabela de vínculo não impõe unicidade ao par.
- O tipo declarado no SQLite não reflete necessariamente o valor de formulário: lançamento é informado como data, duração como hora e nota pode admitir meia estrela. A migração deve preservar os valores efetivamente usados, não converter com base apenas nos tipos declarados.
- O backend agora tem testes `node:test`; a suíte frontend tem Jest/Testing Library. As verificações locais atuais aprovam os testes unitários/contratuais executados, mas os testes de Auth/Firestore Emulator foram ignorados porque o ambiente Firebase Emulator/Java não foi iniciado.

### Formato das senhas legadas

- Foi consultado apenas o banco `teste_helena.db`, que passou no `integrity_check` e contém 14 registros em `usuarios`. Nenhum valor de senha foi exibido ou copiado.
- Uma consulta agregada confirmou que os 14 campos de senha não correspondem a bcrypt, Argon2 ou scrypt; os valores individuais não foram exibidos. A classificação não distingue texto puro de formato proprietário não reconhecido, portanto a migração não deve tentar autenticar por esses valores.
- Na base `teste_helena.db`, a tabela tem 28 avaliações e 11 vínculos; as categorias observadas foram `Filme` (19), `Livro` (8) e `Serie` (1). As 28 notas são armazenadas como texto, e lançamento/duração também estão armazenados como texto. Há 25 referências de imagem não vazias classificadas como caminho local/relativo e 3 vazias; nomes/caminhos não foram incluídos no diagnóstico. `Serie` precisa ser normalizada para `Série` com contagem explícita no relatório.
- O processo criado de importação aceita somente cópia isolada aprovada, usa conexão SQLite somente leitura, não seleciona a coluna de senha, restringe destino a emuladores `demo-*`, gera IDs determinísticos, preserva vínculos repetidos e valida correspondência Firebase com e-mail verificado. Nenhuma importação foi executada.
- `teste_helena_backup.db` e `teste_helena_corrompido.db` retornaram `SQLITE_CORRUPT`; não foi possível verificar esquema ou contas nesses arquivos.
- **Estratégia segura proposta**: não importar nem reutilizar senhas legadas. Migrar os dados de perfil/conteúdo sem credenciais, exigir que a pessoa crie ou recupere uma conta Firebase usando o mesmo e-mail e comprove controle desse endereço antes de associar os dados. Para contas Firebase já existentes, exigir redefinição de senha por e-mail. Casos sem correspondência verificável permanecem em exceções pendentes, sem associação automática.
- A criação de senha nova ocorre somente pelo fluxo oficial de Firebase Authentication; relatórios de migração, logs e Firestore não contêm senha antiga nem nova.

## 2. Arquivos e superfícies que requerem alteração ou validação

### Backend

| Arquivo | Motivo |
| --- | --- |
| `back-end/index.js` | Remover acesso SQL e migrar as rotas de perfil, autenticação, avaliações e administração; proteger operações e substituir o upload em disco. |
| `back-end/firebase.js` | Manter Firebase Admin/Firestore e definir configuração de credenciais adequada ao Render, sem credencial administrativa no cliente. |
| `back-end/autenticarUsuario.js` | Reutilizar a validação de ID token nas rotas privadas e garantir tratamento explícito de autorização. |
| `back-end/package.json` e `back-end/package-lock.json` | Remover dependências antigas somente depois de eliminar seus usos; ajustar dependência de upload após escolher armazenamento. |
| `back-end/.gitignore` | Já exclui arquivo de conta de serviço e `.env`; manter essa proteção e confirmar que continua compatível com a forma final de configuração. |
| Testes do backend (a criar ou localizar na etapa de planejamento) | Cobrir autenticação, propriedade dos documentos, administração, importação, erros e imagens; atualmente não há suíte de testes do backend declarada no `package.json`. |

### Frontend

| Arquivo | Motivo |
| --- | --- |
| `my-app/src/firebase/auth.js` | Integrar o estado de autenticação, a obtenção de token e o encerramento real da sessão ao fluxo da aplicação. |
| `my-app/src/firebase/config.js` | Usar configuração por ambiente; atualmente contém configuração de cliente no código. |
| `my-app/src/componentes/login.js` | Trocar o login legado pela autenticação Firebase e deixar de armazenar ID numérico. |
| `my-app/src/componentes/cadastrar.js` | Remover URL local fixa e manter criação de autenticação/perfil coerente quando qualquer etapa falhar. |
| `my-app/src/componentes/Header.js` | Buscar o perfil pela identidade autenticada e oferecer o encerramento de sessão solicitado. |
| `my-app/src/componentes/pages/criarAvaliacao/criarAvaliacao.js` | Enviar avaliação e imagem usando identidade autenticada; eliminar a segunda chamada que cria o vínculo por ID numérico. |
| `my-app/src/componentes/pages/minhasAva/minhasAva.js` | Consultar avaliações pela identidade autenticada, sem `id_usuario` legado. |
| `my-app/src/componentes/pages/cardsAva/paginasCardsAva.js` | Preservar a listagem pública, ordenação e limite da página inicial. |
| `my-app/src/componentes/pages/cardsAva/cardsAva.js` | Migrar a lista pessoal atualmente obtida por rota antiga e uniformizar URLs das imagens. |
| `my-app/src/componentes/pages/cardsAva/cardsMaisAva.js` e `visualizacaoDetalhesAvaliacao.js` | Preservar cartões/detalhes e direcionar imagens para armazenamento durável. |
| `my-app/src/componentes/pages/minhasAva/minhasAva.test.js` e `cardsAva/carouselAva.test.js` | Atualizar testes que usam ID numérico, host da API e caminho local de imagem. |
| `my-app/src/App.js` e `my-app/src/App.test.js` | Validar rotas e navegação existentes após integração do estado de autenticação, se necessário. |
| `my-app/package.json` e `my-app/package-lock.json` | Somente se a implementação comprovar necessidade de alteração de dependências. |

### Dados, arquivos e documentação

- `teste_helena.db`, `teste_helena_backup.db`, `teste_helena_corrompido.db` e `back-end/uploads/` são artefatos locais existentes. O backend aponta para `teste_helena.db`; não se confirmou que ele seja a base de produção. Não apagar nem publicar esses arquivos antes de identificar a fonte de dados real, migrar imagens e validar a contagem final.
- Atualizar `README.md` e as instruções de configuração/publicação aplicáveis com variáveis de ambiente, configuração de Render, URLs e custos. Não foi encontrada documentação de publicação específica no backend.
- O `README.md` da raiz contém código de componente, não documentação de setup; por isso a tarefa de editar esse arquivo ficou pendente para evitar sobrescrever conteúdo ativo. O guia de validação da feature está em `quickstart.md`.
- Definir configuração por ambiente para URL da API (`REACT_APP_API_URL` no frontend), parâmetros públicos de configuração Firebase (`REACT_APP_FIREBASE_*`), origens CORS permitidas (`CORS_ORIGINS`) e credenciais Admin disponíveis como segredo somente no backend. `PORT` deve continuar respeitando o valor fornecido pelo Render. Valores de desenvolvimento apontam para o backend local; produção aponta para o host de produção. Nenhum fallback local pode ser usado silenciosamente na build de produção.
- Criar ou atualizar regras de Firestore se houver acesso direto do cliente; caso as operações permaneçam mediadas pela API/Admin SDK, validar a autorização de cada rota, pois as regras do Firestore não protegem chamadas feitas pelo Admin SDK.
- Verificar configuração do Firebase no projeto e no console de implantação. Nenhum `firebase.json` ou arquivo `*.rules` foi encontrado no repositório.

## 3. Rotas encontradas

| Rota atual | Comportamento e consumidor encontrado | Direção da migração |
| --- | --- | --- |
| `POST /usuario` | Cadastro SQLite legado; não há consumidor encontrado no frontend atual. | Remover depois de verificar que nenhum cliente externo depende dela; cadastro atual usa Firebase Auth e `POST /usuario/firebase`. |
| `GET /usuario/:id` | Perfil SQLite por ID numérico; usado por `Header.js`. | Buscar perfil pelo UID validado do Firebase; não aceitar ID numérico para recuperar perfil privado. |
| `POST /login` | Confere e-mail/senha no SQLite; usado por `login.js`. | Usar Firebase Authentication; eliminar armazenamento/verificação de senha no SQLite após migração de contas. |
| `GET /avaliacao` | Lista avaliações SQLite em ordem decrescente de ID, com data obtida do vínculo; usado na página inicial. | Manter consulta da lista geral e ordenação cronológica por data migrada. |
| `POST /avaliacao` | Cria avaliação SQLite e salva imagem em disco; usado por `criarAvaliacao.js`. | Criar registro associado ao UID autenticado e armazenar imagem de forma durável. |
| `POST /avaliacoes_usuario` | Cria vínculo SQLite sem autenticação; chamado após a criação da avaliação. | Unificar criação e autoria numa operação autorizada; não aceitar usuário/ID fornecido pelo cliente como autoridade. |
| `GET /avaliacoes_usuarios/:id_usuario` | Lista avaliações por ID numérico; usado por `MinhasAva.js` e `cardsAva.js`. | Listar por UID validado e impedir consulta de avaliações pessoais de outra pessoa. |
| `GET /admin/avaliacoes` | Lista avaliações e autor com verificação de `ADMIN_TOKEN`; nenhum consumidor React foi encontrado. | Preservar caminho e finalidade. Exigir Bearer ID token Firebase verificado no backend e permissão administrativa concedida exclusivamente por processo confiável no servidor. |
| `GET /admin/usuarios` | Lista perfis sem senha com verificação de `ADMIN_TOKEN`; nenhum consumidor React foi encontrado. | Preservar caminho e finalidade. Exigir a mesma verificação administrativa e nunca retornar senha, token ou credencial. |
| `POST /usuario/firebase` | Grava perfil em Firestore; autenticação Firebase e comparação de UID já existem. | Preservar e integrar com cadastro, recuperação de perfil e tratamento de falha entre Auth e Firestore. |

Não foram encontradas rotas de leitura de avaliação individual, edição, exclusão, filtragem por categoria, comentários ou persistência de curtidas/compartilhamentos. Os detalhes são abertos a partir dos dados da lista; os controles de favorito/compartilhar não têm ação persistente. A análise não encontrou componentes administrativos React. Não criar essas funções como parte da migração sem aprovação explícita.

### Autorização administrativa proposta

- Preservar `GET /admin/avaliacoes` e `GET /admin/usuarios`, incluindo a finalidade e os campos de resposta existentes.
- Validar o Bearer ID token usando Firebase Admin no backend; em seguida, exigir uma custom claim `admin: true` no token verificado.
- Somente uma operação controlada no backend/Firebase Admin pode conceder ou remover essa claim. O frontend não envia papel, UID administrativo ou flag de autorização como prova.
- Negar por padrão token ausente/inválido, claim ausente e tentativa de forjar autorização no corpo, query ou headers não autenticados.
- Antes da troca, identificar e aprovar as identidades administrativas atuais; não inferir a lista de administradores a partir de dados enviados pelo cliente. Rotacionar/remover o mecanismo `ADMIN_TOKEN` antigo somente após confirmar a nova autorização no ambiente publicado.

## 4. Estrutura sugerida no Firestore

Os nomes abaixo mantêm a coleção de usuários já existente e representam os dados atuais, sem adicionar entidades de produto novas.

### `usuarios/{uid}`

```text
uid             identificador Firebase do documento
nome            nome complementar do perfil
email           e-mail da conta
aniversario     data de nascimento, quando disponível
criadoEm        instante de criação do perfil
```

O documento é identificado pelo UID, não pelo ID numérico SQLite. Não incluir senha ou token nos dados do perfil.

### `avaliacoes/{documentId}`

```text
usuarioUid          UID da pessoa autora
nome                nome da obra
descricao           descrição
feedback            opinião/feedback
principais_pontos   pontos principais
imagemUrl           URL durável da imagem, opcional
categoria           Filme, Série ou Livro conforme o formulário atual
estrelas            nota numérica, incluindo valores fracionários suportados pela interface
lancamento          valor de data usado pelo formulário atual
duracao             valor de hora/duração usado pelo formulário atual
dataCriacao         data do vínculo legado ou instante validado da publicação
```

O ID do documento passa a ser o identificador da avaliação. Durante a importação, uma correspondência temporária entre IDs SQLite e UIDs/IDs de documentos é necessária para reconstruir os vínculos; ela não deve permanecer como dependência funcional após validação. Registros que tiverem mais de um vínculo legado precisam ser identificados, pois a interface atual publica uma avaliação para uma pessoa por vez.

Não há evidência no esquema ou nas rotas de coleções necessárias para comentários, curtidas, favoritos ou compartilhamentos persistidos.

## 5. Processo de importação e conferência

1. Identificar e aprovar a fonte de produção. Os arquivos locais atuais não podem ser presumidos como base de produção.
2. Gerar um relatório de prévia sem alterar a origem nem gravar senha: totais de usuários, avaliações, vínculos e imagens; totais elegíveis, mapeados, migrados e pendentes; e exceções com motivo.
3. Importar de modo repetível, preservando a origem. A correspondência de conta exige e-mail controlado/verificado e aprovação de vínculos ambíguos; arquivos de imagem devem ser conferidos quanto à existência e acessibilidade após cópia.
4. Gerar o relatório final com totais de origem/destino por entidade, divergências e exceções por categoria (conta sem correspondência, vínculo inválido/duplicado, data inconsistente, imagem ausente/ilegível ou erro de escrita). Relatórios não podem conter senhas, tokens ou credenciais.
5. Reconciliar cada diferença e registrar aprovação explícita da pessoa responsável antes de alterar ou remover qualquer fonte. Enquanto não houver aprovação, manter o banco e os uploads de origem intactos e recuperáveis.

O relatório é artefato obrigatório de liberação, não apenas saída de log. Erros de importação e exceções não podem ser tratados como migração completa.

## 6. Dependências que poderão ser removidas

- `sqlite3` em `back-end/package.json` e no lockfile: remover depois que nenhum código/rota ou ferramenta em uso depender do SQLite e que os dados/imagens tenham sido validados.
- `@libsql/client` está declarado como dependência, mas não foi encontrado importado no código-fonte da aplicação. É candidato à remoção após confirmar que não é exigido por script/configuração externa.
- `multer`: hoje recebe arquivos para armazenamento em disco. Só remover se o fluxo escolhido enviar imagens diretamente ao provedor; se a API continuar recebendo arquivos como proxy, poderá continuar necessário.
- `fs`, `path`, código de inicialização do diretório e estáticos `/uploads`: candidatos à remoção junto com armazenamento local, após migração/validação de arquivos e URLs.
- SQL, rotas SQLite, arquivos `.db` e dados locais: remover apenas depois da aprovação da reconciliação, do período de reversão acordado e da confirmação de cópia de imagens.
- Não remover `firebase-admin`, `firebase`, `autenticarUsuario.js` ou `firebase.js`.

## 7. Riscos de regressão

1. **Contas existentes**: o banco íntegro tem 14 senhas em formato não reconhecido como hash comum; não se deve tentar migrá-las. É obrigatório verificar controle do e-mail e redefinir/criar credenciais no Firebase Authentication. Dois arquivos de backup/corrupção não puderam ser lidos.
2. **Mapeamento de identidade**: relações dependem de IDs numéricos. Uma correspondência errada entre e-mail legado e UID pode expor avaliações ou associá-las à conta incorreta.
3. **Datas e ordenação**: a lista geral usa o menor `data_criacao` dos vínculos e ordena pelo ID da avaliação; a lista pessoal usa a data do vínculo mas também ordena pelo ID. A nova data deve preservar a experiência e a recência pretendida.
4. **Tipos de campo**: SQLite declara lançamento/duração/estrelas como inteiros, enquanto a interface envia data/hora e permite meio ponto. Conversões podem alterar datas, duração ou nota.
5. **Imagem temporária**: após a implantação, caminhos `/uploads/...` podem apontar a uma instância sem o arquivo. É necessário migrar os binários e testar cada URL antes de remover o diretório.
6. **Autorização insuficiente**: várias rotas antigas não validam identidade; rotas administrativas dependem de token separado. O Admin SDK ignora regras Firestore, logo cada operação de API precisa ser explicitamente autorizada. A lista atual de administradores e o processo seguro de conceder custom claims precisam ser confirmados.
7. **Administração sem interface localizada**: as rotas existem, mas não há consumidor React encontrado; remover ou alterar essas rotas pode afetar clientes externos não vistos no repositório.
8. **Configuração de ambiente**: URLs de Render/localhost estão espalhadas e as credenciais Admin têm configuração local por arquivo. URL ausente/incorreta, CORS ou segredo mal configurado pode quebrar cadastro e demais operações em produção; configuração de produção deve falhar claramente em vez de recorrer a localhost.
9. **Alteração de UX por escopo**: não existe hoje ação de logout visível, apesar de existir helper Firebase. Integrá-la requer uma ação acessível; deve ser pequeno e preservar os layouts existentes.
10. **Remoção precoce**: apagar banco, backup ou uploads antes de relatório conferido, aprovação, 100% de testes obrigatórios aprovados e validação em produção impede reconciliação e rollback.
11. **Cotas e cobrança de imagens**: Cloudinary tem uma cota gratuita compartilhada que pode ser consumida por armazenamento, tráfego e transformações; Firebase Storage só funciona em Blaze e pode gerar cobrança acima das cotas elegíveis. Região do bucket, tráfego e crescimento ainda não são conhecidos.

## 8. Migração em pequenas etapas

### Estado corrente da implementação

- Cadastro, login, perfil, logout, avaliações públicas/pessoais, detalhes e administração têm rotas/serviços Firebase implementados e testes unitários/contratuais.
- Há um CLI de prévia/importação restrito a snapshot SQLite aprovado e emuladores `demo-*`; o teste de fonte somente leitura, checksum, mapeamento de e-mail verificado, duplicidades e relatório passou. Nenhuma importação foi executada.
- Upload Cloudinary continua bloqueado por padrão. O endpoint oficial de uso retorna métricas/limites de armazenamento, banda e transformações; o serviço falha fechado se o plano Free ou qualquer limite não puder ser confirmado, mantendo margem de segurança. A quota e o upload real não foram validados com conta autorizada.
- Permanecem pendentes: execução dos emuladores (Java ausente), conferência do snapshot e imagens aprovados, testes reais de integração, setup do Render/produção, aprovação de relatório e remoção do SQLite. Não apagar rotas/arquivos/dependências antigos nesta etapa.

1. **Inventário e baseline**: identificar a fonte de dados real; contabilizar perfis, avaliações, vínculos e imagens sem registrar credenciais; manter cópias recuperáveis e gerar relatório preliminar.
2. **Contas e autorização**: mapear contas sem transportar senhas; estabelecer verificação de e-mail e redefinição/criação de senha Firebase; obter aprovação da lista de administradores e provisionar custom claims somente por mecanismo confiável do servidor.
3. **Modelo e importação de dados**: acordar campos/tipos, preparar execução de prévia e relatório, mapear contas verificadas e avaliações, migrar vínculos/datas/imagens, reconciliar exceções e manter a origem intacta até aprovação explícita.
4. **Escolha de imagem dentro do orçamento**: comparar apenas as cotas gratuitas e os riscos descritos abaixo com o volume/tráfego medido. Cloudinary Free é a opção inicial de menor exposição a cobrança, desde que a previsão caiba nos 25 créditos compartilhados. Não habilitar Firebase Storage/Blaze nem plano/add-on pago sem aprovação explícita; se a cota gratuita escolhida não bastar, interromper upload e pedir aprovação, sem upgrade automático.
5. **Avaliações de escrita/leitura**: migrar publicação, lista geral, página pessoal e detalhes; proteger autoria e consultas; testar ordenação, limite de 15 avaliações pessoais e campos opcionais.
6. **Administração e configuração**: preservar caminhos administrativos e validar claims; definir variáveis de desenvolvimento e Render, CORS, segredos Admin e URL pública correta da API para cadastro e todos os demais fluxos.
7. **Aprovação antes da troca**: exigir relatório de reconciliação aprovado, 100% de todos os testes funcionais e de segurança definidos aprovados, zero falhas conhecidas de autenticação/autoria/privacidade/persistência e teste de todos os fluxos no ambiente de produção.
8. **Troca e limpeza**: implantar e validar os fluxos em produção; manter a origem inalterada até aprovação registrada da conferência e do funcionamento. Só então, com autorização explícita de limpeza, remover rotas, dependências e arquivos SQLite; confirmar novamente que nenhum caminho ativo depende deles e repetir os testes de fumaça em produção após a remoção.

Cada etapa deve ter critérios de saída e possibilidade de voltar à origem antes da limpeza definitiva.

## 9. Critérios de aceitação e testes

- Cadastro e login com e-mail/senha; perfil correto carregado em sessão autenticada; logout invalida a sessão; testar conta nova, conta legada com redefinição e e-mail não comprovado.
- Criar avaliação com todos os campos e sem imagem; confirmar autoria derivada do token, leitura geral, detalhes e lista pessoal.
- Criar nota fracionária e verificar preservação; verificar data, duração, categoria, texto opcional e ordenação por criação.
- Confirmar que avaliações pessoais não podem ser consultadas por outro UID e que tentativas sem token/UID divergente são negadas.
- Confirmar que as rotas administrativas existentes continuam nos mesmos caminhos; Bearer token ausente/inválido, claim ausente e autorização enviada pelo cliente são negados; admin provisionado no servidor recebe os mesmos campos úteis sem senha/token.
- Migrar dados de origem; comparar totais de usuários, avaliações, vínculos e imagens; revisar lista de exceções; exigir aprovação explícita e verificar que banco e uploads de origem permanecem intactos até ela.
- Verificar que todas as imagens migradas abrem em dispositivo externo e que caminho local antigo não é mais necessário.
- Testar indisponibilidade, token expirado e erro no serviço: a interface apresenta erro e não sugere sucesso.
- Executar testes atuais de interface ajustados para UID e testes backend/integrados das operações migradas; 100% dos testes funcionais e de segurança aprovados, sem falhas conhecidas ignoradas.
- Confirmar cadastro e demais chamadas com a URL da API de desenvolvimento e com a URL de produção correta; verificar CORS, segredos somente no backend, armazenamento durável e falha explícita se configuração estiver ausente.
- Validar todos os fluxos e imagens em produção antes de aprovar a remoção; após a limpeza autorizada, confirmar que testes não encontram consultas, imports, dependências nem rotas SQLite e repetir testes de fumaça de cadastro, autenticação, autorização e persistência em produção.

## 10. Imagens: cotas gratuitas, cobrança e alternativas

O backend atualmente grava imagens no diretório local `back-end/uploads/`; esse armazenamento não deve ser considerado persistente em publicação. Nenhum produto de armazenamento foi escolhido.

Comparação consultada em **2026-11-04**, considerando o plano gratuito e sem habilitar cobrança:

| Critério | Cloudinary Free | Firebase Cloud Storage (`*.firebasestorage.app`) |
| --- | --- | --- |
| Cota sem custo | 25 créditos no plano Free, compartilhados entre transformações, armazenamento e largura de banda entregue. A documentação define 1 crédito como 1.000 transformações, 1 GB de armazenamento gerenciado ou 1 GB de tráfego entregue (ou combinação proporcional). | Até 5 GB-mês armazenados, 100 GB/mês baixados, 5.000 operações de upload/mês e 50.000 operações de download/mês, sujeito à região elegível do bucket. |
| Como a cota é medida | Transformações e tráfego usam janela móvel de 30 dias; armazenamento considera o total atual. | Cotas são por período de faturamento conforme a tabela do Firebase; verificar a página vigente e a região antes de contratar. |
| Cartão/faturamento para começar | A documentação oficial diz que inscrição Free não exige cartão nem dados financeiros. | Cloud Storage exige projeto no plano Blaze ligado a uma conta de Cloud Billing; não há acesso ao bucket no Spark. Isso implica risco de cobrança e normalmente requer meio de pagamento válido. |
| Cobranças possíveis | Free não requer cadastro financeiro; addons e planos pagos são cobrados separadamente. Exceder o limite pode impedir uso contínuo ou exigir upgrade; não se deve fazer upgrade automático. | Blaze é pay-as-you-go: uso acima das cotas elegíveis, região não elegível ou outros itens cobrados podem gerar custos. A cota gratuita não remove a exposição à cobrança. |
| Condição de uso neste projeto | Opção inicial recomendada por menor risco financeiro, somente se a medição de armazenamento/tráfego/transforms couber nos 25 créditos e o comportamento ao atingir limite for validado. | Não ativar no projeto sem aprovação explícita para ligar faturamento e aceitar possível cobrança; verificar primeiro a região real do bucket e a elegibilidade da cota. |

Ao atingir o limite gratuito do provedor selecionado, a aplicação deve falhar explicitamente e interromper novas gravações de imagem, sem upgrade, cartão, serviço pago ou fallback para o disco local. A disponibilidade de imagens já existentes ao atingir a cota deve ser testada com a política vigente da conta.

Antes da escolha final, medir armazenamento atual e crescimento estimado, tamanho de uploads e tráfego de entrega. A recomendação Cloudinary Free é condicionada a caber na cota e não autoriza criar conta, habilitar addon ou contratar plano. Nenhum serviço pago ou faturamento será ativado sem aprovação explícita. Fontes oficiais: [Cloudinary onboarding e créditos](https://cloudinary.com/documentation/developer_onboarding_faq), [Cloudinary Pricing](https://cloudinary.com/pricing), [Firebase Pricing](https://firebase.google.com/pricing), [requisitos de Cloud Storage for Firebase](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024) e [Google Cloud Storage Pricing](https://cloud.google.com/storage/pricing).
