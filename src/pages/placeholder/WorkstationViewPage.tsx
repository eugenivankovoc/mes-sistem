import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, X, AlertTriangle, Camera, CheckCheck, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BulkActionBar } from "@/components/workstation/BulkActionBar";
import { ReworkModal } from "@/components/workstation/ReworkModal";
import { QrScannerModal, QrScanResult } from "@/components/workstation/QrScannerModal";
import { PartRowItem } from "@/components/workstation/PartRowItem";
import { EmptyState } from "@/components/workstation/EmptyState";
import { OfflineBanner } from "@/components/workstation/OfflineBanner";
import { ConfirmAllDialog } from "@/components/workstation/ConfirmAllDialog";
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
  order_name: string | null;
  order_priority: number;
  order_due_date: string | null;
  edge_top: string | null;
  edge_bottom: string | null;
  edge_left: string | null;
  edge_right: string | null;
  cnc_program: string | null;
}

interface OrderGroup {
  order_id: string;
  order_number: string;
  order_name: string | null;
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
  const [confirmAllProcessing, setConfirmAllProcessing] = useState(false);
  const [confirmAllProgress, setConfirmAllProgress] = useState(0);
  const [confirmAllText, setConfirmAllText] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [realtimeBanner, setRealtimeBanner] = useState<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { isOffline, syncMessage, queuedPartIds, addToQueue, syncQueue } = useOfflineQueue(id);

  // ── Debounced search ──
  useEffect(() => {
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [search]);

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
      const { data, error } = await supabase.from("workstations").select("id, name, code, type").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // ── Map workstation type → requires_* column ──
  const requiresColumnMap: Record<string, string> = {
    cutting: "requires_cutting",
    edgebanding: "requires_edgebanding",
    cnc: "requires_cnc",
    drilling: "requires_drilling",
    sorting: "requires_sorting",
    assembly: "requires_assembly",
    quality: "requires_quality_check",
    packaging: "requires_packaging",
  };

  const wsType = workstation?.type ?? null;
  const requiresColumn = wsType ? requiresColumnMap[wsType] ?? null : null;

  // ── Fetch parts (60s when empty, 15s otherwise) ──
  const { data: parts = [], isLoading: partsLoading, error: partsError } = useQuery({
    queryKey: ["workstation-parts", id, requiresColumn],
    enabled: !!id && !!workstation && !!requiresColumn,
    refetchInterval: (query) => (query.state.data as PartRow[] | undefined)?.length === 0 ? 60_000 : 15_000,
    queryFn: async () => {
      // 1. Get all parts from released/in_production orders where requires_{type} = true
      const { data: rawParts, error: partsErr } = await supabase
        .from("parts")
        .select(`id, part_number, name, material, length, width, thickness, quantity, status, article_id,
          edge_top, edge_bottom, edge_left, edge_right, cnc_program, is_rework,
          requires_cutting, requires_edgebanding, requires_cnc, requires_drilling,
          requires_sorting, requires_assembly, requires_quality_check, requires_packaging,
          articles!inner( id, order_id, orders!inner( id, order_number, order_name, status, priority, due_date ) )`)
        .eq("is_rework", false);

      if (partsErr) throw partsErr;
      if (!rawParts?.length) return [];

      // 2. Filter by requires_* column and released/in_production orders
      const filtered = rawParts.filter((p: any) => {
        if (!p[requiresColumn!]) return false;
        const os = p.articles?.orders?.status;
        return os === "released" || os === "in_production";
      });

      const partIds = filtered.map((p: any) => p.id);
      if (!partIds.length) return [];

      // 3. Exclude parts that already have feedback for this operation_type
      const { data: doneFeedback } = await supabase
        .from("part_feedback").select("part_id")
        .eq("operation_type", wsType!)
        .in("part_id", partIds);

      const doneSet = new Set((doneFeedback ?? []).map((f) => f.part_id));

      return filtered.filter((p: any) => !doneSet.has(p.id)).map((p: any): PartRow => ({
        id: p.id, part_number: p.part_number, name: p.name, material: p.material,
        length: p.length, width: p.width, thickness: p.thickness, quantity: p.quantity,
        status: p.status, article_id: p.article_id, order_id: p.articles.orders.id,
        order_number: p.articles.orders.order_number,
        order_name: p.articles.orders.order_name,
        order_priority: p.articles.orders.priority,
        order_due_date: p.articles.orders.due_date,
        edge_top: p.edge_top, edge_bottom: p.edge_bottom,
        edge_left: p.edge_left, edge_right: p.edge_right,
        cnc_program: p.cnc_program,
      }));
    },
  });

  // ── Debug counts ──
  const debugOrderCount = useMemo(() => new Set(parts.map(p => p.order_id)).size, [parts]);
  const debugPartsCount = parts.length;

  // ── Realtime: part_feedback inserts ──
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`ws-feedback-${id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "part_feedback",
        filter: `workstation_id=eq.${id}`,
      }, (payload: any) => {
        const feedbackPartId = payload.new?.part_id;
        const feedbackType = payload.new?.feedback_type;
        const operatorId = payload.new?.operator_id;
        if (feedbackType === "done" && operatorId !== user?.id && feedbackPartId) {
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

  // ── Realtime: orders updates ──
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`ws-orders-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload: any) => {
        const newStatus = payload.new?.status;
        const oldStatus = payload.old?.status;
        if (newStatus === "released" && oldStatus !== "released") {
          const orderName = payload.new?.order_name || payload.new?.order_number || "?";
          setRealtimeBanner(`Novi nalog ${orderName} dodan u vašu listu`);
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
    const filtered = debouncedSearch.trim()
      ? parts.filter((p) =>
          (p.order_name || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.order_number.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
      : parts;

    const grouped: Record<string, OrderGroup> = {};
    for (const part of filtered) {
      if (!grouped[part.order_id]) {
        grouped[part.order_id] = {
          order_id: part.order_id, order_number: part.order_number,
          order_name: part.order_name, order_priority: part.order_priority,
          order_due_date: part.order_due_date, parts: [],
        };
      }
      grouped[part.order_id].parts.push(part);
    }

    const groups = Object.values(grouped).sort((a, b) => {
      if (b.order_priority !== a.order_priority) return b.order_priority - a.order_priority;
      return (a.order_due_date ?? "9999").localeCompare(b.order_due_date ?? "9999");
    });
    for (const g of groups) g.parts.sort((a, b) => a.part_number.localeCompare(b.part_number));
    return groups;
  }, [parts, debouncedSearch]);

  const allVisiblePartIds = useMemo(() => orderGroups.flatMap((g) => g.parts.map((p) => p.id)), [orderGroups]);

  // ── Confirm single part ──
  const confirmPart = useCallback(async (partId: string, method: string = "click") => {
    if (!user || !id) return;

    if (isOffline) {
      addToQueue({ part_id: partId, workstation_id: id, operator_id: user.id, timestamp: Date.now(), feedback_type: "done" });
      toast.success("✓ Potvrda spremljena lokalno", { duration: 2000 });
      return;
    }

    setRowStates((s) => ({ ...s, [partId]: "confirming" }));
    const { error } = await supabase.from("part_feedback").insert({
      part_id: partId, workstation_id: id, operator_id: user.id,
      feedback_type: "done" as const,
      operation_type: workstation?.type ?? null,
      feedback_method: method,
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
  }, [user, id, isOffline, addToQueue, queryClient, workstation?.type]);

  // ── Confirm all with progress ──
  const confirmAllSequential = useCallback(async () => {
    if (!user || !id || !allVisiblePartIds.length) return;
    setConfirmAllProcessing(true);
    setConfirmAllProgress(0);
    setConfirmAllText(`Potvrđivanje ${allVisiblePartIds.length} dijelova...`);

    let errors = 0;
    let errorName = "";

    for (let i = 0; i < allVisiblePartIds.length; i++) {
      const pid = allVisiblePartIds[i];
      setRowStates((s) => ({ ...s, [pid]: "confirming" }));

      const { error } = await supabase.from("part_feedback").insert({
        part_id: pid, workstation_id: id, operator_id: user.id,
        feedback_type: "done" as const,
        operation_type: workstation?.type ?? null,
        feedback_method: "bulk",
      });

      if (error) {
        errors++;
        const p = parts.find((x) => x.id === pid);
        errorName = p?.name ?? pid;
        setRowStates((s) => ({ ...s, [pid]: "idle" }));
      } else {
        setRowStates((s) => ({ ...s, [pid]: "confirmed" }));
        setTimeout(() => {
          setRowStates((s) => ({ ...s, [pid]: "removing" }));
          setTimeout(() => {
            setRowStates((s) => { const n = { ...s }; delete n[pid]; return n; });
          }, 300);
        }, 200);
      }

      setConfirmAllProgress(Math.round(((i + 1) / allVisiblePartIds.length) * 100));
    }

    setConfirmAllProcessing(false);
    setConfirmAllOpen(false);
    setConfirmAllProgress(0);
    queryClient.invalidateQueries({ queryKey: ["workstation-parts", id] });
    queryClient.invalidateQueries({ queryKey: ["pending-parts", id] });

    if (errors > 0) {
      toast.warning(`Greška pri potvrdi dijela ${errorName}. Ostatak je potvrđen.`, { duration: 4000 });
    } else {
      toast.success(`Svih ${allVisiblePartIds.length} dijelova potvrđeno!`, { duration: 4000 });
    }
  }, [user, id, allVisiblePartIds, parts, queryClient, workstation?.type]);

  // ── Bulk confirm selected ──
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

    const inserts = partIds.map((pid) => ({
      part_id: pid, workstation_id: id, operator_id: user.id,
      feedback_type: "done" as const,
      operation_type: workstation?.type ?? null,
      feedback_method: "bulk",
    }));
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
  }, [user, id, isOffline, addToQueue, queryClient, workstation?.type]);

  // ── Rework ──
  const [reworkPending, setReworkPending] = useState(false);

  const handleReworkSubmit = useCallback(async (reason: string, photoUrl: string | null) => {
    if (!user || !id || !reworkPart) return;
    setReworkPending(true);

    const { error } = await supabase.from("part_feedback").insert({
      part_id: reworkPart.id, workstation_id: id, operator_id: user.id,
      feedback_type: "rework" as const, rework_reason: reason,
      photo_url: photoUrl,
      operation_type: workstation?.type ?? null,
      feedback_method: "click",
    });

    if (error) { setReworkPending(false); toast.error("Greška pri prijavi dorade"); return; }

    // Update part is_rework
    await supabase.from("parts").update({ is_rework: true } as any).eq("id", reworkPart.id).single();

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
    toast.success("Dorada prijavljena. Planer je obaviješten.", { duration: 4000 });
    setReworkPart(null);
    queryClient.invalidateQueries({ queryKey: ["workstation-parts", id] });
    queryClient.invalidateQueries({ queryKey: ["pending-parts", id] });
  }, [user, id, reworkPart, queryClient, workstation?.type]);

  // ── QR scan handler ──
  const handleQrScan = useCallback((data: QrScanResult): "not_found" | "already_done" | void => {
    let found: PartRow | undefined;
    if (data.id) found = parts.find((p) => p.id === data.id);
    if (!found && data.pn) found = parts.find((p) => p.part_number === data.pn);

    if (found) {
      setQrOpen(false);
      confirmPart(found.id, "scan");
      return;
    }
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

  const hasBulkBar = selectedParts.size > 0;

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
      <div className="bg-card flex items-center gap-3" style={{ height: 48, padding: "0 16px", borderBottom: "1px solid #F3F4F6" }}>
        <Search className="h-[18px] w-[18px] text-muted-foreground shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pretraži po imenu naloga..."
          className="flex-1 bg-transparent border-none outline-none text-[15px] text-foreground placeholder:text-muted-foreground"
        />
        {search && (
          <button onClick={() => setSearch("")} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* DEBUG INFO - remove after testing */}
      {workstation && (
        <div className="px-4 py-1.5 text-xs font-mono text-muted-foreground" style={{ background: "#FFFDE7", borderBottom: "1px solid #FFF9C4" }}>
          Workstation type: {wsType ?? "NULL"} | Orders found: {debugOrderCount} | Parts found: {debugPartsCount}
        </div>
      )}

      {/* Null type error */}
      {workstation && !requiresColumn && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-base font-medium text-foreground">
            Greška: Radnoj stanici nije dodijeljen tip. Kontaktirajte administratora.
          </p>
        </div>
      )}

      {/* Parts list */}
      {requiresColumn && (
      <div className="flex-1 overflow-y-auto" style={{ background: "#F9FAFB" }}>
        {partsLoading || wsLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 p-12 gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Učitavam radnu stanicu...</p>
          </div>
        ) : orderGroups.length === 0 ? (
          <EmptyState hasSearch={!!debouncedSearch.trim()} searchTerm={search} workstationName={workstation?.name ?? ""} />
        ) : (
          <>
            {/* Potvrdi sve button */}
            {allVisiblePartIds.length > 0 && (
              <div className="flex justify-end px-4 py-2">
                <button
                  onClick={() => setConfirmAllOpen(true)}
                  className="h-9 px-3.5 rounded-md border flex items-center gap-1.5 text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <CheckCheck className="h-4 w-4" />
                  Potvrdi sve
                </button>
              </div>
            )}

            {orderGroups.map((group) => (
              <div key={group.order_id}>
                {/* Order group header */}
                <div
                  className="flex items-center justify-between px-4 sticky top-0 z-10"
                  style={{ height: 36, background: "#F0F4F8" }}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[13px] font-semibold text-foreground">
                      {group.order_name || group.order_number}
                    </span>
                    <span className="text-[12px] text-muted-foreground">{group.order_number}</span>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-muted text-muted-foreground"
                  >
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
                    onConfirm={(pid) => confirmPart(pid, "click")}
                    onRework={() => setReworkPart(part)}
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>
      )}

      {/* QR Scanner FAB */}
      {orderGroups.length > 0 && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-300"
          style={{ bottom: hasBulkBar ? 88 : 24 }}
        >
          <button
            onClick={() => setQrOpen(true)}
            className="h-[52px] px-7 rounded-[28px] text-white font-semibold text-[15px] flex items-center gap-2 transition-all active:scale-[0.98]"
            style={{
              backgroundColor: "hsl(214 69% 39%)",
              boxShadow: "0 4px 12px rgba(30,95,168,0.4)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "hsl(214 72% 32%)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "hsl(214 69% 39%)")}
          >
            <Camera className="h-5 w-5" />
            Skeniraj QR
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      <BulkActionBar count={selectedParts.size} onConfirm={() => confirmMultiple([...selectedParts])} onClear={() => setSelectedParts(new Set())} isPending={bulkPending} />

      {/* QR Scanner modal */}
      <QrScannerModal open={qrOpen} onClose={() => setQrOpen(false)} onScan={handleQrScan} />

      {/* Rework modal */}
      <ReworkModal
        open={!!reworkPart}
        onOpenChange={(open) => !open && setReworkPart(null)}
        partName={reworkPart?.name ?? ""}
        partId={reworkPart?.id ?? ""}
        orderId={reworkPart?.order_id ?? ""}
        orderNumber={reworkPart?.order_number ?? ""}
        onSubmit={handleReworkSubmit}
        isPending={reworkPending}
      />

      {/* Confirm all dialog */}
      <ConfirmAllDialog
        open={confirmAllOpen}
        onOpenChange={setConfirmAllOpen}
        count={allVisiblePartIds.length}
        workstationName={workstation?.name ?? ""}
        onConfirm={confirmAllSequential}
        isProcessing={confirmAllProcessing}
        progress={confirmAllProgress}
        progressText={confirmAllText}
      />
    </div>
  );
}
