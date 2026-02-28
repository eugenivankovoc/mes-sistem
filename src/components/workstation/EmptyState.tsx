import { useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface EmptyStateProps {
  hasSearch: boolean;
  searchTerm: string;
}

export function EmptyState({ hasSearch, searchTerm }: EmptyStateProps) {
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
        colors: ["#16A34A", "#22C55E", "#4ADE80", "#86EFAC"],
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
    <div className="flex flex-col items-center justify-center flex-1 p-12 gap-4">
      <div className="h-20 w-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(142 71% 45% / 0.15)" }}>
        <CheckCircle className="h-10 w-10" style={{ color: "hsl(142 71% 45%)" }} />
      </div>
      <h2 className="text-xl font-bold" style={{ color: "hsl(142 71% 45%)" }}>
        Sve završeno!
      </h2>
      <p className="text-muted-foreground text-sm text-center">
        Odlično! Nema više dijelova za ovu stanicu.
      </p>
    </div>
  );
}
