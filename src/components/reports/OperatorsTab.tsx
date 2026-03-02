import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import type { OperatorSummary } from "@/hooks/useReportsData";

interface Props {
  data?: OperatorSummary[];
  isLoading: boolean;
}

type SortKey = "name" | "partsInPeriod" | "avgPerDay" | "mainWorkstation" | "lastActivity";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ReportsOperatorsTab({ data, isLoading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("partsInPeriod");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "partsInPeriod":
          cmp = a.partsInPeriod - b.partsInPeriod;
          break;
        case "avgPerDay":
          cmp = a.avgPerDay - b.avgPerDay;
          break;
        case "mainWorkstation":
          cmp = a.mainWorkstation.localeCompare(b.mainWorkstation);
          break;
        case "lastActivity":
          cmp = (a.lastActivity || "").localeCompare(b.lastActivity || "");
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [data, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

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

  const SortableHead = ({ label, sortKeyVal }: { label: string; sortKeyVal: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => toggleSort(sortKeyVal)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </TableHead>
  );

  return (
    <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[hsl(var(--table-header-bg))] hover:bg-[hsl(var(--table-header-bg))]">
            <SortableHead label="Operater" sortKeyVal="name" />
            <SortableHead label="Dijelovi ukupno" sortKeyVal="partsInPeriod" />
            <SortableHead label="Prosj/smjena" sortKeyVal="avgPerDay" />
            <SortableHead label="Najaktivnija stanica" sortKeyVal="mainWorkstation" />
            <SortableHead label="Zadnja aktivnost" sortKeyVal="lastActivity" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((op, idx) => (
            <TableRow key={op.operatorId} className={idx % 2 === 1 ? "bg-[hsl(var(--table-row-stripe))]" : ""}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                      {getInitials(op.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{op.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">{op.partsInPeriod}</TableCell>
              <TableCell className="text-right">{op.avgPerDay}</TableCell>
              <TableCell className="text-muted-foreground">{op.mainWorkstation}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {op.lastActivity
                  ? format(new Date(op.lastActivity), "dd.MM.yyyy HH:mm", { locale: hr })
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
