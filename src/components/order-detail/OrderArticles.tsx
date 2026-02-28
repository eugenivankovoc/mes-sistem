import { useState, useRef } from "react";
import type { ArticleDetail, PartDetail } from "@/hooks/useOrderDetail";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Package, ChevronRight, AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArticleModal } from "./ArticleModal";
import { PartModal } from "./PartModal";

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

function getArticleStatus(parts: ArticleDetail["parts"]) {
  if (parts.length === 0) return { label: "Prazan", color: "bg-muted text-muted-foreground" };
  const completed = parts.filter((p) => p.status === "completed").length;
  if (completed === parts.length) return { label: "Završeno", color: "bg-status-completed-bg text-status-completed-text" };
  if (parts.some((p) => p.status === "in_progress")) return { label: "U tijeku", color: "bg-status-in-production-bg text-status-in-production-text" };
  if (parts.some((p) => p.status === "rework")) return { label: "Dorada", color: "bg-status-rework-bg text-status-rework-text" };
  return { label: "Na čekanju", color: "bg-status-new-bg text-status-new-text" };
}

function getRowBg(status: string) {
  if (status === "rework") return "bg-[hsl(var(--row-rework))]";
  if (status === "completed") return "bg-[hsl(var(--row-completed))]";
  return "";
}

export function OrderArticles({ articles }: { articles: ArticleDetail[] }) {
  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set(articles.map((a) => a.id)));
  const [deleteTarget, setDeleteTarget] = useState<{ type: "article" | "part"; name: string; id: string } | null>(null);
  const reworkRef = useRef<HTMLTableRowElement>(null);

  // Article modal
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleDetail | null>(null);

  // Part modal
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<PartDetail | null>(null);
  const [partArticleId, setPartArticleId] = useState<string | null>(null);
  const [partSuggestedNumber, setPartSuggestedNumber] = useState("");

  const allParts = articles.flatMap((a) => a.parts);
  const reworkParts = allParts.filter((p) => p.status === "rework");

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollToRework = () => {
    reworkRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    toast.info(`Brisanje ${deleteTarget.type === "article" ? "artikla" : "dijela"} "${deleteTarget.name}" — uskoro dostupno`);
    setDeleteTarget(null);
  };

  const openAddArticle = () => {
    setEditingArticle(null);
    setArticleModalOpen(true);
  };

  const openEditArticle = (article: ArticleDetail) => {
    setEditingArticle(article);
    setArticleModalOpen(true);
  };

  const openAddPart = (article: ArticleDetail) => {
    setEditingPart(null);
    setPartArticleId(article.id);
    const nextNum = `D-${String(article.parts.length + 1).padStart(3, "0")}`;
    setPartSuggestedNumber(nextNum);
    setPartModalOpen(true);
  };

  const openEditPart = (part: PartDetail) => {
    setEditingPart(part);
    setPartModalOpen(true);
  };

  const suggestedArticleNumber = `ART-${String(articles.length + 1).padStart(3, "0")}`;

  if (articles.length === 0) {
    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Artikli i dijelovi</h2>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={openAddArticle}>
            <Plus className="h-3.5 w-3.5" />
            Dodaj artikl
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Nema artikala</h3>
            <p className="text-sm text-muted-foreground">
              Ovaj nalog još nema dodanih artikala i dijelova.
            </p>
          </CardContent>
        </Card>
        <ArticleModal open={articleModalOpen} onOpenChange={setArticleModalOpen} article={null} suggestedNumber={suggestedArticleNumber} />
      </>
    );
  }

  let isFirstRework = true;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Artikli i dijelovi ({articles.length})
        </h2>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={openAddArticle}>
          <Plus className="h-3.5 w-3.5" />
          Dodaj artikl
        </Button>
      </div>

      {/* Rework alert banner */}
      {reworkParts.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-md border-l-4 border-destructive bg-status-rework-bg">
          <AlertTriangle className="h-4 w-4 text-status-rework-text shrink-0" />
          <span className="text-sm font-medium text-status-rework-text">
            {reworkParts.length} {reworkParts.length === 1 ? "dio čeka" : "dijelova čeka"} doradu
          </span>
          <button onClick={scrollToRework} className="ml-auto text-sm font-medium text-primary hover:underline">
            Prikaži
          </button>
        </div>
      )}

      {/* Article accordions */}
      <div className="space-y-3">
        {articles.map((article, idx) => {
          const completedParts = article.parts.filter((p) => p.status === "completed").length;
          const articleStatus = getArticleStatus(article.parts);
          const isOpen = openItems.has(article.id);
          const artNumber = `ART-${String(idx + 1).padStart(3, "0")}`;

          return (
            <Card key={article.id} className="overflow-hidden">
              <Collapsible open={isOpen} onOpenChange={() => toggleItem(article.id)}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                    <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                    <Badge variant="secondary" className="font-mono text-[11px] shrink-0">{artNumber}</Badge>
                    <span className="font-semibold text-[15px] text-foreground truncate">{article.name}</span>
                    <Badge className="border-0 bg-primary/10 text-primary text-[11px] shrink-0">×{article.quantity}</Badge>
                    <span className="flex-1" />
                    <span className="text-xs text-muted-foreground shrink-0">{completedParts}/{article.parts.length}</span>
                    <Badge className={`border-0 text-[11px] shrink-0 ${articleStatus.color}`}>{articleStatus.label}</Badge>
                    <Pencil
                      className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={(e) => { e.stopPropagation(); openEditArticle(article); }}
                    />
                    <Trash2
                      className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "article", name: article.name, id: article.id }); }}
                    />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  {article.description && (
                    <p className="px-4 pb-2 text-sm text-muted-foreground">{article.description}</p>
                  )}
                  {article.parts.length > 0 && (
                    <div className="px-4 pb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">#</TableHead>
                            <TableHead>Naziv dijela</TableHead>
                            <TableHead className="w-[100px]">Materijal</TableHead>
                            <TableHead className="w-[120px]">Dimenzije</TableHead>
                            <TableHead className="w-[60px] text-center">Kol.</TableHead>
                            <TableHead className="w-[100px] text-center">Status</TableHead>
                            <TableHead className="w-[80px] text-center">Radnje</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {article.parts.map((part) => {
                            const isRework = part.status === "rework";
                            const refProp: Record<string, any> = {};
                            if (isRework && isFirstRework) {
                              refProp.ref = reworkRef;
                              isFirstRework = false;
                            }

                            const dims =
                              part.length && part.width
                                ? `${part.length}×${part.width}${part.thickness ? `×${part.thickness}` : ""} mm`
                                : "—";

                            return (
                              <TableRow
                                key={part.id}
                                {...refProp}
                                className={`group ${getRowBg(part.status)}`}
                              >
                                <TableCell className="font-mono text-xs">{part.part_number}</TableCell>
                                <TableCell className="font-medium">{part.name}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{part.material ?? "—"}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{dims}</TableCell>
                                <TableCell className="text-center">{part.quantity}</TableCell>
                                <TableCell className="text-center">
                                  <Badge className={`border-0 text-[11px] ${partStatusColors[part.status] ?? ""}`}>
                                    {partStatusLabels[part.status] ?? part.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => openEditPart(part)}
                                      className="p-1 rounded hover:bg-muted"
                                    >
                                      <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteTarget({ type: "part", name: part.name, id: part.id })}
                                      className="p-1 rounded hover:bg-muted"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                    </button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Add part button */}
                  <div className="px-4 pb-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-muted-foreground hover:text-foreground w-full justify-center border border-dashed border-border"
                      onClick={() => openAddPart(article)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Dodaj dio
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Obrisati {deleteTarget?.type === "article" ? "artikl" : "dio"} "{deleteTarget?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "article"
                ? "Svi dijelovi unutar ovog artikla će biti obrisani. Ova radnja se ne može poništiti."
                : "Ovaj dio će biti trajno obrisan. Ova radnja se ne može poništiti."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Obriši</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals */}
      <ArticleModal
        open={articleModalOpen}
        onOpenChange={setArticleModalOpen}
        article={editingArticle}
        suggestedNumber={suggestedArticleNumber}
      />
      <PartModal
        open={partModalOpen}
        onOpenChange={setPartModalOpen}
        part={editingPart}
        suggestedNumber={partSuggestedNumber}
      />
    </>
  );
}
