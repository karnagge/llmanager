# Biblioteca de Componentes LLManager

Este diretório contém a documentação e histórias dos componentes UI do LLManager.

## Estrutura

```
src/
├── components/
│   ├── dashboard/
│   │   ├── stat-card.tsx
│   │   └── stat-card.stories.tsx
│   └── quotas/
│       ├── quota-alert.tsx
│       ├── quota-alert.stories.tsx
│       ├── quota-limit-form.tsx
│       ├── quota-limit-form.stories.tsx
│       ├── quota-usage-ring.tsx
│       └── quota-usage-ring.stories.tsx
└── stories/
    ├── style-guide.mdx
    └── components.mdx
```

## Componentes Principais

### Dashboard
- **StatCard**: Card para exibição de métricas e estatísticas

### Quotas
- **QuotaAlert**: Alertas de uso de quota
- **QuotaLimitForm**: Formulário para configuração de limites
- **QuotaUsageRing**: Visualização circular do uso de quotas

## Guias de Documentação

### style-guide.mdx
- Cores do sistema
- Tipografia
- Layout
- Padrões de UI

### components.mdx
- Hierarquia de componentes
- Fluxo de dados
- Padrões de estado
- Interações entre componentes

## Desenvolvimento

### Adicionando Novos Componentes

1. Criar o componente em `src/components/[categoria]`
2. Criar arquivo de história correspondente
3. Documentar props e exemplos de uso
4. Atualizar documentação MDX se necessário

### Executando o Storybook

```bash
npm run storybook
```

### Boas Práticas

1. Manter histórias atualizadas com o componente
2. Incluir exemplos de diferentes estados
3. Documentar props usando JSDoc
4. Testar em diferentes viewports
5. Verificar acessibilidade