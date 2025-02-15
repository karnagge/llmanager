import type { Preview } from "@storybook/react";
import './tailwind.css';
import '../src/app/globals.css';

const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  laptop: 1024,
  desktop: 1440,
};

const customViewports = {
  mobile: {
    name: 'Mobile',
    styles: {
      width: `${BREAKPOINTS.mobile}px`,
      height: '100%',
    },
  },
  tablet: {
    name: 'Tablet',
    styles: {
      width: `${BREAKPOINTS.tablet}px`,
      height: '100%',
    },
  },
  laptop: {
    name: 'Laptop',
    styles: {
      width: `${BREAKPOINTS.laptop}px`,
      height: '100%',
    },
  },
  desktop: {
    name: 'Desktop',
    styles: {
      width: `${BREAKPOINTS.desktop}px`,
      height: '100%',
    },
  },
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    darkMode: {
      current: 'light',
      darkClass: 'dark',
      stylePreview: true,
      classTarget: 'html',
    },
    nextjs: {
      appDirectory: true,
    },
    viewport: { viewports: customViewports },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
    docs: {
      story: {
        inline: true,
        iframeHeight: 400,
      },
      canvas: {
        sourceState: 'shown',
      },
    },
  },
};

export default preview;
