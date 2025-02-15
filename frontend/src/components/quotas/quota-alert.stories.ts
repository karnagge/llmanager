import type { Meta, StoryObj } from '@storybook/react';
import { QuotaAlert } from './quota-alert';
import { action } from '@storybook/addon-actions';

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
};

export const MediumAlert: Story = {
  args: {
    alert: {
      id: '2',
      tenantId: 'tenant-1',
      quotaId: 'quota-1',
      threshold: 80,
      triggered: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    onDismiss: action('onDismiss'),
  },
};

export const HighAlert: Story = {
  args: {
    alert: {
      id: '3',
      tenantId: 'tenant-1',
      quotaId: 'quota-1',
      threshold: 95,
      triggered: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    onDismiss: action('onDismiss'),
  },
};

export const WithoutDismiss: Story = {
  args: {
    alert: {
      id: '4',
      tenantId: 'tenant-1',
      quotaId: 'quota-1',
      threshold: 85,
      triggered: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

export const WithCustomClass: Story = {
  args: {
    alert: {
      id: '5',
      tenantId: 'tenant-1',
      quotaId: 'quota-1',
      threshold: 75,
      triggered: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    onDismiss: action('onDismiss'),
    className: 'max-w-md shadow-lg',
  },
};