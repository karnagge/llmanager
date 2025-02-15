import type { Meta, StoryObj } from '@storybook/react';
import { QuotaLimitForm } from './quota-limit-form';
import { action } from '@storybook/addon-actions';
import React from 'react';

const Wrapper = (Story: any) => (
  <div className="w-[500px] p-6 bg-background border rounded-lg">
    <Story />
  </div>
);

const meta: Meta<typeof QuotaLimitForm> = {
  title: 'Quotas/QuotaLimitForm',
  component: QuotaLimitForm,
  decorators: [Wrapper],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof QuotaLimitForm>;

export const Empty: Story = {
  args: {
    onSubmit: async (data) => {
      action('onSubmit')(data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onCancel: action('onCancel'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Formulário vazio para criar um novo limite de quota.',
      },
    },
  },
};

export const WithInitialData: Story = {
  args: {
    initialData: {
      id: '1',
      tenantId: 'tenant-1',
      type: 'TOKENS',
      limit: 1000,
      period: 'MONTHLY',
      used: 250,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    onSubmit: async (data) => {
      action('onSubmit')(data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onCancel: action('onCancel'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Formulário preenchido para editar um limite existente.',
      },
    },
  },
};

export const WithError: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      throw new Error('Erro simulado');
    },
    onCancel: action('onCancel'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado do formulário quando ocorre um erro na submissão.',
      },
    },
  },
};

export const Submitting: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100000));
    },
    onCancel: action('onCancel'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado de carregamento durante a submissão do formulário.',
      },
    },
  },
};

export const ValidationErrors: Story = {
  args: {
    initialData: {
      id: '1',
      tenantId: 'tenant-1',
      type: 'TOKENS',
      limit: -100,
      period: 'MONTHLY',
      used: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    onSubmit: async (data) => {
      action('onSubmit')(data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onCancel: action('onCancel'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Exibição de erros de validação nos campos do formulário.',
      },
    },
  },
};