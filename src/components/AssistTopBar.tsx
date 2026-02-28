import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogoutButton } from "@/components/LogoutButton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AssistTopBar() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [currentTime, setCurrentTime] = useState(() => formatTime());

  // Update clock every 60s
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(formatTime()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch workstation name
  const { data: workstation } = useQuery({
    queryKey: ["workstation", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstations")
        .select("name")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch pending parts count for this workstation
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-parts", id],
    enabled: !!id,
    refetchInterval: 10_000, // live-ish: poll every 10s
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
    <header className="h-16 flex items-center justify-between border-b border-border bg-card px-4 shrink-0">
      {/* Left – Workstation name */}
      <h1 className="text-xl font-bold text-foreground">
        {workstation?.name ?? "Radna stanica"}
      </h1>

      {/* Center – Pending parts badge */}
      <div className="flex items-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-status-released-bg px-3 py-1 text-sm font-medium text-status-released-text">
          Čeka: {pendingCount} dijelova
        </span>
      </div>

      {/* Right – Operator, clock, logout */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-foreground">{operatorName}</span>
        <span className="text-sm text-muted-foreground font-mono">{currentTime}</span>
        <LogoutButton variant="icon" />
      </div>
    </header>
  );
}

function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" });
}
