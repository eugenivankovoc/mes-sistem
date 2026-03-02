import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import type { OrderSummary } from "@/hooks/useReportsData";

interface Props {
  data?: OrderSummary[];
  isLoading: boolean;
}

export function ReportsOrdersTab({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="mt-4">
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="mt-4 rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Nema naloga za odabrani period</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[hsl(var(--table-header-bg))] hover:bg-[hsl(var(--table-header-bg))]">
            <TableHead>Nalog</TableHead>
            <TableHead>Klijent</TableHead>
            <TableHead className="text-right">Ukupno dijelova</TableHead>
            <TableHead className="text-right">Završeno</TableHead>
            <TableHead className="text-right">Dorada</TableHead>
            <TableHead>Rok</TableHead>
            <TableHead>Završen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((o, idx) => (
            <TableRow key={o.id} className={idx % 2 === 1 ? "bg-[hsl(var(--table-row-stripe))]" : ""}>
              <TableCell>
                <span className="font-medium">{o.orderNumber}</span>
                {o.isLate && (
                  <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">
                    Kasni
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{o.customer}</TableCell>
              <TableCell className="text-right">{o.totalParts}</TableCell>
              <TableCell className="text-right">{o.completedParts}</TableCell>
              <TableCell className="text-right">
                <span className={o.reworkParts > 0 ? "text-destructive font-medium" : ""}>
                  {o.reworkParts}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {o.dueDate ? format(new Date(o.dueDate), "dd.MM.yyyy") : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {o.completedAt ? format(new Date(o.completedAt), "dd.MM.yyyy") : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
