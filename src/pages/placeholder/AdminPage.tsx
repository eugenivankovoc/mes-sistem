import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminPage() {
  useSetPageTitle("Admin postavke");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState("");
  const queryClient = useQueryClient();

  const handleCreate = async () => {
    setConfirmOpen(false);
    setCreating(true);
    setProgress("Kreiranje korisnika…");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Niste prijavljeni.");
        setCreating(false);
        return;
      }

      setProgress("Kreiranje 1/6…");

      const res = await supabase.functions.invoke("create-test-users", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) {
        toast.error("Greška: " + res.error.message);
        setCreating(false);
        return;
      }

      const { results } = res.data as {
        results: { index: number; email: string; success: boolean; error?: string }[];
      };

      const successCount = results.filter((r) => r.success).length;
      const failures = results.filter((r) => !r.success);

      if (failures.length > 0) {
        for (const f of failures) {
          toast.error(`${f.email}: ${f.error}`);
        }
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} test korisnika kreirano uspješno. Lozinka za sve: Test1234`
        );
      }

      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) {
      toast.error("Greška: " + (e?.message || String(e)));
    } finally {
      setCreating(false);
      setProgress("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Korisnici</h2>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={creating}
          variant="outline"
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          {creating ? progress : "Kreiraj test tim"}
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Upravljanje korisnicima — uskoro
        </p>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kreirati test tim?</AlertDialogTitle>
            <AlertDialogDescription>
              Kreirati 6 test korisnika s default lozinkom <strong>Test1234</strong>?
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">
                planer@test.com, rezanje@test.com, kantiranje@test.com, cnc@test.com, kontrola@test.com, skladiste@test.com
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreate}>
              Kreiraj
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
