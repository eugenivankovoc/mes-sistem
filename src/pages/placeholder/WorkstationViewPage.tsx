import { useParams } from "react-router-dom";
import { Factory, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function WorkstationViewPage() {
  const { id } = useParams();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <Factory className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Radna stanica</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{profile?.full_name || profile?.email}</span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1" />
            Odjava
          </Button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <p className="text-muted-foreground">
          Radna stanica ({id}) — prikaz dijelova uskoro
        </p>
      </main>
    </div>
  );
}
