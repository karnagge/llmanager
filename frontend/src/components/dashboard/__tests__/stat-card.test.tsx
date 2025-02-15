/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../stat-card";
import { Activity } from "lucide-react";

describe("StatCard", () => {
  const defaultProps = {
    title: "Total de Requisições",
    value: "1,234",
    icon: <Activity data-testid="stat-icon" />,
  };

  it("renders with required props", () => {
    render(<StatCard {...defaultProps} />);

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.value)).toBeInTheDocument();
    expect(screen.getByTestId("stat-icon")).toBeInTheDocument();
  });

  it("renders with optional description", () => {
    const description = "Últimos 30 dias";
    render(<StatCard {...defaultProps} description={description} />);

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it("renders positive trend correctly", () => {
    const trend = { value: 15, isPositive: true };
    render(<StatCard {...defaultProps} trend={trend} />);

    const trendElement = screen.getByText(/\+15%/);
    expect(trendElement).toBeInTheDocument();
    expect(trendElement).toHaveClass("text-green-500");
  });

  it("renders negative trend correctly", () => {
    const trend = { value: 10, isPositive: false };
    render(<StatCard {...defaultProps} trend={trend} />);

    const trendElement = screen.getByText(/-10%/);
    expect(trendElement).toBeInTheDocument();
    expect(trendElement).toHaveClass("text-red-500");
  });

  it("applies custom className", () => {
    render(<StatCard {...defaultProps} className="custom-class" />);

    expect(screen.getByRole("article")).toHaveClass("custom-class");
  });

  it("renders with both trend and description", () => {
    const props = {
      ...defaultProps,
      trend: { value: 20, isPositive: true },
      description: "Comparado ao mês anterior",
    };

    render(<StatCard {...props} />);

    expect(screen.getByText(/\+20%/)).toBeInTheDocument();
    expect(screen.getByText(props.description)).toBeInTheDocument();
  });

  it("renders numerical value correctly", () => {
    render(<StatCard {...defaultProps} value={1234} />);
    expect(screen.getByText("1234")).toBeInTheDocument();
  });

  it("does not render trend section when trend is not provided", () => {
    render(<StatCard {...defaultProps} />);
    
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("formats trend value absolute value correctly", () => {
    const trend = { value: -15, isPositive: false };
    render(<StatCard {...defaultProps} trend={trend} />);

    expect(screen.getByText(/-15%/)).toBeInTheDocument();
  });
});