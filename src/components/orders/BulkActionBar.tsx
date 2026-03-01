import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CreateBatchModal } from "./CreateBatchModal";
import type { OrderRow } from "@/hooks/useOrders";

interface Props {
  count: number;
  onClear: () => void;
  selectedOrders: OrderRow[];
}

export function BulkActionBar({ count, onClear, selectedOrders }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);

  if (count === 0) return null;

  const allReady = selectedOrders.length > 0 && selectedOrders.every((o) => o.status === "ready");
  const allCompleted = selectedOrders.length > 0 && selectedOrders.every((o) => o.status === "completed");
  const canBatch = selectedOrders.length >= 2;

  const handleRelease = async () => {
    setLoading(true);
    const ids = selectedOrders.map((o) => o.id);
    const { error } = await supabase
      .from("orders")
      .update({ status: "released", released_at: new Date().toISOString() })
      .in("id", ids);
    if (error) {
      toast({ title: "Greška", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${ids.length} naloga pušteno u proizvodnju` });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onClear();
    }
    setLoading(false);
  };

  const handleArchive = async () => {
    setLoading(true);
    const ids = selectedOrders.map((o) => o.id);
    const { error } = await supabase
      .from("orders")
      .update({ status: "archived" })
      .in("id", ids);
    if (error) {
      toast({ title: "Greška", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${ids.length} naloga arhivirano` });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onClear();
    }
    setLoading(false);
  };

  return (
    <>
      <div className="fixed bottom-4 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 bg-card border border-border rounded-lg shadow-[0_-4px_20px_rgba(0,0,0,0.12)] px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {count} naloga odabrano
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {allReady && (
              <Button size="sm" onClick={handleRelease} disabled={loading} className="min-h-[44px] sm:min-h-0">
                Releaseaj
              </Button>
            )}
            {canBatch && (
              <Button size="sm" variant="secondary" onClick={() => setBatchOpen(true)} disabled={loading} className="min-h-[44px] sm:min-h-0">
                Kreiraj Batch
              </Button>
            )}
            {allCompleted && (
              <Button size="sm" variant="outline" onClick={handleArchive} disabled={loading} className="min-h-[44px] sm:min-h-0">
                Arhiviraj
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8" onClick={onClear} title="Poništi odabir">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <CreateBatchModal
        open={batchOpen}
        onOpenChange={setBatchOpen}
        selectedOrders={selectedOrders}
        onSuccess={onClear}
      />
    </>
  );
}
