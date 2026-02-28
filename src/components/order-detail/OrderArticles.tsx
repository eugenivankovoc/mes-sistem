import type { ArticleDetail } from "@/hooks/useOrderDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package } from "lucide-react";

const partStatusLabels: Record<string, string> = {
  pending: "Na čekanju",
  in_progress: "U tijeku",
  completed: "Završeno",
  rework: "Dorada",
};

const partStatusColors: Record<string, string> = {
  pending: "bg-status-new-bg text-status-new-text",
  in_progress: "bg-status-in-production-bg text-status-in-production-text",
  completed: "bg-status-completed-bg text-status-completed-text",
  rework: "bg-status-rework-bg text-status-rework-text",
};

export function OrderArticles({ articles }: { articles: ArticleDetail[] }) {
  if (articles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Nema artikala</h3>
          <p className="text-sm text-muted-foreground">
            Ovaj nalog još nema dodanih artikala i dijelova.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Artikli i dijelovi ({articles.length})
      </h2>

      {articles.map((article) => {
        const completedParts = article.parts.filter((p) => p.status === "completed").length;
        return (
          <Card key={article.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {article.name}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    × {article.quantity}
                  </span>
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {completedParts}/{article.parts.length} dijelova
                </Badge>
              </div>
              {article.description && (
                <p className="text-sm text-muted-foreground">{article.description}</p>
              )}
            </CardHeader>

            {article.parts.length > 0 && (
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Broj dijela</TableHead>
                      <TableHead>Naziv</TableHead>
                      <TableHead>Materijal</TableHead>
                      <TableHead className="text-center">Kol.</TableHead>
                      <TableHead className="text-center">Dimenzije</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {article.parts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell className="font-mono text-xs">{part.part_number}</TableCell>
                        <TableCell>{part.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {part.material ?? "—"}
                        </TableCell>
                        <TableCell className="text-center">{part.quantity}</TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {part.length && part.width
                            ? `${part.length}×${part.width}${part.thickness ? `×${part.thickness}` : ""}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`border-0 text-[11px] ${partStatusColors[part.status] ?? ""}`}
                          >
                            {partStatusLabels[part.status] ?? part.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
