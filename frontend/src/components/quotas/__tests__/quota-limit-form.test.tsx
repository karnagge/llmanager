/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuotaLimitForm } from "../quota-limit-form";

describe("QuotaLimitForm", () => {
  const mockInitialData = {
    id: "1",
    tenantId: "tenant-1",
    type: "TOKENS" as const,
    limit: 1000,
    period: "DAILY" as const,
    used: 500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultProps = {
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form with empty fields", () => {
    render(<QuotaLimitForm {...defaultProps} />);

    expect(screen.getByRole("combobox", { name: /tipo de quota/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/limite/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /período/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /salvar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
  });

  it("renders form with initial data", () => {
    render(<QuotaLimitForm {...defaultProps} initialData={mockInitialData} />);

    expect(screen.getByRole("combobox", { name: /tipo de quota/i })).toHaveValue("TOKENS");
    expect(screen.getByLabelText(/limite/i)).toHaveValue(1000);
    expect(screen.getByRole("combobox", { name: /período/i })).toHaveValue("DAILY");
  });

  it("validates required fields", async () => {
    render(<QuotaLimitForm {...defaultProps} />);
    const user = userEvent.setup();

    // Clear the limit field (type and period have default values)
    await user.clear(screen.getByLabelText(/limite/i));
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText(/o limite deve ser maior que zero/i)).toBeInTheDocument();
  });

  it("shows loading state during submission", async () => {
    defaultProps.onSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    render(<QuotaLimitForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/limite/i), "1000");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(screen.getByText(/salvando/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /salvando/i })).toBeDisabled();
  });

  it("handles successful form submission", async () => {
    render(<QuotaLimitForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByRole("combobox", { name: /tipo de quota/i }), "REQUESTS");
    await user.type(screen.getByLabelText(/limite/i), "5000");
    await user.selectOptions(screen.getByRole("combobox", { name: /período/i }), "MONTHLY");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        type: "REQUESTS",
        limit: 5000,
        period: "MONTHLY",
      });
    });
  });

  it("handles submission error", async () => {
    defaultProps.onSubmit.mockRejectedValue(new Error("Submission failed"));
    render(<QuotaLimitForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/limite/i), "1000");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText(/ocorreu um erro ao salvar o limite de quota/i)).toBeInTheDocument();
  });

  it("clears error message on new submission attempt", async () => {
    defaultProps.onSubmit
      .mockRejectedValueOnce(new Error("First attempt fails"))
      .mockResolvedValueOnce(undefined);

    render(<QuotaLimitForm {...defaultProps} />);
    const user = userEvent.setup();

    // First attempt - fails
    await user.type(screen.getByLabelText(/limite/i), "1000");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText(/ocorreu um erro ao salvar o limite de quota/i)).toBeInTheDocument();

    // Second attempt - succeeds
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.queryByText(/ocorreu um erro ao salvar o limite de quota/i)).not.toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    render(<QuotaLimitForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("prevents submission with negative limit", async () => {
    render(<QuotaLimitForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/limite/i), "-100");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText(/o limite deve ser maior que zero/i)).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("preserves form values when submission fails", async () => {
    defaultProps.onSubmit.mockRejectedValue(new Error("Submission failed"));
    render(<QuotaLimitForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByRole("combobox", { name: /tipo de quota/i }), "REQUESTS");
    await user.type(screen.getByLabelText(/limite/i), "5000");
    await user.selectOptions(screen.getByRole("combobox", { name: /período/i }), "MONTHLY");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /tipo de quota/i })).toHaveValue("REQUESTS");
      expect(screen.getByLabelText(/limite/i)).toHaveValue(5000);
      expect(screen.getByRole("combobox", { name: /período/i })).toHaveValue("MONTHLY");
    });
  });
});