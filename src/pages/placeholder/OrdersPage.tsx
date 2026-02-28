import { useState, useCallback, useMemo } from "react";
import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const PAGE_SIZE_OPTIONS = [20, 50, 100];

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: allOrders = [], isLoading, animatedRows } = useOrders(
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

  const hasActiveFilters = !!(search || customerId || status || dateFrom || dateTo);

  // Pagination
  const totalFiltered = allOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalFiltered);
  const paginatedOrders = useMemo(
    () => allOrders.slice(startIdx, endIdx),
    [allOrders, startIdx, endIdx]
  );

  // Reset page when filters change
  const handleSearchChange = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleCustomerChange = useCallback((v: string | null) => { setCustomerId(v); setPage(1); }, []);
  const handleStatusChange = useCallback((v: OrderStatus | null) => { setStatus(v); setPage(1); }, []);
  const handleDateFromChange = useCallback((v: Date | undefined) => { setDateFrom(v); setPage(1); }, []);
  const handleDateToChange = useCallback((v: Date | undefined) => { setDateTo(v); setPage(1); }, []);

  const handleSort = useCallback((col: string) => {
    setSortDirection((d) => (sortColumn === col ? (d === "asc" ? "desc" : "asc") : "asc"));
    setSortColumn(col);
    setPage(1);
  }, [sortColumn]);

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelected(checked ? new Set(paginatedOrders.map((o) => o.id)) : new Set());
  }, [paginatedOrders]);

  const handleColumnVisibility = useCallback((key: string, visible: boolean) => {
    setColumns((prev) => prev.map((c) => c.key === key ? { ...c, visible } : c));
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCustomerId(null);
    setStatus(null);
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  }, []);

  const visibleColumns = columns.filter((c) => c.visible);

  // Page numbers to show
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button onClick={() => setCreateOpen(true)} className="min-h-[48px] md:min-h-0">
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Novi nalog</span>
          <span className="sm:hidden">Novi</span>
        </Button>
        <ColumnVisibilitySettings columns={columns} onChange={handleColumnVisibility} />
      </div>

      <OrderFilters
        search={search}
        onSearchChange={handleSearchChange}
        customerId={customerId}
        onCustomerChange={handleCustomerChange}
        status={status}
        onStatusChange={handleStatusChange}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        customers={customers}
        filteredCount={totalFiltered}
        totalCount={totalCount}
      />

      <OrdersTable
        orders={paginatedOrders}
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
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        visibleColumns={visibleColumns}
        animatedRows={animatedRows}
      />

      {/* Pagination bar */}
      {!isLoading && totalFiltered > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">
            Prikazano {startIdx + 1}–{endIdx} od {totalFiltered} naloga
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ←
            </Button>
            {pageNumbers.map((n) => (
              <Button
                key={n}
                variant={n === safePage ? "default" : "outline"}
                size="sm"
                className="min-w-[36px]"
                onClick={() => setPage(n)}
              >
                {n}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              →
            </Button>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <BulkActionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        selectedOrders={allOrders.filter((o) => selected.has(o.id))}
      />
      <CreateOrderModal open={createOpen} onOpenChange={setCreateOpen} />
      <EditOrderModal order={editOrder} open={!!editOrder} onOpenChange={(o) => !o && setEditOrder(null)} />
      <DuplicateOrderDialog order={duplicateOrder} open={!!duplicateOrder} onOpenChange={(o) => !o && setDuplicateOrder(null)} />
    </div>
  );
}
