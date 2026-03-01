import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { OrderDetail } from "@/hooks/useOrderDetail";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SendHorizontal, CheckCircle, Printer, FileDown, FileSpreadsheet, Pencil } from "lucide-react";
import { exportCuttingList as importCuttingExport } from "@/lib/exportCuttingList";
import { toast } from "sonner";
import { EditOrderModal } from "@/components/orders/EditOrderModal";
import type { OrderRow } from "@/hooks/useOrders";

interface Props {
  order: OrderDetail;
}

export function OrderActionButtons({ order }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allParts = order.articles.flatMap((a) => a.parts);
  const hasParts = allParts.length > 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] });

  const handleRelease = async () => {
    setReleasing(true);
    const { error } = await supabase
      .from("orders")
      .update({
        status: "released" as any,
        released_at: new Date().toISOString(),
        released_by: user?.id ?? null,
      })
      .eq("id", order.id);
    setReleasing(false);
    setReleaseOpen(false);

    if (error) {
      toast.error("Greška pri releaseanju naloga.");
      return;
    }
    toast.success("Nalog uspješno releasean u pogon");
    invalidate();
  };

  const handleMarkReady = async () => {
    setMarkingReady(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: "ready" as any })
      .eq("id", order.id);
    setMarkingReady(false);

    if (error) {
      toast.error("Greška pri promjeni statusa.");
      return;
    }
    toast.success("Nalog označen kao spreman");
    invalidate();
  };

  const handlePrintLabels = () => {
    toast.info("Ispis naljepnica — uskoro dostupno");
  };

  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.info(`Uvoz datoteke "${file.name}" — uskoro dostupno`);
    e.target.value = "";
  };

  const handleExportCSV = () => {
    importCuttingExport({ orderIds: [order.id], filenamePrefix: order.order_number });
  };

  const orderAsRow: OrderRow = {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    priority: order.priority,
    notes: order.notes,
    due_date: order.due_date,
    created_at: order.created_at,
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    parts_total: allParts.length,
    parts_completed: allParts.filter((p) => p.status === "completed").length,
    batch_id: null,
    batch_name: null,
  };

  return (
    <>
      <div className="flex flex-col gap-2 mt-3">
        {/* Release button — only when status = ready */}
        {order.status === "ready" && (
          <Button className="w-full justify-start gap-2" onClick={() => setReleaseOpen(true)}>
            <SendHorizontal className="h-4 w-4" />
            Releaseaj u pogon
          </Button>
        )}

        {/* Mark Ready — only when new AND has parts */}
        {order.status === "new" && hasParts && (
          <Button
            variant="secondary"
            className="w-full justify-start gap-2"
            onClick={handleMarkReady}
            disabled={markingReady}
          >
            <CheckCircle className="h-4 w-4" />
            Označi kao spreman
          </Button>
        )}

        {/* Print Labels */}
        <Button variant="secondary" className="w-full justify-start gap-2" onClick={handlePrintLabels}>
          <Printer className="h-4 w-4" />
          Ispis naljepnica
        </Button>

        {/* Import CSV */}
        <Button variant="secondary" className="w-full justify-start gap-2" onClick={handleImportCSV}>
          <FileDown className="h-4 w-4" />
          Uvezi dijelove (CSV)
        </Button>

        {/* Export CSV */}
        <Button variant="secondary" className="w-full justify-start gap-2" onClick={handleExportCSV}>
          <FileSpreadsheet className="h-4 w-4" />
          Izvozi listu rezanja
        </Button>

        {/* Edit order */}
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" />
          Uredi nalog
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {/* Release confirm dialog */}
      <AlertDialog open={releaseOpen} onOpenChange={setReleaseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Releaseati nalog {order.order_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Operateri u pogonu će moći vidjeti ovaj nalog i sve njegove dijelove.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={releasing}>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={handleRelease} disabled={releasing}>
              {releasing ? "Releaseanje..." : "Releaseaj"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit order modal */}
      <EditOrderModal order={orderAsRow} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
