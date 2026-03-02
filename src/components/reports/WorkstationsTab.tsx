import { Cell } from "recharts";
import { BarChart3 as BarChartIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell as TCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WorkstationSummary } from "@/hooks/useReportsData";

interface Props {
  data?: WorkstationSummary[];
  isLoading: boolean;
}

const BAR_COLORS = [
  "#1E5FA8", "#E07B00", "#2D9C5A", "#9B59B6",
  "#E74C3C", "#17A2B8", "#F39C12", "#1ABC9C",
];

export function ReportsWorkstationsTab({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-6 mt-4">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[60px] ml-auto" />
              <Skeleton className="h-4 w-[60px]" />
              <Skeleton className="h-4 w-[60px]" />
              <Skeleton className="h-4 w-[80px]" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center mt-4">
        <div className="rounded-full bg-muted p-4 mb-4">
          <BarChartIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Nema podataka</h3>
        <p className="text-sm text-muted-foreground">Nema podataka za odabrani period.</p>
      </div>
    );
  }

  const chartData = data
    .filter((w) => w.partsInPeriod > 0)
    .sort((a, b) => b.partsInPeriod - a.partsInPeriod);

  return (
    <div className="space-y-6 mt-4">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--table-header-bg))] hover:bg-[hsl(var(--table-header-bg))]">
              <TableHead>Radna stanica</TableHead>
              <TableHead className="text-right">Dijelovi u periodu</TableHead>
              <TableHead className="text-right">Dijelovi danas</TableHead>
              <TableHead className="text-right">Prosj/dan</TableHead>
              <TableHead>Najaktivniji dan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((ws, idx) => (
              <TableRow key={ws.id} className={idx % 2 === 1 ? "bg-[hsl(var(--table-row-stripe))]" : ""}>
                <TCell className="font-medium">{ws.name}</TCell>
                <TCell className="text-right">{ws.partsInPeriod}</TCell>
                <TCell className="text-right">{ws.partsToday}</TCell>
                <TCell className="text-right">{ws.avgPerDay}</TCell>
                <TCell className="text-muted-foreground">{ws.busiestDay}</TCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Usporedba po stanicama</h3>
            <div style={{ height: Math.max(200, chartData.length * 44 + 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [value, "Dijelovi"]}
                  />
                  <Bar dataKey="partsInPeriod" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
