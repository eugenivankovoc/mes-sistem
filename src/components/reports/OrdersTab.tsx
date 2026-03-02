import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, differenceInDays } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";
import type { OrderSummary } from "@/hooks/useReportsData";

interface Props {
  data?: OrderSummary[];
  isLoading: boolean;
}

export function ReportsOrdersTab({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[50px] ml-auto" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[40px]" />
            <Skeleton className="h-4 w-[50px]" />
          </div>
        ))}
      </div>
    );
  }

  // Only completed orders
  const completed = (data || []).filter((o) => o.completedAt);

  if (!completed.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center mt-4">
        <div className="rounded-full bg-muted p-4 mb-4">
          <BarChart3 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Nema podataka</h3>
        <p className="text-sm text-muted-foreground">Nema završenih naloga za odabrani period.</p>
      </div>
    );
  }

  const onTimeCount = completed.filter((o) => !o.isLate).length;
  const totalWithDue = completed.filter((o) => o.dueDate).length;
  const onTimePct = totalWithDue > 0 ? Math.round((onTimeCount / totalWithDue) * 100) : 100;

  return (
    <div className="space-y-4 mt-4">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--table-header-bg))] hover:bg-[hsl(var(--table-header-bg))]">
              <TableHead>Naziv naloga</TableHead>
              <TableHead>Kupac</TableHead>
              <TableHead className="text-right">Ukupno dijelova</TableHead>
              <TableHead>Datum završetka</TableHead>
              <TableHead>Na vrijeme?</TableHead>
              <TableHead className="text-right">Dana do završetka</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {completed.map((o, idx) => {
              const isOnTime = o.dueDate && o.completedAt
                ? o.completedAt.split("T")[0] <= o.dueDate
                : null;
              const daysDuration = o.completedAt
                ? differenceInDays(new Date(o.completedAt), new Date(o.createdAt))
                : null;

              return (
                <TableRow key={o.id} className={idx % 2 === 1 ? "bg-[hsl(var(--table-row-stripe))]" : ""}>
                  <TableCell className="font-medium">{o.orderNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{o.customer}</TableCell>
                  <TableCell className="text-right">{o.totalParts}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.completedAt ? format(new Date(o.completedAt), "dd.MM.yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    {isOnTime === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : isOnTime ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-sm">
                        <CheckCircle className="h-4 w-4" /> Da ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-destructive font-medium text-sm">
                        <XCircle className="h-4 w-4" /> Ne ✗
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {daysDuration !== null ? daysDuration : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{onTimeCount}</span> od{" "}
          <span className="font-semibold">{totalWithDue}</span> naloga dostavljeno na vrijeme{" "}
          <span className="font-semibold text-primary">({onTimePct}%)</span>
        </p>
      </div>
    </div>
  );
}
