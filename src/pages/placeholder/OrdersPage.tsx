import { useState, useCallback } from "react";
import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { BulkActionBar } from "@/components/orders/BulkActionBar";
import { CreateOrderModal } from "@/components/orders/CreateOrderModal";
import { EditOrderModal } from "@/components/orders/EditOrderModal";
import { DuplicateOrderDialog } from "@/components/orders/DuplicateOrderDialog";
import { useOrders, useCustomers } from "@/hooks/useOrders";
import type { OrderRow } from "@/hooks/useOrders";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export default function OrdersPage() {
  useSetPageTitle("Upravljanje nalozima");
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [sortColumn, setSortColumn] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<OrderRow | null>(null);
  const [duplicateOrder, setDuplicateOrder] = useState<OrderRow | null>(null);

  const { data: orders = [], isLoading } = useOrders(
    { search, customerId, status },
    { column: sortColumn, direction: sortDirection }
  );
  const { data: customers = [] } = useCustomers();

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Upravljanje nalozima</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novi nalog
        </Button>
      </div>

      <OrderFilters
        search={search}
        onSearchChange={setSearch}
        customerId={customerId}
        onCustomerChange={setCustomerId}
        status={status}
        onStatusChange={setStatus}
        customers={customers}
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
      />

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())} />
      <CreateOrderModal open={createOpen} onOpenChange={setCreateOpen} />
      <EditOrderModal order={editOrder} open={!!editOrder} onOpenChange={(o) => !o && setEditOrder(null)} />
      <DuplicateOrderDialog order={duplicateOrder} open={!!duplicateOrder} onOpenChange={(o) => !o && setDuplicateOrder(null)} />
    </div>
  );
}
