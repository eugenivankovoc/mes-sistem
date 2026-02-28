import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { OrderRow } from "@/hooks/useOrders";

import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Props {
  order: OrderRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateOrderDialog({ order, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [duplicating, setDuplicating] = useState(false);

  const handleDuplicate = async () => {
    if (!order) return;
    setDuplicating(true);

    // Generate new order number
    const { data: newNumber, error: fnError } = await supabase.rpc("generate_order_number");
    if (fnError) {
      toast({ title: "Greška", description: fnError.message, variant: "destructive" });
      setDuplicating(false);
      return;
    }

    // Insert duplicated order
    const { data: newOrder, error: orderError } = await supabase.from("orders").insert({
      order_number: order.order_number + " (kopija)",
      customer_id: order.customer_id,
      due_date: order.due_date,
      priority: order.priority,
      notes: order.notes,
      created_by: user?.id ?? null,
      status: "new",
    }).select("id").single();

    if (orderError || !newOrder) {
      toast({ title: "Greška pri kopiranju", description: orderError?.message, variant: "destructive" });
      setDuplicating(false);
      return;
    }

    // Copy articles and their parts
    const { data: articles } = await supabase
      .from("articles")
      .select("id, name, description, quantity")
      .eq("order_id", order.id);

    if (articles && articles.length > 0) {
      for (const article of articles) {
        const { data: newArticle } = await supabase.from("articles").insert({
          order_id: newOrder.id,
          name: article.name,
          description: article.description,
          quantity: article.quantity,
        }).select("id").single();

        if (newArticle) {
          const { data: parts } = await supabase
            .from("parts")
            .select("name, part_number, material, length, width, thickness, quantity")
            .eq("article_id", article.id);

          if (parts && parts.length > 0) {
            await supabase.from("parts").insert(
              parts.map((p) => ({ ...p, article_id: newArticle.id }))
            );
          }
        }
      }
    }

    toast({ title: "Nalog kopiran uspješno" });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    onOpenChange(false);
    setDuplicating(false);
    navigate(`/orders/${newOrder.id}`);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kopirati nalog {order?.order_number}?</AlertDialogTitle>
          <AlertDialogDescription>
            Nova kopija bit će kreirana sa svim artiklima i dijelovima.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={duplicating}>Odustani</AlertDialogCancel>
          <AlertDialogAction onClick={handleDuplicate} disabled={duplicating}>
            {duplicating ? "Kopiranje..." : "Kopiraj"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
