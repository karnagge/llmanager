/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuotaAlert } from "../quota-alert";

describe("QuotaAlert", () => {
  const createAlert = (threshold: number) => ({
    id: "alert-1",
    tenantId: "tenant-1",
    quotaId: "quota-1",
    threshold,
    triggered: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  it("renders high severity alert correctly", () => {
    const alert = createAlert(95);
    render(<QuotaAlert alert={alert} />);

    const card = screen.getByRole("article");
    expect(card).toHaveClass("border-red-500", "bg-red-50");
    expect(screen.getByText(/95%/)).toHaveClass("text-red-700");
  });

  it("renders medium severity alert correctly", () => {
    const alert = createAlert(80);
    render(<QuotaAlert alert={alert} />);

    const card = screen.getByRole("article");
    expect(card).toHaveClass("border-yellow-500", "bg-yellow-50");
    expect(screen.getByText(/80%/)).toHaveClass("text-yellow-700");
  });

  it("renders low severity alert correctly", () => {
    const alert = createAlert(70);
    render(<QuotaAlert alert={alert} />);

    const card = screen.getByRole("article");
    expect(card).toHaveClass("border-blue-500", "bg-blue-50");
    expect(screen.getByText(/70%/)).toHaveClass("text-blue-700");
  });

  it("formats threshold percentage correctly", () => {
    const alert = createAlert(85.75);
    render(<QuotaAlert alert={alert} />);

    expect(screen.getByText(/85,8%/)).toBeInTheDocument();
  });

  it("renders dismiss button when onDismiss is provided", () => {
    const onDismiss = jest.fn();
    const alert = createAlert(90);
    render(<QuotaAlert alert={alert} onDismiss={onDismiss} />);

    expect(screen.getByRole("button", { name: /dispensar/i })).toBeInTheDocument();
  });

  it("does not render dismiss button when onDismiss is not provided", () => {
    const alert = createAlert(90);
    render(<QuotaAlert alert={alert} />);

    expect(screen.queryByRole("button", { name: /dispensar/i })).not.toBeInTheDocument();
  });

  it("calls onDismiss with alert id when dismiss button is clicked", async () => {
    const onDismiss = jest.fn();
    const alert = createAlert(90);
    render(<QuotaAlert alert={alert} onDismiss={onDismiss} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /dispensar/i }));

    expect(onDismiss).toHaveBeenCalledWith(alert.id);
  });

  it("applies custom className", () => {
    const alert = createAlert(90);
    render(<QuotaAlert alert={alert} className="custom-class" />);

    expect(screen.getByRole("article")).toHaveClass("custom-class");
  });

  it("renders warning icon", () => {
    const alert = createAlert(90);
    render(<QuotaAlert alert={alert} />);

    // Using title role since AlertTriangle is an icon with semantic meaning
    expect(screen.getByTitle(/alert triangle/i)).toBeInTheDocument();
  });

  it("applies correct color to dismiss button based on severity", () => {
    const onDismiss = jest.fn();

    // High severity
    const highAlert = createAlert(95);
    const { rerender } = render(<QuotaAlert alert={highAlert} onDismiss={onDismiss} />);
    expect(screen.getByRole("button")).toHaveClass("text-red-700");

    // Medium severity
    const mediumAlert = createAlert(80);
    rerender(<QuotaAlert alert={mediumAlert} onDismiss={onDismiss} />);
    expect(screen.getByRole("button")).toHaveClass("text-yellow-700");

    // Low severity
    const lowAlert = createAlert(70);
    rerender(<QuotaAlert alert={lowAlert} onDismiss={onDismiss} />);
    expect(screen.getByRole("button")).toHaveClass("text-blue-700");
  });

  it("renders alert message with correct text", () => {
    const alert = createAlert(85);
    render(<QuotaAlert alert={alert} />);

    const message = screen.getByText(/o uso atual atingiu 85% do limite estabelecido/i);
    expect(message).toBeInTheDocument();
    expect(message).toHaveTextContent(/considere ajustar seus limites ou reduzir o consumo/i);
  });
});