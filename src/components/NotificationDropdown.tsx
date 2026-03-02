import { useRef, useEffect } from "react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const TYPE_COLORS: Record<string, string> = {
  order_completed: "#16A34A",
  order_overdue: "#C0392B",
  rework_requested: "#E07B00",
  rework_approved: "#1E5FA8",
  order_released: "#1E5FA8",
  batch_ready: "#0D9488",
  default: "#9CA3AF",
};

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "upravo";
  if (diffMin < 60) return `prije ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `prije ${diffHours} sati`;
  const d = new Date(iso);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `jučer ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ open, onClose }: Props) {
  const { data: notifications, isLoading, markAllRead, markOneRead } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div
      ref={ref}
      className="absolute top-14 right-0 w-[380px] max-h-[480px] bg-popover border border-border rounded-lg shadow-lg z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-[15px] font-bold text-foreground">Obavijesti</span>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-[13px] h-auto py-1 px-2"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            Označi sve pročitano
          </Button>
        )}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-2 w-2 rounded-full mt-2 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : !notifications?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nema obavijesti
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={() => {
                if (!n.is_read) markOneRead.mutate(n.id);
              }}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
}

function NotificationItem({
  notification: n,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const dotColor = TYPE_COLORS[n.type] ?? TYPE_COLORS.default;

  return (
    <button
      onClick={onRead}
      className="w-full text-left flex gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors duration-100"
    >
      <span
        className="mt-1.5 h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${n.is_read ? "font-normal text-foreground" : "font-bold text-foreground"}`}>
          {n.title}
        </p>
        <p className="text-[13px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
          {n.message}
        </p>
        <span className="text-xs text-muted-foreground/70 mt-1 block">
          {timeAgo(n.created_at)}
        </span>
      </div>
    </button>
  );
}
