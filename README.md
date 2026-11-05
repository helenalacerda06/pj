## lac-star: desenvolvimento e testes

### Pré-requisitos

- Node.js e npm compatíveis com os projetos em `my-app/` e `back-end/`.
- Java instalado e disponível no `PATH` para executar a Firebase Emulator Suite.
- Dependências instaladas com `npm install` em cada uma dessas pastas.
- Os testes com emuladores usam exclusivamente o projeto local `demo-lac-star`; não configure credenciais Firebase de produção nesses comandos.

### Executar a aplicação

Em terminais separados, inicie o frontend e o backend:

```sh
cd my-app
npm start
```

```sh
cd back-end
npm start
```

Configure as variáveis de ambiente conforme `my-app/.env.development.example`, `my-app/.env.production.example` e `back-end/.env.example`. Segredos administrativos e de serviço pertencem somente ao backend; não adicione credenciais ou arquivos de serviço ao repositório.

### Executar testes

Testes do frontend:

```sh
cd my-app
npm test -- --watchAll=false
```

Testes do backend sem iniciar emuladores:

```sh
cd back-end
npm test
```

Suíte do backend e testes HTTP das rotas reais com Authentication/Firestore Emulator:

```sh
cd back-end
npm run test:emulators
```

Teste de integração da SDK Web real com autenticação, sessão e isolamento de perfil:

```sh
cd back-end
npm run test:web-sdk:emulators
```

Os comandos de Emulator Suite iniciam e encerram os serviços locais automaticamente. Não execute importação de dados, `dry-run` ou `apply` como parte dos testes.
