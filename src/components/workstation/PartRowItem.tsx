import React from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PartRowData {
  id: string;
  part_number: string;
  name: string;
  material: string | null;
  length: number | null;
  width: number | null;
  thickness: number | null;
  quantity: number;
}

type RowState = "idle" | "confirming" | "confirmed" | "removing";

interface PartRowItemProps {
  part: PartRowData;
  state: RowState;
  isSelected: boolean;
  isOffline: boolean;
  isOfflineQueued: boolean;
  onToggle: (id: string) => void;
  onConfirm: (id: string) => void;
  onRework: () => void;
}

function formatDimensions(p: PartRowData): string {
  const dims: string[] = [];
  if (p.length != null) dims.push(`${p.length}`);
  if (p.width != null) dims.push(`${p.width}`);
  if (p.thickness != null) dims.push(`${p.thickness}`);
  return dims.length ? dims.join(" × ") + " mm" : "";
}

export const PartRowItem = React.memo(function PartRowItem({
  part,
  state,
  isSelected,
  isOffline,
  isOfflineQueued,
  onToggle,
  onConfirm,
  onRework,
}: PartRowItemProps) {
  if (state === "removing") {
    return <div className="animate-slide-out-up overflow-hidden" />;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0 border-b transition-colors",
        state === "confirmed" && "animate-row-confirm"
      )}
      style={{ minHeight: 72, borderColor: "hsl(220 13% 91%)" }}
    >
      {/* Checkbox */}
      <div className="flex items-center justify-center shrink-0" style={{ width: 48 }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(part.id)}
          className="h-6 w-6 rounded border-2 border-input accent-primary cursor-pointer"
          disabled={state !== "idle"}
        />
      </div>

      {/* Part info */}
      <div className="flex-1 py-3 pr-2 min-w-0">
        <p className="text-[15px] font-bold text-foreground truncate">{part.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[13px] text-muted-foreground">{part.part_number}</span>
          {part.material && (
            <span className="text-[13px] text-muted-foreground">• {part.material}</span>
          )}
          {formatDimensions(part) && (
            <span className="text-[13px] text-muted-foreground">• {formatDimensions(part)}</span>
          )}
          {part.quantity > 1 && (
            <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary">
              ×{part.quantity}
            </span>
          )}
          {isOfflineQueued && (
            <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold bg-muted text-muted-foreground">
              ⏳ Čeka sync
            </span>
          )}
        </div>
      </div>

      {/* Done button */}
      <button
        onClick={() => onConfirm(part.id)}
        disabled={state !== "idle"}
        className="shrink-0 flex items-center justify-center gap-1.5 text-white font-bold text-sm transition-all duration-100 active:scale-[0.98] disabled:opacity-60"
        style={{
          width: 100,
          minHeight: 56,
          backgroundColor: "hsl(142 71% 37%)",
          alignSelf: "stretch",
        }}
        onMouseEnter={(e) => state === "idle" && (e.currentTarget.style.backgroundColor = "hsl(142 71% 30%)")}
        onMouseLeave={(e) => state === "idle" && (e.currentTarget.style.backgroundColor = "hsl(142 71% 37%)")}
      >
        {state === "confirming" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Check className="h-4 w-4" />
            Gotovo
          </>
        )}
      </button>

      {/* Rework button */}
      <div className="flex items-center justify-center shrink-0" style={{ width: 48 }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onRework}
              disabled={state !== "idle"}
              className="h-9 w-9 rounded-md border border-destructive flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Prijavi doradu</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});
