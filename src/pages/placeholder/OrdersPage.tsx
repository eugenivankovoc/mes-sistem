import { useState, useCallback } from "react";
import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { Plus, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderMobileCard } from "@/components/orders/OrderMobileCard";
import { BulkActionBar } from "@/components/orders/BulkActionBar";
import { CreateOrderModal } from "@/components/orders/CreateOrderModal";
import { EditOrderModal } from "@/components/orders/EditOrderModal";
import { DuplicateOrderDialog } from "@/components/orders/DuplicateOrderDialog";
import { ColumnVisibilitySettings, type ColumnConfig } from "@/components/orders/ColumnVisibilitySettings";
import { useOrders, useCustomers, useOrdersCount } from "@/hooks/useOrders";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const useCardView = isMobile || isTablet;
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

  const { data: orders = [], isLoading, animatedRows } = useOrders(
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
      {/* Action buttons – title is in TopBar via useSetPageTitle */}
      <div className="flex items-center justify-end gap-2">
        <Button onClick={() => setCreateOpen(true)} className="min-h-[48px] md:min-h-0">
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Novi nalog</span>
          <span className="sm:hidden">Novi</span>
        </Button>
        {!useCardView && (
          <ColumnVisibilitySettings columns={columns} onChange={handleColumnVisibility} />
        )}
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

      {/* Compact: card list | Desktop: table */}
      {useCardView ? (
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <ClipboardList className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Nema naloga</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Nema naloga koji odgovaraju vašim filterima.
              </p>
              <Button onClick={() => setCreateOpen(true)}>Kreirajte prvi nalog</Button>
            </div>
          ) : (
            orders.map((order) => (
              <OrderMobileCard
                key={order.id}
                order={order}
                isSelected={selected.has(order.id)}
                onSelect={handleSelect}
                onEdit={setEditOrder}
                onDuplicate={setDuplicateOrder}
                animType={animatedRows.get(order.id)}
              />
            ))
          )}
        </div>
      ) : (
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
          animatedRows={animatedRows}
        />
      )}

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())} />
      <CreateOrderModal open={createOpen} onOpenChange={setCreateOpen} />
      <EditOrderModal order={editOrder} open={!!editOrder} onOpenChange={(o) => !o && setEditOrder(null)} />
      <DuplicateOrderDialog order={duplicateOrder} open={!!duplicateOrder} onOpenChange={(o) => !o && setDuplicateOrder(null)} />
    </div>
  );
}
