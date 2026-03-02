import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminUsers, useUpdateUser, useWorkstations, type AdminUser } from "@/hooks/useAdminUsers";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import { InviteUserModal } from "./InviteUserModal";

const roleLabels: Record<string, string> = {
  administrator: "Administrator",
  planner: "Planer",
  operator: "Operater",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UsersTab() {
  const { user } = useAuth();
  const { data: users, isLoading } = useAdminUsers();
  const { data: workstations } = useWorkstations();
  const updateUser = useUpdateUser();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const [inviteOpen, setInviteOpen] = useState(false);

  const handleRoleChange = (u: AdminUser, newRole: string) => {
    setConfirmDialog({
      open: true,
      title: "Promijeniti ulogu?",
      description: `Promijeniti ulogu za ${u.full_name} u "${roleLabels[newRole]}"?`,
      onConfirm: () => {
        updateUser.mutate(
          { user_id: u.user_id, role: newRole },
          {
            onSuccess: () => toast.success("Uloga ažurirana"),
            onError: (e) => toast.error(e.message),
          }
        );
        setConfirmDialog((d) => ({ ...d, open: false }));
      },
    });
  };

  const handleWorkstationChange = (u: AdminUser, wsId: string) => {
    const value = wsId === "__none" ? null : wsId;
    updateUser.mutate(
      { user_id: u.user_id, workstation_id: value },
      {
        onSuccess: () => toast.success("Radna stanica ažurirana"),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const handleToggleActive = (u: AdminUser) => {
    if (u.user_id === user?.id) {
      toast.error("Ne možete deaktivirati vlastiti račun");
      return;
    }

    if (u.is_active) {
      setConfirmDialog({
        open: true,
        title: "Deaktivirati korisnika?",
        description: `Deaktivirati korisnika ${u.full_name}? Korisnik se neće moći prijaviti.`,
        onConfirm: () => {
          updateUser.mutate(
            { user_id: u.user_id, is_active: false },
            {
              onSuccess: () => toast.success("Korisnik deaktiviran"),
              onError: (e) => toast.error(e.message),
            }
          );
          setConfirmDialog((d) => ({ ...d, open: false }));
        },
      });
    } else {
      updateUser.mutate(
        { user_id: u.user_id, is_active: true },
        {
          onSuccess: () => toast.success("Korisnik aktiviran"),
          onError: (e) => toast.error(e.message),
        }
      );
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Upravljanje korisnicima
        </h2>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Pozovi korisnika
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--table-header-bg))] hover:bg-[hsl(var(--table-header-bg))]">
              <TableHead className="text-[11px] uppercase font-bold tracking-[0.05em] text-[hsl(var(--table-header-text))]">
                Korisnik
              </TableHead>
              <TableHead className="text-[11px] uppercase font-bold tracking-[0.05em] text-[hsl(var(--table-header-text))]">
                Uloga
              </TableHead>
              <TableHead className="text-[11px] uppercase font-bold tracking-[0.05em] text-[hsl(var(--table-header-text))]">
                Radna stanica
              </TableHead>
              <TableHead className="text-[11px] uppercase font-bold tracking-[0.05em] text-[hsl(var(--table-header-text))]">
                Status
              </TableHead>
              <TableHead className="text-[11px] uppercase font-bold tracking-[0.05em] text-[hsl(var(--table-header-text))]">
                Zadnja prijava
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !users?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nema korisnika
                </TableCell>
              </TableRow>
            ) : (
              users.map((u, idx) => (
                <TableRow
                  key={u.user_id}
                  className={idx % 2 === 1 ? "bg-[hsl(var(--table-row-stripe))]" : ""}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                          {getInitials(u.full_name || u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {u.full_name || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role || ""}
                      onValueChange={(val) => handleRoleChange(u, val)}
                    >
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administrator">Administrator</SelectItem>
                        <SelectItem value="planner">Planer</SelectItem>
                        <SelectItem value="operator">Operater</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {u.role === "operator" ? (
                      <Select
                        value={u.workstation_id || "__none"}
                        onValueChange={(val) => handleWorkstationChange(u, val)}
                      >
                        <SelectTrigger className="h-8 w-[160px] text-xs">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">— Nije dodijeljeno</SelectItem>
                          {workstations?.map((ws) => (
                            <SelectItem key={ws.id} value={ws.id}>
                              {ws.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={u.is_active}
                      onCheckedChange={() => handleToggleActive(u)}
                      disabled={u.user_id === user?.id}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {u.last_sign_in_at
                        ? format(new Date(u.last_sign_in_at), "dd.MM.yyyy HH:mm", { locale: hr })
                        : "Nikad"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((d) => ({ ...d, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm}>
              Potvrdi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InviteUserModal open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
