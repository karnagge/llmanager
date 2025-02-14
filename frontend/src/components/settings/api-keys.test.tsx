import { render, screen, waitFor } from "@/test/test-utils";
import { ApiKeys } from "./api-keys";
import * as hooks from "@/hooks/settings/use-settings";

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
  {
    id: "2",
    name: "Test Key 2",
    key: "test_key_2",
    createdAt: "2025-02-14T11:00:00Z",
    scopes: ["read"],
    createdBy: "user@example.com",
  },
];

jest.mock("@/hooks/settings/use-settings", () => ({
  useApiKeys: jest.fn(),
}));

describe("ApiKeys", () => {
  beforeEach(() => {
    jest.spyOn(hooks, "useApiKeys").mockImplementation(() => ({
      data: mockApiKeys,
      isLoading: false,
      createApiKey: jest.fn(),
      deleteApiKey: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    jest.spyOn(hooks, "useApiKeys").mockImplementation(() => ({
      data: undefined,
      isLoading: true,
      createApiKey: jest.fn(),
      deleteApiKey: jest.fn(),
    }));

    render(<ApiKeys />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders empty state when no API keys exist", () => {
    jest.spyOn(hooks, "useApiKeys").mockImplementation(() => ({
      data: [],
      isLoading: false,
      createApiKey: jest.fn(),
      deleteApiKey: jest.fn(),
    }));

    render(<ApiKeys />);
    expect(screen.getByText(/nenhuma chave de api encontrada/i)).toBeInTheDocument();
  });

  it("renders list of API keys", () => {
    render(<ApiKeys />);

    expect(screen.getByText("Test Key 1")).toBeInTheDocument();
    expect(screen.getByText("Test Key 2")).toBeInTheDocument();
  });

  it("opens create dialog when clicking new key button", async () => {
    const { user } = render(<ApiKeys />);

    await user.click(screen.getByRole("button", { name: /nova chave/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("creates new API key", async () => {
    const createApiKey = jest.fn().mockResolvedValue({
      id: "3",
      name: "New Key",
      key: "new_key",
      createdAt: "2025-02-14T12:00:00Z",
      scopes: ["read"],
      createdBy: "user@example.com",
    });

    jest.spyOn(hooks, "useApiKeys").mockImplementation(() => ({
      data: mockApiKeys,
      isLoading: false,
      createApiKey,
      deleteApiKey: jest.fn(),
    }));

    const { user } = render(<ApiKeys />);

    // Open dialog
    await user.click(screen.getByRole("button", { name: /nova chave/i }));

    // Fill form
    await user.type(screen.getByPlaceholderText(/minha api key/i), "New Key");

    // Submit form
    await user.click(screen.getByRole("button", { name: /criar/i }));

    await waitFor(() => {
      expect(createApiKey).toHaveBeenCalledWith({
        name: "New Key",
        scopes: [],
      });
    });
  });

  it("deletes API key after confirmation", async () => {
    const deleteApiKey = jest.fn().mockResolvedValue(undefined);

    jest.spyOn(hooks, "useApiKeys").mockImplementation(() => ({
      data: mockApiKeys,
      isLoading: false,
      createApiKey: jest.fn(),
      deleteApiKey,
    }));

    // Mock window.confirm
    const confirmSpy = jest.spyOn(window, "confirm");
    confirmSpy.mockImplementation(jest.fn(() => true));

    const { user } = render(<ApiKeys />);

    // Click delete button for first key
    await user.click(screen.getAllByRole("button", { name: /excluir/i })[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteApiKey).toHaveBeenCalledWith("1");

    confirmSpy.mockRestore();
  });

  it("does not delete API key when confirmation is cancelled", async () => {
    const deleteApiKey = jest.fn().mockResolvedValue(undefined);

    jest.spyOn(hooks, "useApiKeys").mockImplementation(() => ({
      data: mockApiKeys,
      isLoading: false,
      createApiKey: jest.fn(),
      deleteApiKey,
    }));

    // Mock window.confirm to return false
    const confirmSpy = jest.spyOn(window, "confirm");
    confirmSpy.mockImplementation(jest.fn(() => false));

    const { user } = render(<ApiKeys />);

    // Click delete button for first key
    await user.click(screen.getAllByRole("button", { name: /excluir/i })[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteApiKey).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});