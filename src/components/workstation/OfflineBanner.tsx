import { AlertTriangle, CheckCircle } from "lucide-react";

interface OfflineBannerProps {
  isOffline: boolean;
  syncMessage: string | null;
}

export function OfflineBanner({ isOffline, syncMessage }: OfflineBannerProps) {
  if (syncMessage) {
    return (
      <div className="px-4 py-2 text-sm font-semibold text-white flex items-center gap-2 justify-center" style={{ backgroundColor: "hsl(142 71% 45%)" }}>
        <CheckCircle className="h-4 w-4" />
        {syncMessage}
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div className="px-4 py-2 text-sm font-semibold text-white flex items-center gap-2 justify-center" style={{ backgroundColor: "hsl(33 100% 50%)" }}>
      <AlertTriangle className="h-4 w-4" />
      ⚠ Offline mod – potvrde se čuvaju lokalno
    </div>
  );
}
