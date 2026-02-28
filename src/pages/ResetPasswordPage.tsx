import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function getStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: "", color: "#D1D5DB" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/\d/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: "Slaba", color: "#E74C3C" };
  if (score === 2) return { level: 2, label: "Srednja", color: "#F39C12" };
  return { level: 3, label: "Jaka", color: "#27AE60" };
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase v2 handles the token exchange via the hash automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Check if we already have a session (user clicked the link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        // Give a moment for the hash to be processed
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (!s) {
              navigate("/forgot-password", { replace: true, state: { expired: true } });
            } else {
              setReady(true);
            }
          });
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const strength = useMemo(() => getStrength(password), [password]);

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!hasMinLength) {
      setError("Lozinka mora imati najmanje 8 znakova.");
      return;
    }
    if (!hasNumber) {
      setError("Lozinka mora sadržavati barem jedan broj.");
      return;
    }
    if (password !== confirm) {
      setError("Lozinke se ne podudaraju.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || "Greška pri spremanju lozinke.");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    toast.success("Lozinka uspješno promijenjena. Prijavite se.");
    navigate("/login", { replace: true });
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F9FAFB" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#1E5FA8" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F9FAFB" }}>
      <div
        className="w-full"
        style={{
          maxWidth: 400,
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 40,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h2 className="font-bold text-center" style={{ fontSize: 22, color: "#0F2744", marginBottom: 8 }}>
          Nova lozinka
        </h2>
        <p className="text-center" style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
          Unesite novu lozinku za vaš račun.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* New password */}
          <div className="mb-2">
            <label htmlFor="password" className="block font-medium" style={{ fontSize: 14, color: "#374151", marginBottom: 6 }}>
              Nova lozinka
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border outline-none transition-colors"
                style={{ height: 40, borderRadius: 6, padding: "0 40px 0 12px", fontSize: 14, borderColor: "#D1D5DB" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1E5FA8"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(30,95,168,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-0 h-full flex items-center justify-center"
                style={{ width: 40, color: "#9CA3AF" }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Requirements */}
            <div className="mt-2 space-y-1" style={{ fontSize: 12 }}>
              <p style={{ color: hasMinLength ? "#27AE60" : "#9CA3AF" }}>
                {hasMinLength ? "✓" : "○"} Najmanje 8 znakova
              </p>
              <p style={{ color: hasNumber ? "#27AE60" : "#9CA3AF" }}>
                {hasNumber ? "✓" : "○"} Sadrži barem jedan broj
              </p>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{ backgroundColor: i <= strength.level ? strength.color : "#E5E7EB" }}
                    />
                  ))}
                </div>
                <p className="mt-1" style={{ fontSize: 12, color: strength.color }}>{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="mb-5 mt-4">
            <label htmlFor="confirm" className="block font-medium" style={{ fontSize: 14, color: "#374151", marginBottom: 6 }}>
              Potvrdi lozinku
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border outline-none transition-colors"
                style={{ height: 40, borderRadius: 6, padding: "0 40px 0 12px", fontSize: 14, borderColor: "#D1D5DB" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1E5FA8"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(30,95,168,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-0 top-0 h-full flex items-center justify-center"
                style={{ width: 40, color: "#9CA3AF" }}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center font-medium text-white transition-colors"
            style={{
              height: 44,
              borderRadius: 6,
              fontSize: 15,
              backgroundColor: loading ? "#4A8AD4" : "#1E5FA8",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Spremanje...
              </>
            ) : (
              "Spremi novu lozinku"
            )}
          </button>

          {error && (
            <div
              style={{
                marginTop: 16,
                backgroundColor: "#FFEBEE",
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: 13,
                color: "#C62828",
              }}
            >
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
