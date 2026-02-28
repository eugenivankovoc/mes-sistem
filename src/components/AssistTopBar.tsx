import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogoutButton } from "@/components/LogoutButton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Factory } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AssistTopBar() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [currentTime, setCurrentTime] = useState(() => formatTime());

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
        .select("name, code")
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

  return (
    <header className="h-16 flex items-center justify-between border-b bg-card px-4 shrink-0" style={{ borderColor: '#E5E7EB' }}>
      {/* Left – Icon + name + type badge */}
      <div className="flex items-center gap-3">
        <Factory className="h-5 w-5 text-foreground" />
        <h1 className="text-lg font-bold text-foreground">
          {workstation?.name ?? "Radna stanica"}
        </h1>
        {workstation?.code && (
          <Badge variant="secondary" className="text-xs font-medium bg-muted text-muted-foreground border-0">
            {workstation.code}
          </Badge>
        )}
      </div>

      {/* Center – Pending parts badge */}
      <div className="flex items-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-status-released-bg px-4 py-1.5 text-sm font-semibold text-status-released-text">
          Čeka: {pendingCount} dijelova
        </span>
      </div>

      {/* Right – Operator, clock, logout */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{operatorName}</span>
        <span className="text-base font-bold text-foreground font-mono">{currentTime}</span>
        <LogoutButton variant="icon" />
      </div>
    </header>
  );
}

function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" });
}
