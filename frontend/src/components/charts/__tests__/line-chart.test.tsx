/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { LineChart } from "../line-chart";

// Mock Tremor components
jest.mock("@tremor/react", () => ({
  AreaChart: jest.fn(() => <div data-testid="area-chart" />),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("LineChart", () => {
  const defaultProps = {
    title: "Requisições por Hora",
    data: [
      { date: "2025-01-01", value: 100 },
      { date: "2025-01-02", value: 200 },
    ],
    categories: ["value"],
    index: "date",
  };

  it("renders with required props", () => {
    render(<LineChart {...defaultProps} />);

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });

  it("renders loading skeleton when isLoading is true", () => {
    render(<LineChart {...defaultProps} isLoading={true} />);

    expect(screen.getAllByRole("status")).toHaveLength(1); // Skeleton
    expect(screen.queryByTestId("area-chart")).not.toBeInTheDocument();
  });

  it("renders loading skeleton with description when isLoading is true", () => {
    render(
      <LineChart
        {...defaultProps}
        isLoading={true}
        description="Dados das últimas 24 horas"
      />
    );

    expect(screen.getAllByRole("status")).toHaveLength(2); // Title and description skeletons
  });

  it("renders with description", () => {
    const description = "Dados das últimas 24 horas";
    render(<LineChart {...defaultProps} description={description} />);

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it("passes correct props to AreaChart", () => {
    const { AreaChart: MockAreaChart } = require("@tremor/react");
    const customProps = {
      ...defaultProps,
      colors: ["blue", "red"],
      valueFormatter: (value: number) => `${value}%`,
      height: "h-96",
    };

    render(<LineChart {...customProps} />);

    expect(MockAreaChart).toHaveBeenCalledWith(
      expect.objectContaining({
        data: customProps.data,
        index: customProps.index,
        categories: customProps.categories,
        colors: customProps.colors,
        valueFormatter: customProps.valueFormatter,
        className: customProps.height,
        showLegend: true,
        showGridLines: true,
        showTooltip: true,
        showXAxis: true,
        showYAxis: true,
      }),
      expect.any(Object)
    );
  });

  it("uses default valueFormatter when not provided", () => {
    const { AreaChart: MockAreaChart } = require("@tremor/react");
    render(<LineChart {...defaultProps} />);

    const call = MockAreaChart.mock.calls[0][0];
    expect(call.valueFormatter(100)).toBe("100");
  });

  it("uses default colors when not provided", () => {
    const { AreaChart: MockAreaChart } = require("@tremor/react");
    render(<LineChart {...defaultProps} />);

    const call = MockAreaChart.mock.calls[0][0];
    expect(call.colors).toEqual(["emerald", "gray"]);
  });

  it("uses default height when not provided", () => {
    const { AreaChart: MockAreaChart } = require("@tremor/react");
    render(<LineChart {...defaultProps} />);

    const call = MockAreaChart.mock.calls[0][0];
    expect(call.className).toBe("h-72");
  });

  it("applies custom className to wrapper Card", () => {
    render(<LineChart {...defaultProps} className="custom-class" />);
    
    const card = screen.getByRole("article");
    expect(card).toHaveClass("custom-class");
  });
});