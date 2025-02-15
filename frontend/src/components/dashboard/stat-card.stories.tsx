import type { Meta, StoryObj } from '@storybook/react';
import { Activity, Users, FileText, Globe } from 'lucide-react';
import { StatCard } from './stat-card';

const meta = {
  title: 'Dashboard/StatCard',
  component: StatCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Título do card estatístico',
      control: 'text',
    },
    value: {
      description: 'Valor principal a ser exibido',
      control: 'text',
    },
    icon: {
      description: 'Ícone do card (componente React)',
    },
    description: {
      description: 'Descrição opcional abaixo do valor',
      control: 'text',
    },
    trend: {
      description: 'Informação de tendência (positiva ou negativa)',
      control: 'object',
    },
    className: {
      description: 'Classes CSS adicionais',
      control: 'text',
    },
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Basic: Story = {
  args: {
    title: 'Total de Usuários',
    value: '1,234',
    icon: <Users className="h-4 w-4" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Versão básica do card estatístico mostrando apenas título, valor e ícone.',
      },
    },
  },
};

export const WithPositiveTrend: Story = {
  args: {
    title: 'Requisições',
    value: '45,678',
    icon: <Activity className="h-4 w-4" />,
    trend: {
      value: 12.5,
      isPositive: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Card com indicador de tendência positiva, mostrando um aumento percentual.',
      },
    },
  },
};

export const WithNegativeTrend: Story = {
  args: {
    title: 'Taxa de Erro',
    value: '2.4%',
    icon: <Globe className="h-4 w-4" />,
    trend: {
      value: 3.2,
      isPositive: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Card com indicador de tendência negativa, mostrando uma diminuição percentual.',
      },
    },
  },
};

export const WithDescription: Story = {
  args: {
    title: 'Documentos Processados',
    value: '892',
    icon: <FileText className="h-4 w-4" />,
    description: 'Nas últimas 24 horas',
  },
  parameters: {
    docs: {
      description: {
        story: 'Card com uma descrição adicional fornecendo contexto sobre o valor exibido.',
      },
    },
  },
};

export const Complete: Story = {
  args: {
    title: 'Taxa de Sucesso',
    value: '98.7%',
    icon: <Activity className="h-4 w-4" />,
    description: 'Comparado ao mês anterior',
    trend: {
      value: 2.1,
      isPositive: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemplo completo do card utilizando todas as propriedades disponíveis.',
      },
    },
  },
};