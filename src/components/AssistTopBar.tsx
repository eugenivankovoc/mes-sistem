import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Scissors, AlignLeft, Cpu, CircleDot, ListOrdered,
  Wrench, CheckCircle, Package, Factory, LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

const WORKSTATION_ICONS: Record<string, React.ElementType> = {
  cutting: Scissors,
  edgebanding: AlignLeft,
  cnc: Cpu,
  drilling: CircleDot,
  sorting: ListOrdered,
  assembly: Wrench,
  quality: CheckCircle,
  packaging: Package,
};

export function AssistTopBar() {
  const { id } = useParams<{ id: string }>();
  const { profile, signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(() => formatTime());
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(formatTime()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const { data: workstation } = useQuery({
    queryKey: ["workstation", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstations")
        .select("name, code, type")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-parts", id],
    enabled: !!id,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("parts")
        .select("id", { count: "exact", head: true })
        .eq("current_workstation_id", id!)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const operatorName = profile?.full_name || profile?.email || "Operater";
  const WsIcon = (workstation?.type ? WORKSTATION_ICONS[workstation.type] : null) || Factory;

  const handleLogoutConfirm = async () => {
    setLogoutOpen(false);
    await signOut();
  };

  return (
    <>
      <header
        className="h-14 flex items-center justify-between bg-card px-4 shrink-0"
        style={{ borderBottom: "1px solid #E5E7EB" }}
      >
        {/* Left – Icon + name + type badge */}
        <div className="flex items-center gap-3">
          <WsIcon className="h-[22px] w-[22px] text-foreground" />
          <h1 className="text-lg font-bold text-foreground">
            {workstation?.name ?? "Radna stanica"}
          </h1>
          {workstation?.code && (
            <Badge
              variant="secondary"
              className="text-xs font-medium uppercase bg-muted text-muted-foreground border-0"
            >
              {workstation.code}
            </Badge>
          )}
        </div>

        {/* Center – Pending parts pill */}
        <div className="flex items-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-sm font-semibold"
            style={{
              background: "#FFF3E0",
              border: "1px solid #FFA726",
              color: "#E65100",
            }}
          >
            Čeka: {pendingCount} dijelova
          </span>
        </div>

        {/* Right – Operator, clock, logout */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{operatorName}</span>
          <span className="text-base font-bold text-foreground font-mono">
            {currentTime}
          </span>
          <button
            onClick={() => setLogoutOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Odjava"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      {/* Logout confirm dialog */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="max-w-[360px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              Odjaviti se?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {operatorName} bit će odjavljen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Odjava
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" });
}
