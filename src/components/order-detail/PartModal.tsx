import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const operations = [
  { key: "cutting", icon: "✂", label: "Rezanje" },
  { key: "edging", icon: "□", label: "Kantovanje" },
  { key: "cnc", icon: "⬢", label: "CNC" },
  { key: "drilling", icon: "⦿", label: "Bušenje" },
  { key: "sorting", icon: "⌗", label: "Sortiranje" },
  { key: "mounting", icon: "✓", label: "Montaža" },
  { key: "qc", icon: "📦", label: "Kont. kvalitete" },
  { key: "packing", icon: "⎶", label: "Pakiranje" },
] as const;

const schema = z.object({
  part_number: z.string().min(1, "Obavezno polje"),
  name: z.string().min(1, "Obavezno polje"),
  material: z.string().optional(),
  quantity: z.coerce.number().int().min(1, "Minimalno 1"),
  length: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  thickness: z.coerce.number().optional(),
  // operations
  cutting: z.boolean(),
  edging: z.boolean(),
  cnc: z.boolean(),
  drilling: z.boolean(),
  sorting: z.boolean(),
  mounting: z.boolean(),
  qc: z.boolean(),
  packing: z.boolean(),
  // conditional
  edge_top: z.string().optional(),
  edge_bottom: z.string().optional(),
  edge_left: z.string().optional(),
  edge_right: z.string().optional(),
  cnc_program: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part?: { id: string; name: string; part_number: string; material: string | null; quantity: number; length: number | null; width: number | null; thickness: number | null } | null;
  suggestedNumber: string;
}

const defaultValues: FormValues = {
  part_number: "",
  name: "",
  material: "",
  quantity: 1,
  length: undefined,
  width: undefined,
  thickness: undefined,
  cutting: false,
  edging: false,
  cnc: false,
  drilling: false,
  sorting: false,
  mounting: false,
  qc: false,
  packing: false,
  edge_top: "",
  edge_bottom: "",
  edge_left: "",
  edge_right: "",
  cnc_program: "",
  notes: "",
};

export function PartModal({ open, onOpenChange, part, suggestedNumber }: PartModalProps) {
  const isEdit = !!part;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchEdging = form.watch("edging");
  const watchCnc = form.watch("cnc");

  useEffect(() => {
    if (open) {
      form.reset({
        ...defaultValues,
        part_number: part?.part_number ?? suggestedNumber,
        name: part?.name ?? "",
        material: part?.material ?? "",
        quantity: part?.quantity ?? 1,
        length: part?.length ?? undefined,
        width: part?.width ?? undefined,
        thickness: part?.thickness ?? undefined,
      });
    }
  }, [open, part, suggestedNumber]);

  const onSubmit = (values: FormValues) => {
    toast.info(
      isEdit
        ? `Uređivanje dijela "${values.name}" — uskoro dostupno`
        : `Dodavanje dijela "${values.name}" — uskoro dostupno`
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Uredi dio" : "Novi dio"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Izmijeni podatke dijela." : "Dodaj novi dio u artikl."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section: Osnovni podaci */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Osnovni podaci</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="part_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broj dijela *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naziv dijela *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="material" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materijal</FormLabel>
                    <FormControl><Input placeholder="npr. Melamin bijeli 18mm" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Količina *</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Section: Dimenzije */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dimenzije</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="length" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duljina mm</FormLabel>
                    <FormControl><Input type="number" step="0.1" placeholder="0" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="width" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Širina mm</FormLabel>
                    <FormControl><Input type="number" step="0.1" placeholder="0" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="thickness" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Debljina mm</FormLabel>
                    <FormControl><Input type="number" step="0.1" placeholder="0" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Section: Operacije */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Operacije</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {operations.map((op) => (
                  <FormField
                    key={op.key}
                    control={form.control}
                    name={op.key as keyof FormValues}
                    render={({ field }) => (
                      <div className="flex items-center gap-2 rounded-md border border-border p-2.5">
                        <Switch
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                          id={`op-${op.key}`}
                        />
                        <Label htmlFor={`op-${op.key}`} className="text-xs cursor-pointer">
                          <span className="mr-1">{op.icon}</span>
                          {op.label}
                        </Label>
                      </div>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Section: Rubovi (conditional) */}
            {watchEdging && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Rubovi</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(["edge_top", "edge_bottom", "edge_left", "edge_right"] as const).map((edgeKey) => {
                    const labels: Record<string, string> = { edge_top: "Rub gore", edge_bottom: "Rub dolje", edge_left: "Rub lijevo", edge_right: "Rub desno" };
                    return (
                      <FormField key={edgeKey} control={form.control} name={edgeKey} render={({ field }) => (
                        <FormItem>
                          <FormLabel>{labels[edgeKey]}</FormLabel>
                          <FormControl><Input placeholder="npr. ABS 2mm bijeli" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section: CNC (conditional) */}
            {watchCnc && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">CNC</h3>
                <FormField control={form.control} name="cnc_program" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNC program</FormLabel>
                    <FormControl><Input placeholder="npr. BR_0042_bocna.mpr" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            )}

            {/* Section: Napomene */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Napomene</h3>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormControl><Textarea placeholder="Opcionalne napomene..." rows={3} {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Odustani
              </Button>
              <Button type="submit">{isEdit ? "Spremi" : "Dodaj"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
