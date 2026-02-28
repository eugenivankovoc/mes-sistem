import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface PublicRouteProps {
  children: React.ReactNode;
}

function getHomeRoute(role: string | null, workstationId: string | null): string {
  if (role === "operator") {
    return workstationId ? `/workstation/${workstationId}` : "/no-workstation";
  }
  return "/orders";
}

/**
 * Wraps public pages (login, forgot-password, reset-password).
 * If the user is already authenticated, redirects to their role-based home.
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { session, profile, loading } = useAuth();

  if (loading) return null; // AuthGuard-level spinner handles this

  // Allow reset-password even when logged in (PASSWORD_RECOVERY flow)
  if (session && profile) {
    return <Navigate to={getHomeRoute(profile.role, profile.workstation_id)} replace />;
  }

  return <>{children}</>;
}
