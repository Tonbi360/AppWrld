import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "developer" | "admin";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary/8 border border-primary/16 flex items-center justify-center mx-auto mb-5">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Sign in required</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            You need to be signed in to access this page.
          </p>
          <button
            onClick={login}
            className="w-full px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Log in
          </button>
          <Link href="/" className="mt-3 block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (requiredRole) {
    const role = user?.role;
    const hasAccess =
      role === "admin" ||
      (requiredRole === "developer" && role === "developer");

    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-destructive/8 border border-destructive/16 flex items-center justify-center mx-auto mb-5">
              <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">Access restricted</h1>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              This area requires elevated access. Your current role is{" "}
              <span className="font-medium text-foreground">{role ?? "unknown"}</span>.
            </p>
            <Link href="/" className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors inline-block">
              Back to home
            </Link>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
