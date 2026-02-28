import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

function getHomeRoute(role: string | null, workstationId: string | null): string {
  if (role === "operator") {
    return workstationId ? `/workstation/${workstationId}` : "/no-workstation";
  }
  return "/orders";
}

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center max-w-md px-4">
        <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-2 text-lg font-medium text-foreground">Stranica nije pronađena</p>
        <p className="mb-6 text-sm text-muted-foreground">
          Stranica koju tražite ne postoji.
        </p>
        <Button
          onClick={() => navigate(
            profile ? getHomeRoute(profile.role, profile.workstation_id) : "/login",
            { replace: true }
          )}
        >
          Povratak na početnu
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
