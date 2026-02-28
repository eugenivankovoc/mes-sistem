import { useParams } from "react-router-dom";

export default function OrderDetailPage() {
  const { id } = useParams();
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Detalji naloga ({id}) — uskoro</p>
    </div>
  );
}
