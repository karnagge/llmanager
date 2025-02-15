/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "../register-form";
import { useAuth } from "@/hooks/auth/use-auth";

jest.mock("@/hooks/auth/use-auth");
const mockRegisterFn = jest.fn();

describe("RegisterForm", () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegisterFn,
      login: jest.fn(),
      logout: jest.fn(),
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders register form fields", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar conta/i })).toBeInTheDocument();
  });

  it("displays validation errors for empty fields", async () => {
    render(<RegisterForm />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument();
    expect(await screen.findByText(/e-mail é obrigatório/i)).toBeInTheDocument();
    expect(await screen.findByText(/senha é obrigatória/i)).toBeInTheDocument();
  });

  it("displays validation error for invalid email", async () => {
    render(<RegisterForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/nome/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "invalid-email");
    await user.type(screen.getByLabelText(/senha/i), "password123");
    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(await screen.findByText(/e-mail inválido/i)).toBeInTheDocument();
  });

  it("calls register function with form data on valid submission", async () => {
    render(<RegisterForm />);
    const user = userEvent.setup();
    const testName = "John Doe";
    const testEmail = "test@example.com";
    const testPassword = "password123";

    await user.type(screen.getByLabelText(/nome/i), testName);
    await user.type(screen.getByLabelText(/email/i), testEmail);
    await user.type(screen.getByLabelText(/senha/i), testPassword);
    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(mockRegisterFn).toHaveBeenCalledWith(testName, testEmail, testPassword);
  });

  it("displays loading state during form submission", async () => {
    mockRegisterFn.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    
    render(<RegisterForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/nome/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/senha/i), "password123");
    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(screen.getByText(/criando conta/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("displays error message when registration fails", async () => {
    mockRegisterFn.mockRejectedValue(new Error("Registration failed"));
    
    render(<RegisterForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/nome/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/senha/i), "password123");
    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(await screen.findByText(/não foi possível criar sua conta/i)).toBeInTheDocument();
  });

  it("validates password length", async () => {
    render(<RegisterForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/nome/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/senha/i), "123");
    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(await screen.findByText(/senha deve ter pelo menos 6 caracteres/i)).toBeInTheDocument();
  });
});