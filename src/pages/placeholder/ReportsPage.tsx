import { useState, useMemo } from "react";
import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { hr } from "date-fns/locale";
import { CalendarIcon, Download } from "lucide-react";
import {
  useOverviewData,
  useWorkstationReport,
  useOperatorReport,
  useOrderReport,
  type ReportsDateRange,
} from "@/hooks/useReportsData";
import { ReportsOverviewTab } from "@/components/reports/OverviewTab";
import { ReportsWorkstationsTab } from "@/components/reports/WorkstationsTab";
import { ReportsOperatorsTab } from "@/components/reports/OperatorsTab";
import { ReportsOrdersTab } from "@/components/reports/OrdersTab";

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  useSetPageTitle("Izvještaji");

  const [activeTab, setActiveTab] = useState("overview");
  const [fromDate, setFromDate] = useState<Date>(subDays(new Date(), 30));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [appliedRange, setAppliedRange] = useState<ReportsDateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const range = appliedRange;
  const overviewQuery = useOverviewData(range);
  const workstationsQuery = useWorkstationReport(range);
  const operatorsQuery = useOperatorReport(range);
  const ordersQuery = useOrderReport(range);

  const applyRange = () => {
    setAppliedRange({ from: startOfDay(fromDate), to: endOfDay(toDate) });
  };

  const setQuickRange = (preset: string) => {
    const now = new Date();
    let from: Date, to: Date;
    switch (preset) {
      case "today":
        from = startOfDay(now);
        to = endOfDay(now);
        break;
      case "week":
        from = startOfWeek(now, { weekStartsOn: 1 });
        to = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "month":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case "last-month": {
        const prev = subMonths(now, 1);
        from = startOfMonth(prev);
        to = endOfMonth(prev);
        break;
      }
      default:
        return;
    }
    setFromDate(from);
    setToDate(to);
    setAppliedRange({ from, to });
  };

  const handleExportCsv = () => {
    if (activeTab === "overview" && overviewQuery.data) {
      downloadCsv(
        "pregled.csv",
        ["Datum", "Dijelovi"],
        overviewQuery.data.dailyParts.map((d) => [d.date, String(d.count)])
      );
    } else if (activeTab === "workstations" && workstationsQuery.data) {
      downloadCsv(
        "po-stanici.csv",
        ["Radna stanica", "Ukupno", "Danas", "Prosj/dan", "Najaktivniji dan"],
        workstationsQuery.data.map((w) => [w.name, String(w.partsInPeriod), String(w.partsToday), String(w.avgPerDay), w.busiestDay])
      );
    } else if (activeTab === "operators" && operatorsQuery.data) {
      downloadCsv(
        "po-operateru.csv",
        ["Operater", "Dijelovi", "Dorade", "Prosj/dan", "Stanica"],
        operatorsQuery.data.map((o) => [o.name, String(o.partsInPeriod), String(o.reworkCount), String(o.avgPerDay), o.mainWorkstation])
      );
    } else if (activeTab === "orders" && ordersQuery.data) {
      downloadCsv(
        "nalozi.csv",
        ["Nalog", "Klijent", "Ukupno dijelova", "Završeno", "Dorada", "Rok", "Završen"],
        ordersQuery.data.map((o) => [
          o.orderNumber, o.customer, String(o.totalParts), String(o.completedParts),
          String(o.reworkParts), o.dueDate || "—", o.completedAt?.split("T")[0] || "—"
        ])
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with date range */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Od</span>
            <DatePicker date={fromDate} onSelect={setFromDate} />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Do</span>
            <DatePicker date={toDate} onSelect={setToDate} />
          </div>
          <Button onClick={applyRange} size="sm">Primijeni</Button>

          <div className="flex gap-1">
            {[
              { label: "Danas", value: "today" },
              { label: "Ovaj tjedan", value: "week" },
              { label: "Ovaj mjesec", value: "month" },
              { label: "Prošli mjesec", value: "last-month" },
            ].map((btn) => (
              <Button
                key={btn.value}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setQuickRange(btn.value)}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>

        <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCsv}>
          <Download className="h-4 w-4" />
          Izvozi CSV
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
          {[
            { value: "overview", label: "Pregled" },
            { value: "workstations", label: "Po stanici" },
            { value: "operators", label: "Po operateru" },
            { value: "orders", label: "Nalozi" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:text-primary transition-colors"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <ReportsOverviewTab data={overviewQuery.data} isLoading={overviewQuery.isLoading} />
        </TabsContent>
        <TabsContent value="workstations">
          <ReportsWorkstationsTab data={workstationsQuery.data} isLoading={workstationsQuery.isLoading} />
        </TabsContent>
        <TabsContent value="operators">
          <ReportsOperatorsTab data={operatorsQuery.data} isLoading={operatorsQuery.isLoading} />
        </TabsContent>
        <TabsContent value="orders">
          <ReportsOrdersTab data={ordersQuery.data} isLoading={ordersQuery.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DatePicker({ date, onSelect }: { date: Date; onSelect: (d: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-[140px] justify-start text-left font-normal text-xs",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
          {date ? format(date, "dd.MM.yyyy") : "Odaberi"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && onSelect(d)}
          initialFocus
          locale={hr}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
