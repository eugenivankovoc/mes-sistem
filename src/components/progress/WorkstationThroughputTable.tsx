import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkstationThroughput } from "@/hooks/useProgressData";

interface Props {
  data: WorkstationThroughput[] | undefined;
  isLoading: boolean;
}

function TrendIcon({ trend }: { trend: "up" | "down" | "neutral" }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-status-completed-text" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
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
      waiting: acc.waiting + ws.waiting,
    }),
    { completed: 0, rework: 0, waiting: 0 }
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Stanica</TableHead>
          <TableHead>Kod</TableHead>
          <TableHead className="text-right">Potvrđeno</TableHead>
          <TableHead className="text-right">Dorada</TableHead>
          <TableHead className="text-right">Čeka</TableHead>
          <TableHead className="text-right">Prosj/sat</TableHead>
          <TableHead className="text-center">Trend</TableHead>
          <TableHead className="text-right">Ukupno</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(data ?? []).map((ws) => (
          <TableRow key={ws.id} className="cursor-pointer">
            <TableCell className="font-medium">{ws.name}</TableCell>
            <TableCell className="text-muted-foreground">{ws.code}</TableCell>
            <TableCell className="text-right font-semibold text-status-completed-text">
              {ws.completedToday}
            </TableCell>
            <TableCell className="text-right font-semibold text-status-rework-text">
              {ws.reworkToday}
            </TableCell>
            <TableCell className="text-right font-semibold text-status-released-text">
              {ws.waiting}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {ws.avgPerHour}
            </TableCell>
            <TableCell className="text-center">
              <div className="flex justify-center">
                <TrendIcon trend={ws.trend} />
              </div>
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
            <TableCell className="text-right text-status-released-text">{total.waiting}</TableCell>
            <TableCell colSpan={2} />
            <TableCell className="text-right">{total.completed + total.rework}</TableCell>
          </TableRow>
        )}
        {(data ?? []).length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              Nema aktivnih stanica
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
