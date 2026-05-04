import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Factory, Eye, EyeOff, Loader2 } from "lucide-react";
import { translateSupabaseError } from "@/lib/supabaseErrors";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn } = useAuth();

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Email adresa je obavezna.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Unesite ispravnu email adresu.";
    }
    if (!password) {
      errors.password = "Lozinka je obavezna.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const { error: authError } = await signIn(email.trim(), password);

      if (authError) {
        setError(
          authError.message.toLowerCase().includes("invalid login credentials")
            ? "Pogrešan email ili lozinka. Pokušajte ponovo."
            : translateSupabaseError(authError)
        );
      }
    } catch (err) {
      setError(translateSupabaseError(err));
    } finally {
      setLoading(false);
    }
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
        {/* Logo */}
        <div className="flex justify-center">
          <Factory className="shrink-0" style={{ width: 48, height: 48, color: "#1E5FA8" }} />
        </div>

        {/* Title */}
        <h1
          className="text-center font-bold"
          style={{ fontSize: 28, color: "#0F2744", marginTop: 12 }}
        >
          MES Sustav
        </h1>
        <p
          className="text-center"
          style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}
        >
          Prijavite se na vaš račun
        </p>

        {/* Divider */}
        <hr style={{ margin: "24px 0", borderColor: "#E5E7EB" }} />

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="mb-4">
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
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
              className="w-full border outline-none transition-colors"
              style={{
                height: 40,
                borderRadius: 6,
                padding: "0 12px",
                fontSize: 14,
                borderColor: fieldErrors.email ? "#C0392B" : "#D1D5DB",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1E5FA8"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(30,95,168,0.15)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = fieldErrors.email ? "#C0392B" : "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }}
            />
            {fieldErrors.email && (
              <p style={{ fontSize: 12, color: "#C0392B", marginTop: 4 }}>{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-1">
            <label
              htmlFor="password"
              className="block font-medium"
              style={{ fontSize: 14, color: "#374151", marginBottom: 6 }}
            >
              Lozinka
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                className="w-full border outline-none transition-colors pr-10"
                style={{
                  height: 40,
                  borderRadius: 6,
                  padding: "0 40px 0 12px",
                  fontSize: 14,
                  borderColor: fieldErrors.password ? "#C0392B" : "#D1D5DB",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1E5FA8"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(30,95,168,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = fieldErrors.password ? "#C0392B" : "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }}
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
            {fieldErrors.password && (
              <p style={{ fontSize: 12, color: "#C0392B", marginTop: 4 }}>{fieldErrors.password}</p>
            )}
          </div>

          {/* Forgot password */}
          <div className="flex justify-end mb-6">
            <Link
              to="/forgot-password"
              style={{ fontSize: 13, color: "#1E5FA8" }}
              className="hover:underline"
            >
              Zaboravili ste lozinku?
            </Link>
          </div>

          {/* Submit */}
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
              marginTop: 0,
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Prijava u tijeku...
              </>
            ) : (
              "Prijava"
            )}
          </button>

          {/* Error box */}
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
