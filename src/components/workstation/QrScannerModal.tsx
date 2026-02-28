import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (data: { id?: string; pn?: string; on?: string; raw: string }) => void;
}

export function QrScannerModal({ open, onClose, onScan }: QrScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

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
            // Parse QR data
            let parsed: any = { raw: decodedText };
            try {
              const json = JSON.parse(decodedText);
              if (json.id) parsed = { ...json, raw: decodedText };
            } catch {
              // Try as plain UUID
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              if (uuidRegex.test(decodedText.trim())) {
                parsed = { id: decodedText.trim(), raw: decodedText };
              }
            }

            scanner.stop().catch(() => {});
            scannerRef.current = null;
            onScan(parsed);
          },
          () => {} // ignore scan failures
        );
      } catch (err: any) {
        if (!stopped) {
          setError("Nije moguće pristupiti kameri. Provjerite dozvole.");
        }
      }
    };

    // Small delay to ensure DOM element exists
    const timer = setTimeout(startScanner, 100);

    return () => {
      stopped = true;
      clearTimeout(timer);
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
      setError(null);
    };
  }, [open, onScan]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Close button */}
      <button
        onClick={() => {
          scannerRef.current?.stop().catch(() => {});
          scannerRef.current = null;
          onClose();
        }}
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Scanner area */}
      <div className="relative w-full max-w-sm aspect-square" ref={containerRef}>
        <div id="qr-reader" className="w-full h-full" />
        {/* Corner overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top-left */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg" />
          {/* Top-right */}
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg" />
          {/* Bottom-left */}
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg" />
          {/* Bottom-right */}
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg" />
        </div>
      </div>

      {/* Instruction text */}
      <p className="text-white text-sm mt-6 text-center px-4">
        {error || "Usmjerite kameru na QR kod dijela"}
      </p>
    </div>
  );
}
