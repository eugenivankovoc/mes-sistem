import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import ForbiddenPage from "@/pages/ForbiddenPage";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  /** If true, operator can only see their own workstation; others get redirected home */
  requireOwnWorkstation?: boolean;
  /** If true, show 403 instead of redirecting when role doesn't match */
  showForbidden?: boolean;
}

function getHomeRoute(role: AppRole | null, workstationId: string | null): string {
  if (role === "operator") {
    return workstationId ? `/workstation/${workstationId}` : "/no-workstation";
  }
  return "/orders";
}

export function ProtectedRoute({ children, allowedRoles, requireOwnWorkstation, showForbidden }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();
  const role = profile?.role ?? null;
  const params = useParams();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → 403 or redirect
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (showForbidden) {
      return <ForbiddenPage />;
    }
    return <Navigate to={getHomeRoute(role, profile?.workstation_id ?? null)} replace />;
  }

  // Operator can only access their own workstation
  if (requireOwnWorkstation && role === "operator" && params.id && profile?.workstation_id !== params.id) {
    return <Navigate to={getHomeRoute(role, profile?.workstation_id ?? null)} replace />;
  }

  return <>{children}</>;
}
