import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../login-form";
import { useAuth } from "@/hooks/auth/use-auth";

// Mock o hook de autenticação
jest.mock("@/hooks/auth/use-auth");
const mockLoginFn = jest.fn();

describe("LoginForm", () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLoginFn,
      logout: jest.fn(),
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("displays validation errors for empty fields", async () => {
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText(/e-mail é obrigatório/i)).toBeInTheDocument();
    expect(await screen.findByText(/senha é obrigatória/i)).toBeInTheDocument();
  });

  it("displays validation error for invalid email", async () => {
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "invalid-email");
    await user.type(screen.getByLabelText(/senha/i), "password123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText(/e-mail inválido/i)).toBeInTheDocument();
  });

  it("calls login function with form data on valid submission", async () => {
    render(<LoginForm />);
    const user = userEvent.setup();
    const testEmail = "test@example.com";
    const testPassword = "password123";

    await user.type(screen.getByLabelText(/email/i), testEmail);
    await user.type(screen.getByLabelText(/senha/i), testPassword);
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(mockLoginFn).toHaveBeenCalledWith(testEmail, testPassword);
  });

  it("displays loading state during form submission", async () => {
    mockLoginFn.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/senha/i), "password123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(screen.getByText(/entrando/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("displays error message when login fails", async () => {
    mockLoginFn.mockRejectedValue(new Error("Login failed"));
    
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/senha/i), "password123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText(/não foi possível fazer login/i)).toBeInTheDocument();
  });
});