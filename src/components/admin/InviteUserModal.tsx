import { useState } from "react";
import { useInviteUser, useWorkstations } from "@/hooks/useAdminUsers";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserModal({ open, onOpenChange }: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("operator");
  const [workstationId, setWorkstationId] = useState("");
  const { data: workstations } = useWorkstations();
  const inviteUser = useInviteUser();

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setRole("operator");
    setWorkstationId("");
  };

  const handleSubmit = () => {
    if (!email.trim() || !fullName.trim()) {
      toast.error("Email i ime su obavezni");
      return;
    }

    inviteUser.mutate(
      {
        email: email.trim(),
        full_name: fullName.trim(),
        role,
        workstation_id: role === "operator" && workstationId ? workstationId : null,
      },
      {
        onSuccess: () => {
          toast.success(`Pozivnica poslana na ${email.trim()}`);
          resetForm();
          onOpenChange(false);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Pozovi novog korisnika</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email *</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="korisnik@firma.hr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-name">Ime i prezime *</Label>
            <Input
              id="invite-name"
              placeholder="Ivan Horvat"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Uloga *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="administrator">Administrator</SelectItem>
                <SelectItem value="planner">Planer</SelectItem>
                <SelectItem value="operator">Operater</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === "operator" && (
            <div className="space-y-2">
              <Label>Radna stanica</Label>
              <Select value={workstationId} onValueChange={setWorkstationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberi radnu stanicu" />
                </SelectTrigger>
                <SelectContent>
                  {workstations?.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Odustani
          </Button>
          <Button onClick={handleSubmit} disabled={inviteUser.isPending}>
            {inviteUser.isPending ? "Šaljem…" : "Pošalji pozivnicu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
