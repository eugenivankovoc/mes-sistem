import { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateBatch } from "@/hooks/useBatches";
import { useToast } from "@/hooks/use-toast";
import type { OrderRow } from "@/hooks/useOrders";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: OrderRow[];
  onSuccess: () => void;
}

export function CreateBatchModal({ open, onOpenChange, selectedOrders, onSuccess }: Props) {
  const { toast } = useToast();
  const createBatch = useCreateBatch();

  const suggestedName = `Batch ${format(new Date(), "dd.MM.yyyy")}`;
  const [name, setName] = useState(suggestedName);
  const [materialFilter, setMaterialFilter] = useState("");

  const totalParts = selectedOrders.reduce((sum, o) => sum + o.parts_total, 0);

  const handleSave = () => {
    if (!name.trim()) return;
    createBatch.mutate(
      {
        name: name.trim(),
        materialFilter: materialFilter.trim(),
        orderIds: selectedOrders.map((o) => o.id),
      },
      {
        onSuccess: () => {
          toast({ title: "Batch kreiran" });
          onOpenChange(false);
          onSuccess();
          // Reset
          setName(suggestedName);
          setMaterialFilter("");
        },
        onError: (err) => {
          toast({ title: "Greška", description: (err as Error).message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nova batch grupa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="batch-name">Naziv batcha *</Label>
            <Input
              id="batch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={suggestedName}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material-filter">Filter materijala</Label>
            <Input
              id="material-filter"
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              placeholder="npr. Melamin bijeli 18mm"
              maxLength={200}
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <p className="text-sm font-medium text-foreground">
              Odabrani nalozi: {selectedOrders.length}
            </p>
            <ul className="space-y-1 max-h-[160px] overflow-y-auto">
              {selectedOrders.map((o) => (
                <li key={o.id} className="text-sm text-muted-foreground flex justify-between">
                  <span>{o.order_number}</span>
                  <span className="text-xs">{o.parts_total} dijelova</span>
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium text-foreground border-t border-border pt-2">
              Ukupno dijelova: {totalParts}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Odustani
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || createBatch.isPending}>
            {createBatch.isPending ? "Kreiranje..." : "Kreiraj batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
