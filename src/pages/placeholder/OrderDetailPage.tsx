import { useParams } from "react-router-dom";
import { useSetPageTitle } from "@/hooks/useSetPageTitle";

export default function OrderDetailPage() {
  const { id } = useParams();
  useSetPageTitle(`Nalog: ${id ?? ""}`);
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Detalji naloga ({id}) — uskoro</p>
    </div>
  );
}
