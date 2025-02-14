// Optional: configure or set up a testing framework before each test
import "@testing-library/jest-dom";

// Mock next/router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Intersection Observer
global.IntersectionObserver = class IntersectionObserver {
  constructor() {
    return {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };
  }
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob()),
    text: () => Promise.resolve(""),
  })
);

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock clipboard API
Object.defineProperty(navigator, "clipboard", {
  writable: true,
  value: {
    writeText: jest.fn(),
  },
});