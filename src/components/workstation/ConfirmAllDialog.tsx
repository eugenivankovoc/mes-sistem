import { CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ConfirmAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  workstationName: string;
  onConfirm: () => void;
  isProcessing: boolean;
  progress: number; // 0-100
  progressText: string;
}

export function ConfirmAllDialog({
  open,
  onOpenChange,
  count,
  workstationName,
  onConfirm,
  isProcessing,
  progress,
  progressText,
}: ConfirmAllDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <AlertDialogContent
        className="max-w-[360px] flex flex-col items-center text-center gap-4"
        style={{ borderRadius: 12, padding: 24 }}
      >
        {isProcessing ? (
          <>
            <Progress value={progress} className="w-full h-2" />
            <p className="text-sm text-muted-foreground">{progressText}</p>
          </>
        ) : (
          <>
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "hsl(142 71% 45% / 0.15)" }}
            >
              <CheckCircle className="h-10 w-10" style={{ color: "#16A34A" }} />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Potvrditi sve dijelove?
            </h3>
            <p className="text-sm text-muted-foreground">
              Ovo će potvrditi {count} dijelova za stanicu {workstationName}.
            </p>
            <div className="flex flex-col gap-3 w-full mt-2">
              <Button
                onClick={onConfirm}
                className="w-full h-[52px] text-white font-bold"
                style={{ backgroundColor: "#16A34A", borderRadius: 8 }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803D")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16A34A")}
              >
                Potvrdi sve
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full h-[52px]"
                style={{ borderRadius: 8 }}
              >
                Odustani
              </Button>
            </div>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
