import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  requireOwnWorkstation?: boolean;
}

function getHomeRoute(role: AppRole | null, workstationId: string | null): string {
  if (role === "operator") {
    return workstationId ? `/workstation/${workstationId}` : "/no-workstation";
  }
  return "/orders";
}

export function ProtectedRoute({ children, allowedRoles, requireOwnWorkstation }: ProtectedRouteProps) {
  const { session, role, profile, loading } = useAuth();
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

  // Wrong role → redirect to their correct home page
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={getHomeRoute(role, profile?.workstation_id ?? null)} replace />;
  }

  // Operator can only access their own workstation
  if (requireOwnWorkstation && role === "operator" && params.id && profile?.workstation_id !== params.id) {
    return <Navigate to={getHomeRoute(role, profile?.workstation_id ?? null)} replace />;
  }

  return <>{children}</>;
}
