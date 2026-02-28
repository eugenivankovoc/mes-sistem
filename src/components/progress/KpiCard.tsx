import { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  alertBg?: string; // applied when value > 0
}

export function KpiCard({ title, value, subtitle, icon: Icon, iconColor, iconBg, alertBg }: KpiCardProps) {
  const showAlert = alertBg && value > 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-colors duration-300",
        showAlert && alertBg
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <AnimatedNumber value={value} className="text-3xl font-bold text-foreground" />
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
    </div>
  );
}
