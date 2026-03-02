import { useState } from "react";
import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { useBatches, useBatchOrders, useUpdateBatchStatus, useDeleteBatch } from "@/hooks/useBatches";
import { exportCuttingList } from "@/lib/exportCuttingList";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Plus, ChevronDown, ChevronRight, FileSpreadsheet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { BatchRow } from "@/hooks/useBatches";

const STATUS_OPTIONS = [
  { value: "open", label: "Otvoren", className: "bg-status-ready-bg text-status-ready-text" },
  { value: "sent_to_optimization", label: "Poslano na optimizaciju", className: "bg-status-released-bg text-status-released-text" },
  { value: "completed", label: "Završeno", className: "bg-status-completed-bg text-status-completed-text" },
];

function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
  return (
    <Badge variant="outline" className={cn("text-xs border-0", opt.className)}>
      {opt.label}
    </Badge>
  );
}

function ExpandedOrders({ batchId, batchName }: { batchId: string; batchName: string }) {
  const { data: orders, isLoading } = useBatchOrders(batchId);
  const navigate = useNavigate();

  if (isLoading) return <Skeleton className="h-20 w-full m-2" />;

  return (
    <div className="px-8 py-3 bg-muted/30">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">Nalozi u batchu</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => exportCuttingList({
            orderIds: (orders ?? []).map((o) => o.id),
            filenamePrefix: batchName.replace(/\s+/g, "_"),
          })}
        >
          <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
          Izvezi listu rezanja
        </Button>
      </div>
      {(orders ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Nema naloga</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nalog</TableHead>
              <TableHead>Kupac</TableHead>
              <TableHead>Isporuka</TableHead>
              <TableHead className="text-right">Dijelovi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(orders ?? []).map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer"
                onClick={() => navigate(`/orders/${o.id}`)}
              >
                <TableCell className="font-medium text-primary hover:underline">{o.order_number}</TableCell>
                <TableCell className="text-muted-foreground">{o.customer_name ?? "–"}</TableCell>
                <TableCell>{o.due_date ? format(parseISO(o.due_date), "dd.MM.yyyy") : "–"}</TableCell>
                <TableCell className="text-right">{o.parts_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default function BatchesPage() {
  useSetPageTitle("Batch formacija");
  const { data: batches, isLoading } = useBatches();
  const updateStatus = useUpdateBatchStatus();
  const deleteBatch = useDeleteBatch();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BatchRow | null>(null);

  const handleStatusChange = (batchId: string, newStatus: string) => {
    updateStatus.mutate({ batchId, status: newStatus }, {
      onSuccess: () => toast({ title: "Status ažuriran" }),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteBatch.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Batch obrisan" });
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast({ title: "Greška", description: (err as Error).message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Batch formacija</h1>
        <Button disabled>
          <Plus className="h-4 w-4 mr-1" />
          Nova batch grupa
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !batches?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Plus className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Nema batch grupa</h3>
          <p className="text-sm text-muted-foreground">Označite naloge u listi naloga i kliknite "Kreiraj Batch".</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Naziv batcha</TableHead>
              <TableHead>Filter materijala</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Nalozi</TableHead>
              <TableHead className="text-right">Dijelovi</TableHead>
              <TableHead>Kreirao</TableHead>
              <TableHead>Kreirano</TableHead>
              <TableHead className="text-right">Radnje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => {
              const isExpanded = expandedId === batch.id;
              return (
                <TableRow key={batch.id} className="group">
                  <TableCell>
                    <button onClick={() => setExpandedId(isExpanded ? null : batch.id)}>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{batch.name ?? batch.batch_number}</TableCell>
                  <TableCell className="text-muted-foreground">{batch.material_filter ?? "–"}</TableCell>
                  <TableCell>
                    <Select
                      value={batch.status}
                      onValueChange={(v) => handleStatusChange(batch.id, v)}
                    >
                      <SelectTrigger className="w-[180px] h-8">
                        <StatusBadge status={batch.status} />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">{batch.order_count}</TableCell>
                  <TableCell className="text-right">{batch.parts_count}</TableCell>
                  <TableCell className="text-muted-foreground">{batch.created_by_name ?? "–"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(parseISO(batch.created_at), "dd.MM.yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Izvezi"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(batch.id); // expand to show export
                        }}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                      {batch.order_count === 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title="Obriši"
                          onClick={() => setDeleteTarget(batch)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Expanded order list rendered outside table for proper layout */}
      {expandedId && batches?.find((b) => b.id === expandedId) && (
        <ExpandedOrders
          batchId={expandedId}
          batchName={batches.find((b) => b.id === expandedId)!.name ?? batches.find((b) => b.id === expandedId)!.batch_number}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obrisati batch?</AlertDialogTitle>
            <AlertDialogDescription>
              Batch "{deleteTarget?.name ?? deleteTarget?.batch_number}" će biti trajno obrisan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Obriši</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
