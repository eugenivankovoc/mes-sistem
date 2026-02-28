import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  priority: number;
  notes: string | null;
  due_date: string | null;
  created_at: string;
  customer_id: string | null;
  customer_name: string | null;
  parts_total: number;
  parts_completed: number;
}

interface Filters {
  search: string;
  customerId: string | null;
  status: OrderStatus | null;
  dateFrom: string | null;
  dateTo: string | null;
}

interface SortConfig {
  column: string;
  direction: "asc" | "desc";
}

export type RowAnimation = "insert" | "update" | "delete";

export function useOrders(filters: Filters, sort: SortConfig) {
  const queryClient = useQueryClient();
  const [animatedRows, setAnimatedRows] = useState<Map<string, RowAnimation>>(new Map());
  const animationTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearAnimation = useCallback((id: string) => {
    setAnimatedRows((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const triggerAnimation = useCallback((id: string, type: RowAnimation) => {
    // Clear existing timer for this row
    const existing = animationTimers.current.get(id);
    if (existing) clearTimeout(existing);

    setAnimatedRows((prev) => new Map(prev).set(id, type));

    const timer = setTimeout(() => {
      clearAnimation(id);
      animationTimers.current.delete(id);
    }, type === "delete" ? 500 : 2000);
    animationTimers.current.set(id, timer);
  }, [clearAnimation]);

  const query = useQuery({
    queryKey: ["orders", filters, sort],
    queryFn: async (): Promise<OrderRow[]> => {
      let q = supabase
        .from("orders")
        .select("id, order_number, status, priority, notes, due_date, created_at, customer_id, customers(name), articles(parts(id, status))");

      if (filters.search) {
        q = q.ilike("order_number", `%${filters.search}%`);
      }
      if (filters.customerId) {
        q = q.eq("customer_id", filters.customerId);
      }
      if (filters.status) {
        q = q.eq("status", filters.status);
      }
      if (filters.dateFrom) {
        q = q.gte("due_date", filters.dateFrom);
      }
      if (filters.dateTo) {
        q = q.lte("due_date", filters.dateTo);
      }

      q = q.order(sort.column === "customer_name" ? "created_at" : sort.column, {
        ascending: sort.direction === "asc",
      });

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []).map((row: any) => {
        const allParts = (row.articles ?? []).flatMap((a: any) => a.parts ?? []);
        return {
          id: row.id,
          order_number: row.order_number,
          status: row.status,
          priority: row.priority,
          notes: row.notes,
          due_date: row.due_date,
          created_at: row.created_at,
          customer_id: row.customer_id,
          customer_name: row.customers?.name ?? null,
          parts_total: allParts.length,
          parts_completed: allParts.filter((p: any) => p.status === "completed").length,
        };
      });
    },
  });

  // Realtime subscription with animation triggers
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        triggerAnimation(payload.new.id, "insert");
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        triggerAnimation(payload.new.id, "update");
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "orders" }, (payload) => {
        triggerAnimation(payload.old.id, "delete");
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        }, 500);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, triggerAnimation]);

  return { ...query, animatedRows };
}

/** Fetch total order count (unfiltered) */
export function useOrdersCount() {
  return useQuery({
    queryKey: ["orders-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
