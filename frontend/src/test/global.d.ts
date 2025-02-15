/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

declare namespace NodeJS {
  interface Global {
    TextEncoder: typeof TextEncoder;
    TextDecoder: typeof TextDecoder;
  }
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare interface Window {
  ResizeObserver: jest.Mock;
  IntersectionObserver: jest.Mock;
}

declare namespace jest {
  interface Mock<T = any, Y extends any[] = any> {
    (...args: Y): T;
    mockClear(): void;
    mockReset(): void;
    mockImplementation(fn: (...args: Y) => T): Mock<T, Y>;
    mockReturnValue(value: T): Mock<T, Y>;
    mockResolvedValue(value: T): Mock<T, Y>;
    mockRejectedValue(value: any): Mock<T, Y>;
  }
}