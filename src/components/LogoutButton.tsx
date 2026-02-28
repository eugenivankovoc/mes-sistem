import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LogoutButtonProps {
  collapsed?: boolean;
  variant?: "sidebar" | "icon";
}

export function LogoutButton({ collapsed = false, variant = "sidebar" }: LogoutButtonProps) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    setOpen(false);
    await signOut();
  };

  if (variant === "icon") {
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <button
            className="p-2 rounded-md text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors duration-150"
            aria-label="Odjava"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </AlertDialogTrigger>
        <LogoutDialogContent onConfirm={handleConfirm} />
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sidebar-foreground/70 hover:bg-destructive hover:text-destructive-foreground transition-colors duration-150"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm">Odjava</span>}
        </button>
      </AlertDialogTrigger>
      <LogoutDialogContent onConfirm={handleConfirm} />
    </AlertDialog>
  );
}

function LogoutDialogContent({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Odjava</AlertDialogTitle>
        <AlertDialogDescription>
          Jeste li sigurni da se želite odjaviti?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Odustani</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Odjava</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
