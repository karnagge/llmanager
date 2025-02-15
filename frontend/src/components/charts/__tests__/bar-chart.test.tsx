/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { BarChart } from "../bar-chart";

// Mock Tremor components
jest.mock("@tremor/react", () => ({
  BarChart: jest.fn(() => <div data-testid="bar-chart" />),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("BarChart", () => {
  const defaultProps = {
    title: "Usuários por Região",
    data: [
      { date: "2025-01", region: "Norte", value: 100 },
      { date: "2025-01", region: "Sul", value: 200 },
    ],
    categories: ["value"],
    index: "date",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with required props", () => {
    render(<BarChart {...defaultProps} />);

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders loading skeleton when isLoading is true", () => {
    render(<BarChart {...defaultProps} isLoading={true} />);

    expect(screen.getAllByRole("status")).toHaveLength(1); // Skeleton
    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
  });

  it("renders loading skeleton with description when isLoading is true", () => {
    render(
      <BarChart
        {...defaultProps}
        isLoading={true}
        description="Distribuição geográfica"
      />
    );

    expect(screen.getAllByRole("status")).toHaveLength(2); // Title and description skeletons
  });

  it("renders with description", () => {
    const description = "Distribuição geográfica";
    render(<BarChart {...defaultProps} description={description} />);

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it("passes correct props to BarChart", () => {
    const { BarChart: MockBarChart } = require("@tremor/react");
    const customProps = {
      ...defaultProps,
      colors: ["blue", "red"],
      valueFormatter: (value: number) => `${value}%`,
      height: "h-96",
      showLegend: false,
      showGridLines: false,
      showTooltip: false,
      showXAxis: false,
      showYAxis: false,
    };

    render(<BarChart {...customProps} />);

    expect(MockBarChart).toHaveBeenCalledWith(
      expect.objectContaining({
        data: customProps.data,
        index: customProps.index,
        categories: customProps.categories,
        colors: customProps.colors,
        valueFormatter: customProps.valueFormatter,
        className: customProps.height,
        showLegend: false,
        showGridLines: false,
        showTooltip: false,
        showXAxis: false,
        showYAxis: false,
      }),
      expect.any(Object)
    );
  });

  it("uses default values for optional props", () => {
    const { BarChart: MockBarChart } = require("@tremor/react");
    render(<BarChart {...defaultProps} />);

    const call = MockBarChart.mock.calls[0][0];
    expect(call.colors).toEqual(["emerald", "gray"]);
    expect(call.valueFormatter(100)).toBe("100");
    expect(call.className).toBe("h-72");
    expect(call.showLegend).toBe(true);
    expect(call.showGridLines).toBe(true);
    expect(call.showTooltip).toBe(true);
    expect(call.showXAxis).toBe(true);
    expect(call.showYAxis).toBe(true);
  });

  it("applies custom className to wrapper Card", () => {
    render(<BarChart {...defaultProps} className="custom-class" />);
    
    const card = screen.getByRole("article");
    expect(card).toHaveClass("custom-class");
  });

  it("passes correct value formatter", () => {
    const { BarChart: MockBarChart } = require("@tremor/react");
    const customFormatter = (value: number) => `${value}K`;
    
    render(<BarChart {...defaultProps} valueFormatter={customFormatter} />);

    const call = MockBarChart.mock.calls[0][0];
    expect(call.valueFormatter(100)).toBe("100K");
  });

  it("handles empty data array", () => {
    const { BarChart: MockBarChart } = require("@tremor/react");
    
    render(<BarChart {...defaultProps} data={[]} />);

    expect(MockBarChart).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [],
      }),
      expect.any(Object)
    );
  });

  it("respects visibility toggles individually", () => {
    const { BarChart: MockBarChart } = require("@tremor/react");
    
    const props = {
      ...defaultProps,
      showLegend: true,
      showGridLines: false,
      showTooltip: true,
      showXAxis: false,
      showYAxis: true,
    };

    render(<BarChart {...props} />);

    const call = MockBarChart.mock.calls[0][0];
    expect(call.showLegend).toBe(true);
    expect(call.showGridLines).toBe(false);
    expect(call.showTooltip).toBe(true);
    expect(call.showXAxis).toBe(false);
    expect(call.showYAxis).toBe(true);
  });
});