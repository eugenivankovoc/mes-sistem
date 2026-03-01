import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BatchRow {
  id: string;
  batch_number: string;
  name: string | null;
  material_filter: string | null;
  status: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  order_count: number;
  parts_count: number;
}

export interface BatchOrderRow {
  id: string;
  order_number: string;
  customer_name: string | null;
  due_date: string | null;
  status: string;
  parts_count: number;
}

export function useBatches() {
  return useQuery({
    queryKey: ["batches"],
    queryFn: async (): Promise<BatchRow[]> => {
      const { data: batches, error } = await supabase
        .from("batches")
        .select("id, batch_number, name, material_filter, status, created_by, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!batches?.length) return [];

      // Get orders with batch_id
      const batchIds = batches.map((b) => b.id);
      const { data: orders } = await supabase
        .from("orders")
        .select("id, batch_id, articles(parts(id))")
        .in("batch_id", batchIds);

      // Get creator names
      const creatorIds = [...new Set(batches.map((b) => b.created_by).filter(Boolean))] as string[];
      let creatorMap: Record<string, string> = {};
      if (creatorIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", creatorIds);
        creatorMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.full_name]));
      }

      return batches.map((b) => {
        const batchOrders = (orders ?? []).filter((o: any) => o.batch_id === b.id);
        const partsCount = batchOrders.reduce((sum: number, o: any) => {
          return sum + (o.articles ?? []).reduce((s: number, a: any) => s + (a.parts ?? []).length, 0);
        }, 0);

        return {
          id: b.id,
          batch_number: b.batch_number,
          name: b.name,
          material_filter: (b as any).material_filter ?? null,
          status: b.status,
          created_by: b.created_by,
          created_by_name: b.created_by ? creatorMap[b.created_by] ?? null : null,
          created_at: b.created_at,
          order_count: batchOrders.length,
          parts_count: partsCount,
        };
      });
    },
  });
}

export function useBatchOrders(batchId: string | null) {
  return useQuery({
    queryKey: ["batch-orders", batchId],
    queryFn: async (): Promise<BatchOrderRow[]> => {
      if (!batchId) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, due_date, customer_id, customers(name), articles(parts(id))")
        .eq("batch_id", batchId)
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;

      return (data ?? []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        customer_name: o.customers?.name ?? null,
        due_date: o.due_date,
        status: o.status,
        parts_count: (o.articles ?? []).reduce((s: number, a: any) => s + (a.parts ?? []).length, 0),
      }));
    },
    enabled: !!batchId,
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { name: string; materialFilter: string; orderIds: string[] }) => {
      // Generate batch number
      const batchNumber = `B-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const { data: batch, error: batchErr } = await supabase
        .from("batches")
        .insert({
          batch_number: batchNumber,
          name: params.name,
          status: "open",
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();
      if (batchErr) throw batchErr;

      // Set material_filter separately to avoid type issues
      if (params.materialFilter) {
        await (supabase.from("batches") as any)
          .update({ material_filter: params.materialFilter })
          .eq("id", batch.id);
      }

      // Update orders
      await (supabase.from("orders") as any)
        .update({ batch_id: batch.id })
        .in("id", params.orderIds);

      return batch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateBatchStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { batchId: string; status: string }) => {
      const { error } = await supabase
        .from("batches")
        .update({ status: params.status })
        .eq("id", params.batchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });
}

export function useDeleteBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchId: string) => {
      // Remove batch_id from orders first
      await (supabase.from("orders") as any)
        .update({ batch_id: null })
        .eq("batch_id", batchId);

      const { error } = await supabase
        .from("batches")
        .delete()
        .eq("id", batchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
