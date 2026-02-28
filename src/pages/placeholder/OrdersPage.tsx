import { useState, useCallback } from "react";
import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { BulkActionBar } from "@/components/orders/BulkActionBar";
import { CreateOrderModal } from "@/components/orders/CreateOrderModal";
import { EditOrderModal } from "@/components/orders/EditOrderModal";
import { DuplicateOrderDialog } from "@/components/orders/DuplicateOrderDialog";
import { ColumnVisibilitySettings, type ColumnConfig } from "@/components/orders/ColumnVisibilitySettings";
import { useOrders, useCustomers, useOrdersCount } from "@/hooks/useOrders";
import type { OrderRow } from "@/hooks/useOrders";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const defaultColumns: ColumnConfig[] = [
  { key: "order_number", label: "Naziv naloga", visible: true },
  { key: "customer_name", label: "Kupac", visible: true },
  { key: "status", label: "Status", visible: true },
  { key: "created_at", label: "Datum naloga", visible: true },
  { key: "due_date", label: "Datum isporuke", visible: true },
  { key: "parts_count", label: "Dijelovi", visible: true },
];

export default function OrdersPage() {
  useSetPageTitle("Upravljanje nalozima");
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [sortColumn, setSortColumn] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<OrderRow | null>(null);
  const [duplicateOrder, setDuplicateOrder] = useState<OrderRow | null>(null);
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);

  const { data: orders = [], isLoading } = useOrders(
    {
      search,
      customerId,
      status,
      dateFrom: dateFrom ? format(dateFrom, "yyyy-MM-dd") : null,
      dateTo: dateTo ? format(dateTo, "yyyy-MM-dd") : null,
    },
    { column: sortColumn, direction: sortDirection }
  );
  const { data: customers = [] } = useCustomers();
  const { data: totalCount = 0 } = useOrdersCount();

  const handleSort = useCallback((col: string) => {
    setSortDirection((d) => (sortColumn === col ? (d === "asc" ? "desc" : "asc") : "asc"));
    setSortColumn(col);
  }, [sortColumn]);

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelected(checked ? new Set(orders.map((o) => o.id)) : new Set());
  }, [orders]);

  const handleColumnVisibility = useCallback((key: string, visible: boolean) => {
    setColumns((prev) => prev.map((c) => c.key === key ? { ...c, visible } : c));
  }, []);

  const visibleColumns = columns.filter((c) => c.visible);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Upravljanje nalozima</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novi nalog
          </Button>
          <ColumnVisibilitySettings columns={columns} onChange={handleColumnVisibility} />
        </div>
      </div>

      <OrderFilters
        search={search}
        onSearchChange={setSearch}
        customerId={customerId}
        onCustomerChange={setCustomerId}
        status={status}
        onStatusChange={setStatus}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        customers={customers}
        filteredCount={orders.length}
        totalCount={totalCount}
      />

      <OrdersTable
        orders={orders}
        selected={selected}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onEdit={setEditOrder}
        onDuplicate={setDuplicateOrder}
        isLoading={isLoading}
        onCreateClick={() => setCreateOpen(true)}
        visibleColumns={visibleColumns}
      />

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())} />
      <CreateOrderModal open={createOpen} onOpenChange={setCreateOpen} />
      <EditOrderModal order={editOrder} open={!!editOrder} onOpenChange={(o) => !o && setEditOrder(null)} />
      <DuplicateOrderDialog order={duplicateOrder} open={!!duplicateOrder} onOpenChange={(o) => !o && setDuplicateOrder(null)} />
    </div>
  );
}
