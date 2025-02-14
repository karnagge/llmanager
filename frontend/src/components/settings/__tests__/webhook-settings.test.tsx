import { render, screen, waitFor } from "@/test/test-utils";
import { WebhookSettings } from "../webhook-settings";
import * as hooks from "@/hooks/settings/use-settings";
import { toast } from "sonner";

// Mock hooks
jest.mock("@/hooks/settings/use-settings");
// Mock toast
jest.mock("sonner");

const mockWebhooks = [
  {
    id: "1",
    name: "Test Webhook",
    url: "https://test.com/webhook",
    events: ["user.created", "user.updated"],
    active: true,
    createdAt: "2025-02-14T10:00:00Z",
    createdBy: "user@example.com",
    lastTriggered: "2025-02-14T09:00:00Z",
    failureCount: 0,
  },
];

describe("WebhookSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (hooks.useWebhooks as jest.Mock).mockReturnValue({
      data: mockWebhooks,
      isLoading: false,
      createWebhook: jest.fn(),
      updateWebhook: jest.fn(),
      deleteWebhook: jest.fn(),
    });
  });

  it("renders loading state", () => {
    (hooks.useWebhooks as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      createWebhook: jest.fn(),
      updateWebhook: jest.fn(),
      deleteWebhook: jest.fn(),
    });

    render(<WebhookSettings />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders empty state when no webhooks exist", () => {
    (hooks.useWebhooks as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      createWebhook: jest.fn(),
      updateWebhook: jest.fn(),
      deleteWebhook: jest.fn(),
    });

    render(<WebhookSettings />);
    expect(screen.getByText(/nenhum webhook configurado/i)).toBeInTheDocument();
  });

  it("displays list of webhooks", () => {
    render(<WebhookSettings />);

    expect(screen.getByText("Test Webhook")).toBeInTheDocument();
    expect(screen.getByText("https://test.com/webhook")).toBeInTheDocument();
    expect(screen.getByText("Usuário Criado")).toBeInTheDocument();
    expect(screen.getByText("Usuário Atualizado")).toBeInTheDocument();
  });

  it("opens create webhook dialog", async () => {
    const { user } = render(<WebhookSettings />);

    await user.click(screen.getByRole("button", { name: /novo webhook/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/criar novo webhook/i)).toBeInTheDocument();
  });

  it("validates required fields in create form", async () => {
    const { user } = render(<WebhookSettings />);

    // Open dialog
    await user.click(screen.getByRole("button", { name: /novo webhook/i }));

    // Try to submit empty form
    await user.click(screen.getByRole("button", { name: /criar/i }));

    // Check for validation messages
    expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
    expect(screen.getByText(/url inválida/i)).toBeInTheDocument();
    expect(screen.getByText(/selecione pelo menos um evento/i)).toBeInTheDocument();
  });

  it("creates webhook successfully", async () => {
    const createWebhook = jest.fn().mockResolvedValue({
      id: "2",
      name: "New Webhook",
      url: "https://new.com/webhook",
      events: ["user.created"],
      active: true,
    });

    (hooks.useWebhooks as jest.Mock).mockReturnValue({
      data: mockWebhooks,
      isLoading: false,
      createWebhook,
      updateWebhook: jest.fn(),
      deleteWebhook: jest.fn(),
    });

    const { user } = render(<WebhookSettings />);

    // Open dialog
    await user.click(screen.getByRole("button", { name: /novo webhook/i }));

    // Fill form
    await user.type(screen.getByPlaceholderText(/meu webhook/i), "New Webhook");
    await user.type(
      screen.getByPlaceholderText(/https:\/\/api.exemplo.com\/webhook/i),
      "https://new.com/webhook"
    );

    // Select event
    const userCreatedCheckbox = screen.getByLabelText(/usuário criado/i);
    await user.click(userCreatedCheckbox);

    // Submit form
    await user.click(screen.getByRole("button", { name: /criar/i }));

    await waitFor(() => {
      expect(createWebhook).toHaveBeenCalledWith({
        name: "New Webhook",
        url: "https://new.com/webhook",
        events: ["user.created"],
        active: true,
      });
    });

    expect(toast.success).toHaveBeenCalledWith("Webhook criado com sucesso!");
  });

  it("handles create webhook error", async () => {
    const error = new Error("Failed to create webhook");
    const createWebhook = jest.fn().mockRejectedValue(error);

    (hooks.useWebhooks as jest.Mock).mockReturnValue({
      data: mockWebhooks,
      isLoading: false,
      createWebhook,
      updateWebhook: jest.fn(),
      deleteWebhook: jest.fn(),
    });

    const { user } = render(<WebhookSettings />);

    // Open dialog and fill form
    await user.click(screen.getByRole("button", { name: /novo webhook/i }));
    await user.type(screen.getByPlaceholderText(/meu webhook/i), "New Webhook");
    await user.type(
      screen.getByPlaceholderText(/https:\/\/api.exemplo.com\/webhook/i),
      "https://new.com/webhook"
    );
    await user.click(screen.getByLabelText(/usuário criado/i));

    // Submit form
    await user.click(screen.getByRole("button", { name: /criar/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao criar webhook");
    });
  });

  it("toggles webhook active state", async () => {
    const updateWebhook = jest.fn().mockResolvedValue({
      ...mockWebhooks[0],
      active: false,
    });

    (hooks.useWebhooks as jest.Mock).mockReturnValue({
      data: mockWebhooks,
      isLoading: false,
      createWebhook: jest.fn(),
      updateWebhook,
      deleteWebhook: jest.fn(),
    });

    const { user } = render(<WebhookSettings />);

    // Toggle switch
    const switch_ = screen.getByRole("switch");
    await user.click(switch_);

    await waitFor(() => {
      expect(updateWebhook).toHaveBeenCalledWith({
        id: "1",
        data: { active: false },
      });
    });

    expect(toast.success).toHaveBeenCalledWith("Webhook desativado");
  });

  it("deletes webhook after confirmation", async () => {
    const deleteWebhook = jest.fn().mockResolvedValue(undefined);

    (hooks.useWebhooks as jest.Mock).mockReturnValue({
      data: mockWebhooks,
      isLoading: false,
      createWebhook: jest.fn(),
      updateWebhook: jest.fn(),
      deleteWebhook,
    });

    // Mock window.confirm
    const confirmSpy = jest.spyOn(window, "confirm");
    confirmSpy.mockImplementation(jest.fn(() => true));

    const { user } = render(<WebhookSettings />);

    // Click delete button
    await user.click(screen.getByRole("button", { name: /excluir/i }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteWebhook).toHaveBeenCalledWith("1");
    expect(toast.success).toHaveBeenCalledWith("Webhook excluído com sucesso!");

    confirmSpy.mockRestore();
  });
});