import { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "guard" | "resident" | "admin" | "visitor";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: AppRole;
  /** e.g. "resident" -- the actual redirect path is built as "/:societySlug/resident"
   * or just "/resident" depending on which route pattern actually matched, so a
   * direct/refreshed hit on a society-scoped dashboard sends an unauthenticated
   * visitor back to that SAME society's login page, not a slug-less legacy one. */
  loginPathBase: string;
}

const ProtectedRoute = ({ children, requiredRole, loginPathBase }: ProtectedRouteProps) => {
  const { user, roles, loading } = useAuth();
  const { societySlug } = useParams();
  const loginPath = societySlug ? `/${societySlug}/${loginPathBase}` : `/${loginPathBase}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginPath} replace />;
  }

  // Super-admins have no society and should never land on society dashboards —
  // redirect them to their own dashboard silently.
  if (roles.includes("super_admin")) {
    return <Navigate to="/super-admin" replace />;
  }

  if (!roles.includes(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="space-y-4">
          <p className="text-2xl font-bold text-destructive">Access Denied</p>
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
