/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";
import { GrafanaEmbed, GrafanaPanel, GrafanaDashboard } from "../grafana-embed";

describe("GrafanaEmbed", () => {
  const defaultProps = {
    title: "CPU Usage",
    src: "https://grafana.example.com/d/abc123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with required props", () => {
    render(<GrafanaEmbed {...defaultProps} />);

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByRole("iframe")).toHaveAttribute("src", defaultProps.src);
  });

  it("renders with description", () => {
    const description = "System metrics";
    render(<GrafanaEmbed {...defaultProps} description={description} />);

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it("shows loading skeleton initially", () => {
    render(<GrafanaEmbed {...defaultProps} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("iframe")).toHaveStyle({ display: "none" });
  });

  it("handles successful iframe load", () => {
    const onLoad = jest.fn();
    render(<GrafanaEmbed {...defaultProps} onLoad={onLoad} />);

    const iframe = screen.getByRole("iframe");
    act(() => {
      iframe.dispatchEvent(new Event("load"));
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(iframe).toHaveStyle({ display: "block" });
    expect(onLoad).toHaveBeenCalled();
  });

  it("handles iframe error", () => {
    const onError = jest.fn();
    render(<GrafanaEmbed {...defaultProps} onError={onError} />);

    const iframe = screen.getByRole("iframe");
    act(() => {
      iframe.dispatchEvent(new Event("error"));
    });

    expect(screen.getByText(/failed to load grafana dashboard/i)).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("applies custom height", () => {
    const height = "800px";
    render(<GrafanaEmbed {...defaultProps} height={height} />);

    expect(screen.getByRole("iframe")).toHaveAttribute("height", height);
  });

  it("applies custom className", () => {
    render(<GrafanaEmbed {...defaultProps} className="custom-class" />);

    expect(screen.getByRole("article")).toHaveClass("custom-class");
  });
});

describe("GrafanaPanel", () => {
  const mockGrafanaUrl = "https://grafana.example.com";
  const defaultProps = {
    title: "CPU Usage",
    dashboardUid: "abc123",
    panelId: 1,
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GRAFANA_URL = mockGrafanaUrl;
  });

  it("constructs correct panel URL", () => {
    render(<GrafanaPanel {...defaultProps} />);

    const expectedUrl = `${mockGrafanaUrl}/d/${defaultProps.dashboardUid}?viewPanel=1&kiosk=`;
    expect(screen.getByRole("iframe")).toHaveAttribute("src", expectedUrl);
  });

  it("includes time range in URL", () => {
    const timeRange = {
      from: "now-6h",
      to: "now",
    };

    render(<GrafanaPanel {...defaultProps} timeRange={timeRange} />);

    const iframe = screen.getByRole("iframe");
    expect(iframe.getAttribute("src")).toContain(`from=${timeRange.from}`);
    expect(iframe.getAttribute("src")).toContain(`to=${timeRange.to}`);
  });

  it("includes variables in URL", () => {
    const variables = {
      region: "us-east-1",
      env: "prod",
    };

    render(<GrafanaPanel {...defaultProps} variables={variables} />);

    const iframe = screen.getByRole("iframe");
    expect(iframe.getAttribute("src")).toContain("region=us-east-1");
    expect(iframe.getAttribute("src")).toContain("env=prod");
  });

  it("throws error when GRAFANA_URL is not defined", () => {
    process.env.NEXT_PUBLIC_GRAFANA_URL = "";

    expect(() => {
      render(<GrafanaPanel {...defaultProps} />);
    }).toThrow("NEXT_PUBLIC_GRAFANA_URL is not defined");
  });
});

describe("GrafanaDashboard", () => {
  const mockGrafanaUrl = "https://grafana.example.com";
  const defaultProps = {
    title: "System Dashboard",
    dashboardUid: "abc123",
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GRAFANA_URL = mockGrafanaUrl;
  });

  it("constructs correct dashboard URL", () => {
    render(<GrafanaDashboard {...defaultProps} />);

    const expectedUrl = `${mockGrafanaUrl}/d/${defaultProps.dashboardUid}?kiosk=`;
    expect(screen.getByRole("iframe")).toHaveAttribute("src", expectedUrl);
  });

  it("includes time range in URL", () => {
    const timeRange = {
      from: "now-6h",
      to: "now",
    };

    render(<GrafanaDashboard {...defaultProps} timeRange={timeRange} />);

    const iframe = screen.getByRole("iframe");
    expect(iframe.getAttribute("src")).toContain(`from=${timeRange.from}`);
    expect(iframe.getAttribute("src")).toContain(`to=${timeRange.to}`);
  });

  it("includes variables in URL", () => {
    const variables = {
      datacenter: "us-west",
      cluster: "prod-1",
    };

    render(<GrafanaDashboard {...defaultProps} variables={variables} />);

    const iframe = screen.getByRole("iframe");
    expect(iframe.getAttribute("src")).toContain("datacenter=us-west");
    expect(iframe.getAttribute("src")).toContain("cluster=prod-1");
  });

  it("throws error when GRAFANA_URL is not defined", () => {
    process.env.NEXT_PUBLIC_GRAFANA_URL = "";

    expect(() => {
      render(<GrafanaDashboard {...defaultProps} />);
    }).toThrow("NEXT_PUBLIC_GRAFANA_URL is not defined");
  });

  it("passes through additional props to GrafanaEmbed", () => {
    const height = "1200px";
    const className = "custom-dashboard";
    
    render(
      <GrafanaDashboard
        {...defaultProps}
        height={height}
        className={className}
      />
    );

    const iframe = screen.getByRole("iframe");
    expect(iframe).toHaveAttribute("height", height);
    expect(screen.getByRole("article")).toHaveClass(className);
  });
