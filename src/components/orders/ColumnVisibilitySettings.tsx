import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

interface Props {
  columns: ColumnConfig[];
  onChange: (key: string, visible: boolean) => void;
}

export function ColumnVisibilitySettings({ columns, onChange }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" title="Postavke stupaca">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground mb-2">Vidljivi stupci</p>
          {columns.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted cursor-pointer text-sm"
            >
              <Checkbox
                checked={col.visible}
                onCheckedChange={(v) => onChange(col.key, !!v)}
              />
              {col.label}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
