import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusConfig: Record<OrderStatus, { label: string; key: string }> = {
  new: { label: "New", key: "new" },
  ready: { label: "Ready", key: "ready" },
  released: { label: "Released", key: "released" },
  in_production: { label: "In Production", key: "in-production" },
  completed: { label: "Completed", key: "completed" },
  archived: { label: "Archived", key: "archived" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-xs font-medium bg-status-${config.key}-bg text-status-${config.key}-text`}
    >
      <span className={`h-[7px] w-[7px] rounded-full bg-status-${config.key}-dot`} />
      {config.label}
    </span>
  );
}
