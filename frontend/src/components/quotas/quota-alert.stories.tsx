import type { Meta, StoryObj } from '@storybook/react';
import { QuotaAlert } from './quota-alert';
import { action } from '@storybook/addon-actions';
import React from 'react';

const meta: Meta<typeof QuotaAlert> = {
  title: 'Quotas/QuotaAlert',
  component: QuotaAlert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof QuotaAlert>;

export const LowAlert: Story = {
  args: {
    alert: {
      id: '1',
      tenantId: 'tenant-1',
      quotaId: 'quota-1',
      threshold: 65,
      triggered: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    onDismiss: action('onDismiss'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Alerta de uso baixo (abaixo de 75%).',
      },
    },
  },
};

export const MediumAlert: Story = {
  args: {
    alert: {
      id: '1',
      tenantId: 'tenant-1',
      quotaId: 'quota-1',
      threshold: 80,
      triggered: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    onDismiss: action('onDismiss'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Alerta de uso médio (entre 75% e 90%).',
      },
    },
  },
};

export const HighAlert: Story = {
  args: {
    alert: {
      id: '1',
      tenantId: 'tenant-1',
      quotaId: 'quota-1',
      threshold: 95,
      triggered: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    onDismiss: action('onDismiss'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Alerta de uso alto (acima de 90%).',
      },
    },
  },
};

export const WithoutDismiss: Story = {
  args: {
    alert: {
      id: '1',
      tenantId: 'tenant-1',
      quotaId: 'quota-1',
      threshold: 75,
      triggered: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Alerta sem botão de descarte.',
      },
    },
  },
};