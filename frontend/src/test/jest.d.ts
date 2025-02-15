import '@testing-library/jest-dom/extend-expect';

declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toBeDisabled(): R;
    }
  }

  interface Window {
    ResizeObserver: jest.Mock;
    IntersectionObserver: jest.Mock;
  }
}

export {};