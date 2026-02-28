import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const QUEUE_KEY = "mes_offline_queue";

export interface OfflineEntry {
  part_id: string;
  workstation_id: string;
  operator_id: string;
  timestamp: number;
  feedback_type: "done";
}

export function useOfflineQueue(workstationId: string | undefined) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [queuedPartIds, setQueuedPartIds] = useState<Set<string>>(new Set());
  const syncingRef = useRef(false);

  // Load queued part IDs on mount
  useEffect(() => {
    const queue: OfflineEntry[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    setQueuedPartIds(new Set(queue.filter(e => e.workstation_id === workstationId).map(e => e.part_id)));
  }, [workstationId]);

  // Online/offline detection
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => {
      setIsOffline(false);
      syncQueue();
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  const addToQueue = useCallback((entry: OfflineEntry) => {
    const queue: OfflineEntry[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    queue.push(entry);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    setQueuedPartIds(prev => new Set([...prev, entry.part_id]));
  }, []);

  const syncQueue = useCallback(async () => {
    if (syncingRef.current) return 0;
    syncingRef.current = true;

    const queue: OfflineEntry[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    if (!queue.length) {
      syncingRef.current = false;
      return 0;
    }

    let synced = 0;
    const remaining: OfflineEntry[] = [];

    for (const entry of queue) {
      const { error } = await supabase.from("part_feedback").insert({
        part_id: entry.part_id,
        workstation_id: entry.workstation_id,
        operator_id: entry.operator_id,
        feedback_type: entry.feedback_type,
      });

      if (error) {
        // Keep in queue if not a duplicate constraint error
        if (!error.message?.includes("duplicate") && !error.message?.includes("unique")) {
          remaining.push(entry);
        } else {
          synced++; // Already confirmed, count as synced
        }
      } else {
        synced++;
      }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    setQueuedPartIds(new Set(remaining.map(e => e.part_id)));

    if (synced > 0) {
      setSyncMessage(`✓ ${synced} potvrda synkronizirano`);
      setTimeout(() => setSyncMessage(null), 4000);
    }

    syncingRef.current = false;
    return synced;
  }, []);

  return { isOffline, syncMessage, queuedPartIds, addToQueue, syncQueue };
}
