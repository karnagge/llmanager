import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../card";

describe("Card", () => {
  it("renders with all its parts", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Test Content</CardContent>
        <CardFooter>Test Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
    expect(screen.getByText("Test Footer")).toBeInTheDocument();
  });

  it("renders with only required parts", () => {
    render(
      <Card>
        <CardContent>Test Content</CardContent>
      </Card>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("passes className to all parts", () => {
    render(
      <Card className="test-card">
        <CardHeader className="test-header">
          <CardTitle className="test-title">Test Title</CardTitle>
          <CardDescription className="test-description">
            Test Description
          </CardDescription>
        </CardHeader>
        <CardContent className="test-content">Test Content</CardContent>
        <CardFooter className="test-footer">Test Footer</CardFooter>
      </Card>
    );

    expect(document.querySelector(".test-card")).toBeInTheDocument();
    expect(document.querySelector(".test-header")).toBeInTheDocument();
    expect(document.querySelector(".test-title")).toBeInTheDocument();
    expect(document.querySelector(".test-description")).toBeInTheDocument();
    expect(document.querySelector(".test-content")).toBeInTheDocument();
    expect(document.querySelector(".test-footer")).toBeInTheDocument();
  });

  it("uses default div element when asChild is false", () => {
    render(
      <Card asChild={false} data-testid="card">
        <CardContent>Test Content</CardContent>
      </Card>
    );

    const card = screen.getByTestId("card");
    expect(card.tagName).toBe("DIV");
  });

  it("renders card title as heading by default", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
      </Card>
    );

    expect(screen.getByRole("heading")).toHaveTextContent("Test Title");
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(
      <Card onClick={handleClick} data-testid="card">
        <CardContent>Test Content</CardContent>
      </Card>
    );

    screen.getByTestId("card").click();
    expect(handleClick).toHaveBeenCalled();
  });

  it("has correct ARIA attributes", () => {
    render(
      <Card aria-label="Test Card" role="region" data-testid="card">
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Test Content</CardContent>
      </Card>
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("aria-label", "Test Card");
    expect(card).toHaveAttribute("role", "region");
  });

  it("applies base styles correctly", () => {
    render(
      <Card data-testid="card">
        <CardContent>Test Content</CardContent>
      </Card>
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveClass("rounded-lg", "border", "bg-card", "shadow-sm");
  });

  it("merges custom className with base styles", () => {
    render(
      <Card className="custom-class" data-testid="card">
        <CardContent>Test Content</CardContent>
      </Card>
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveClass(
      "rounded-lg",
      "border",
      "bg-card",
      "shadow-sm",
      "custom-class"
    );
  });

  it("preserves user-provided attributes", () => {
    render(
      <Card data-testid="card" data-custom="test" title="Card Title">
        <CardContent>Test Content</CardContent>
      </Card>
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("data-custom", "test");
    expect(card).toHaveAttribute("title", "Card Title");
  });
});