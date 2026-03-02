import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVertical, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { WorkstationModal } from "./WorkstationModal";

interface Workstation {
  id: string;
  name: string;
  code: string;
  type: string | null;
  is_active: boolean;
  sort_order: number;
  description: string | null;
}

interface OperatorCount {
  workstation_id: string;
  count: number;
  names: string[];
}

const typeLabels: Record<string, string> = {
  cutting: "Rezanje",
  edgebanding: "Kantiranje",
  cnc: "CNC obrada",
  quality: "Kontrola kvalitete",
  packaging: "Skladištar / Pakiranje",
};

const typeColors: Record<string, string> = {
  cutting: "bg-orange-100 text-orange-700 border-orange-200",
  edgebanding: "bg-blue-100 text-blue-700 border-blue-200",
  cnc: "bg-purple-100 text-purple-700 border-purple-200",
  quality: "bg-green-100 text-green-700 border-green-200",
  packaging: "bg-amber-100 text-amber-700 border-amber-200",
};

function useWorkstationsFull() {
  return useQuery<Workstation[]>({
    queryKey: ["admin-workstations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstations")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

function useOperatorCounts() {
  return useQuery<OperatorCount[]>({
    queryKey: ["operator-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("workstation_id, full_name")
        .not("workstation_id", "is", null);
      if (error) throw error;
      const map = new Map<string, { count: number; names: string[] }>();
      (data || []).forEach((p: any) => {
        const entry = map.get(p.workstation_id) || { count: 0, names: [] };
        entry.count++;
        entry.names.push(p.full_name || "—");
        map.set(p.workstation_id, entry);
      });
      return Array.from(map.entries()).map(([workstation_id, v]) => ({
        workstation_id,
        ...v,
      }));
    },
  });
}

export function WorkstationsTab() {
  const queryClient = useQueryClient();
  const { data: workstations, isLoading } = useWorkstationsFull();
  const { data: operatorCounts } = useOperatorCounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWs, setEditingWs] = useState<Workstation | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("workstations")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workstations"] });
      toast.success("Status ažuriran");
    },
    onError: (e) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        await supabase
          .from("workstations")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workstations"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const getOperatorInfo = (wsId: string) => {
    const entry = operatorCounts?.find((o) => o.workstation_id === wsId);
    return entry || { count: 0, names: [] };
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx || !workstations) return;
    const items = [...workstations];
    const [moved] = items.splice(dragIdx, 1);
    items.splice(targetIdx, 0, moved);
    const updates = items.map((ws, i) => ({ id: ws.id, sort_order: i }));
    reorder.mutate(updates);
    setDragIdx(null);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Upravljanje radnim stanicama</h2>
        <Button
          onClick={() => {
            setEditingWs(null);
            setModalOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Dodaj stanicu
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--table-header-bg))] hover:bg-[hsl(var(--table-header-bg))]">
              <TableHead className="w-12" />
              <TableHead>Naziv</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Dodijeljeni operateri</TableHead>
              <TableHead>Aktivna</TableHead>
              <TableHead className="w-16">Radnje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !workstations?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nema radnih stanica
                </TableCell>
              </TableRow>
            ) : (
              workstations.map((ws, idx) => {
                const opInfo = getOperatorInfo(ws.id);
                return (
                  <TableRow
                    key={ws.id}
                    className={idx % 2 === 1 ? "bg-[hsl(var(--table-row-stripe))]" : ""}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(idx)}
                  >
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">{ws.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{ws.code}</span>
                    </TableCell>
                    <TableCell>
                      {ws.type ? (
                        <Badge
                          variant="outline"
                          className={typeColors[ws.type] || ""}
                        >
                          {typeLabels[ws.type] || ws.type}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm cursor-default">
                              {opInfo.count > 0 ? `${opInfo.count} operater${opInfo.count > 1 ? "a" : ""}` : "—"}
                            </span>
                          </TooltipTrigger>
                          {opInfo.count > 0 && (
                            <TooltipContent>
                              {opInfo.names.map((n, i) => (
                                <div key={i}>{n}</div>
                              ))}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={ws.is_active}
                        onCheckedChange={(checked) =>
                          toggleActive.mutate({ id: ws.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingWs(ws);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <WorkstationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        workstation={editingWs}
      />
    </div>
  );
}
