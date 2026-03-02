import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  workstation_id: string | null;
  role: "administrator" | "planner" | "operator" | null;
  last_sign_in_at: string | null;
  created_at: string;
}

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Niste prijavljeni");
  return { Authorization: `Bearer ${session.access_token}` };
}

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      const { data, error } = await supabase.functions.invoke("admin-users?action=list", {
        method: "GET",
        headers,
      });
      if (error) throw error;
      return data.users;
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      user_id: string;
      role?: string;
      workstation_id?: string | null;
      is_active?: boolean;
      full_name?: string;
    }) => {
      const headers = await getAuthHeader();
      const { data, error } = await supabase.functions.invoke("admin-users?action=update", {
        method: "PATCH",
        headers,
        body: payload,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      full_name: string;
      role: string;
      workstation_id?: string | null;
    }) => {
      const headers = await getAuthHeader();
      const { data, error } = await supabase.functions.invoke("admin-users?action=invite", {
        method: "POST",
        headers,
        body: payload,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useWorkstations() {
  return useQuery({
    queryKey: ["workstations-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstations")
        .select("id, name, code")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}
