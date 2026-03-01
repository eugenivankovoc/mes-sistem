import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, isPast, parseISO } from "date-fns";
import type { OrderProgress } from "@/hooks/useProgressData";

interface Props {
  data: OrderProgress[] | undefined;
  isLoading: boolean;
}

function MiniBar({ done, total }: { done: number; total: number }) {
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] text-muted-foreground">–</span>
        <div className="h-1.5 w-10 rounded-full bg-muted" />
      </div>
    );
  }
  const pct = Math.round((done / total) * 100);
  const isDone = done === total;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn("text-[10px] font-medium", isDone ? "text-status-completed-text" : "text-primary")}>
        {done}/{total}
      </span>
      <div className="h-1.5 w-10 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", isDone ? "bg-status-completed-dot" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    released: "Pušteno",
    in_production: "U proizvodnji",
  };
  const colors: Record<string, string> = {
    released: "bg-status-released-bg text-status-released-text",
    in_production: "bg-status-in-production-bg text-status-in-production-text",
  };
  return (
    <Badge variant="outline" className={cn("text-xs border-0", colors[status])}>
      {labels[status] ?? status}
    </Badge>
  );
}

export function OrderProgressTable({ data, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Nema aktivnih naloga
      </div>
    );
  }

  // Collect unique workstation codes from first order (they're the same for all)
  const wsCols = data[0]?.workstations ?? [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Naziv naloga</TableHead>
          <TableHead>Kupac</TableHead>
          <TableHead>Isporuka</TableHead>
          {wsCols.map((ws) => (
            <TableHead key={ws.id} className="text-center px-1 min-w-[52px]">
              {ws.code}
            </TableHead>
          ))}
          <TableHead className="min-w-[120px]">Ukupno</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((order) => {
          const pct = order.totalParts > 0 ? Math.round((order.totalDone / order.totalParts) * 100) : 0;
          const overdue = order.dueDate ? isPast(parseISO(order.dueDate)) : false;

          return (
            <TableRow
              key={order.id}
              className="cursor-pointer"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <TableCell className="font-semibold text-primary hover:underline">
                {order.orderNumber}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {order.customerName ?? "–"}
              </TableCell>
              <TableCell className={cn(overdue && "text-destructive font-medium")}>
                {order.dueDate ? format(parseISO(order.dueDate), "dd.MM.yyyy") : "–"}
              </TableCell>
              {order.workstations.map((ws) => (
                <TableCell key={ws.id} className="text-center px-1">
                  <MiniBar done={ws.done} total={ws.total} />
                </TableCell>
              ))}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={pct} className="h-2 flex-1" />
                  <span className="text-xs font-medium text-muted-foreground w-8">{pct}%</span>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
