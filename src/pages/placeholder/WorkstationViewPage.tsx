import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function WorkstationViewPage() {
  const { id } = useParams();
  const [search, setSearch] = useState("");
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

  // Fetch workstation to verify it exists
  const { data: workstation, isLoading, error } = useQuery({
    queryKey: ["workstation", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstations")
        .select("id, name")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Error state
  if (!isLoading && (error || !workstation)) {
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
      {/* Filter/Search bar */}
      <div className="bg-card px-4 py-3 border-b border-border">
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

      {/* Content area – placeholder for parts list */}
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-muted-foreground">
          {search
            ? `Pretraga: "${search}" — prikaz dijelova uskoro`
            : "Prikaz dijelova uskoro"}
        </p>
      </div>
    </div>
  );
}
