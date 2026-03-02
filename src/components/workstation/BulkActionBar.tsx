import { Check, X } from "lucide-react";

interface BulkActionBarProps {
  count: number;
  onConfirm: () => void;
  onClear: () => void;
  isPending: boolean;
}

export function BulkActionBar({ count, onConfirm, onClear, isPending }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-card animate-slide-in"
      style={{
        borderTop: "2px solid #E5E7EB",
        boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
        height: 72,
        padding: "0 24px",
      }}
    >
      <div className="flex items-center justify-between h-full max-w-screen-xl mx-auto">
        {/* Left: count */}
        <span className="text-[15px] font-semibold text-foreground">
          {count} dijelova odabrano
        </span>

        {/* Center: confirm button */}
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="h-12 px-8 rounded-lg text-white font-bold text-[15px] transition-all active:scale-[0.98] disabled:opacity-60 flex items-center gap-2"
          style={{ backgroundColor: "#16A34A" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803D")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16A34A")}
        >
          <Check className="h-5 w-5" />
          {isPending ? "Potvrđujem..." : "Potvrdi odabrane"}
        </button>

        {/* Right: clear */}
        <button
          onClick={onClear}
          className="h-10 w-10 rounded-full border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          style={{ borderColor: "#E5E7EB" }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
