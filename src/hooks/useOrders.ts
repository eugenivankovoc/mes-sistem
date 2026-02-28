import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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
  parts_count: number;
}

interface Filters {
  search: string;
  customerId: string | null;
  status: OrderStatus | null;
}

interface SortConfig {
  column: string;
  direction: "asc" | "desc";
}

export function useOrders(filters: Filters, sort: SortConfig) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["orders", filters, sort],
    queryFn: async (): Promise<OrderRow[]> => {
      let q = supabase
        .from("orders")
        .select("id, order_number, status, priority, notes, due_date, created_at, customer_id, customers(name), parts(id)");

      if (filters.search) {
        q = q.ilike("order_number", `%${filters.search}%`);
      }
      if (filters.customerId) {
        q = q.eq("customer_id", filters.customerId);
      }
      if (filters.status) {
        q = q.eq("status", filters.status);
      }

      const sortCol = sort.column === "customer_name" ? "customers(name)" : sort.column;
      q = q.order(sort.column === "customer_name" ? "created_at" : sort.column, {
        ascending: sort.direction === "asc",
      });

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        id: row.id,
        order_number: row.order_number,
        status: row.status,
        priority: row.priority,
        notes: row.notes,
        due_date: row.due_date,
        created_at: row.created_at,
        customer_id: row.customer_id,
        customer_name: row.customers?.name ?? null,
        parts_count: row.parts?.length ?? 0,
      }));
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
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
