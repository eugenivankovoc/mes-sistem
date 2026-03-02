import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConfirmBeforeClose } from "@/hooks/useConfirmBeforeClose";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const schema = z.object({
  article_number: z.string().min(1, "Obavezno polje"),
  name: z.string().min(1, "Obavezno polje"),
  quantity: z.coerce.number().int().min(1, "Minimalno 1"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ArticleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass existing article to edit, null for create */
  article?: { id: string; name: string; quantity: number; description: string | null } | null;
  /** Suggested next article number */
  suggestedNumber: string;
}

export function ArticleModal({ open, onOpenChange, article, suggestedNumber }: ArticleModalProps) {
  const isEdit = !!article;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      article_number: suggestedNumber,
      name: "",
      quantity: 1,
      description: "",
    },
  });

  const isDirty = form.formState.isDirty;
  const { guardedOpenChange, showGuard, confirmClose, cancelClose } =
    useConfirmBeforeClose(isDirty, onOpenChange);

  useEffect(() => {
    if (open) {
      form.reset({
        article_number: article ? "" : suggestedNumber,
        name: article?.name ?? "",
        quantity: article?.quantity ?? 1,
        description: article?.description ?? "",
      });
    }
  }, [open, article, suggestedNumber]);

  const onSubmit = (values: FormValues) => {
    toast.info(
      isEdit
        ? `Uređivanje artikla "${values.name}" — uskoro dostupno`
        : `Dodavanje artikla "${values.name}" — uskoro dostupno`
    );
    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={guardedOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Uredi artikl" : "Novi artikl"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Izmijeni podatke artikla." : "Dodaj novi artikl na nalog."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="article_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Broj artikla *</FormLabel>
                  <FormControl>
                    <Input placeholder="ART-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naziv artikla *</FormLabel>
                  <FormControl>
                    <Input placeholder="npr. Kuhinjski ormarić gornji" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Količina *</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Opcionalni opis artikla..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => guardedOpenChange(false)}>
                Odustani
              </Button>
              <Button type="submit">{isEdit ? "Spremi" : "Dodaj"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    <UnsavedChangesDialog open={showGuard} onConfirm={confirmClose} onCancel={cancelClose} />
    </>
  );
}
