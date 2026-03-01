import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  batchId: string;
  batchName: string | null;
}

// Generate a consistent color from a batch ID hash
function batchColor(id: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue}, 55%, 92%)`,
    text: `hsl(${hue}, 60%, 35%)`,
  };
}

export function BatchBadge({ batchId, batchName }: Props) {
  const colors = batchColor(batchId);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn("text-[10px] border-0 cursor-default px-1.5 py-0")}
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          B
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{batchName || "Batch"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
