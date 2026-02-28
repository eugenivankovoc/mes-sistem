import { useEffect, useState } from "react";
import { Search, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Customer {
  id: string;
  name: string;
}

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  customerId: string | null;
  onCustomerChange: (v: string | null) => void;
  status: OrderStatus | null;
  onStatusChange: (v: OrderStatus | null) => void;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (v: Date | undefined) => void;
  onDateToChange: (v: Date | undefined) => void;
  customers: Customer[];
  filteredCount: number;
  totalCount: number;
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "Novi" },
  { value: "ready", label: "Spreman" },
  { value: "released", label: "Releasean" },
  { value: "in_production", label: "U proizvodnji" },
  { value: "completed", label: "Završen" },
  { value: "archived", label: "Arhiviran" },
];

export function OrderFilters({
  search, onSearchChange,
  customerId, onCustomerChange,
  status, onStatusChange,
  dateFrom, dateTo, onDateFromChange, onDateToChange,
  customers,
  filteredCount, totalCount,
}: Props) {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => onSearchChange(localSearch), 300);
    return () => clearTimeout(t);
  }, [localSearch, onSearchChange]);

  const hasFilters = search || customerId || status || dateFrom || dateTo;

  const clearAll = () => {
    setLocalSearch("");
    onSearchChange("");
    onCustomerChange(null);
    onStatusChange(null);
    onDateFromChange(undefined);
    onDateToChange(undefined);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži naziv naloga..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 pr-8"
          />
          {localSearch && (
            <button
              onClick={() => { setLocalSearch(""); onSearchChange(""); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Customer */}
        <Select
          value={customerId ?? "all"}
          onValueChange={(v) => onCustomerChange(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Svi kupci" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi kupci</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={status ?? "all"}
          onValueChange={(v) => onStatusChange(v === "all" ? null : (v as OrderStatus))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Svi statusi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi statusi</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "dd.MM.yyyy") : "Od"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={onDateFromChange}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "dd.MM.yyyy") : "Do"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={onDateToChange}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" /> Poništi filtere
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground">
          Prikazano {filteredCount} od {totalCount} naloga
        </span>
      </div>
    </div>
  );
}
