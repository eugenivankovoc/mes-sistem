import React from "react";
import { Check, Loader2, X } from "lucide-react";
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
  edge_top: string | null;
  edge_bottom: string | null;
  edge_left: string | null;
  edge_right: string | null;
  cnc_program: string | null;
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

const EDGE_LABELS = [
  { key: "edge_top" as const, label: "G" },
  { key: "edge_bottom" as const, label: "D" },
  { key: "edge_left" as const, label: "L" },
  { key: "edge_right" as const, label: "P" },
];

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

  const hasEdges = EDGE_LABELS.some((e) => part[e.key] != null);
  const dims = formatDimensions(part);
  const materialLine = [part.material, dims].filter(Boolean).join(" • ");

  return (
    <div
      className={cn(
        "flex items-stretch gap-0 border-b transition-colors hover:bg-background",
        state === "confirmed" && "animate-row-confirm"
      )}
      style={{ minHeight: 72, borderColor: "#F3F4F6" }}
    >
      {/* Checkbox – 44px */}
      <div className="flex items-center justify-center shrink-0" style={{ width: 44 }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(part.id)}
          className="h-6 w-6 rounded border-2 border-input accent-primary cursor-pointer"
          style={{ borderRadius: 4 }}
          disabled={state !== "idle"}
        />
      </div>

      {/* Part info – flex-1 */}
      <div className="flex-1 py-3 pr-2 min-w-0">
        <p className="text-[15px] font-bold text-foreground truncate">{part.name}</p>

        {materialLine && (
          <p className="text-[13px] text-muted-foreground mt-0.5 truncate">{materialLine}</p>
        )}

        {/* Edge chips */}
        {hasEdges && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {EDGE_LABELS.map(({ key, label }) =>
              part[key] ? (
                <span
                  key={key}
                  className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium"
                  style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                >
                  {label}: {part[key]}
                </span>
              ) : null
            )}
          </div>
        )}

        {/* CNC program chip */}
        {part.cnc_program && (
          <div className="mt-1">
            <span
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium"
              style={{ background: "#F5F3FF", color: "#6D28D9" }}
            >
              ⚙ {part.cnc_program}
            </span>
          </div>
        )}

        {/* Quantity + offline badge */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[13px] text-muted-foreground">{part.part_number}</span>
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

      {/* Confirm button – 100px */}
      <button
        onClick={() => onConfirm(part.id)}
        disabled={state !== "idle"}
        className="shrink-0 flex flex-col items-center justify-center gap-1 text-white font-semibold text-[13px] transition-all duration-100 active:scale-[0.97] disabled:opacity-70"
        style={{
          width: 100,
          backgroundColor: "#16A34A",
          borderRadius: 8,
        }}
        onMouseEnter={(e) =>
          state === "idle" && (e.currentTarget.style.backgroundColor = "#15803D")
        }
        onMouseLeave={(e) =>
          state === "idle" && (e.currentTarget.style.backgroundColor = "#16A34A")
        }
      >
        {state === "confirming" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Check className="h-5 w-5" />
            <span className="hidden sm:inline">Gotovo</span>
          </>
        )}
      </button>

      {/* Rework button – 44px */}
      <div className="flex items-center justify-center shrink-0" style={{ width: 44 }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onRework}
              disabled={state !== "idle"}
              className="h-10 w-10 rounded-lg border flex items-center justify-center text-destructive hover:bg-destructive/5 transition-colors active:scale-[0.97] disabled:opacity-60"
              style={{ borderColor: "#FCA5A5" }}
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Prijavi doradu</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});
