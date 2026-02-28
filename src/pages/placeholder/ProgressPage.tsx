import { useState } from "react";
import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { useProgressKpi, useWorkstationThroughput, type DateFilter } from "@/hooks/useProgressData";
import { KpiCard } from "@/components/progress/KpiCard";
import { WorkstationThroughputTable } from "@/components/progress/WorkstationThroughputTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, ClipboardList, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const DATE_LABELS: Record<DateFilter, string> = {
  today: "Danas",
  week: "Ovaj tjedan",
  month: "Ovaj mjesec",
};

export default function ProgressPage() {
  useSetPageTitle("Napredak naloga");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const queryClient = useQueryClient();

  const { data: kpi, isLoading: kpiLoading } = useProgressKpi(dateFilter);
  const { data: throughput, isLoading: throughputLoading } = useWorkstationThroughput(dateFilter);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["progress-kpi"] });
    queryClient.invalidateQueries({ queryKey: ["workstation-throughput"] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Napredak naloga</h1>
        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(DATE_LABELS) as [DateFilter, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Aktivni nalozi"
          value={kpi?.activeOrders ?? 0}
          subtitle="naloga u tijeku"
          icon={ClipboardList}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <KpiCard
          title={`Dijelovi ${DATE_LABELS[dateFilter].toLowerCase()}`}
          value={kpi?.partsToday ?? 0}
          subtitle={`dijelova potvrđeno ${DATE_LABELS[dateFilter].toLowerCase()}`}
          icon={CheckCircle2}
          iconColor="text-status-completed-text"
          iconBg="bg-status-completed-bg"
        />
        <KpiCard
          title="U doradi"
          value={kpi?.reworkParts ?? 0}
          subtitle="dijelova čeka doradu"
          icon={AlertTriangle}
          iconColor="text-status-released-text"
          iconBg="bg-status-released-bg"
          alertBg="bg-status-released-bg/40"
        />
        <KpiCard
          title="Kasni nalozi"
          value={kpi?.lateOrders ?? 0}
          subtitle="naloga kasni s isporukom"
          icon={Clock}
          iconColor="text-destructive"
          iconBg="bg-status-rework-bg"
          alertBg="bg-status-rework-bg/60"
        />
      </div>

      {/* Workstation Throughput */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Propusnost po stanicama {DATE_LABELS[dateFilter].toLowerCase()}
        </h2>
        <WorkstationThroughputTable data={throughput} isLoading={throughputLoading} />
      </div>
    </div>
  );
}
