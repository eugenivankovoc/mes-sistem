import { useNavigate } from "react-router-dom";
import { format, isPast, parseISO } from "date-fns";
import { ArrowUpDown, Pencil, Copy, ArrowRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderRow } from "@/hooks/useOrders";

interface Props {
  orders: OrderRow[];
  selected: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  onEdit: (order: OrderRow) => void;
  onDuplicate: (order: OrderRow) => void;
}

const columns = [
  { key: "order_number", label: "Order name" },
  { key: "customer_name", label: "Customer" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Order date" },
  { key: "due_date", label: "Delivery date" },
  { key: "parts_count", label: "Parts" },
];

function fmtDate(d: string | null) {
  if (!d) return "—";
  return format(parseISO(d), "dd.MM.yyyy");
}

export function OrdersTable({
  orders, selected, onSelect, onSelectAll,
  sortColumn, sortDirection, onSort, onEdit, onDuplicate,
}: Props) {
  const navigate = useNavigate();
  const allSelected = orders.length > 0 && selected.size === orders.length;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-table-header-bg hover:bg-table-header-bg border-b border-border">
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(v) => onSelectAll(!!v)}
            />
          </TableHead>
          {columns.map((col) => (
            <TableHead key={col.key}>
              <button
                className="inline-flex items-center gap-1 text-table-header-text hover:text-foreground"
                onClick={() => onSort(col.key)}
              >
                {col.label}
                <ArrowUpDown className="h-3.5 w-3.5" />
              </button>
            </TableHead>
          ))}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order, i) => {
          const isOverdue = order.due_date && isPast(parseISO(order.due_date)) && order.status !== "completed" && order.status !== "archived";
          return (
            <TableRow
              key={order.id}
              className={`${i % 2 === 1 ? "bg-muted/30" : ""} hover:bg-table-row-hover`}
            >
              <TableCell>
                <Checkbox
                  checked={selected.has(order.id)}
                  onCheckedChange={(v) => onSelect(order.id, !!v)}
                />
              </TableCell>
              <TableCell>
                <button
                  className="font-semibold text-primary hover:underline"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  {order.order_number}
                </button>
              </TableCell>
              <TableCell>{order.customer_name ?? "—"}</TableCell>
              <TableCell><OrderStatusBadge status={order.status} /></TableCell>
              <TableCell>{fmtDate(order.created_at)}</TableCell>
              <TableCell className={isOverdue ? "text-destructive font-medium" : ""}>
                {fmtDate(order.due_date)}
              </TableCell>
              <TableCell>{order.parts_count}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => onEdit(order)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Copy" onClick={() => onDuplicate(order)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8" title="View"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
