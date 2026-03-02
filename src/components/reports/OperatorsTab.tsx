import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OperatorSummary } from "@/hooks/useReportsData";

interface Props {
  data?: OperatorSummary[];
  isLoading: boolean;
}

export function ReportsOperatorsTab({ data, isLoading }: Props) {
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
        <p className="text-muted-foreground">Nema podataka za odabrani period</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[hsl(var(--table-header-bg))] hover:bg-[hsl(var(--table-header-bg))]">
            <TableHead>Operater</TableHead>
            <TableHead className="text-right">Dijelovi u periodu</TableHead>
            <TableHead className="text-right">Dorade</TableHead>
            <TableHead className="text-right">Prosj/dan</TableHead>
            <TableHead>Glavna stanica</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((op, idx) => (
            <TableRow key={op.operatorId} className={idx % 2 === 1 ? "bg-[hsl(var(--table-row-stripe))]" : ""}>
              <TableCell className="font-medium">{op.name}</TableCell>
              <TableCell className="text-right">{op.partsInPeriod}</TableCell>
              <TableCell className="text-right">
                <span className={op.reworkCount > 0 ? "text-destructive font-medium" : ""}>
                  {op.reworkCount}
                </span>
              </TableCell>
              <TableCell className="text-right">{op.avgPerDay}</TableCell>
              <TableCell className="text-muted-foreground">{op.mainWorkstation}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
