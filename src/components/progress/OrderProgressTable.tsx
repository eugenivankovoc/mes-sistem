import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  ArrowRight,
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
        <span className="text-xs text-muted-foreground">–</span>
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

/* ── Shared cell styles ─────────────────────────────────── */
const stickyBase = "bg-card group-hover/row:bg-primary/5 transition-colors duration-150";
const thBase =
  "h-11 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-table-header-text";

export function OrderProgressTable({ data, isLoading }: Props) {
  const navigate = useNavigate();

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
  const totalCols = 3 + wsCols.length;

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm" style={{ minWidth: 200 + 120 + 100 + wsCols.length * 90 }}>
          {/* ── Group header row ──────────────────────────── */}
          <thead>
            <tr className="border-b border-border">
              {/* Spans the 3 fixed columns */}
              <th colSpan={3} className={cn(thBase, "sticky left-0 z-20", stickyBase)} />
              {wsCols.length > 0 && (
                <th
                  colSpan={wsCols.length}
                  className={cn(thBase, "text-center normal-case tracking-normal font-semibold text-xs text-muted-foreground")}
                >
                  <span className="inline-flex items-center gap-1">
                    Radne stanice
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </th>
              )}
            </tr>

            {/* ── Column headers ─────────────────────────── */}
            <tr className="border-b border-border">
              <th className={cn(thBase, "sticky left-0 z-20 min-w-[200px] w-[200px]", stickyBase)}>
                Naziv naloga
              </th>
              <th className={cn(thBase, "sticky left-[200px] z-20 min-w-[120px] w-[120px]", stickyBase)}>
                Status
              </th>
              <th className={cn(thBase, "sticky left-[320px] z-20 min-w-[100px] w-[100px] text-center", stickyBase)}>
                Uk. dijelova
              </th>
              {wsCols.map((ws) => {
                const Icon = getWsIcon(ws.code);
                return (
                  <th key={ws.id} className={cn(thBase, "text-center px-1 min-w-[90px] w-[90px]")}>
                    <div className="flex flex-col items-center gap-0.5">
                      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="block text-[10px]" title={ws.name}>
                        {truncate(ws.code, 8)}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  <td className={cn("px-4 py-3.5 sticky left-0 z-10", stickyBase)}>
                    <Skeleton className="h-5 w-28" />
                  </td>
                  <td className={cn("px-4 py-3.5 sticky left-[200px] z-10", stickyBase)}>
                    <Skeleton className="h-5 w-20" />
                  </td>
                  <td className={cn("px-4 py-3.5 text-center sticky left-[320px] z-10", stickyBase)}>
                    <Skeleton className="h-5 w-10 mx-auto" />
                  </td>
                  {wsCols.map((ws) => (
                    <td key={ws.id} className="px-1 py-3.5 text-center">
                      <Skeleton className="h-5 w-12 mx-auto" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data?.length ? (
              <tr>
                <td
                  colSpan={totalCols}
                  className="text-center py-10 text-muted-foreground"
                >
                  Nema aktivnih naloga
                </td>
              </tr>
            ) : (
              data.map((order) => {
                const wsMap = new Map(order.workstations.map((w) => [w.id, w]));
                return (
                  <tr
                    key={order.id}
                    className="group/row border-b border-border last:border-b-0 cursor-pointer hover:bg-primary/5 transition-colors duration-150"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <td className={cn("px-4 py-3.5 font-semibold text-primary hover:underline sticky left-0 z-10", stickyBase)}>
                      {order.orderNumber}
                    </td>
                    <td className={cn("px-4 py-3.5 sticky left-[200px] z-10", stickyBase)}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className={cn("px-4 py-3.5 text-center text-sm text-muted-foreground sticky left-[320px] z-10", stickyBase)}>
                      {order.totalParts}
                    </td>
                    {wsCols.map((ws) => {
                      const progress = wsMap.get(ws.id);
                      return (
                        <td key={ws.id} className="px-1 py-3.5 text-center">
                          <WsDot done={progress?.done ?? 0} total={progress?.total ?? 0} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
