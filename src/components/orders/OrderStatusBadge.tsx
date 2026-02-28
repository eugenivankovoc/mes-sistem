import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusConfig: Record<OrderStatus, { label: string; key: string }> = {
  new: { label: "Novi", key: "new" },
  ready: { label: "Spreman", key: "ready" },
  released: { label: "Pušteno", key: "released" },
  in_production: { label: "U proizvodnji", key: "in-production" },
  completed: { label: "Završeno", key: "completed" },
  archived: { label: "Arhivirano", key: "archived" },
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
