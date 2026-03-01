import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChevronDown, ChevronRight, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { hr } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useApproveRework, useRejectRework, type ReworkAlert } from "@/hooks/useProgressData";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  data: ReworkAlert[] | undefined;
  isLoading: boolean;
}

function ReworkCard({ alert }: { alert: ReworkAlert }) {
  const approveMutation = useApproveRework();
  const rejectMutation = useRejectRework();

  const handleApprove = () => {
    approveMutation.mutate(alert.id, {
      onSuccess: () => {
        toast({ title: "Dorada odobrena", description: "Dio vraćen u produkciju" });
      },
    });
  };

  const handleReject = () => {
    rejectMutation.mutate(alert.id, {
      onSuccess: () => {
        toast({ title: "Dorada odbačena", description: "Dio označen kao ispravan" });
      },
    });
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-status-rework-bg">
        <AlertTriangle className="h-4 w-4 text-status-rework-text" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold text-sm text-foreground">{alert.partName}</span>
          <span className="text-xs text-muted-foreground">{alert.partNumber}</span>
          <span className="text-xs text-muted-foreground">· {alert.orderNumber}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Stanica: {alert.workstationName}
        </p>
        {alert.reworkReason && (
          <p className="text-sm text-foreground">{alert.reworkReason}</p>
        )}
        {alert.photoUrl && (
          <Dialog>
            <DialogTrigger asChild>
              <img
                src={alert.photoUrl}
                alt="Rework photo"
                className="h-16 w-16 rounded-md object-cover cursor-pointer border border-border hover:opacity-80 transition-opacity"
              />
            </DialogTrigger>
            <DialogContent className="max-w-lg p-2">
              <img src={alert.photoUrl} alt="Rework photo full" className="w-full rounded-md" />
            </DialogContent>
          </Dialog>
        )}
        <p className="text-[11px] text-muted-foreground">
          Prijavljeno {formatDistanceToNow(new Date(alert.reportedAt), { addSuffix: true, locale: hr })}
        </p>
      </div>

      <div className="flex flex-col gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="default"
          className="text-xs h-8"
          onClick={handleApprove}
          disabled={approveMutation.isPending}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          Odobri
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-8"
          onClick={handleReject}
          disabled={rejectMutation.isPending}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Odbaci
        </Button>
      </div>
    </div>
  );
}

export function ReworkAlertsSection({ data, isLoading }: Props) {
  const count = data?.length ?? 0;
  const [open, setOpen] = useState(count > 0);

  if (isLoading) {
    return <Skeleton className="h-12 w-full" />;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-2 group">
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
        )}
        <h2 className="text-lg font-semibold text-foreground">Dijelovi u doradi</h2>
        {count > 0 && (
          <Badge variant="destructive" className="text-xs">
            {count}
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {count === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Nema dijelova u doradi</p>
        ) : (
          <div className="mt-2 space-y-2">
            {data!.map((alert) => (
              <ReworkCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
