import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldError("");

    if (!email.trim()) {
      setFieldError("Email adresa je obavezna.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError("Unesite ispravnu email adresu.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError("Greška. Pokušajte ponovo.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

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
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 hover:underline mb-6"
          style={{ fontSize: 13, color: "#1E5FA8" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Povratak na prijavu
        </Link>

        {sent ? (
          /* Success state */
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle style={{ width: 48, height: 48, color: "#27AE60" }} />
            </div>
            <h2 className="font-bold" style={{ fontSize: 22, color: "#0F2744", marginBottom: 8 }}>
              Link za resetiranje poslan!
            </h2>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
              Provjerite vaš email pretinac. Link je valjan 60 minuta.
            </p>
            <Link
              to="/login"
              className="hover:underline font-medium"
              style={{ fontSize: 14, color: "#1E5FA8" }}
            >
              Povratak na prijavu
            </Link>
          </div>
        ) : (
          /* Form state */
          <>
            <h2 className="font-bold" style={{ fontSize: 22, color: "#0F2744", marginBottom: 8 }}>
              Zaboravili ste lozinku?
            </h2>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
              Unesite vaš email i poslat ćemo vam link za resetiranje.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="block font-medium"
                  style={{ fontSize: 14, color: "#374151", marginBottom: 6 }}
                >
                  Email adresa
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vas@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldError(""); }}
                  className="w-full border outline-none transition-colors"
                  style={{
                    height: 40,
                    borderRadius: 6,
                    padding: "0 12px",
                    fontSize: 14,
                    borderColor: fieldError ? "#C0392B" : "#D1D5DB",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#1E5FA8"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(30,95,168,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = fieldError ? "#C0392B" : "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }}
                />
                {fieldError && (
                  <p style={{ fontSize: 12, color: "#C0392B", marginTop: 4 }}>{fieldError}</p>
                )}
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
                    Slanje...
                  </>
                ) : (
                  "Pošalji link za reset"
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
          </>
        )}
      </div>
    </div>
  );
}
