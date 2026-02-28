import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const redirectAfterLogin = async (userId: string) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (roleData?.role === "operator") {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("workstation_id")
        .eq("user_id", userId)
        .single();

      if (profileData?.workstation_id) {
        navigate(`/workstation/${profileData.workstation_id}`, { replace: true });
      } else {
        navigate("/no-workstation", { replace: true });
      }
    } else {
      navigate("/orders", { replace: true });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError("Pogrešan email ili lozinka.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) await redirectAfterLogin(user.id);
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Auto-confirmed, so sign in and redirect
      const { error: loginError } = await signIn(email, password);
      if (loginError) {
        setError("Registracija uspješna, ali prijava nije uspjela. Pokušajte se prijaviti.");
        setIsRegister(false);
        setLoading(false);
        return;
      }
      await redirectAfterLogin(data.user.id);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center mb-4">
            <Factory className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">MES Sustav</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRegister ? "Kreirajte novi račun" : "Prijavite se u sustav"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-border">
          <button
            type="button"
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              !isRegister
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setIsRegister(false); setError(""); }}
          >
            Prijava
          </button>
          <button
            type="button"
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              isRegister
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setIsRegister(true); setError(""); }}
          >
            Registracija
          </button>
        </div>

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Ime i prezime</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ivan Horvat"
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vas@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Lozinka</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={isRegister ? 6 : undefined}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? (isRegister ? "Registracija..." : "Prijava...")
              : (isRegister ? "Registriraj se" : "Prijava")}
          </Button>

          {!isRegister && (
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => {/* TODO: implement forgot password */}}
              >
                Zaboravili ste lozinku?
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
