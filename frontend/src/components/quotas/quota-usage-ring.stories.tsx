import type { Meta, StoryObj } from '@storybook/react';
import { QuotaUsageRing } from './quota-usage-ring';
import React from 'react';

const meta: Meta<typeof QuotaUsageRing> = {
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
      description: 'Tamanho do componente',
    },
    unit: {
      control: 'text',
      description: 'Unidade de medida opcional',
    },
  },
};

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
  parameters: {
    docs: {
      description: {
        story: 'Exibição de uso baixo de quota (abaixo de 75%).',
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: 'Exibição de uso médio de quota (entre 75% e 90%).',
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: 'Exibição de uso alto de quota (acima de 90%).',
      },
    },
  },
};

export const Small: Story = {
  args: {
    title: 'Uso Compacto',
    used: 500,
    total: 1000,
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Versão compacta do componente.',
      },
    },
  },
};

export const Medium: Story = {
  args: {
    title: 'Uso Médio',
    used: 500,
    total: 1000,
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Versão padrão do componente.',
      },
    },
  },
};

export const Large: Story = {
  args: {
    title: 'Uso Grande',
    used: 500,
    total: 1000,
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Versão grande do componente.',
      },
    },
  },
};

export const WithoutUnit: Story = {
  args: {
    title: 'Uso Genérico',
    used: 75,
    total: 100,
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Exibição sem unidade de medida.',
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: 'Estado quando a quota está totalmente utilizada.',
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: 'Estado quando o uso excede o limite estabelecido.',
      },
    },
  },
};