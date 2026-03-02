import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, eachDayOfInterval, subDays } from "date-fns";

export interface ReportsDateRange {
  from: Date;
  to: Date;
}

// ─── OVERVIEW KPI ───────────────────────────────────────
export interface OverviewKpi {
  avgPartsPerDay: number;
  totalParts: number;
  reworkRate: number; // percentage
  onTimeRate: number; // percentage
}

// ─── DAILY PARTS ────────────────────────────────────────
export interface DailyParts {
  date: string; // DD.MM.YYYY
  dateISO: string;
  count: number;
  rolling7: number | null;
}

// ─── WORKSTATION SUMMARY ────────────────────────────────
export interface WorkstationSummary {
  id: string;
  name: string;
  code: string;
  partsInPeriod: number;
  partsToday: number;
  avgPerDay: number;
  busiestDay: string;
}

// ─── OPERATOR SUMMARY ───────────────────────────────────
export interface OperatorSummary {
  operatorId: string;
  name: string;
  partsInPeriod: number;
  reworkCount: number;
  avgPerDay: number;
  mainWorkstation: string;
}

// ─── ORDER SUMMARY ──────────────────────────────────────
export interface OrderSummary {
  id: string;
  orderNumber: string;
  customer: string;
  totalParts: number;
  completedParts: number;
  reworkParts: number;
  dueDate: string | null;
  completedAt: string | null;
  isLate: boolean;
}

export function useOverviewData(range: ReportsDateRange) {
  return useQuery({
    queryKey: ["reports-overview", range.from.toISOString(), range.to.toISOString()],
    queryFn: async (): Promise<{ kpi: OverviewKpi; dailyParts: DailyParts[] }> => {
      const fromISO = range.from.toISOString();
      const toISO = range.to.toISOString();

      // All feedback in period
      const { data: feedback } = await supabase
        .from("part_feedback")
        .select("feedback_type, created_at")
        .gte("created_at", fromISO)
        .lte("created_at", toISO);

      const doneCount = (feedback || []).filter((f) => f.feedback_type === "done").length;
      const reworkCount = (feedback || []).filter((f) => f.feedback_type === "rework").length;
      const totalFeedback = doneCount + reworkCount;

      // Days in range
      const days = eachDayOfInterval({ start: range.from, end: range.to });
      const numDays = Math.max(days.length, 1);

      // Daily breakdown
      const dailyMap = new Map<string, number>();
      days.forEach((d) => dailyMap.set(format(d, "yyyy-MM-dd"), 0));
      (feedback || []).filter((f) => f.feedback_type === "done").forEach((f) => {
        const key = f.created_at.split("T")[0];
        if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
      });

      const dailyArr = days.map((d) => ({
        dateISO: format(d, "yyyy-MM-dd"),
        date: format(d, "dd.MM."),
        count: dailyMap.get(format(d, "yyyy-MM-dd")) || 0,
        rolling7: null as number | null,
      }));

      // 7-day rolling average
      for (let i = 0; i < dailyArr.length; i++) {
        const window = dailyArr.slice(Math.max(0, i - 6), i + 1);
        dailyArr[i].rolling7 = Math.round((window.reduce((s, d) => s + d.count, 0) / window.length) * 10) / 10;
      }

      // On-time rate: orders completed in period where completed_at <= due_date
      const { data: completedOrders } = await supabase
        .from("orders")
        .select("due_date, completed_at")
        .not("completed_at", "is", null)
        .gte("completed_at", fromISO)
        .lte("completed_at", toISO);

      const withDue = (completedOrders || []).filter((o) => o.due_date);
      const onTime = withDue.filter((o) => o.completed_at && o.due_date && o.completed_at.split("T")[0] <= o.due_date);
      const onTimeRate = withDue.length > 0 ? Math.round((onTime.length / withDue.length) * 100) : 100;

      return {
        kpi: {
          avgPartsPerDay: Math.round((doneCount / numDays) * 10) / 10,
          totalParts: doneCount,
          reworkRate: totalFeedback > 0 ? Math.round((reworkCount / totalFeedback) * 1000) / 10 : 0,
          onTimeRate,
        },
        dailyParts: dailyArr,
      };
    },
  });
}

export function useWorkstationReport(range: ReportsDateRange) {
  return useQuery({
    queryKey: ["reports-workstations", range.from.toISOString(), range.to.toISOString()],
    queryFn: async (): Promise<WorkstationSummary[]> => {
      const fromISO = range.from.toISOString();
      const toISO = range.to.toISOString();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: workstations } = await supabase
        .from("workstations")
        .select("id, name, code")
        .eq("is_active", true)
        .order("sort_order");

      const { data: feedback } = await supabase
        .from("part_feedback")
        .select("workstation_id, feedback_type, created_at")
        .eq("feedback_type", "done")
        .gte("created_at", fromISO)
        .lte("created_at", toISO);

      const days = eachDayOfInterval({ start: range.from, end: range.to });
      const numDays = Math.max(days.length, 1);

      return (workstations || []).map((ws) => {
        const wsFeedback = (feedback || []).filter((f) => f.workstation_id === ws.id);

        // Daily counts for busiest day
        const dailyCounts = new Map<string, number>();
        wsFeedback.forEach((f) => {
          const day = f.created_at.split("T")[0];
          dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
        });

        let busiestDay = "—";
        let maxCount = 0;
        dailyCounts.forEach((count, day) => {
          if (count > maxCount) {
            maxCount = count;
            busiestDay = format(new Date(day), "dd.MM.yyyy");
          }
        });

        const todayISO = format(todayStart, "yyyy-MM-dd");
        const partsToday = wsFeedback.filter((f) => f.created_at.startsWith(todayISO)).length;

        return {
          id: ws.id,
          name: ws.name,
          code: ws.code,
          partsInPeriod: wsFeedback.length,
          partsToday,
          avgPerDay: Math.round((wsFeedback.length / numDays) * 10) / 10,
          busiestDay,
        };
      });
    },
  });
}

export function useOperatorReport(range: ReportsDateRange) {
  return useQuery({
    queryKey: ["reports-operators", range.from.toISOString(), range.to.toISOString()],
    queryFn: async (): Promise<OperatorSummary[]> => {
      const fromISO = range.from.toISOString();
      const toISO = range.to.toISOString();

      const { data: feedback } = await supabase
        .from("part_feedback")
        .select("operator_id, workstation_id, feedback_type, created_at")
        .gte("created_at", fromISO)
        .lte("created_at", toISO);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name");

      const { data: workstations } = await supabase
        .from("workstations")
        .select("id, name");

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
      const wsMap = new Map((workstations || []).map((w) => [w.id, w.name]));

      const days = eachDayOfInterval({ start: range.from, end: range.to });
      const numDays = Math.max(days.length, 1);

      // Group by operator
      const operatorMap = new Map<string, { done: number; rework: number; wsCount: Map<string, number> }>();
      (feedback || []).forEach((f) => {
        const entry = operatorMap.get(f.operator_id) || { done: 0, rework: 0, wsCount: new Map() };
        if (f.feedback_type === "done") entry.done++;
        else entry.rework++;
        entry.wsCount.set(f.workstation_id, (entry.wsCount.get(f.workstation_id) || 0) + 1);
        operatorMap.set(f.operator_id, entry);
      });

      return Array.from(operatorMap.entries())
        .map(([opId, data]) => {
          let mainWsId = "";
          let maxWs = 0;
          data.wsCount.forEach((count, wsId) => {
            if (count > maxWs) { maxWs = count; mainWsId = wsId; }
          });

          return {
            operatorId: opId,
            name: profileMap.get(opId) || "—",
            partsInPeriod: data.done,
            reworkCount: data.rework,
            avgPerDay: Math.round((data.done / numDays) * 10) / 10,
            mainWorkstation: wsMap.get(mainWsId) || "—",
          };
        })
        .sort((a, b) => b.partsInPeriod - a.partsInPeriod);
    },
  });
}

export function useOrderReport(range: ReportsDateRange) {
  return useQuery({
    queryKey: ["reports-orders", range.from.toISOString(), range.to.toISOString()],
    queryFn: async (): Promise<OrderSummary[]> => {
      const fromISO = range.from.toISOString();
      const toISO = range.to.toISOString();
      const todayISO = format(new Date(), "yyyy-MM-dd");

      // Orders that were active (created or in-production) during the period
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number, customer_id, due_date, completed_at, status")
        .gte("created_at", fromISO)
        .order("created_at", { ascending: false });

      if (!orders?.length) return [];

      const customerIds = [...new Set(orders.map((o) => o.customer_id).filter(Boolean))] as string[];
      let customerMap: Record<string, string> = {};
      if (customerIds.length) {
        const { data: customers } = await supabase.from("customers").select("id, name").in("id", customerIds);
        customerMap = Object.fromEntries((customers || []).map((c) => [c.id, c.name]));
      }

      const orderIds = orders.map((o) => o.id);
      const { data: articles } = await supabase.from("articles").select("id, order_id").in("order_id", orderIds);
      const articleIds = (articles || []).map((a) => a.id);

      const { data: parts } = await supabase
        .from("parts")
        .select("id, article_id, status")
        .in("article_id", articleIds.length ? articleIds : ["__none__"]);

      const articleOrderMap: Record<string, string> = {};
      (articles || []).forEach((a) => { articleOrderMap[a.id] = a.order_id; });

      const orderPartsMap: Record<string, { total: number; completed: number; rework: number }> = {};
      (parts || []).forEach((p) => {
        const orderId = articleOrderMap[p.article_id];
        if (orderId) {
          if (!orderPartsMap[orderId]) orderPartsMap[orderId] = { total: 0, completed: 0, rework: 0 };
          orderPartsMap[orderId].total++;
          if (p.status === "completed") orderPartsMap[orderId].completed++;
          if (p.status === "rework") orderPartsMap[orderId].rework++;
        }
      });

      return orders.map((o) => {
        const counts = orderPartsMap[o.id] || { total: 0, completed: 0, rework: 0 };
        const isLate = o.due_date && !o.completed_at && o.due_date < todayISO;
        return {
          id: o.id,
          orderNumber: o.order_number,
          customer: o.customer_id ? customerMap[o.customer_id] || "—" : "—",
          totalParts: counts.total,
          completedParts: counts.completed,
          reworkParts: counts.rework,
          dueDate: o.due_date,
          completedAt: o.completed_at,
          isLate: !!isLate,
        };
      });
    },
  });
}
