import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CustomerModal } from "./CustomerModal";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  order_count: number;
}

function useCustomersWithCounts() {
  return useQuery<Customer[]>({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data: customers, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      if (error) throw error;

      const { data: orders } = await supabase
        .from("orders")
        .select("customer_id");

      const countMap = new Map<string, number>();
      (orders || []).forEach((o: any) => {
        if (o.customer_id) {
          countMap.set(o.customer_id, (countMap.get(o.customer_id) || 0) + 1);
        }
      });

      return (customers || []).map((c: any) => ({
        ...c,
        order_count: countMap.get(c.id) || 0,
      }));
    },
  });
}

export function CustomersTab() {
  const queryClient = useQueryClient();
  const { data: customers, isLoading } = useCustomersWithCounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    customer: Customer | null;
  }>({ open: false, customer: null });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast.success("Klijent obrisan");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleDelete = (customer: Customer) => {
    if (customer.order_count > 0) {
      toast.error(`Klijent ima ${customer.order_count} nalog${customer.order_count > 1 ? "a" : ""}. Nije moguće obrisati.`);
      return;
    }
    setDeleteDialog({ open: true, customer });
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Upravljanje klijentima</h2>
        <Button
          onClick={() => {
            setEditingCustomer(null);
            setModalOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Dodaj klijenta
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--table-header-bg))] hover:bg-[hsl(var(--table-header-bg))]">
              <TableHead>Naziv</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Adresa</TableHead>
              <TableHead>Broj naloga</TableHead>
              <TableHead className="w-24">Radnje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !customers?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="py-0">
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Plus className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Nema klijenata</h3>
                    <p className="text-sm text-muted-foreground mb-4">Dodajte prvog klijenta za upravljanje nalozima.</p>
                    <Button onClick={() => { setEditingCustomer(null); setModalOpen(true); }}>Dodaj klijenta</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c, idx) => (
                <TableRow
                  key={c.id}
                  className={idx % 2 === 1 ? "bg-[hsl(var(--table-row-stripe))]" : ""}
                >
                  <TableCell>
                    <span className="font-medium text-foreground">{c.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{c.email || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{c.phone || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                      {c.address || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{c.order_count}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingCustomer(c);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((d) => ({ ...d, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obrisati klijenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Jeste li sigurni da želite obrisati klijenta "{deleteDialog.customer?.name}"? Ova radnja je nepovratna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog.customer) {
                  deleteCustomer.mutate(deleteDialog.customer.id);
                }
                setDeleteDialog({ open: false, customer: null });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customer={editingCustomer}
      />
    </div>
  );
}
