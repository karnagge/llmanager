/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuotaAlertForm } from "../quota-alert-form";
import { QuotaLimit } from "@/services/quotas/quota-service";

describe("QuotaAlertForm", () => {
  const mockQuotas: QuotaLimit[] = [
    {
      id: "1",
      tenantId: "tenant-1",
      type: "TOKENS",
      limit: 1000,
      period: "DAILY",
      used: 500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      tenantId: "tenant-1",
      type: "REQUESTS",
      limit: 10000,
      period: "MONTHLY",
      used: 5000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const defaultProps = {
    quotas: mockQuotas,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form with quota options", () => {
    render(<QuotaAlertForm {...defaultProps} />);

    const select = screen.getByRole("combobox");
    const options = screen.getAllByRole("option");

    expect(select).toBeInTheDocument();
    expect(options).toHaveLength(mockQuotas.length + 1); // +1 for default option
    expect(screen.getByText("Tokens - Diário")).toBeInTheDocument();
    expect(screen.getByText("Requisições - Mensal")).toBeInTheDocument();
  });

  it("shows validation error for empty quota selection", async () => {
    render(<QuotaAlertForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText(/selecione uma quota/i)).toBeInTheDocument();
  });

  it("shows validation error for invalid threshold", async () => {
    render(<QuotaAlertForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.type(screen.getByLabelText(/limite percentual/i), "150");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText(/o limite deve ser menor que 100/i)).toBeInTheDocument();
  });

  it("shows loading state during submission", async () => {
    defaultProps.onSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    render(<QuotaAlertForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.type(screen.getByLabelText(/limite percentual/i), "75");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(screen.getByText(/salvando/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /salvando/i })).toBeDisabled();
  });

  it("handles successful submission", async () => {
    render(<QuotaAlertForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.type(screen.getByLabelText(/limite percentual/i), "75");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        quotaId: "1",
        threshold: 75,
      });
    });
  });

  it("handles submission error", async () => {
    defaultProps.onSubmit.mockRejectedValue(new Error("Submission failed"));
    render(<QuotaAlertForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.type(screen.getByLabelText(/limite percentual/i), "75");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText(/ocorreu um erro ao salvar o alerta/i)).toBeInTheDocument();
  });

  it("clears error when submitting again", async () => {
    defaultProps.onSubmit
      .mockRejectedValueOnce(new Error("First attempt fails"))
      .mockResolvedValueOnce(undefined);

    render(<QuotaAlertForm {...defaultProps} />);
    const user = userEvent.setup();

    // First attempt - fails
    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.type(screen.getByLabelText(/limite percentual/i), "75");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText(/ocorreu um erro ao salvar o alerta/i)).toBeInTheDocument();

    // Second attempt - succeeds
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.queryByText(/ocorreu um erro ao salvar o alerta/i)).not.toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    render(<QuotaAlertForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("prevents submission with threshold less than 1", async () => {
    render(<QuotaAlertForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.type(screen.getByLabelText(/limite percentual/i), "0");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText(/o limite deve ser maior que 0/i)).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });
});