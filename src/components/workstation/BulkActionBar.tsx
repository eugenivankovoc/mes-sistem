import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  count: number;
  onConfirm: () => void;
  onClear: () => void;
  isPending: boolean;
}

export function BulkActionBar({ count, onConfirm, onClear, isPending }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-3 animate-slide-in">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Left: count */}
        <span className="text-sm font-bold text-foreground">
          {count} dijelova odabrano
        </span>

        {/* Center: confirm button */}
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="h-14 px-8 rounded-lg text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ backgroundColor: "#16A34A" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803D")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16A34A")}
        >
          <Check className="h-4 w-4 inline mr-2" />
          {isPending ? "Potvrđujem..." : "Potvrdi odabrane"}
        </button>

        {/* Right: clear */}
        <Button variant="ghost" size="icon" onClick={onClear} className="h-9 w-9 text-muted-foreground">
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
