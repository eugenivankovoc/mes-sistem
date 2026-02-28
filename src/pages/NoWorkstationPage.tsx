import { Factory, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NoWorkstationPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-6">
          <Factory className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">
          Radna stanica nije dodijeljena
        </h1>
        <p className="text-muted-foreground mb-6">
          Nije vam dodijeljena radna stanica. Kontaktirajte administratora.
        </p>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Odjava
        </Button>
      </div>
    </div>
  );
}
