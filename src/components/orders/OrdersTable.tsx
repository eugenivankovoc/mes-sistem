import { useNavigate } from "react-router-dom";
import { format, isPast, isToday, parseISO } from "date-fns";
import { ArrowUpDown, Pencil, Copy, ArrowRight, ClipboardList, AlertTriangle, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderRow, RowAnimation } from "@/hooks/useOrders";

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
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  visibleColumns: ColumnDef[];
  animatedRows: Map<string, RowAnimation>;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return format(parseISO(d), "dd.MM.yyyy");
}

function getAnimationClass(type: RowAnimation | undefined) {
  if (!type) return "";
  switch (type) {
    case "insert":
      return "animate-row-insert";
    case "update":
      return "animate-row-update";
    case "delete":
      return "animate-row-delete";
  }
}

export function OrdersTable({
  orders, selected, onSelect, onSelectAll,
  sortColumn, sortDirection, onSort, onEdit, onDuplicate,
  isLoading, onCreateClick, onClearFilters, hasActiveFilters,
  visibleColumns, animatedRows,
}: Props) {
  const navigate = useNavigate();
  const allSelected = orders.length > 0 && selected.size === orders.length;
  const colSpan = visibleColumns.length + 2;

  return (
    <div className="overflow-x-auto -mx-3 sm:mx-0 rounded-lg border border-border">
    <Table className="min-w-[700px]">
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
                <ArrowUpDown className={`h-3.5 w-3.5 ${sortColumn === col.key ? "text-primary" : ""}`} />
              </button>
            </TableHead>
          ))}
          <TableHead className="text-right w-[120px]">Radnje</TableHead>
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
                {hasActiveFilters ? (
                  <>
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Search className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Nema rezultata za odabrane filtere</h3>
                    {onClearFilters && (
                      <Button variant="secondary" onClick={onClearFilters} className="mt-4">
                        Poništi filtere
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <ClipboardList className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Nema naloga</h3>
                    {onCreateClick && (
                      <Button onClick={onCreateClick} className="mt-4">Kreirajte prvi nalog</Button>
                    )}
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order, i) => {
            const animType = animatedRows.get(order.id);
            const isOverdue =
              order.due_date &&
              isPast(parseISO(order.due_date)) &&
              !isToday(parseISO(order.due_date)) &&
              order.status !== "completed" &&
              order.status !== "archived";
            const isDueToday =
              order.due_date &&
              isToday(parseISO(order.due_date)) &&
              order.status !== "completed" &&
              order.status !== "archived";

            return (
              <TableRow
                key={order.id}
                className={`group ${i % 2 === 1 ? "bg-muted/30" : ""} hover:bg-table-row-hover ${getAnimationClass(animType)}`}
              >
                {/* Checkbox */}
                <TableCell>
                  <Checkbox
                    checked={selected.has(order.id)}
                    onCheckedChange={(v) => onSelect(order.id, !!v)}
                  />
                </TableCell>

                {visibleColumns.map((col) => {
                  switch (col.key) {
                    case "order_number":
                      return (
                        <TableCell key={col.key}>
                          <div className="flex items-center gap-2">
                            <div>
                              <button
                                className="font-semibold text-sm text-foreground hover:text-primary hover:underline"
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                {order.order_number}
                              </button>
                              <p className="text-xs text-muted-foreground">{order.order_number}</p>
                            </div>
                            {order.priority === 1 && (
                              <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                                Hitno
                              </span>
                            )}
                          </div>
                        </TableCell>
                      );
                    case "customer_name":
                      return (
                        <TableCell key={col.key} className="w-[160px]">
                          {order.customer_name ? (
                            <span className="text-sm">{order.customer_name}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      );
                    case "status":
                      return (
                        <TableCell key={col.key} className="w-[140px]">
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                      );
                    case "created_at":
                      return (
                        <TableCell key={col.key} className="w-[120px] text-sm">
                          {fmtDate(order.created_at)}
                        </TableCell>
                      );
                    case "due_date":
                      return (
                        <TableCell key={col.key} className="w-[120px]">
                          {order.due_date ? (
                            <span
                              className={`inline-flex items-center gap-1 text-sm ${
                                isOverdue
                                  ? "text-destructive font-medium"
                                  : isDueToday
                                    ? "text-orange-600 font-medium"
                                    : ""
                              }`}
                            >
                              {isOverdue && <AlertTriangle className="h-3.5 w-3.5" />}
                              {fmtDate(order.due_date)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      );
                    case "parts_count":
                      return (
                        <TableCell key={col.key} className="w-[80px] text-center">
                          {order.parts_total === 0 ? (
                            <span className="text-sm text-muted-foreground">0</span>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-sm font-medium">
                                {order.parts_completed}/{order.parts_total}
                              </span>
                              <Progress
                                value={(order.parts_completed / order.parts_total) * 100}
                                className="h-[2px]"
                              />
                            </div>
                          )}
                        </TableCell>
                      );
                    default:
                      return <TableCell key={col.key} />;
                  }
                })}

                {/* Actions – visible on hover */}
                <TableCell className="text-right w-[120px]">
                  <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
                    <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8" title="Uredi" onClick={() => onEdit(order)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8" title="Kopiraj" onClick={() => onDuplicate(order)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8" title="Pregledaj"
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
    </div>
  );
}
