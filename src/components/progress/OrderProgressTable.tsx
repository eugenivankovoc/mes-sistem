import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Scissors,
  AlignLeft,
  Cpu,
  CircleDot,
  ListOrdered,
  Wrench,
  CheckCircle,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { OrderProgress } from "@/hooks/useProgressData";

interface Props {
  data: OrderProgress[] | undefined;
  isLoading: boolean;
}

const WS_ICON_MAP: Record<string, LucideIcon> = {
  REZ: Scissors,
  KANT: AlignLeft,
  CNC: Cpu,
  BUS: CircleDot,
  SORT: ListOrdered,
  MONT: Wrench,
  QK: CheckCircle,
  PAK: Package,
};

function getWsIcon(code: string): LucideIcon | null {
  const upper = code.toUpperCase();
  for (const [key, icon] of Object.entries(WS_ICON_MAP)) {
    if (upper.includes(key)) return icon;
  }
  return null;
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
    <Badge variant="outline" className={cn("text-xs border-0 whitespace-nowrap", colors[status])}>
      {labels[status] ?? status}
    </Badge>
  );
}

function WsDot({ done, total }: { done: number; total: number }) {
  if (total === 0) {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />
        <span className="text-xs text-muted-foreground">0/0</span>
      </div>
    );
  }
  const completed = done >= total;
  return (
    <div className="flex items-center justify-center gap-1.5">
      <span
        className={cn(
          "h-2 w-2 rounded-full shrink-0",
          completed ? "bg-status-completed-dot" : "bg-primary"
        )}
      />
      <span
        className={cn(
          "text-xs font-medium",
          completed ? "text-status-completed-text" : "text-foreground"
        )}
      >
        {done}/{total}
      </span>
    </div>
  );
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function OrderProgressTable({ data, isLoading }: Props) {
  const navigate = useNavigate();

  // Always fetch workstations so headers render even with no orders
  const { data: workstations } = useQuery({
    queryKey: ["workstations-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstations")
        .select("id, code, name")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const wsCols = workstations ?? [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[200px] w-[200px]">Naziv naloga</TableHead>
          <TableHead className="min-w-[120px] w-[120px]">Status</TableHead>
          <TableHead className="min-w-[100px] w-[100px] text-center">Uk. dijelova</TableHead>
          {wsCols.map((ws) => {
            const Icon = getWsIcon(ws.code);
            return (
              <TableHead key={ws.id} className="text-center px-1 min-w-[90px] w-[90px]">
                <div className="flex flex-col items-center gap-0.5">
                  {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="block text-[10px]" title={ws.name}>
                    {truncate(ws.code, 8)}
                  </span>
                </div>
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-28" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
              {wsCols.map((ws) => (
                <TableCell key={ws.id} className="text-center px-1">
                  <Skeleton className="h-5 w-12 mx-auto" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : !data?.length ? (
          <TableRow>
            <TableCell
              colSpan={3 + wsCols.length}
              className="text-center py-10 text-muted-foreground"
            >
              Nema aktivnih naloga
            </TableCell>
          </TableRow>
        ) : (
          data.map((order) => {
            // Build a map from ws id -> progress for this order
            const wsMap = new Map(order.workstations.map((w) => [w.id, w]));
            return (
              <TableRow
                key={order.id}
                className="cursor-pointer"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <TableCell className="font-semibold text-primary hover:underline">
                  {order.orderNumber}
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {order.totalParts}
                </TableCell>
                {wsCols.map((ws) => {
                  const progress = wsMap.get(ws.id);
                  return (
                    <TableCell key={ws.id} className="text-center px-1">
                      <WsDot done={progress?.done ?? 0} total={progress?.total ?? 0} />
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
