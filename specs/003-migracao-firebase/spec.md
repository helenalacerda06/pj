# Especificação: Migração de dados e contas

**Feature Branch**: `janelaDaAvaliação`

**Criado em**: 2026-11-04

**Status**: Rascunho para aprovação

**Entrada**: Migrar as funcionalidades de contas e avaliações para Firebase, preservando dados, experiência e acesso administrativo, com importação auditável e aprovação explícita antes da limpeza da origem.

## Cenários de usuário e testes

### História 1 — Acessar a conta e o próprio perfil (Prioridade: P1)

Como pessoa cadastrada, quero entrar com minha conta, ver meus dados e encerrar minha sessão, para usar a aplicação com uma identidade consistente.

**Por que esta prioridade**: A identidade da pessoa é a base para associar avaliações e restringir operações a quem tem autorização.

**Teste independente**: Criar uma conta, sair, entrar novamente e confirmar que o perfil correto aparece em mais de uma sessão/dispositivo.

**Cenários de aceitação**:

1. **Dado** que uma pessoa possui uma conta válida, **quando** entra com e-mail e senha, **então** a aplicação identifica a mesma conta e apresenta seus dados complementares.
2. **Dado** que a pessoa está autenticada, **quando** encerra a sessão, **então** a sessão deixa de ser válida e as áreas autenticadas não continuam usando a identidade anterior.
3. **Dado** que duas pessoas usam contas diferentes, **quando** cada uma abre seu perfil, **então** nenhuma delas recebe os dados privados da outra.
4. **Dado** que uma conta antiga não pode ter sua senha migrada com segurança, **quando** sua titular tenta recuperar o acesso, **então** recebe um fluxo de redefinição/verificação por e-mail do provedor de autenticação, sem reutilização ou exposição da senha antiga.

### História 2 — Publicar e consultar avaliações (Prioridade: P1)

Como pessoa usuária, quero publicar avaliações e consultar as avaliações recentes, para compartilhar opiniões e descobrir obras.

**Por que esta prioridade**: Publicação e consulta são os fluxos centrais da aplicação e dependem da associação correta entre avaliação e autoria.

**Teste independente**: Publicar uma avaliação com todos os campos e imagem, depois confirmar sua presença na lista geral, nos detalhes e na lista pessoal de quem a publicou.

**Cenários de aceitação**:

1. **Dado** que uma pessoa está autenticada, **quando** publica uma avaliação, **então** a avaliação aparece nas listagens e fica associada à conta autenticada.
2. **Dado** que há avaliações publicadas, **quando** uma pessoa abre a página inicial, **então** vê as avaliações recentes em ordem decrescente de criação.
3. **Dado** que uma avaliação possui dados opcionais ausentes, **quando** alguém abre seus detalhes, **então** os demais dados continuam legíveis e não há imagem quebrada.
4. **Dado** que uma pessoa abre “Minhas avaliações”, **quando** a lista termina de carregar, **então** ela vê somente avaliações associadas à sua própria conta, mantendo o limite e a ordem atuais.

### História 3 — Manter a administração e os dados existentes (Prioridade: P2)

Como administradora autorizada, quero continuar consultando as avaliações e os perfis necessários à administração, para manter a operação sem expor essas informações a pessoas não autorizadas.

**Por que esta prioridade**: A migração precisa preservar a capacidade administrativa existente e proteger dados pessoais durante e depois da transição.

**Teste independente**: Acessar as consultas administrativas com e sem autorização e comparar os dados migrados com o conjunto legado.

**Cenários de aceitação**:

1. **Dado** que uma pessoa administradora tem permissão concedida por processo confiável no servidor, **quando** consulta as informações administrativas, **então** as rotas administrativas existentes continuam disponíveis e retornam os mesmos campos úteis, sem credenciais de acesso.
2. **Dado** que uma pessoa não tem permissão administrativa, **quando** tenta acessar essas informações ou envia uma declaração de papel administrativo pelo cliente, **então** a solicitação é negada.
3. **Dado** que a migração é concluída, **quando** se compara a origem com o destino, **então** cada perfil, avaliação e vínculo válido continua representado sem depender dos antigos identificadores numéricos.

## Casos de borda

- Uma conta legada pode não ter correspondência inequívoca com uma conta atual; a migração deve sinalizar o caso para resolução, sem associar avaliações à pessoa errada.
- A inspeção segura do banco íntegro encontrou 14 registros cujos campos de senha não correspondem aos formatos comuns de hash verificados; nenhuma senha legada será migrada. Titulares dessas contas precisarão passar por redefinição/verificação de acesso no Firebase Authentication.
- Uma avaliação pode não ter imagem ou pode apontar para um arquivo que não esteja mais disponível; o restante da avaliação deve continuar acessível e a perda deve ser registrada.
- Uma sessão expirada ou token inválido não deve permitir leitura privada, criação em nome de outra pessoa ou acesso administrativo.
- Dados de criação ausentes ou inválidos não podem fazer a listagem deixar de carregar; a migração deve registrar e tratar esses registros.
- A indisponibilidade de serviço ou falha durante a migração não deve resultar em sucesso parcial silencioso nem autorizar a remoção da origem.
- A aplicação deve continuar acessível em publicação e em dispositivos diferentes, sem depender de um endereço local ou de arquivos temporários do servidor.

## Requisitos

### Requisitos funcionais

- **FR-001**: A aplicação MUST manter cadastro e acesso por e-mail e senha para contas novas e existentes; senhas legadas não podem ser copiadas para o perfil nem reutilizadas como credenciais no novo provedor.
- **FR-002**: A aplicação MUST recuperar e apresentar os dados complementares da conta autenticada, usando uma identidade única e estável para associar conteúdo.
- **FR-003**: A aplicação MUST permitir encerrar a sessão autenticada e impedir que a sessão encerrada continue acessando áreas privadas.
- **FR-004**: A aplicação MUST permitir que uma pessoa autenticada publique uma avaliação com categoria, nome, descrição, feedback, principais pontos, imagem opcional, lançamento, duração e nota.
- **FR-005**: A aplicação MUST associar cada avaliação criada exclusivamente à identidade autenticada, sem aceitar autoria informada por outra pessoa.
- **FR-006**: A aplicação MUST manter as listagens geral e pessoal, os detalhes já disponíveis, a ordem de recência e os limites de exibição atuais.
- **FR-007**: A aplicação MUST restringir avaliações pessoais à pessoa autenticada correspondente e restringir consultas administrativas a pessoas cuja permissão foi concedida por processo confiável no servidor; dados de autorização enviados pelo frontend MUST NOT conceder privilégios.
- **FR-008**: A migração MUST preservar todos os perfis, avaliações, vínculos e imagens existentes que pertençam ao conjunto de dados legado e MUST gerar um relatório com totais migrados por tipo e uma lista detalhada de exceções, sem descartar registros silenciosamente.
- **FR-009**: A migração MUST manter imagens acessíveis após publicação e não depender de disco temporário do servidor.
- **FR-010**: A aplicação MUST informar falhas de autenticação, consulta, publicação ou migração de forma explícita, sem apresentar falhas como sucesso.
- **FR-011**: A publicação MUST funcionar em ambientes de desenvolvimento e produção sem endereços locais fixos no cliente.
- **FR-012**: As rotas administrativas existentes MUST manter seus caminhos e finalidades; o acesso MUST ser autorizado pela identidade Firebase verificada e por permissão concedida exclusivamente no servidor.
- **FR-013**: A migração MUST preservar as funcionalidades existentes, sem criar comportamento novo para ações que hoje não persistem dados nem remover controles visuais existentes.
- **FR-014**: A aplicação MUST disponibilizar configuração separada de URL da API e serviços para desenvolvimento e produção; cadastro e demais operações MUST usar a configuração correspondente ao ambiente e produção MUST NOT usar endereços locais.
- **FR-015**: A aplicação MUST NOT ativar serviço, plano, cartão ou faturamento pago para imagens sem aprovação explícita; o plano gratuito escolhido MUST respeitar suas cotas e informar falhas de quota sem sugerir que houve upload bem-sucedido.
- **FR-016**: A origem SQLite MUST permanecer intacta até que o relatório de importação e a reconciliação de usuários, avaliações, vínculos e imagens sejam revisados e aprovados.
- **FR-017**: A dependência SQLite, os arquivos do banco e as rotas antigas MUST ser removidos somente depois da importação aprovada, da aprovação da limpeza, da execução sem falhas de todos os testes funcionais e de segurança obrigatórios e da validação dos fluxos em produção.
- **FR-018**: Os testes de autenticação, autoria, privacidade, autorização administrativa, persistência, importação, imagens e configuração de produção MUST passar integralmente; nenhuma falha conhecida nessas áreas pode ser ignorada para aprovar a migração.

### Entidades principais

- **Conta**: Identidade autenticável e dados complementares de perfil, incluindo nome, e-mail e aniversário.
- **Avaliação**: Conteúdo publicado por uma conta, com os campos descritivos, classificatórios, a imagem opcional e a data de criação.
- **Imagem de avaliação**: Arquivo associado a uma avaliação e acessível de forma durável após publicação.
- **Autorização administrativa**: Permissão que diferencia consultas de administração das operações comuns de uma conta.

## Critérios de sucesso

### Resultados mensuráveis

- **SC-001**: O relatório de importação contabiliza 100% dos perfis, avaliações, vínculos e imagens da origem selecionada como migrados ou incluídos em exceções identificadas; a reconciliação é aprovada antes de qualquer limpeza da origem.
- **SC-002**: 100% dos testes funcionais definidos para cadastro, recuperação de conta, entrada, encerramento de sessão, publicação, consulta geral, consulta pessoal, administração e detalhes passam antes da liberação.
- **SC-003**: 100% das avaliações migradas com imagem disponível na origem exibem uma imagem acessível após a publicação em produção.
- **SC-004**: 100% dos testes de segurança de acesso privado, autoria e autorização administrativa passam; tentativas sem identidade/permissão e tentativas de forjar autorização pelo cliente são negadas.
- **SC-005**: Nenhum fluxo ativo depende de identificadores numéricos legados, credenciais em texto ou armazenamento temporário local quando a migração é aprovada.
- **SC-006**: 100% dos testes de configuração e dos fluxos principais passam nos ambientes de desenvolvimento e produção, incluindo a confirmação de que o cadastro usa a URL correta da API em cada ambiente.
- **SC-007**: Nenhuma falha conhecida de autenticação, autoria, privacidade ou persistência permanece sem correção e reteste aprovado no momento da autorização da migração.
- **SC-008**: A origem SQLite permanece disponível e inalterada até a aprovação registrada da reconciliação, dos testes e da validação em produção; a remoção só ocorre após todas essas aprovações.

## Pressupostos

- A fonte de verdade para funcionalidades existentes é o comportamento verificável no repositório; a análise técnica detalhada está em [diagnostico.md](./diagnostico.md).
- Os dados do banco legado em uso devem ser preservados, mas a especificação não presume que arquivos de teste, cópias de segurança ou o banco local sejam a fonte de produção.
- Senhas legadas não serão migradas. A associação de dados exige controle comprovado do mesmo e-mail; a pessoa cria uma conta Firebase verificada ou redefine a senha da conta Firebase existente antes de receber conteúdo legado.
- Nenhum provedor de armazenamento de imagens está aprovado ainda. Cloudinary oferece um plano gratuito sem exigir cartão na inscrição, com limite compartilhado de créditos; Firebase Storage exige o plano Blaze e conta de faturamento, com risco de cobranças acima das cotas aplicáveis. Nenhum plano pago, cartão ou faturamento será ativado sem aprovação explícita.
- A identidade administrativa será concedida exclusivamente por mecanismo confiável controlado pelo backend; permissões declaradas no frontend não são autoridade.
- A importação produzirá relatório de contagens por tipo de registro e arquivos migrados, além da lista de exceções. A origem permanece intacta até a conferência e aprovação explícitas.
- As rotas administrativas atuais mantêm seus caminhos e sua finalidade durante a migração; o modo de autenticação e autorização muda para identidade Firebase verificada e permissão administrativa concedida no servidor.
- O frontend receberá URLs distintas de API por configuração de ambiente. Cadastro e demais fluxos devem usar a URL correspondente ao ambiente, sem endereço de desenvolvimento em produção.
- Não serão adicionadas funções de edição, exclusão, filtragem, comentários ou curtidas que não estejam implementadas atualmente; uma aprovação de escopo separada é necessária para introduzi-las.
- Os controles visuais existentes de favoritos e compartilhamento permanecem sem criar persistência ou comportamento novo como parte desta migração.
