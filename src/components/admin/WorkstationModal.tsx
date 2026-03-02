import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfirmBeforeClose } from "@/hooks/useConfirmBeforeClose";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface WorkstationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workstation: {
    id: string;
    name: string;
    code: string;
    type: string | null;
    is_active: boolean;
  } | null;
}

const typeOptions = [
  { value: "cutting", label: "Rezanje" },
  { value: "edgebanding", label: "Kantiranje" },
  { value: "cnc", label: "CNC obrada" },
  { value: "quality", label: "Kontrola kvalitete" },
  { value: "packaging", label: "Skladištar / Pakiranje" },
];

export function WorkstationModal({ open, onOpenChange, workstation }: WorkstationModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!workstation;

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [isActive, setIsActive] = useState(true);

  const isDirty = useMemo(() => {
    if (isEdit && workstation) {
      return name !== workstation.name || type !== (workstation.type || "") || isActive !== workstation.is_active;
    }
    return !!(name || type);
  }, [name, type, isActive, workstation, isEdit]);

  const { guardedOpenChange, showGuard, confirmClose, cancelClose } =
    useConfirmBeforeClose(isDirty, onOpenChange);

  useEffect(() => {
    if (open) {
      if (workstation) {
        setName(workstation.name);
        setType(workstation.type || "");
        setIsActive(workstation.is_active);
      } else {
        setName("");
        setType("");
        setIsActive(true);
      }
    }
  }, [open, workstation]);

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !type) throw new Error("Naziv i tip su obavezni");

      const codeMap: Record<string, string> = {
        cutting: "REZ", edgebanding: "KANT", cnc: "CNC", quality: "QK", packaging: "PAK",
      };

      if (isEdit && workstation) {
        const { error } = await supabase
          .from("workstations")
          .update({ name: name.trim(), type, is_active: isActive })
          .eq("id", workstation.id);
        if (error) throw error;
      } else {
        const { data: existing } = await supabase
          .from("workstations")
          .select("sort_order")
          .order("sort_order", { ascending: false })
          .limit(1);
        const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

        const baseCode = codeMap[type] || type.toUpperCase().slice(0, 4);
        const { data: sameCodes } = await supabase
          .from("workstations")
          .select("code")
          .like("code", `${baseCode}%`);
        const code = sameCodes?.length ? `${baseCode}-${String(sameCodes.length + 1).padStart(2, "0")}` : `${baseCode}-01`;

        const { error } = await supabase.from("workstations").insert({
          name: name.trim(), code, type, is_active: isActive, sort_order: nextOrder,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workstations"] });
      queryClient.invalidateQueries({ queryKey: ["workstations-active"] });
      toast.success(isEdit ? "Stanica ažurirana" : "Stanica kreirana");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
    <Dialog open={open} onOpenChange={guardedOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Uredi radnu stanicu" : "Dodaj radnu stanicu"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Naziv radne stanice *</Label>
            <Input placeholder="npr. Kantovanje 1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Tip stanice *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Odaberi tip" /></SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Aktivna</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => guardedOpenChange(false)}>Odustani</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Spremam…" : isEdit ? "Spremi" : "Dodaj"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <UnsavedChangesDialog open={showGuard} onConfirm={confirmClose} onCancel={cancelClose} />
    </>
  );
}
