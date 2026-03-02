import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
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

export function ReportsWorkstationsTab({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-6 mt-4">
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

  const chartData = data
    .filter((w) => w.partsInPeriod > 0)
    .sort((a, b) => b.partsInPeriod - a.partsInPeriod);

  return (
    <div className="space-y-6 mt-4">
      {/* Table */}
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
                <TableCell className="font-medium">{ws.name}</TableCell>
                <TableCell className="text-right">{ws.partsInPeriod}</TableCell>
                <TableCell className="text-right">{ws.partsToday}</TableCell>
                <TableCell className="text-right">{ws.avgPerDay}</TableCell>
                <TableCell className="text-muted-foreground">{ws.busiestDay}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Horizontal bar chart */}
      {chartData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Usporedba po stanicama</h3>
            <div style={{ height: Math.max(200, chartData.length * 40 + 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                    width={80}
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
                  <Bar dataKey="partsInPeriod" fill="#1E5FA8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
