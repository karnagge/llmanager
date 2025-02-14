import { render as testingLibraryRender, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import type { RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

// Create a new QueryClient for tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  initialState?: {
    user?: any;
    isAuthenticated?: boolean;
  };
}

function customRender(
  ui: ReactElement,
  { route = "/", initialState, ...renderOptions }: CustomRenderOptions = {}
) {
  // Mock window.location
  Object.defineProperty(window, "location", {
    value: new URL(`http://localhost${route}`),
    writable: true,
  });

  // Create a new QueryClient for each test
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialState={initialState}>
          <ThemeProvider defaultTheme="light" storageKey="test-theme">
            {children}
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  return {
    user: userEvent.setup(),
    ...testingLibraryRender(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Test utilities
export const mockApiResponse = <T,>(data: T): Promise<Response> =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response);

export const mockApiError = (status = 400, message = "Error"): Promise<Response> =>
  Promise.resolve({
    ok: false,
    status,
    statusText: message,
    json: () => Promise.resolve({ message }),
  } as Response);

export const waitForLoading = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Re-export everything from testing-library
export * from "@testing-library/react";

// Override render method and export utilities
export {
  customRender as render,
  screen,
  waitFor,
  userEvent,
};