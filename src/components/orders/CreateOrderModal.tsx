import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomers } from "@/hooks/useOrders";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrderModal({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { data: customers = [] } = useCustomers();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [orderName, setOrderName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isUrgent, setIsUrgent] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setOrderName("");
    setCustomerId("");
    setOrderDate(new Date());
    setDueDate(undefined);
    setIsUrgent(false);
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!orderName.trim() || !customerId) return;
    setSaving(true);

    // Generate order number
    const { data: orderNumber, error: fnError } = await supabase.rpc("generate_order_number");
    if (fnError) {
      toast({ title: "Greška", description: fnError.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("orders").insert({
      order_number: orderName.trim() + ` (${orderNumber})`,
      customer_id: customerId,
      created_at: orderDate.toISOString(),
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      priority: isUrgent ? 1 : 0,
      notes: notes.trim() || null,
      created_by: user?.id ?? null,
    });

    if (error) {
      toast({ title: "Greška pri kreiranju", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Nalog kreiran" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      resetForm();
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novi nalog</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="orderName">Order name *</Label>
            <Input
              id="orderName"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
              placeholder="Naziv naloga"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Order date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(orderDate, "dd.MM.yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={orderDate}
                    onSelect={(d) => d && setOrderDate(d)}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="priority">Priority</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Normal</span>
              <Switch id="priority" checked={isUrgent} onCheckedChange={setIsUrgent} />
              <span className={cn("text-sm", isUrgent ? "text-destructive font-medium" : "text-muted-foreground")}>
                Hitno
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcionalne napomene..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Odustani</Button>
          <Button onClick={handleSubmit} disabled={saving || !orderName.trim() || !customerId}>
            {saving ? "Kreiranje..." : "Kreiraj nalog"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
