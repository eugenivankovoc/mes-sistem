import { useNavigate } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

function getHomeRoute(role: string | null, workstationId: string | null): string {
  if (role === "operator") {
    return workstationId ? `/workstation/${workstationId}` : "/no-workstation";
  }
  return "/orders";
}

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center max-w-md px-4">
        <div className="flex justify-center mb-4">
          <ShieldX className="h-16 w-16 text-destructive" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">403</h1>
        <p className="mb-2 text-lg font-medium text-foreground">
          Nemate ovlaštenje za pristup ovoj stranici.
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          Kontaktirajte administratora ako smatrate da bi trebali imati pristup.
        </p>
        <Button
          onClick={() => navigate(getHomeRoute(profile?.role ?? null, profile?.workstation_id ?? null), { replace: true })}
        >
          Povratak na početnu
        </Button>
      </div>
    </div>
  );
}
