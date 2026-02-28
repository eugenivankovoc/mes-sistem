import type { OrderDetail, WorkstationProgress } from "@/hooks/useOrderDetail";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { format, differenceInDays, parseISO, isToday } from "date-fns";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd.MM.yyyy");
  } catch {
    return "—";
  }
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd.MM.yyyy HH:mm");
  } catch {
    return "—";
  }
}

interface InfoRowProps {
  label: string;
  children: React.ReactNode;
}
function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

interface Props {
  order: OrderDetail;
  workstationProgress?: WorkstationProgress[];
}

export function OrderInfoCard({ order, workstationProgress = [] }: Props) {
  const overdueDays = order.due_date
    ? differenceInDays(new Date(), parseISO(order.due_date))
    : null;
  const isOverdue = overdueDays !== null && overdueDays > 0 && order.status !== "completed" && order.status !== "archived";
  const isDueToday = order.due_date ? isToday(parseISO(order.due_date)) : false;

  // Overall progress
  const allParts = order.articles.flatMap((a) => a.parts);
  const totalParts = allParts.length;
  const completedParts = allParts.filter((p) => p.status === "completed").length;
  const progressPercent = totalParts > 0 ? Math.round((completedParts / totalParts) * 100) : 0;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        {/* Name & number */}
        <div>
          <h2 className="text-xl font-bold text-foreground leading-tight">
            {order.order_number}
          </h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {order.order_number}
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <OrderStatusBadge status={order.status} />
          {order.priority === 1 && (
            <Badge variant="destructive" className="text-xs">HITNO</Badge>
          )}
        </div>

        <Separator />

        {/* Details */}
        <div className="space-y-3">
          <InfoRow label="Kupac">
            {order.customer_name ?? <span className="text-muted-foreground italic">Nije odabran</span>}
          </InfoRow>
          <InfoRow label="Datum naloga">
            {formatDate(order.created_at)}
          </InfoRow>
          <InfoRow label="Datum isporuke">
            <span className="flex items-center gap-2 flex-wrap">
              <span className={isOverdue ? "text-destructive font-medium" : ""}>
                {formatDate(order.due_date)}
              </span>
              {isOverdue && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  KASNI {overdueDays} dana
                </Badge>
              )}
              {isDueToday && !isOverdue && (
                <Badge className="text-[10px] px-1.5 py-0 bg-status-released-bg text-status-released-text border-0">
                  Isporuka danas!
                </Badge>
              )}
            </span>
          </InfoRow>
          <InfoRow label="Kreirao">
            {order.created_by_name ?? <span className="text-muted-foreground italic">—</span>}
          </InfoRow>
          <InfoRow label="Kreirano">
            {formatDateTime(order.created_at)}
          </InfoRow>
        </div>

        <Separator />

        {/* Progress */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Napredak</span>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-[13px] text-muted-foreground">
            {completedParts} / {totalParts} dijelova završeno
          </p>

          {/* Per-workstation mini progress */}
          {workstationProgress.length > 0 && (
            <div className="space-y-2 pt-1">
              {workstationProgress.map((ws) => {
                const wsPercent = ws.total > 0 ? Math.round((ws.completed / ws.total) * 100) : 0;
                return (
                  <div key={ws.workstation_id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground truncate">{ws.workstation_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{ws.completed}/{ws.total}</span>
                    </div>
                    <Progress value={wsPercent} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Notes */}
        {order.notes && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Napomena</span>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
