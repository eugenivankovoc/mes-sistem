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

  const isValid = reason.trim().length >= 10;

  const handleSubmit = () => {
    if (!isValid) return;
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
              placeholder="Opišite što je pogrešno s ovim dijelom..."
              rows={4}
              autoFocus
            />
            {reason.trim().length > 0 && reason.trim().length < 10 && (
              <p className="text-xs text-destructive">
                Minimalno 10 znakova ({reason.trim().length}/10)
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="w-full h-14 text-sm font-bold"
          >
            {isPending ? "Šaljem..." : "Prijavi doradu"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="w-full"
          >
            Odustani
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
