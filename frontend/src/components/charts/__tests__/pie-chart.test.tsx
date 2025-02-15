/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { PieChart } from "../pie-chart";

// Mock Tremor components
jest.mock("@tremor/react", () => ({
  DonutChart: jest.fn(({ data, label }) => (
    <div data-testid="donut-chart">
      <span data-testid="chart-label">{label}</span>
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
    </div>
  )),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("PieChart", () => {
  const defaultProps = {
    title: "Distribuição por Categoria",
    data: [
      { name: "A", value: 100 },
      { name: "B", value: 200 },
      { name: "C", value: 300 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with required props", () => {
    render(<PieChart {...defaultProps} />);

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByTestId("donut-chart")).toBeInTheDocument();
  });

  it("renders loading skeleton when isLoading is true", () => {
    render(<PieChart {...defaultProps} isLoading={true} />);

    expect(screen.getAllByRole("status")).toHaveLength(1); // Title skeleton
    expect(screen.queryByTestId("donut-chart")).not.toBeInTheDocument();
  });

  it("renders loading skeleton with description when isLoading is true", () => {
    render(
      <PieChart
        {...defaultProps}
        isLoading={true}
        description="Análise de dados"
      />
    );

    expect(screen.getAllByRole("status")).toHaveLength(2); // Title and description skeletons
  });

  it("calculates percentages correctly", () => {
    const { DonutChart } = require("@tremor/react");
    render(<PieChart {...defaultProps} />);

    const chartData = JSON.parse(screen.getByTestId("chart-data").textContent || "");
    expect(chartData).toContainEqual(
      expect.objectContaining({
        name: "A",
        value: 100,
        percentage: "16.7%",
      })
    );
    expect(chartData).toContainEqual(
      expect.objectContaining({
        name: "B",
        value: 200,
        percentage: "33.3%",
      })
    );
    expect(chartData).toContainEqual(
      expect.objectContaining({
        name: "C",
        value: 300,
        percentage: "50.0%",
      })
    );
  });

  it("displays total in the label", () => {
    render(<PieChart {...defaultProps} />);

    expect(screen.getByTestId("chart-label")).toHaveTextContent("Total: 600");
  });

  it("uses custom valueFormatter", () => {
    const valueFormatter = (value: number) => `${value}K`;
    render(<PieChart {...defaultProps} valueFormatter={valueFormatter} />);

    expect(screen.getByTestId("chart-label")).toHaveTextContent("Total: 600K");
  });

  it("renders legend items when showLabel is true", () => {
    render(<PieChart {...defaultProps} showLabel={true} />);

    defaultProps.data.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });
  });

  it("hides legend items when showLabel is false", () => {
    render(<PieChart {...defaultProps} showLabel={false} />);

    const legendItem = defaultProps.data[0].name;
    expect(screen.queryByText(legendItem)).not.toBeInTheDocument();
  });

  it("passes correct props to DonutChart", () => {
    const { DonutChart } = require("@tremor/react");
    const customProps = {
      ...defaultProps,
      colors: ["red", "blue", "green"],
      variant: "pie" as const,
      showLabel: false,
      showAnimation: false,
    };

    render(<PieChart {...customProps} />);

    expect(DonutChart).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: customProps.colors,
        variant: customProps.variant,
        showLabel: customProps.showLabel,
        showAnimation: customProps.showAnimation,
      }),
      expect.any(Object)
    );
  });

  it("uses default values for optional props", () => {
    const { DonutChart } = require("@tremor/react");
    render(<PieChart {...defaultProps} />);

    expect(DonutChart).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: ["slate", "violet", "indigo", "rose", "cyan", "amber"],
        variant: "donut",
        showLabel: true,
        showAnimation: true,
      }),
      expect.any(Object)
    );
  });

  it("applies custom className to wrapper Card", () => {
    render(<PieChart {...defaultProps} className="custom-class" />);
    
    const card = screen.getByRole("article");
    expect(card).toHaveClass("custom-class");
  });

  it("shows correct percentage and value in legend", () => {
    render(<PieChart {...defaultProps} showLabel={true} />);

    // Check first item (100 of 600 = 16.7%)
    const legendValue = screen.getByText("16.7% (100)");
    expect(legendValue).toBeInTheDocument();
  });
});