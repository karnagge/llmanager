import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useApiKeys } from "../use-settings";
import { SettingsService } from "@/services/settings-service";

// Mock the settings service
jest.mock("@/services/settings-service", () => ({
  SettingsService: {
    getApiKeys: jest.fn(),
    createApiKey: jest.fn(),
    deleteApiKey: jest.fn(),
  },
}));

const mockApiKeys = [
  {
    id: "1",
    name: "Test Key 1",
    key: "test_key_1",
    createdAt: "2025-02-14T10:00:00Z",
    expiresAt: "2026-02-14T10:00:00Z",
    lastUsed: "2025-02-14T09:00:00Z",
    scopes: ["read", "write"],
    createdBy: "user@example.com",
  },
];

describe("useApiKeys", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("fetches api keys successfully", async () => {
    (SettingsService.getApiKeys as jest.Mock).mockResolvedValueOnce(mockApiKeys);

    const { result } = renderHook(() => useApiKeys(), { wrapper });

    // Should start with loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockApiKeys);
    expect(SettingsService.getApiKeys).toHaveBeenCalledTimes(1);
  });

  it("handles api keys fetch error", async () => {
    const error = new Error("Failed to fetch");
    (SettingsService.getApiKeys as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useApiKeys(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });

  it("creates api key successfully", async () => {
    const newKey = {
      id: "2",
      name: "New Key",
      key: "new_key",
      createdAt: "2025-02-14T12:00:00Z",
      scopes: ["read"],
      createdBy: "user@example.com",
    };

    (SettingsService.createApiKey as jest.Mock).mockResolvedValueOnce(newKey);

    const { result } = renderHook(() => useApiKeys(), { wrapper });

    // Execute the mutation
    result.current.createApiKey({
      name: "New Key",
      scopes: ["read"],
    });

    await waitFor(() => expect(SettingsService.createApiKey).toHaveBeenCalled());

    expect(SettingsService.createApiKey).toHaveBeenCalledWith({
      name: "New Key",
      scopes: ["read"],
    });
  });

  it("deletes api key successfully", async () => {
    (SettingsService.deleteApiKey as jest.Mock).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useApiKeys(), { wrapper });

    // Execute the mutation
    result.current.deleteApiKey("1");

    await waitFor(() => expect(SettingsService.deleteApiKey).toHaveBeenCalled());

    expect(SettingsService.deleteApiKey).toHaveBeenCalledWith("1");
  });

  it("handles delete api key error", async () => {
    const error = new Error("Failed to delete");
    (SettingsService.deleteApiKey as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useApiKeys(), { wrapper });

    // Execute the mutation
    const deletePromise = result.current.deleteApiKey("1");

    await expect(deletePromise).rejects.toThrow("Failed to delete");
    expect(SettingsService.deleteApiKey).toHaveBeenCalledWith("1");
  });
});