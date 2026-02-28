import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, X, AlertTriangle, Check, RotateCcw, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PartRow {
  id: string;
  part_number: string;
  name: string;
  material: string | null;
  length: number | null;
  width: number | null;
  thickness: number | null;
  quantity: number;
  status: string;
  article_id: string;
  order_id: string;
  order_number: string;
  order_priority: number;
  order_due_date: string | null;
}

interface OrderGroup {
  order_id: string;
  order_number: string;
  order_priority: number;
  order_due_date: string | null;
  parts: PartRow[];
}

export default function WorkstationViewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Prevent zoom on tablets
  useEffect(() => {
    const existing = document.querySelector('meta[name="viewport"]');
    const original = existing?.getAttribute("content") ?? "";
    if (existing) {
      existing.setAttribute(
        "content",
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
      );
    }
    return () => {
      if (existing) existing.setAttribute("content", original);
    };
  }, []);

  // Wake Lock API
  useEffect(() => {
    let active = true;
    const requestLock = async () => {
      try {
        if ("wakeLock" in navigator && active) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        }
      } catch {
        // silently fail
      }
    };
    requestLock();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") requestLock();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  // Fetch workstation
  const { data: workstation, isLoading: wsLoading, error: wsError } = useQuery({
    queryKey: ["workstation", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstations")
        .select("id, name, code")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch parts for this workstation (pending/in_progress, from released/in_production orders)
  // Excludes parts that already have a 'done' feedback at this workstation
  const { data: parts = [], isLoading: partsLoading } = useQuery({
    queryKey: ["workstation-parts", id],
    enabled: !!id && !!workstation,
    refetchInterval: 15_000,
    queryFn: async () => {
      // 1. Fetch parts at this workstation with pending/in_progress status
      const { data: rawParts, error: partsError } = await supabase
        .from("parts")
        .select(`
          id, part_number, name, material, length, width, thickness, quantity, status, article_id,
          articles!inner(
            id, order_id,
            orders!inner(
              id, order_number, status, priority, due_date
            )
          )
        `)
        .eq("current_workstation_id", id!)
        .in("status", ["pending", "in_progress"]);

      if (partsError) throw partsError;
      if (!rawParts?.length) return [];

      // Filter only released/in_production orders
      const filteredParts = rawParts.filter((p: any) => {
        const orderStatus = p.articles?.orders?.status;
        return orderStatus === "released" || orderStatus === "in_production";
      });

      // 2. Get done feedback for these parts at this workstation
      const partIds = filteredParts.map((p: any) => p.id);
      const { data: doneFeedback } = await supabase
        .from("part_feedback")
        .select("part_id")
        .eq("workstation_id", id!)
        .eq("feedback_type", "done")
        .in("part_id", partIds);

      const donePartIds = new Set((doneFeedback ?? []).map((f) => f.part_id));

      // 3. Map and exclude done parts
      return filteredParts
        .filter((p: any) => !donePartIds.has(p.id))
        .map((p: any): PartRow => ({
          id: p.id,
          part_number: p.part_number,
          name: p.name,
          material: p.material,
          length: p.length,
          width: p.width,
          thickness: p.thickness,
          quantity: p.quantity,
          status: p.status,
          article_id: p.article_id,
          order_id: p.articles.orders.id,
          order_number: p.articles.orders.order_number,
          order_priority: p.articles.orders.priority,
          order_due_date: p.articles.orders.due_date,
        }));
    },
  });

  // Group parts by order, sorted by priority DESC then due_date ASC
  const orderGroups = useMemo((): OrderGroup[] => {
    const grouped: Record<string, OrderGroup> = {};
    const filtered = search.trim()
      ? parts.filter((p) =>
          p.order_number.toLowerCase().includes(search.toLowerCase()) ||
          p.name.toLowerCase().includes(search.toLowerCase())
        )
      : parts;

    for (const part of filtered) {
      if (!grouped[part.order_id]) {
        grouped[part.order_id] = {
          order_id: part.order_id,
          order_number: part.order_number,
          order_priority: part.order_priority,
          order_due_date: part.order_due_date,
          parts: [],
        };
      }
      grouped[part.order_id].parts.push(part);
    }

    // Sort groups
    const groups = Object.values(grouped).sort((a, b) => {
      if (b.order_priority !== a.order_priority) return b.order_priority - a.order_priority;
      const da = a.order_due_date ?? "9999";
      const db = b.order_due_date ?? "9999";
      return da.localeCompare(db);
    });

    // Sort parts within each group
    for (const g of groups) {
      g.parts.sort((a, b) => a.part_number.localeCompare(b.part_number));
    }

    return groups;
  }, [parts, search]);

  // Mark part as done
  const doneMutation = useMutation({
    mutationFn: async (partId: string) => {
      if (!user || !id) throw new Error("Missing context");
      const { error } = await supabase.from("part_feedback").insert({
        part_id: partId,
        workstation_id: id,
        operator_id: user.id,
        feedback_type: "done" as const,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workstation-parts", id] });
      queryClient.invalidateQueries({ queryKey: ["pending-parts", id] });
      toast.success("Dio označen kao gotov");
    },
    onError: () => {
      toast.error("Greška pri označavanju dijela");
    },
  });

  // Mark part as rework
  const reworkMutation = useMutation({
    mutationFn: async (partId: string) => {
      if (!user || !id) throw new Error("Missing context");
      const { error } = await supabase.from("part_feedback").insert({
        part_id: partId,
        workstation_id: id,
        operator_id: user.id,
        feedback_type: "rework" as const,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workstation-parts", id] });
      queryClient.invalidateQueries({ queryKey: ["pending-parts", id] });
      toast.success("Dorada prijavljena");
    },
    onError: () => {
      toast.error("Greška pri prijavi dorade");
    },
  });

  // Toggle part selection
  const togglePart = (partId: string) => {
    setSelectedParts((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) next.delete(partId);
      else next.add(partId);
      return next;
    });
  };

  // Format dimensions
  const formatDimensions = (p: PartRow): string => {
    const dims: string[] = [];
    if (p.length != null) dims.push(`${p.length}mm`);
    if (p.width != null) dims.push(`${p.width}mm`);
    if (p.thickness != null) dims.push(`${p.thickness}mm`);
    return dims.join(" × ");
  };

  // Error state
  if (!wsLoading && (wsError || !workstation)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-lg font-medium text-foreground">Radna stanica nije pronađena</p>
        <p className="text-sm text-muted-foreground">ID: {id}</p>
      </div>
    );
  }

  const totalParts = parts.length;

  return (
    <div className="flex flex-col flex-1">
      {/* Filter/Search bar */}
      <div className="bg-card px-4 py-3 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraži po imenu naloga..."
            className="pl-9 pr-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Parts list */}
      <div className="flex-1 overflow-y-auto">
        {partsLoading || wsLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : orderGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <Package className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              {search ? `Nema rezultata za "${search}"` : "Nema dijelova za obradu"}
            </p>
          </div>
        ) : (
          orderGroups.map((group) => (
            <div key={group.order_id}>
              {/* Order group header */}
              <div
                className="flex items-center justify-between px-4 py-2 sticky top-0 z-10"
                style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-foreground">
                    {group.order_number}
                  </span>
                  {group.order_due_date && (
                    <span className="text-xs text-muted-foreground">
                      Rok: {new Date(group.order_due_date).toLocaleDateString("hr-HR")}
                    </span>
                  )}
                  {group.order_priority > 0 && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-destructive/10 text-destructive">
                      Prioritet {group.order_priority}
                    </span>
                  )}
                </div>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                  {group.parts.length} dijelova
                </span>
              </div>

              {/* Part rows */}
              {group.parts.map((part) => (
                <div
                  key={part.id}
                  className="flex items-center gap-0 border-b"
                  style={{ minHeight: 72, borderColor: "#F3F4F6" }}
                >
                  {/* Col 1: Checkbox */}
                  <div className="flex items-center justify-center shrink-0" style={{ width: 48 }}>
                    <input
                      type="checkbox"
                      checked={selectedParts.has(part.id)}
                      onChange={() => togglePart(part.id)}
                      className="h-6 w-6 rounded border-2 border-input accent-primary cursor-pointer"
                    />
                  </div>

                  {/* Col 2: Part info */}
                  <div className="flex-1 py-3 pr-2 min-w-0">
                    <p className="text-[15px] font-bold text-foreground truncate">
                      {part.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[13px] text-muted-foreground">{part.part_number}</span>
                      {part.material && (
                        <span className="text-[13px] text-muted-foreground">• {part.material}</span>
                      )}
                      {formatDimensions(part) && (
                        <span className="text-[13px] text-muted-foreground">
                          • {formatDimensions(part)}
                        </span>
                      )}
                      {part.quantity > 1 && (
                        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary">
                          ×{part.quantity}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Col 3: Done button */}
                  <button
                    onClick={() => doneMutation.mutate(part.id)}
                    disabled={doneMutation.isPending}
                    className={cn(
                      "shrink-0 flex items-center justify-center gap-1.5 text-white font-bold text-sm",
                      "transition-all duration-100 active:scale-[0.98]",
                      "disabled:opacity-60"
                    )}
                    style={{
                      width: 100,
                      minHeight: 56,
                      backgroundColor: "#16A34A",
                      alignSelf: "stretch",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803D")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16A34A")}
                  >
                    <Check className="h-4 w-4" />
                    Gotovo
                  </button>

                  {/* Col 4: Rework button */}
                  <div className="flex items-center justify-center shrink-0" style={{ width: 48 }}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => reworkMutation.mutate(part.id)}
                          disabled={reworkMutation.isPending}
                          className={cn(
                            "h-9 w-9 rounded-md border border-destructive flex items-center justify-center",
                            "text-destructive hover:bg-destructive/10 transition-colors",
                            "active:scale-[0.98] disabled:opacity-60"
                          )}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Prijavi doradu</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
