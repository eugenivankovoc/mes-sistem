import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export interface QrScanResult {
  id?: string;
  pn?: string;
  on?: string;
  raw: string;
}

type ScanOutcome = "not_found" | "already_done" | null;

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (data: QrScanResult) => ScanOutcome | void;
}

export function QrScannerModal({ open, onClose, onScan }: QrScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<{ message: string; color: "orange" | "gray" } | null>(null);

  const handleClose = useCallback(() => {
    scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const elementId = "qr-reader";
    let stopped = false;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            let parsed: QrScanResult = { raw: decodedText };
            try {
              const json = JSON.parse(decodedText);
              if (json.id) parsed = { ...json, raw: decodedText };
            } catch {
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              if (uuidRegex.test(decodedText.trim())) {
                parsed = { id: decodedText.trim(), raw: decodedText };
              }
            }

            const outcome = onScan(parsed);

            if (outcome === "not_found") {
              // Keep scanner open, show overlay
              setOverlay({
                message: `Dio ${parsed.pn || parsed.id?.substring(0, 8) || "?"} nije za ovu stanicu`,
                color: "orange",
              });
              setTimeout(() => setOverlay(null), 2000);
              // Don't stop scanner — let them scan again
              return;
            }

            if (outcome === "already_done") {
              scanner.stop().catch(() => {});
              scannerRef.current = null;
              // Parent will close via onClose or show toast
              return;
            }

            // Case 1 — found & confirmed: parent closes scanner
            scanner.stop().catch(() => {});
            scannerRef.current = null;
          },
          () => {}
        );
      } catch {
        if (!stopped) {
          setError("Nije moguće pristupiti kameri. Provjerite dozvole.");
        }
      }
    };

    const timer = setTimeout(startScanner, 100);

    return () => {
      stopped = true;
      clearTimeout(timer);
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
      setError(null);
      setOverlay(null);
    };
  }, [open, onScan]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Overlay message */}
      {overlay && (
        <div
          className="absolute top-20 left-4 right-4 z-20 rounded-lg px-4 py-3 text-center text-sm font-semibold text-white animate-slide-in"
          style={{
            backgroundColor: overlay.color === "orange" ? "hsl(33 100% 50% / 0.9)" : "hsl(0 0% 40% / 0.9)",
          }}
        >
          {overlay.message}
        </div>
      )}

      {/* Scanner area */}
      <div className="relative w-full max-w-sm aspect-square">
        <div id="qr-reader" className="w-full h-full" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg" />
        </div>
      </div>

      <p className="text-white text-sm mt-6 text-center px-4">
        {error || "Usmjerite kameru na QR kod dijela"}
      </p>
    </div>
  );
}
