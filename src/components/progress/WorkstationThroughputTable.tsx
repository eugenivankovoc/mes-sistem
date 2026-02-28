import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkstationThroughput } from "@/hooks/useProgressData";

interface Props {
  data: WorkstationThroughput[] | undefined;
  isLoading: boolean;
}

export function WorkstationThroughputTable({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const total = (data ?? []).reduce(
    (acc, ws) => ({
      completed: acc.completed + ws.completedToday,
      rework: acc.rework + ws.reworkToday,
    }),
    { completed: 0, rework: 0 }
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Stanica</TableHead>
          <TableHead>Kod</TableHead>
          <TableHead className="text-right">Potvrđeno</TableHead>
          <TableHead className="text-right">Dorada</TableHead>
          <TableHead className="text-right">Ukupno</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(data ?? []).map((ws) => (
          <TableRow key={ws.id}>
            <TableCell className="font-medium">{ws.name}</TableCell>
            <TableCell className="text-muted-foreground">{ws.code}</TableCell>
            <TableCell className="text-right font-semibold text-status-completed-text">
              {ws.completedToday}
            </TableCell>
            <TableCell className="text-right font-semibold text-status-rework-text">
              {ws.reworkToday}
            </TableCell>
            <TableCell className="text-right font-semibold">
              {ws.completedToday + ws.reworkToday}
            </TableCell>
          </TableRow>
        ))}
        {(data ?? []).length > 0 && (
          <TableRow className="bg-muted/50 font-semibold">
            <TableCell colSpan={2}>Ukupno</TableCell>
            <TableCell className="text-right text-status-completed-text">{total.completed}</TableCell>
            <TableCell className="text-right text-status-rework-text">{total.rework}</TableCell>
            <TableCell className="text-right">{total.completed + total.rework}</TableCell>
          </TableRow>
        )}
        {(data ?? []).length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              Nema aktivnih stanica
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
