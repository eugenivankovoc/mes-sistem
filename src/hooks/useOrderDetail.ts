import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export interface OrderDetail {
  id: string;
  order_number: string;
  status: OrderStatus;
  priority: number;
  notes: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  customer_id: string | null;
  customer_name: string | null;
  created_by: string | null;
  created_by_name: string | null;
  articles: ArticleDetail[];
}

export interface ArticleDetail {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  parts: PartDetail[];
}

export interface PartDetail {
  id: string;
  name: string;
  part_number: string;
  material: string | null;
  quantity: number;
  length: number | null;
  width: number | null;
  thickness: number | null;
  status: Database["public"]["Enums"]["part_status"];
  current_workstation_id: string | null;
}

export function useOrderDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["order-detail", id],
    queryFn: async (): Promise<OrderDetail> => {
      if (!id) throw new Error("No order ID");

      const { data: order, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers(name),
          articles(
            id, name, description, quantity,
            parts(id, name, part_number, material, quantity, length, width, thickness, status, current_workstation_id)
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      // Fetch creator name
      let createdByName: string | null = null;
      if (order.created_by) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", order.created_by)
          .single();
        createdByName = profile?.full_name ?? null;
      }

      return {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        priority: order.priority,
        notes: order.notes,
        due_date: order.due_date,
        created_at: order.created_at,
        updated_at: order.updated_at,
        customer_id: order.customer_id,
        customer_name: (order.customers as any)?.name ?? null,
        created_by: order.created_by,
        created_by_name: createdByName,
        articles: ((order.articles as any[]) ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          quantity: a.quantity,
          parts: (a.parts ?? []).map((p: any) => ({
            id: p.id,
            name: p.name,
            part_number: p.part_number,
            material: p.material,
            quantity: p.quantity,
            length: p.length,
            width: p.width,
            thickness: p.thickness,
            status: p.status,
            current_workstation_id: p.current_workstation_id,
          })),
        })),
      };
    },
    enabled: !!id,
  });
}

export function useOrderComments(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order-comments", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from("order_comments")
        .select("id, content, created_at, user_id")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Fetch user names for comments
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) ?? []);

      return data.map((c) => ({
        ...c,
        user_name: nameMap.get(c.user_id) ?? "Nepoznat",
      }));
    },
    enabled: !!orderId,
  });
}
