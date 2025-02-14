# Plano de Implementação Frontend - LLM Manager

## Estrutura de Diretórios (✓)

```
frontend/
├── src/
│   ├── app/                    # Páginas e layouts (Next.js App Router)
│   │   ├── (auth)/            # Rotas autenticadas
│   │   │   ├── dashboard/     # Dashboard principal
│   │   │   ├── users/        # Gestão de usuários
│   │   │   ├── groups/       # Gestão de grupos
│   │   │   ├── quotas/       # Gestão de quotas
│   │   │   ├── metrics/      # Visualização de métricas
│   │   │   └── settings/     # Configurações
│   │   ├── login/            # Autenticação
│   │   └── register/         # Registro
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base
│   │   ├── forms/            # Componentes de formulário
│   │   ├── charts/           # Componentes de visualização
│   │   ├── layout/           # Componentes de layout
│   │   ├── metrics/          # Componentes específicos para métricas
│   │   ├── quotas/           # Componentes específicos para quotas
│   │   └── shared/           # Componentes compartilhados
│   ├── hooks/                # Hooks customizados
│   │   ├── auth/             # Hooks de autenticação
│   │   ├── api/              # Hooks de API/queries
│   │   └── ui/               # Hooks de interface
│   ├── lib/                  # Utilitários e configurações
│   │   ├── api/             # Cliente API e configurações
│   │   ├── schemas/         # Schemas de validação
│   │   ├── types/          # Tipos TypeScript
│   │   └── utils/          # Funções utilitárias
│   ├── services/            # Serviços de API
│   │   ├── auth/           # Serviço de autenticação
│   │   ├── users/          # Serviço de usuários
│   │   ├── quotas/         # Serviço de quotas
│   │   └── metrics/        # Serviço de métricas
│   └── stores/             # Estado global (Zustand)
```

## Checklist de Implementação

### 1. Autenticação e Autorização (✓)
- [x] Serviço de autenticação (`services/auth/`)
  - [x] `auth-service.ts`: Login, logout, refresh token
  - [x] `auth-store.ts`: Estado de autenticação
  - [x] `auth-provider.tsx`: Contexto de autenticação
- [x] Páginas de autenticação
  - [x] `login/page.tsx`: Formulário de login
  - [x] `register/page.tsx`: Formulário de registro
- [x] Middleware de autenticação
  - [x] `middleware.ts`: Proteção de rotas

### 2. Dashboard (Em Progresso)
- [ ] Componentes de métricas
  - [ ] `components/metrics/metric-card.tsx`: Card de métrica individual
  - [ ] `components/metrics/metric-chart.tsx`: Gráfico de métrica
  - [ ] `components/metrics/metric-list.tsx`: Lista de métricas
- [ ] Hooks de dados
  - [ ] `hooks/api/use-dashboard-metrics.ts`
  - [ ] `hooks/api/use-recent-activity.ts`

### 3. Gestão de Quotas (Pendente)
- [ ] Componentes de quotas
  - [ ] `components/quotas/quota-usage-chart.tsx`
  - [ ] `components/quotas/quota-limit-form.tsx`
  - [ ] `components/quotas/quota-alerts.tsx`
- [ ] Serviços e hooks
  - [ ] `services/quotas/quota-service.ts`
  - [ ] `hooks/api/use-quota-management.ts`

### 4. Métricas e Analytics (Pendente)
- [ ] Componentes de visualização
  - [ ] `components/charts/line-chart.tsx`
  - [ ] `components/charts/bar-chart.tsx`
  - [ ] `components/charts/pie-chart.tsx`
- [ ] Integrações
  - [ ] `lib/api/grafana-client.ts`
  - [ ] `components/metrics/grafana-embed.tsx`

### 5. Gestão de Grupos (Pendente)
- [ ] Componentes de grupos
  - [ ] `components/groups/group-form.tsx`
  - [ ] `components/groups/group-members.tsx`
  - [ ] `components/groups/group-permissions.tsx`
- [ ] Serviços e hooks
  - [ ] `services/groups/group-service.ts`
  - [ ] `hooks/api/use-group-management.ts`

### 6. Configurações (Pendente)
- [ ] Componentes de configuração
  - [ ] `components/settings/api-keys.tsx`
  - [ ] `components/settings/webhook-config.tsx`
  - [ ] `components/settings/notifications.tsx`
- [ ] Serviços e hooks
  - [ ] `services/settings/settings-service.ts`
  - [ ] `hooks/api/use-settings.ts`

### 7. UI/UX (Parcialmente Concluído)
- [x] Tema e estilização
  - [x] `lib/utils/theme.ts`: Utilitários de tema
  - [x] `components/ui/theme-switcher.tsx`: Alternador de tema
- [x] Notificações
  - [x] `components/ui/toast.tsx`: Componente de toast
  - [x] `hooks/ui/use-toast.ts`: Hook de toast
- [x] Feedback de carregamento
  - [x] `components/ui/loading-state.tsx`
  - [x] `components/ui/skeleton.tsx`

### 8. Estado e Cache (✓)
- [x] React Query
  - [x] `lib/api/query-client.ts`: Configuração do cliente
  - [x] `hooks/api/use-optimistic-update.ts`: Updates otimistas
- [x] Zustand Stores
  - [x] `stores/settings-store.ts`: Configurações do usuário
  - [x] `stores/ui-store.ts`: Estado da UI

### 9. Testes (Pendente)
- [ ] Testes unitários
  - [ ] `__tests__/components/`: Testes de componentes
  - [ ] `__tests__/hooks/`: Testes de hooks
  - [ ] `__tests__/services/`: Testes de serviços
- [ ] Testes E2E
  - [ ] `cypress/e2e/`: Testes E2E com Cypress

### 10. Documentação (Em Progresso)
- [x] README
  - [x] Guia de desenvolvimento
  - [x] Convenções de código
  - [x] Fluxo de trabalho
- [ ] Storybook
  - [ ] Documentação de componentes
  - [ ] Guia de estilo

## Próximas Etapas

1. **Dashboard Principal**
   - Implementar métricas de uso
   - Criar gráficos de consumo
   - Desenvolver lista de atividades recentes

2. **Sistema de Quotas**
   - Desenvolver serviço de quotas
   - Criar componentes de visualização
   - Implementar alertas e notificações

3. **Relatórios e Métricas**
   - Integrar com Grafana
   - Implementar exportação de dados
   - Criar dashboards personalizados

4. **Gerenciamento de Grupos**
   - Desenvolver CRUD completo
   - Implementar controle de permissões
   - Criar interface de membros