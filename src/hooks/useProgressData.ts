import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

export type DateFilter = "today" | "week" | "month";

function getDateFrom(filter: DateFilter): string {
  const now = new Date();
  switch (filter) {
    case "today":
      return startOfDay(now).toISOString();
    case "week":
      return startOfWeek(now, { weekStartsOn: 1 }).toISOString();
    case "month":
      return startOfMonth(now).toISOString();
  }
}

export interface KpiData {
  activeOrders: number;
  partsToday: number;
  reworkParts: number;
  lateOrders: number;
}

export interface WorkstationThroughput {
  id: string;
  name: string;
  code: string;
  completedToday: number;
  reworkToday: number;
}

export function useProgressKpi(dateFilter: DateFilter) {
  const queryClient = useQueryClient();
  const dateFrom = getDateFrom(dateFilter);

  const query = useQuery({
    queryKey: ["progress-kpi", dateFilter],
    queryFn: async (): Promise<KpiData> => {
      const todayStart = startOfDay(new Date()).toISOString();
      const todayDate = new Date().toISOString().split("T")[0];

      // Active orders
      const { count: activeOrders } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["released", "in_production"]);

      // Parts confirmed in date range
      const { count: partsToday } = await supabase
        .from("part_feedback")
        .select("id", { count: "exact", head: true })
        .eq("feedback_type", "done")
        .gte("created_at", dateFrom);

      // Parts in rework
      const { count: reworkParts } = await supabase
        .from("parts")
        .select("id", { count: "exact", head: true })
        .eq("status", "rework");

      // Late orders
      const { count: lateOrders } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .lt("due_date", todayDate)
        .not("status", "in", '("completed","archived")');

      return {
        activeOrders: activeOrders ?? 0,
        partsToday: partsToday ?? 0,
        reworkParts: reworkParts ?? 0,
        lateOrders: lateOrders ?? 0,
      };
    },
  });

  // Realtime: refresh on part_feedback INSERT
  useEffect(() => {
    const channel = supabase
      .channel("progress-kpi-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "part_feedback" }, () => {
        queryClient.invalidateQueries({ queryKey: ["progress-kpi"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["progress-kpi"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "parts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["progress-kpi"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useWorkstationThroughput(dateFilter: DateFilter) {
  const queryClient = useQueryClient();
  const dateFrom = getDateFrom(dateFilter);

  const query = useQuery({
    queryKey: ["workstation-throughput", dateFilter],
    queryFn: async (): Promise<WorkstationThroughput[]> => {
      // Get all active workstations
      const { data: workstations, error: wsErr } = await supabase
        .from("workstations")
        .select("id, name, code")
        .eq("is_active", true)
        .order("sort_order");
      if (wsErr) throw wsErr;

      // Get feedback in date range
      const { data: feedback, error: fbErr } = await supabase
        .from("part_feedback")
        .select("workstation_id, feedback_type")
        .gte("created_at", dateFrom);
      if (fbErr) throw fbErr;

      return (workstations ?? []).map((ws) => {
        const wsFeedback = (feedback ?? []).filter((f) => f.workstation_id === ws.id);
        return {
          id: ws.id,
          name: ws.name,
          code: ws.code,
          completedToday: wsFeedback.filter((f) => f.feedback_type === "done").length,
          reworkToday: wsFeedback.filter((f) => f.feedback_type === "rework").length,
        };
      });
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("throughput-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "part_feedback" }, () => {
        queryClient.invalidateQueries({ queryKey: ["workstation-throughput"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}
