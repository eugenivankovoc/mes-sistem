import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCustomers } from "@/hooks/useOrders";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { OrderRow } from "@/hooks/useOrders";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface Props {
  order: OrderRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditOrderModal({ order, open, onOpenChange }: Props) {
  const { data: customers = [] } = useCustomers();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [orderName, setOrderName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isUrgent, setIsUrgent] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order && open) {
      setOrderName(order.order_number);
      setCustomerId(order.customer_id ?? "");
      setDueDate(order.due_date ? parseISO(order.due_date) : undefined);
      setIsUrgent(order.priority > 0);
      setNotes(order.notes ?? "");
    }
  }, [order, open]);

  const handleSubmit = async () => {
    if (!order || !orderName.trim() || !customerId) return;
    setSaving(true);

    const { error } = await supabase.from("orders").update({
      order_number: orderName.trim(),
      customer_id: customerId,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      priority: isUrgent ? 1 : 0,
      notes: notes.trim() || null,
    }).eq("id", order.id);

    if (error) {
      toast({ title: "Greška pri ažuriranju", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Nalog ažuriran" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Uredi nalog</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="editOrderName">Order name *</Label>
            <Input
              id="editOrderName"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Customer *</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Odaberite kupca" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Delivery date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd.MM.yyyy") : "Odaberite"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="editPriority">Priority</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Normal</span>
              <Switch id="editPriority" checked={isUrgent} onCheckedChange={setIsUrgent} />
              <span className={cn("text-sm", isUrgent ? "text-destructive font-medium" : "text-muted-foreground")}>
                Hitno
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editNotes">Notes</Label>
            <Textarea
              id="editNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Odustani</Button>
          <Button onClick={handleSubmit} disabled={saving || !orderName.trim() || !customerId}>
            {saving ? "Spremanje..." : "Spremi promjene"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
