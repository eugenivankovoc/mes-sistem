import { AlertTriangle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function NoWorkstationPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F9FAFB" }}>
      <div
        className="w-full text-center"
        style={{
          maxWidth: 420,
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 40,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex justify-center mb-5">
          <AlertTriangle style={{ width: 64, height: 64, color: "#E67E22" }} />
        </div>
        <h2 className="font-bold" style={{ fontSize: 22, color: "#0F2744", marginBottom: 8 }}>
          Nije vam dodijeljena radna stanica
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 28 }}>
          Kontaktirajte administratora sustava za dodjelu radne stanice.
        </p>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center justify-center gap-2 font-medium border transition-colors hover:bg-gray-50"
          style={{
            height: 40,
            borderRadius: 6,
            padding: "0 20px",
            fontSize: 14,
            color: "#374151",
            borderColor: "#D1D5DB",
            backgroundColor: "#FFFFFF",
          }}
        >
          <LogOut className="h-4 w-4" />
          Odjava
        </button>
      </div>
    </div>
  );
}
