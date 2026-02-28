import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ReworkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partName: string;
  orderNumber: string;
  onSubmit: (reason: string) => void;
  isPending: boolean;
}

export function ReworkModal({
  open,
  onOpenChange,
  partName,
  orderNumber,
  onSubmit,
  isPending,
}: ReworkModalProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(reason.trim());
    setReason("");
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) setReason("");
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Prijava dorade</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Part info – read-only */}
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="text-sm font-semibold text-foreground">{partName}</p>
            <p className="text-xs text-muted-foreground">Nalog: {orderNumber}</p>
          </div>

          {/* Reason field */}
          <div className="space-y-2">
            <Label htmlFor="rework-reason">
              Razlog dorade <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rework-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Opišite razlog dorade..."
              rows={3}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Odustani
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || isPending}
          >
            {isPending ? "Šaljem..." : "Prijavi doradu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
