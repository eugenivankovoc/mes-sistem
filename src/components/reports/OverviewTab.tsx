import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OverviewKpi, DailyParts } from "@/hooks/useReportsData";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

interface Props {
  data?: { kpi: OverviewKpi; dailyParts: DailyParts[] };
  isLoading: boolean;
}

const kpiConfig = [
  { key: "avgPartsPerDay", label: "Prosj. dijelova/dan", suffix: "" },
  { key: "totalParts", label: "Ukupno u periodu", suffix: "" },
  { key: "reworkRate", label: "Stopa dorade", suffix: "%" },
  { key: "onTimeRate", label: "Isporuka na vrijeme", suffix: "%" },
] as const;

export function ReportsOverviewTab({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-6 mt-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-[280px] w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 mt-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiConfig.map((cfg) => (
          <Card key={cfg.key}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{cfg.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {data.kpi[cfg.key]}{cfg.suffix}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Dijelovi po danu</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.dailyParts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === "count" ? "Dijelovi" : "7-dnevni prosjek",
                  ]}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="count" fill="#1E5FA8" radius={[3, 3, 0, 0]} name="count" />
                <Line
                  type="monotone"
                  dataKey="rolling7"
                  stroke="#E07B00"
                  strokeWidth={2}
                  dot={false}
                  name="rolling7"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
