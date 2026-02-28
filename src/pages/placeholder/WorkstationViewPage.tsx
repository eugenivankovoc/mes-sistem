import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, X, AlertTriangle, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { BulkActionBar } from "@/components/workstation/BulkActionBar";
import { ReworkModal } from "@/components/workstation/ReworkModal";
import { QrScannerModal, QrScanResult } from "@/components/workstation/QrScannerModal";
import { PartRowItem } from "@/components/workstation/PartRowItem";
import { EmptyState } from "@/components/workstation/EmptyState";
import { OfflineBanner } from "@/components/workstation/OfflineBanner";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

// ── Types ──────────────────────────────────────────────
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

type RowState = "idle" | "confirming" | "confirmed" | "removing";

// ── Component ──────────────────────────────────────────
export default function WorkstationViewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [reworkPart, setReworkPart] = useState<PartRow | null>(null);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [realtimeBanner, setRealtimeBanner] = useState<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const { isOffline, syncMessage, queuedPartIds, addToQueue, syncQueue } = useOfflineQueue(id);

  // ── Viewport zoom lock ──
  useEffect(() => {
    const el = document.querySelector('meta[name="viewport"]');
    const original = el?.getAttribute("content") ?? "";
    el?.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no");
    return () => { el?.setAttribute("content", original); };
  }, []);

  // ── Wake Lock ──
  useEffect(() => {
    let active = true;
    const request = async () => {
      try {
        if ("wakeLock" in navigator && active)
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      } catch { /* silent */ }
    };
    request();
    const onVis = () => { if (document.visibilityState === "visible") request(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { active = false; document.removeEventListener("visibilitychange", onVis); wakeLockRef.current?.release().catch(() => {}); };
  }, []);

  // ── Fetch workstation ──
  const { data: workstation, isLoading: wsLoading, error: wsError } = useQuery({
    queryKey: ["workstation", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("workstations").select("id, name, code").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // ── Fetch parts (60s when empty, 15s otherwise) ──
  const { data: parts = [], isLoading: partsLoading } = useQuery({
    queryKey: ["workstation-parts", id],
    enabled: !!id && !!workstation,
    refetchInterval: (query) => (query.state.data as PartRow[] | undefined)?.length === 0 ? 60_000 : 15_000,
    queryFn: async () => {
      const { data: rawParts, error: partsError } = await supabase
        .from("parts")
        .select(`id, part_number, name, material, length, width, thickness, quantity, status, article_id,
          articles!inner( id, order_id, orders!inner( id, order_number, status, priority, due_date ) )`)
        .eq("current_workstation_id", id!)
        .in("status", ["pending", "in_progress"]);

      if (partsError) throw partsError;
      if (!rawParts?.length) return [];

      const filtered = rawParts.filter((p: any) => {
        const os = p.articles?.orders?.status;
        return os === "released" || os === "in_production";
      });

      const partIds = filtered.map((p: any) => p.id);
      if (!partIds.length) return [];

      const { data: doneFeedback } = await supabase
        .from("part_feedback").select("part_id")
        .eq("workstation_id", id!).eq("feedback_type", "done")
        .in("part_id", partIds);

      const doneSet = new Set((doneFeedback ?? []).map((f) => f.part_id));

      return filtered.filter((p: any) => !doneSet.has(p.id)).map((p: any): PartRow => ({
        id: p.id, part_number: p.part_number, name: p.name, material: p.material,
        length: p.length, width: p.width, thickness: p.thickness, quantity: p.quantity,
        status: p.status, article_id: p.article_id, order_id: p.articles.orders.id,
        order_number: p.articles.orders.order_number, order_priority: p.articles.orders.priority,
        order_due_date: p.articles.orders.due_date,
      }));
    },
  });

  // ── Realtime: part_feedback inserts ──
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`ws-feedback-${id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "part_feedback",
        filter: `workstation_id=eq.${id}`,
      }, (payload: any) => {
        const feedbackPartId = payload.new?.part_id;
        const feedbackType = payload.new?.feedback_type;
        const operatorId = payload.new?.operator_id;
        if (feedbackType === "done" && operatorId !== user?.id && feedbackPartId) {
          // Another operator confirmed — animate out
          setRowStates((s) => ({ ...s, [feedbackPartId]: "confirmed" }));
          setTimeout(() => {
            setRowStates((s) => ({ ...s, [feedbackPartId]: "removing" }));
            setTimeout(() => {
              setRowStates((s) => { const n = { ...s }; delete n[feedbackPartId]; return n; });
              queryClient.invalidateQueries({ queryKey: ["workstation-parts", id] });
            }, 300);
          }, 500);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, user?.id, queryClient]);

  // ── Realtime: orders updates (new releases) ──
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`ws-orders-${id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
      }, (payload: any) => {
        const newStatus = payload.new?.status;
        const oldStatus = payload.old?.status;
        if (newStatus === "released" && oldStatus !== "released") {
          const orderNum = payload.new?.order_number || "?";
          setRealtimeBanner(`Novi nalog ${orderNum} dodan u vašu listu`);
          setTimeout(() => setRealtimeBanner(null), 5000);
          queryClient.invalidateQueries({ queryKey: ["workstation-parts", id] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  // ── Sync offline queue when coming online ──
  useEffect(() => {
    if (!isOffline && id) {
      syncQueue().then((count) => {
        if (count > 0) queryClient.invalidateQueries({ queryKey: ["workstation-parts", id] });
      });
    }
  }, [isOffline, id, syncQueue, queryClient]);

  // ── Group + sort + filter ──
  const orderGroups = useMemo((): OrderGroup[] => {
    const filtered = search.trim()
      ? parts.filter((p) =>
          p.order_number.toLowerCase().includes(search.toLowerCase()) ||
          p.name.toLowerCase().includes(search.toLowerCase()))
      : parts;

    const grouped: Record<string, OrderGroup> = {};
    for (const part of filtered) {
      if (!grouped[part.order_id]) {
        grouped[part.order_id] = { order_id: part.order_id, order_number: part.order_number, order_priority: part.order_priority, order_due_date: part.order_due_date, parts: [] };
      }
      grouped[part.order_id].parts.push(part);
    }

    const groups = Object.values(grouped).sort((a, b) => {
      if (b.order_priority !== a.order_priority) return b.order_priority - a.order_priority;
      return (a.order_due_date ?? "9999").localeCompare(b.order_due_date ?? "9999");
    });
    for (const g of groups) g.parts.sort((a, b) => a.part_number.localeCompare(b.part_number));
    return groups;
  }, [parts, search]);

  const allVisiblePartIds = useMemo(() => orderGroups.flatMap((g) => g.parts.map((p) => p.id)), [orderGroups]);

  // ── Confirm single part ──
  const confirmPart = useCallback(async (partId: string) => {
    if (!user || !id) return;

    // Offline: queue locally
    if (isOffline) {
      addToQueue({ part_id: partId, workstation_id: id, operator_id: user.id, timestamp: Date.now(), feedback_type: "done" });
      toast.success("✓ Potvrda spremljena lokalno", { duration: 2000 });
      return;
    }

    setRowStates((s) => ({ ...s, [partId]: "confirming" }));
    const { error } = await supabase.from("part_feedback").insert({
      part_id: partId, workstation_id: id, operator_id: user.id, feedback_type: "done" as const,
    });

    if (error) {
      setRowStates((s) => ({ ...s, [partId]: "idle" }));
      toast.warning("Dio je već potvrđen na ovoj stanici");
      return;
    }

    setRowStates((s) => ({ ...s, [partId]: "confirmed" }));
    queryClient.invalidateQueries({ queryKey: ["pending-parts", id] });
    setTimeout(() => {
      setRowStates((s) => ({ ...s, [partId]: "removing" }));
      setTimeout(() => {
        setRowStates((s) => { const n = { ...s }; delete n[partId]; return n; });
        queryClient.invalidateQueries({ queryKey: ["workstation-parts", id] });
      }, 300);
    }, 500);
    toast.success("✓ Dio potvrđen", { duration: 2000 });
  }, [user, id, isOffline, addToQueue, queryClient]);

  // ── Bulk confirm ──
  const [bulkPending, setBulkPending] = useState(false);

  const confirmMultiple = useCallback(async (partIds: string[]) => {
    if (!user || !id || !partIds.length) return;
    setBulkPending(true);

    if (isOffline) {
      partIds.forEach((pid) => addToQueue({ part_id: pid, workstation_id: id, operator_id: user.id, timestamp: Date.now(), feedback_type: "done" }));
      setBulkPending(false);
      setSelectedParts(new Set());
      toast.success(`${partIds.length} potvrda spremljeno lokalno`, { duration: 2000 });
      return;
    }

    setRowStates((s) => { const n = { ...s }; partIds.forEach((pid) => (n[pid] = "confirming")); return n; });

    const inserts = partIds.map((pid) => ({ part_id: pid, workstation_id: id, operator_id: user.id, feedback_type: "done" as const }));
    const { error } = await supabase.from("part_feedback").insert(inserts);
    setBulkPending(false);

    if (error) {
      setRowStates((s) => { const n = { ...s }; partIds.forEach((pid) => (n[pid] = "idle")); return n; });
      toast.error("Greška pri potvrdi dijelova");
      return;
    }

    setRowStates((s) => { const n = { ...s }; partIds.forEach((pid) => (n[pid] = "confirmed")); return n; });
    queryClient.invalidateQueries({ queryKey: ["pending-parts", id] });
    setTimeout(() => {
      setRowStates((s) => { const n = { ...s }; partIds.forEach((pid) => (n[pid] = "removing")); return n; });
      setTimeout(() => { setRowStates({}); setSelectedParts(new Set()); queryClient.invalidateQueries({ queryKey: ["workstation-parts", id] }); }, 300);
    }, 500);
    toast.success(`${partIds.length} dijelova potvrđeno`, { duration: 2000 });
  }, [user, id, isOffline, addToQueue, queryClient]);

  // ── Rework ──
  const [reworkPending, setReworkPending] = useState(false);

  const handleReworkSubmit = useCallback(async (reason: string) => {
    if (!user || !id || !reworkPart) return;
    setReworkPending(true);

    const { error } = await supabase.from("part_feedback").insert({
      part_id: reworkPart.id, workstation_id: id, operator_id: user.id,
      feedback_type: "rework" as const, rework_reason: reason,
    });

    if (error) { setReworkPending(false); toast.error("Greška pri prijavi dorade"); return; }

    try {
      const { data: roles } = await supabase.from("user_roles").select("user_id").in("role", ["administrator", "planner"]);
      if (roles?.length) {
        await supabase.from("notifications").insert(
          roles.map((r) => ({
            user_id: r.user_id, title: "Dorada prijavljena",
            message: `Dio "${reworkPart.name}" (nalog ${reworkPart.order_number}) zahtijeva doradu: ${reason.substring(0, 100)}`,
          }))
        );
      }
    } catch { /* non-critical */ }

    setReworkPending(false);
    toast.success("Dorada prijavljena. Planer je obaviješten.");
    setReworkPart(null);
    queryClient.invalidateQueries({ queryKey: ["workstation-parts", id] });
    queryClient.invalidateQueries({ queryKey: ["pending-parts", id] });
  }, [user, id, reworkPart, queryClient]);

  // ── QR scan handler ──
  const handleQrScan = useCallback((data: QrScanResult): "not_found" | "already_done" | void => {
    // Check if part exists in current list
    let found: PartRow | undefined;
    if (data.id) found = parts.find((p) => p.id === data.id);
    if (!found && data.pn) found = parts.find((p) => p.part_number === data.pn);

    if (found) {
      // Case 1: found in list — close scanner, auto-confirm
      setQrOpen(false);
      confirmPart(found.id);
      return;
    }

    // Check if already confirmed (not in list but was scanned)
    // We can't distinguish "not on this station" from "already confirmed" without an extra query
    // So we return "not_found" to keep scanner open with overlay
    return "not_found";
  }, [parts, confirmPart]);

  // ── Toggle checkbox ──
  const togglePart = useCallback((partId: string) => {
    setSelectedParts((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) next.delete(partId); else next.add(partId);
      return next;
    });
  }, []);

  // ── Error state ──
  if (!wsLoading && (wsError || !workstation)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-lg font-medium text-foreground">Radna stanica nije pronađena</p>
        <p className="text-sm text-muted-foreground">ID: {id}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Offline / sync banner */}
      <OfflineBanner isOffline={isOffline} syncMessage={syncMessage} />

      {/* New order released banner */}
      {realtimeBanner && (
        <div className="px-4 py-2 text-sm font-semibold text-white flex items-center justify-center" style={{ backgroundColor: "hsl(214 69% 39%)" }}>
          {realtimeBanner}
        </div>
      )}

      {/* Search bar */}
      <div className="bg-card px-4 py-3 border-b flex items-center gap-3 border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pretraži po imenu naloga..." className="pl-9 pr-9" />
          {search && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearch("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {allVisiblePartIds.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => setConfirmAllOpen(true)} className="shrink-0 text-xs">
            Potvrdi sve ({allVisiblePartIds.length})
          </Button>
        )}
      </div>

      {/* Parts list */}
      <div className="flex-1 overflow-y-auto">
        {partsLoading || wsLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : orderGroups.length === 0 ? (
          <EmptyState hasSearch={!!search.trim()} searchTerm={search} />
        ) : (
          orderGroups.map((group) => (
            <div key={group.order_id}>
              {/* Order group header */}
              <div className="flex items-center justify-between px-4 py-2 sticky top-0 z-10 bg-muted border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-foreground">{group.order_number}</span>
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
                <PartRowItem
                  key={part.id}
                  part={part}
                  state={rowStates[part.id] ?? "idle"}
                  isSelected={selectedParts.has(part.id)}
                  isOffline={isOffline}
                  isOfflineQueued={queuedPartIds.has(part.id)}
                  onToggle={togglePart}
                  onConfirm={confirmPart}
                  onRework={() => setReworkPart(part)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* QR Scanner button */}
      <div className="flex justify-center py-3" style={{ paddingBottom: selectedParts.size > 0 ? 80 : 12 }}>
        <button
          onClick={() => setQrOpen(true)}
          className="h-[52px] w-[200px] rounded-[26px] bg-primary text-primary-foreground font-bold text-sm shadow-lg hover:opacity-90 transition-opacity active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Camera className="h-5 w-5" />
          Skeniraj QR
        </button>
      </div>

      {/* Bulk action bar */}
      <BulkActionBar count={selectedParts.size} onConfirm={() => confirmMultiple([...selectedParts])} onClear={() => setSelectedParts(new Set())} isPending={bulkPending} />

      {/* QR Scanner modal */}
      <QrScannerModal open={qrOpen} onClose={() => setQrOpen(false)} onScan={handleQrScan} />

      {/* Rework modal */}
      <ReworkModal open={!!reworkPart} onOpenChange={(open) => !open && setReworkPart(null)} partName={reworkPart?.name ?? ""} orderNumber={reworkPart?.order_number ?? ""} onSubmit={handleReworkSubmit} isPending={reworkPending} />

      {/* Confirm all dialog */}
      <AlertDialog open={confirmAllOpen} onOpenChange={setConfirmAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potvrdi sve dijelove</AlertDialogTitle>
            <AlertDialogDescription>Potvrditi sve vidljive dijelove ({allVisiblePartIds.length})?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmMultiple(allVisiblePartIds)} style={{ backgroundColor: "hsl(142 71% 37%)" }} className="text-white hover:opacity-90">
              Potvrdi sve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
