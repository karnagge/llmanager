# LLM Manager Frontend

Interface web para gerenciamento de quotas e métricas de LLMs.

## 🚀 Começando

### Pré-requisitos

- Node.js v18 ou superior
- npm v9 ou superior
- Git

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/llm-manager.git
cd llm-manager/frontend
```

2. Execute o script de configuração:
```bash
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

3. Configure as variáveis de ambiente em `.env.local`

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 🧪 Testes

### Testes Unitários

O projeto usa Jest e Testing Library para testes unitários. Os testes estão localizados ao lado dos componentes com o sufixo `.test.tsx`.

```bash
# Executar todos os testes
npm test

# Executar testes com watch mode
npm run test:watch

# Verificar cobertura
npm run test:coverage
```

### Testes E2E

Usamos Cypress para testes E2E. Os testes estão em `cypress/e2e/`.

```bash
# Abrir Cypress
npm run cypress:open

# Executar testes E2E em modo headless
npm run test:e2e
```

## 📁 Estrutura de Testes

```
frontend/
├── src/
│   └── components/
│       └── auth/
│           ├── login-form.tsx
│           └── __tests__/
│               └── login-form.test.tsx
├── cypress/
│   ├── e2e/
│   │   ├── auth.cy.ts
│   │   ├── quotas.cy.ts
│   │   ├── metrics.cy.ts
│   │   └── user-flows.cy.ts
│   └── support/
│       ├── commands.ts
│       └── e2e.ts
└── jest.config.js
```

### Componentes Testados

- **Autenticação**
  - LoginForm
  - RegisterForm
  - AuthGuard

- **Dashboard**
  - StatCard
  - LineChart
  - BarChart
  - PieChart

- **Métricas**
  - GrafanaEmbed
  - GrafanaPanel
  - GrafanaDashboard

- **Quotas**
  - QuotaAlert
  - QuotaAlertForm
  - QuotaLimitForm

## 🔍 Comandos Cypress Personalizados

```typescript
// Autenticação
cy.login(email: string, password: string)
cy.logout()

// Quotas
cy.createQuotaAlert(quotaId: string, threshold: number)
cy.createQuotaLimit(type: string, limit: number, period: string)

// Assertions
cy.shouldShowToast(message: string)
cy.shouldBeOnDashboard()
```

## 📝 Convenções

1. **Nomenclatura de Testes**
   - Use descrições claras e específicas
   - Siga o padrão "should [expected behavior] when [condition]"

2. **Organização de Arquivos**
   - Testes unitários junto aos componentes
   - Testes E2E agrupados por funcionalidade

3. **Data Attributes**
   - Use `data-testid` para elementos de teste
   - Prefixe com o nome do componente

## 🤝 Contribuindo

1. Crie uma branch para sua feature:
```bash
git checkout -b feature/nome-da-feature
```

2. Execute os testes antes de commitar:
```bash
npm run test:all
```

3. Garanta que a cobertura de testes seja mantida ou melhorada

4. Faça o push e crie um Pull Request

## 📚 Documentação Adicional

- [Jest](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Cypress](https://www.cypress.io/)
- [Next.js Testing](https://nextjs.org/docs/testing)

## 🔧 Scripts Disponíveis

```bash
npm run dev           # Inicia servidor de desenvolvimento
npm test             # Executa testes unitários
npm run test:watch   # Executa testes em modo watch
npm run test:coverage # Gera relatório de cobertura
npm run cypress:open  # Abre Cypress
npm run test:e2e     # Executa testes E2E
npm run typecheck    # Verifica tipos TypeScript
```

## 🎯 Métricas de Qualidade

- Cobertura de testes mínima: 80%
- Zero warnings de TypeScript
- Testes E2E para fluxos críticos
- Testes de acessibilidade incluídos
