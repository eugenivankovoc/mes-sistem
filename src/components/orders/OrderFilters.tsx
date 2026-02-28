import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  customers: Customer[];
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "Novi" },
  { value: "ready", label: "Spreman" },
  { value: "released", label: "Pušteno" },
  { value: "in_production", label: "U proizvodnji" },
  { value: "completed", label: "Završeno" },
  { value: "archived", label: "Arhivirano" },
];

export function OrderFilters({
  search, onSearchChange,
  customerId, onCustomerChange,
  status, onStatusChange,
  customers,
}: Props) {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => onSearchChange(localSearch), 300);
    return () => clearTimeout(t);
  }, [localSearch, onSearchChange]);

  const hasFilters = search || customerId || status;

  const clearAll = () => {
    setLocalSearch("");
    onSearchChange("");
    onCustomerChange(null);
    onStatusChange(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Naziv naloga"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={customerId ?? "all"}
        onValueChange={(v) => onCustomerChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Svi kupci" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Svi kupci</SelectItem>
          {customers.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status ?? "all"}
        onValueChange={(v) => onStatusChange(v === "all" ? null : (v as OrderStatus))}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Svi statusi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Svi statusi</SelectItem>
          {statusOptions.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
          <X className="h-4 w-4 mr-1" /> Očisti
        </Button>
      )}
    </div>
  );
}
