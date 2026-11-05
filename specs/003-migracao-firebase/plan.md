# Implementation Plan: Migração de dados e contas

**Branch**: `janelaDaAvaliação` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: Aprovada emenda constitucional 1.1.0 e especificação de migração SQLite para Firebase.

## Summary

Migrar autenticação, perfil, avaliações e consultas administrativas para Firebase Authentication e Cloud Firestore, sem transportar senhas legadas, mantendo associação de dados a e-mails verificados e protegendo a origem até a reconciliação aprovada. Usar Cloudinary Free para imagens apenas se a medição de uso couber nos 25 créditos compartilhados e sem upgrade/cartão; pausar uploads e pedir aprovação se a cota não bastar. Preservar as rotas administrativas e autorizá-las com ID token Firebase verificado e custom claim definida exclusivamente pelo backend. A remoção de SQLite fica condicionada à aprovação do relatório, 100% de testes funcionais e de segurança e validação em produção.

## Technical Context

**Language/Version**: JavaScript; Node.js (versão atual de execução do projeto, a confirmar na implantação), React 19.2.7

**Primary Dependencies**: Express 5.2.1, Firebase Admin 13.10.0, Firebase Web SDK 13.2.0, React Scripts 5.0.1, Multer 2.4.0; Cloudinary Node SDK planejado para upload servidor-a-servidor. Testes do backend com `node:test`; frontend com Jest via `react-scripts test`.

**Storage**: SQLite permanece como origem imutável durante migração; Firestore nas coleções `usuarios`, `avaliacoes` e `avaliacoes_usuario` como destino; Cloudinary Free para arquivos de imagem condicionado ao orçamento/cota aprovada. Não habilitar Firebase Storage/Blaze sem autorização financeira explícita.

**Testing**: Jest/React Testing Library no frontend; `node:test` para unidade/contrato backend, com Firebase Emulator Suite para testes integrados isolados de Authentication/Firestore; testes de smoke e autorização em ambiente de staging/produção controlado. Critério de liberação: 100% dos testes obrigatórios aprovados e zero falhas conhecidas de autenticação, autoria, privacidade ou persistência.

**Target Platform**: Frontend React estático publicado no GitHub Pages; API Node.js/Express no Render; Firebase Authentication/Firestore e Cloudinary Free como serviços externos.

**Project Type**: Aplicação web com frontend, API REST e processo de importação one-shot/reexecutável.

**Performance Goals**: Preservar a experiência atual de listagem sem meta de throughput nova; manter o carregamento de lista e perfil dentro do comportamento atual. Importação executada em lotes limitados pelos limites documentados do Firestore, com progresso/relatório para não exigir atomicidade de todo o conjunto.

**Constraints**: Senhas legadas nunca são copiadas; vinculação de conta só após e-mail verificado; nenhuma permissão admin declarada pelo cliente; endpoints administrativos preservam caminhos; nenhuma cobrança/upgrade sem aprovação; relatório de importação e aprovação precedem limpeza; URLs públicas via configuração de ambiente, segredos somente no backend; React Create React App expõe variáveis `REACT_APP_*` no bundle e exige rebuild após alteração.

**Scale/Scope**: Esquema SQLite atual contém `usuarios`, `avaliacao` e `avaliacoes_usuario`; banco íntegro local verificado contém 14 contas, mas não está confirmado como fonte de produção. Dois DBs locais de backup/corrupção são ilegíveis. Volumes reais de produção, imagens, tráfego, região Firebase e lista de administradores são precondições para a execução, não para o desenho.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Approved Technology Stack**: PASS after the explicitly approved 2026-11-04 amendment 1.1.0. Firebase Authentication/Firestore is authorized only for this feature; SQLite remains the source until approved cleanup.
- **Clear Responsibility and Reuse**: PASS. Reuse existing Firebase setup and token middleware; isolate migration/reporting from request handling and media provider behavior.
- **Accessible, Legible Interface**: PASS. Keep current React pages, navigation, visual language, labels and accessible errors; integrate logout without replacing existing screens.
- **Safe Backend and Behavior Preservation**: PASS with required gates. Validate request fields/files, derive owner from verified token, verify server-side admin claim, keep errors explicit, and retain existing behaviors/endpoints.
- **Simplicity and Maintainability**: PASS. No new application framework. Add Cloudinary SDK for signed server-side upload and Firebase CLI/emulator tooling only for isolated tests; use Node built-in test runner to avoid a backend test framework.
- **Governance amendment**: Recorded in [constitution.md](../../.specify/memory/constitution.md), with explicit maintainer approval, scoped authorization, motivation, impact, and version 1.1.0.
- **Release blockers**: Do not run a production import until the authoritative production source, verified account mapping process, admin identities, Cloudinary free-quota fit, environment configuration, and complete test matrix are confirmed. Do not remove source data or SQLite before explicit reconciliation/cleanup approvals.

No unresolved constitution violations remain after the approved amendment.

## Project Structure

### Documentation (this feature)

```text
specs/003-migracao-firebase/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── diagnostico.md
├── spec.md
└── contracts/
    └── api.md
```

### Source Code (repository root)

```text
back-end/
├── index.js                         # Express route registration and server startup
├── firebase.js                      # Admin SDK initialization from backend-only credentials
├── autenticarUsuario.js             # Firebase ID token validation
├── services/
│   ├── perfilService.js              # Authenticated profile persistence/retrieval
│   ├── avaliacaoService.js            # Firestore review operations and owner filtering
│   ├── adminService.js                # Server-side admin claim guard and admin queries
│   └── imagemService.js               # Validated Cloudinary Free upload and URL metadata
├── scripts/
│   └── migrarSQLiteParaFirestore.js   # Dry-run/import/reconcile report; never deletes source
└── tests/
    ├── unit/
    ├── contract/
    └── integration/

my-app/src/
├── firebase/
│   ├── auth.js                         # Existing Auth helpers, including reset/verification flows
│   └── config.js                       # Public build-time Firebase settings
├── services/
│   └── api.js                          # Environment-derived API base URL and bearer-token fetch
└── componentes/
    ├── login.js
    ├── cadastrar.js
    ├── Header.js
    └── pages/
        ├── criarAvaliacao/criarAvaliacao.js
        ├── minhasAva/minhasAva.js
        └── cardsAva/                   # General/personal list and details
```

Existing component locations and styling remain; new service modules separate shared API concerns and backend responsibilities. Tests remain near current frontend tests and in the backend test directory. `tasks.md` is produced by `/speckit-tasks`.

**Structure Decision**: Keep existing `back-end/` and `my-app/` projects. Extract only the shared API client, backend service responsibilities and standalone migration script needed for identity checks, security, and a recoverable import. Do not create a new application or admin UI.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Scoped departure from SQLite | Approved Constitution amendment 1.1.0 authorizes Firebase for this migration only. | Keeping SQLite as final store contradicts the approved product requirement to complete the migration. |
| Backend service modules and import script | Route authorization, storage-provider failures, and import reconciliation require separately testable responsibilities. | Leaving database, upload, admin checks, and import code in one server entry point makes the required gates and rollback/reporting difficult to validate. |
