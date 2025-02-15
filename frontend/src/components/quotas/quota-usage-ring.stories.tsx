import type { Meta, StoryObj } from '@storybook/react';
import { QuotaUsageRing } from './quota-usage-ring';
import React from 'react';

const meta = {
  title: 'Quotas/QuotaUsageRing',
  component: QuotaUsageRing,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof QuotaUsageRing>;

export default meta;
type Story = StoryObj<typeof QuotaUsageRing>;

export const LowUsage: Story = {
  args: {
    title: 'Uso de Tokens',
    used: 3500,
    total: 10000,
    unit: 'tokens',
    size: 'md',
  },
};

export const MediumUsage: Story = {
  args: {
    title: 'Uso de Requisições',
    used: 7800,
    total: 10000,
    unit: 'requests',
    size: 'md',
  },
};

export const HighUsage: Story = {
  args: {
    title: 'Uso de Tokens',
    used: 9500,
    total: 10000,
    unit: 'tokens',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    title: 'Uso Compacto',
    used: 500,
    total: 1000,
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    title: 'Uso Médio',
    used: 500,
    total: 1000,
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    title: 'Uso Grande',
    used: 500,
    total: 1000,
    size: 'lg',
  },
};

export const WithoutUnit: Story = {
  args: {
    title: 'Uso Genérico',
    used: 75,
    total: 100,
    size: 'md',
  },
};

export const MaxedOut: Story = {
  args: {
    title: 'Limite Atingido',
    used: 10000,
    total: 10000,
    unit: 'tokens',
    size: 'md',
  },
};

export const OverLimit: Story = {
  args: {
    title: 'Acima do Limite',
    used: 12000,
    total: 10000,
    unit: 'tokens',
    size: 'md',
  },
};