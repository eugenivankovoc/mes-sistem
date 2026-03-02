import { useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface EmptyStateProps {
  hasSearch: boolean;
  searchTerm: string;
  workstationName: string;
}

export function EmptyState({ hasSearch, searchTerm, workstationName }: EmptyStateProps) {
  const confettiFired = useRef(false);

  useEffect(() => {
    if (hasSearch || confettiFired.current) return;
    confettiFired.current = true;

    const end = Date.now() + 3000;
    const fire = () => {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#16A34A", "#22C55E", "#4ADE80", "#1E5FA8"],
      });
      if (Date.now() < end) requestAnimationFrame(fire);
    };
    fire();

    return () => { confettiFired.current = false; };
  }, [hasSearch]);

  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <p className="text-muted-foreground text-sm">
          Nema rezultata za "{searchTerm}"
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-12 gap-5">
      <div
        className="h-[100px] w-[100px] rounded-full flex items-center justify-center"
        style={{ backgroundColor: "#DCFCE7" }}
      >
        <CheckCircle className="h-14 w-14" style={{ color: "#16A34A" }} />
      </div>
      <h2 className="text-[28px] font-bold" style={{ color: "#15803D" }}>
        Sve završeno!
      </h2>
      <p className="text-muted-foreground text-base text-center">
        Odlično! Nema više dijelova za stanicu {workstationName}.
      </p>
    </div>
  );
}
