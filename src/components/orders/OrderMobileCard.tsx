import { useNavigate } from "react-router-dom";
import { format, isPast, isToday, parseISO } from "date-fns";
import { Pencil, Copy, ArrowRight, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderRow, RowAnimation } from "@/hooks/useOrders";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return format(parseISO(d), "dd.MM.yyyy");
}

function getAnimationClass(type: RowAnimation | undefined) {
  if (!type) return "";
  switch (type) {
    case "insert": return "animate-row-insert";
    case "update": return "animate-row-update";
    case "delete": return "animate-row-delete";
  }
}

interface Props {
  order: OrderRow;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onEdit: (order: OrderRow) => void;
  onDuplicate: (order: OrderRow) => void;
  animType?: RowAnimation;
}

export function OrderMobileCard({ order, isSelected, onSelect, onEdit, onDuplicate, animType }: Props) {
  const navigate = useNavigate();

  const isOverdue =
    order.due_date &&
    isPast(parseISO(order.due_date)) &&
    !isToday(parseISO(order.due_date)) &&
    order.status !== "completed" &&
    order.status !== "archived";
  const isDueToday =
    order.due_date &&
    isToday(parseISO(order.due_date)) &&
    order.status !== "completed" &&
    order.status !== "archived";

  return (
    <div className={`rounded-lg border border-border bg-card p-4 space-y-3 ${getAnimationClass(animType)}`}>
      {/* Top row: checkbox + order name + priority */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(v) => onSelect(order.id, !!v)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="font-semibold text-sm text-foreground hover:text-primary hover:underline text-left"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              {order.order_number}
            </button>
            {order.priority === 1 && (
              <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                Hitno
              </span>
            )}
          </div>
          {order.customer_name && (
            <p className="text-xs text-muted-foreground mt-0.5">{order.customer_name}</p>
          )}
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Info row */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground block">Datum naloga</span>
          <span className="font-medium text-foreground">{fmtDate(order.created_at)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Isporuka</span>
          {order.due_date ? (
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                isOverdue
                  ? "text-destructive"
                  : isDueToday
                    ? "text-orange-600"
                    : "text-foreground"
              }`}
            >
              {isOverdue && <AlertTriangle className="h-3 w-3" />}
              {fmtDate(order.due_date)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
        <div>
          <span className="text-muted-foreground block">Dijelovi</span>
          {order.parts_total === 0 ? (
            <span className="text-muted-foreground">0</span>
          ) : (
            <div className="space-y-0.5">
              <span className="font-medium text-foreground">
                {order.parts_completed}/{order.parts_total}
              </span>
              <Progress
                value={(order.parts_completed / order.parts_total) * 100}
                className="h-[2px]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 border-t border-border pt-2">
        <Button variant="ghost" size="icon" className="h-10 w-10" title="Uredi" onClick={() => onEdit(order)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10" title="Kopiraj" onClick={() => onDuplicate(order)}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10" title="Pregledaj" onClick={() => navigate(`/orders/${order.id}`)}>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
