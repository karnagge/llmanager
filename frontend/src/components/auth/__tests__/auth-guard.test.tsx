/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { AuthGuard } from "../auth-guard";
import { useAuth } from "@/hooks/auth/use-auth";

jest.mock("@/hooks/auth/use-auth");
const mockCheckAuth = jest.fn();

describe("AuthGuard", () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      checkAuth: mockCheckAuth,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls checkAuth on mount", () => {
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(mockCheckAuth).toHaveBeenCalledTimes(1);
  });

  it("shows loading state when isLoading is true", () => {
    (useAuth as jest.Mock).mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      checkAuth: mockCheckAuth,
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText(/verificando autenticação/i)).toBeInTheDocument();
    expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    (useAuth as jest.Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      checkAuth: mockCheckAuth,
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText(/protected content/i)).toBeInTheDocument();
    expect(screen.queryByText(/verificando autenticação/i)).not.toBeInTheDocument();
  });

  it("renders nothing when not authenticated", () => {
    (useAuth as jest.Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      checkAuth: mockCheckAuth,
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/verificando autenticação/i)).not.toBeInTheDocument();
  });

  it("re-checks auth when checkAuth dependency changes", () => {
    const { rerender } = render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(mockCheckAuth).toHaveBeenCalledTimes(1);

    // Simula uma mudança na função checkAuth
    const newMockCheckAuth = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      checkAuth: newMockCheckAuth,
    });

    rerender(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(newMockCheckAuth).toHaveBeenCalledTimes(1);
  });
});