import { useNavigate } from "react-router-dom";
import { format, isPast, parseISO } from "date-fns";
import { ArrowUpDown, Pencil, Copy, ArrowRight, ClipboardList } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderRow } from "@/hooks/useOrders";

interface ColumnDef {
  key: string;
  label: string;
}

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
  isLoading?: boolean;
  onCreateClick?: () => void;
  visibleColumns: ColumnDef[];
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return format(parseISO(d), "dd.MM.yyyy");
}

function renderCell(order: OrderRow, key: string, isOverdue: boolean) {
  switch (key) {
    case "order_number":
      return null; // handled inline with link
    case "customer_name":
      return order.customer_name ?? "—";
    case "status":
      return <OrderStatusBadge status={order.status} />;
    case "created_at":
      return fmtDate(order.created_at);
    case "due_date":
      return <span className={isOverdue ? "text-destructive font-medium" : ""}>{fmtDate(order.due_date)}</span>;
    case "parts_count":
      return order.parts_count;
    default:
      return null;
  }
}

export function OrdersTable({
  orders, selected, onSelect, onSelectAll,
  sortColumn, sortDirection, onSort, onEdit, onDuplicate,
  isLoading, onCreateClick, visibleColumns,
}: Props) {
  const navigate = useNavigate();
  const allSelected = orders.length > 0 && selected.size === orders.length;
  const colSpan = visibleColumns.length + 2; // checkbox + columns + actions

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-table-header-bg hover:bg-table-header-bg">
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(v) => onSelectAll(!!v)}
            />
          </TableHead>
          {visibleColumns.map((col) => (
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
          <TableHead className="text-right">Radnje</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: colSpan }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan}>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <ClipboardList className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Nema naloga</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Nema naloga koji odgovaraju vašim filterima.
                </p>
                {onCreateClick && (
                  <Button onClick={onCreateClick}>Kreirajte prvi nalog</Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order, i) => {
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
                {visibleColumns.map((col) => (
                  <TableCell key={col.key}>
                    {col.key === "order_number" ? (
                      <button
                        className="font-semibold text-primary hover:underline"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        {order.order_number}
                      </button>
                    ) : (
                      renderCell(order, col.key, !!isOverdue)
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Uredi" onClick={() => onEdit(order)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Kopiraj" onClick={() => onDuplicate(order)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8" title="Pregledaj"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
