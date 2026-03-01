import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, differenceInHours } from "date-fns";

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
  waiting: number;
  avgPerHour: number;
  trend: "up" | "down" | "neutral";
}

export interface OrderProgress {
  id: string;
  orderNumber: string;
  customerName: string | null;
  dueDate: string | null;
  status: string;
  workstations: {
    id: string;
    code: string;
    done: number;
    total: number;
  }[];
  totalDone: number;
  totalParts: number;
}

export interface ReworkAlert {
  id: string; // part id
  partName: string;
  partNumber: string;
  orderNumber: string;
  orderId: string;
  workstationName: string;
  reworkReason: string | null;
  photoUrl: string | null;
  reportedAt: string;
}

// ─── KPI ────────────────────────────────────────────────
export function useProgressKpi(dateFilter: DateFilter) {
  const queryClient = useQueryClient();
  const dateFrom = getDateFrom(dateFilter);

  const query = useQuery({
    queryKey: ["progress-kpi", dateFilter],
    queryFn: async (): Promise<KpiData> => {
      const todayDate = new Date().toISOString().split("T")[0];

      const { count: activeOrders } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["released", "in_production"]);

      const { count: partsToday } = await supabase
        .from("part_feedback")
        .select("id", { count: "exact", head: true })
        .eq("feedback_type", "done")
        .gte("created_at", dateFrom);

      const { count: reworkParts } = await supabase
        .from("parts")
        .select("id", { count: "exact", head: true })
        .eq("status", "rework");

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

// ─── WORKSTATION THROUGHPUT ─────────────────────────────
export function useWorkstationThroughput(dateFilter: DateFilter) {
  const queryClient = useQueryClient();
  const dateFrom = getDateFrom(dateFilter);

  const query = useQuery({
    queryKey: ["workstation-throughput", dateFilter],
    queryFn: async (): Promise<WorkstationThroughput[]> => {
      const { data: workstations, error: wsErr } = await supabase
        .from("workstations")
        .select("id, name, code")
        .eq("is_active", true)
        .order("sort_order");
      if (wsErr) throw wsErr;

      const { data: feedback, error: fbErr } = await supabase
        .from("part_feedback")
        .select("workstation_id, feedback_type, created_at")
        .gte("created_at", dateFrom);
      if (fbErr) throw fbErr;

      // Yesterday's feedback for trend comparison
      const yesterdayStart = new Date();
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date();
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const { data: yesterdayFeedback } = await supabase
        .from("part_feedback")
        .select("workstation_id, feedback_type")
        .gte("created_at", yesterdayStart.toISOString())
        .lte("created_at", yesterdayEnd.toISOString());

      // Waiting parts per workstation
      const { data: waitingParts } = await supabase
        .from("parts")
        .select("current_workstation_id")
        .in("status", ["pending", "in_progress"]);

      const hoursElapsed = Math.max(1, differenceInHours(new Date(), new Date(dateFrom)));

      return (workstations ?? []).map((ws) => {
        const wsFeedback = (feedback ?? []).filter((f) => f.workstation_id === ws.id);
        const completedToday = wsFeedback.filter((f) => f.feedback_type === "done").length;
        const reworkToday = wsFeedback.filter((f) => f.feedback_type === "rework").length;

        const yesterdayCount = (yesterdayFeedback ?? []).filter(
          (f) => f.workstation_id === ws.id && f.feedback_type === "done"
        ).length;

        const waiting = (waitingParts ?? []).filter(
          (p) => p.current_workstation_id === ws.id
        ).length;

        const trend: "up" | "down" | "neutral" =
          completedToday > yesterdayCount ? "up" : completedToday < yesterdayCount ? "down" : "neutral";

        return {
          id: ws.id,
          name: ws.name,
          code: ws.code,
          completedToday,
          reworkToday,
          waiting,
          avgPerHour: Math.round((completedToday / hoursElapsed) * 10) / 10,
          trend,
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

// ─── ORDER PROGRESS ─────────────────────────────────────
export function useOrderProgress() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["order-progress"],
    queryFn: async (): Promise<OrderProgress[]> => {
      // Get active orders with customer
      const { data: orders, error: ordErr } = await supabase
        .from("orders")
        .select("id, order_number, status, due_date, customer_id")
        .in("status", ["released", "in_production"])
        .order("due_date", { ascending: true, nullsFirst: false });
      if (ordErr) throw ordErr;
      if (!orders?.length) return [];

      // Get customer names
      const customerIds = [...new Set(orders.map((o) => o.customer_id).filter(Boolean))] as string[];
      let customersMap: Record<string, string> = {};
      if (customerIds.length) {
        const { data: customers } = await supabase
          .from("customers")
          .select("id, name")
          .in("id", customerIds);
        customersMap = Object.fromEntries((customers ?? []).map((c) => [c.id, c.name]));
      }

      // Get all workstations for columns
      const { data: workstations } = await supabase
        .from("workstations")
        .select("id, code")
        .eq("is_active", true)
        .order("sort_order");

      const orderIds = orders.map((o) => o.id);

      // Get articles for these orders
      const { data: articles } = await supabase
        .from("articles")
        .select("id, order_id")
        .in("order_id", orderIds);
      const articleIds = (articles ?? []).map((a) => a.id);

      // Get parts for these articles
      const { data: parts } = await supabase
        .from("parts")
        .select("id, article_id, current_workstation_id, status")
        .in("article_id", articleIds.length ? articleIds : ["__none__"]);

      // Get feedback for these parts
      const partIds = (parts ?? []).map((p) => p.id);
      const { data: allFeedback } = await supabase
        .from("part_feedback")
        .select("part_id, workstation_id, feedback_type")
        .in("part_id", partIds.length ? partIds : ["__none__"])
        .eq("feedback_type", "done");

      // Map article_id -> order_id
      const articleOrderMap: Record<string, string> = {};
      (articles ?? []).forEach((a) => { articleOrderMap[a.id] = a.order_id; });

      // Group parts by order
      const orderPartsMap: Record<string, typeof parts> = {};
      (parts ?? []).forEach((p) => {
        const orderId = articleOrderMap[p.article_id];
        if (orderId) {
          if (!orderPartsMap[orderId]) orderPartsMap[orderId] = [];
          orderPartsMap[orderId]!.push(p);
        }
      });

      // Feedback by part+workstation
      const feedbackSet = new Set(
        (allFeedback ?? []).map((f) => `${f.part_id}|${f.workstation_id}`)
      );

      return orders.map((order) => {
        const orderParts = orderPartsMap[order.id] ?? [];
        const wsData = (workstations ?? []).map((ws) => {
          // Parts that pass through this workstation = parts with current_workstation_id = ws.id OR feedback exists
          // Simplified: count parts that have feedback for this ws as done, total = all parts
          const total = orderParts.length;
          const done = orderParts.filter((p) =>
            feedbackSet.has(`${p.id}|${ws.id}`)
          ).length;
          return { id: ws.id, code: ws.code, done, total };
        });

        const totalDone = orderParts.filter((p) => p.status === "completed").length;

        return {
          id: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_id ? customersMap[order.customer_id] ?? null : null,
          dueDate: order.due_date,
          status: order.status,
          workstations: wsData,
          totalDone,
          totalParts: orderParts.length,
        };
      });
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("order-progress-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "part_feedback" }, () => {
        queryClient.invalidateQueries({ queryKey: ["order-progress"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "parts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["order-progress"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

// ─── REWORK ALERTS ──────────────────────────────────────
export function useReworkAlerts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["rework-alerts"],
    queryFn: async (): Promise<ReworkAlert[]> => {
      // Get parts in rework status
      const { data: reworkParts, error } = await supabase
        .from("parts")
        .select("id, name, part_number, article_id, current_workstation_id")
        .eq("status", "rework");
      if (error) throw error;
      if (!reworkParts?.length) return [];

      const articleIds = [...new Set(reworkParts.map((p) => p.article_id))];
      const wsIds = [...new Set(reworkParts.map((p) => p.current_workstation_id).filter(Boolean))] as string[];

      // Get articles -> orders
      const { data: articles } = await supabase
        .from("articles")
        .select("id, order_id")
        .in("id", articleIds);
      const orderIds = [...new Set((articles ?? []).map((a) => a.order_id))];
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number")
        .in("id", orderIds);

      // Get workstation names
      const { data: workstations } = await supabase
        .from("workstations")
        .select("id, name")
        .in("id", wsIds.length ? wsIds : ["__none__"]);

      // Get rework feedback for reason & photo
      const partIds = reworkParts.map((p) => p.id);
      const { data: feedback } = await supabase
        .from("part_feedback")
        .select("part_id, rework_reason, photo_url, created_at")
        .in("part_id", partIds)
        .eq("feedback_type", "rework")
        .order("created_at", { ascending: false });

      const articleOrderMap: Record<string, string> = {};
      (articles ?? []).forEach((a) => { articleOrderMap[a.id] = a.order_id; });
      const orderMap: Record<string, string> = {};
      (orders ?? []).forEach((o) => { orderMap[o.id] = o.order_number; });
      const wsMap: Record<string, string> = {};
      (workstations ?? []).forEach((w) => { wsMap[w.id] = w.name; });

      // Latest feedback per part
      const feedbackMap: Record<string, { rework_reason: string | null; photo_url: string | null; created_at: string }> = {};
      (feedback ?? []).forEach((f) => {
        if (!feedbackMap[f.part_id]) feedbackMap[f.part_id] = f;
      });

      return reworkParts.map((p) => {
        const orderId = articleOrderMap[p.article_id] ?? "";
        const fb = feedbackMap[p.id];
        return {
          id: p.id,
          partName: p.name,
          partNumber: p.part_number,
          orderNumber: orderMap[orderId] ?? "",
          orderId,
          workstationName: p.current_workstation_id ? wsMap[p.current_workstation_id] ?? "" : "",
          reworkReason: fb?.rework_reason ?? null,
          photoUrl: fb?.photo_url ?? null,
          reportedAt: fb?.created_at ?? new Date().toISOString(),
        };
      });
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("rework-alerts-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "parts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["rework-alerts"] });
        queryClient.invalidateQueries({ queryKey: ["progress-kpi"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

// ─── REWORK ACTIONS ─────────────────────────────────────
export function useApproveRework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partId: string) => {
      const { error } = await supabase
        .from("parts")
        .update({ status: "pending" })
        .eq("id", partId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rework-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["progress-kpi"] });
    },
  });
}

export function useRejectRework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partId: string) => {
      const { error } = await supabase
        .from("parts")
        .update({ status: "pending" })
        .eq("id", partId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rework-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["progress-kpi"] });
    },
  });
}
