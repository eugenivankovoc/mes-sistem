import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfDay, isBefore } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomers } from "@/hooks/useOrders";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
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
  const navigate = useNavigate();
  const { data: customers = [] } = useCustomers();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [orderName, setOrderName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isUrgent, setIsUrgent] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Customer picker state
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Inline add customer state
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = useMemo(
    () => !!(orderName.trim() || customerId || dueDate || isUrgent || notes.trim()),
    [orderName, customerId, dueDate, isUrgent, notes]
  );
  useUnsavedChangesGuard(isDirty && open);

  // Generate order number on open
  useEffect(() => {
    if (open) {
      supabase.rpc("generate_order_number").then(({ data }) => {
        if (data) setOrderNumber(data);
      });
    }
  }, [open]);

  const selectedCustomerName = customers.find((c) => c.id === customerId)?.name ?? "";

  const resetForm = () => {
    setOrderName("");
    setCustomerId("");
    setOrderNumber("");
    setOrderDate(new Date());
    setDueDate(undefined);
    setIsUrgent(false);
    setNotes("");
    setErrors({});
    setAddingCustomer(false);
    setNewCustomerName("");
    setNewCustomerEmail("");
    setNewCustomerPhone("");
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!orderName.trim()) e.orderName = "Naziv naloga je obavezan.";
    if (orderName.length > 100) e.orderName = "Maksimalno 100 znakova.";
    if (!customerId) e.customerId = "Kupac je obavezan.";
    if (!orderDate) e.orderDate = "Datum naloga je obavezan.";
    if (dueDate && isBefore(dueDate, startOfDay(orderDate))) {
      e.dueDate = "Datum isporuke mora biti nakon datuma naloga.";
    }
    if (dueDate && isBefore(dueDate, startOfDay(new Date()))) {
      e.dueDate = "Datum isporuke ne može biti u prošlosti.";
    }
    if (notes.length > 500) e.notes = "Maksimalno 500 znakova.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveCustomer = async () => {
    if (!newCustomerName.trim()) return;
    setSavingCustomer(true);
    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: newCustomerName.trim(),
        email: newCustomerEmail.trim() || null,
        phone: newCustomerPhone.trim() || null,
      })
      .select("id")
      .single();
    if (error) {
      toast({ title: "Greška", description: error.message, variant: "destructive" });
    } else if (data) {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      setCustomerId(data.id);
      setAddingCustomer(false);
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      setCustomerOpen(false);
      setErrors((prev) => ({ ...prev, customerId: "" }));
    }
    setSavingCustomer(false);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);

    const { data: newOrder, error } = await supabase.from("orders").insert({
      order_number: orderNumber || orderName.trim(),
      customer_id: customerId,
      created_at: orderDate.toISOString(),
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      priority: isUrgent ? 1 : 0,
      notes: notes.trim() || null,
      created_by: user?.id ?? null,
    }).select("id").single();

    if (error || !newOrder) {
      toast({ title: "Greška pri kreiranju", description: error?.message, variant: "destructive" });
    } else {
      toast({ title: `Nalog ${orderNumber} uspješno kreiran` });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-count"] });
      resetForm();
      onOpenChange(false);
      navigate(`/orders/${newOrder.id}`);
    }
    setSaving(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novi nalog</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Naziv naloga */}
          <div className="space-y-1.5">
            <Label htmlFor="orderName">
              Naziv naloga <span className="text-destructive">*</span>
            </Label>
            <Input
              id="orderName"
              value={orderName}
              onChange={(e) => {
                if (e.target.value.length <= 100) setOrderName(e.target.value);
              }}
              placeholder="npr. Sideboard bijeli"
              className={cn(errors.orderName && "border-destructive")}
            />
            <div className="flex justify-between">
              {errors.orderName ? (
                <span className="text-xs text-destructive">{errors.orderName}</span>
              ) : <span />}
              <span className="text-xs text-muted-foreground">{orderName.length}/100</span>
            </div>
          </div>

          {/* Kupac */}
          <div className="space-y-1.5">
            <Label>
              Kupac <span className="text-destructive">*</span>
            </Label>
            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerOpen}
                  className={cn(
                    "w-full justify-between font-normal",
                    !customerId && "text-muted-foreground",
                    errors.customerId && "border-destructive"
                  )}
                >
                  {customerId ? selectedCustomerName : "Odaberite kupca..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                {addingCustomer ? (
                  <div className="p-3 space-y-3">
                    <p className="text-sm font-medium text-foreground">Novi kupac</p>
                    <div className="space-y-2">
                      <Input
                        placeholder="Naziv *"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={newCustomerEmail}
                        onChange={(e) => setNewCustomerEmail(e.target.value)}
                      />
                      <Input
                        placeholder="Telefon"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setAddingCustomer(false)}>
                        Odustani
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveCustomer}
                        disabled={!newCustomerName.trim() || savingCustomer}
                      >
                        {savingCustomer ? "Spremanje..." : "Spremi"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Command>
                    <CommandInput
                      placeholder="Pretraži kupce..."
                      value={customerSearch}
                      onValueChange={setCustomerSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Nema rezultata.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => {
                              setCustomerId(c.id);
                              setCustomerOpen(false);
                              setErrors((prev) => ({ ...prev, customerId: "" }));
                            }}
                            className="min-h-[44px]"
                          >
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => setAddingCustomer(true)}
                          className="min-h-[44px] text-primary"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Dodaj novog klijenta
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}
              </PopoverContent>
            </Popover>
            {errors.customerId && (
              <span className="text-xs text-destructive">{errors.customerId}</span>
            )}
          </div>

          {/* Broj naloga (auto) */}
          <div className="space-y-1.5">
            <Label>Broj naloga</Label>
            <Input value={orderNumber} readOnly className="bg-muted text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Automatski generirano</span>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Datum naloga */}
            <div className="space-y-1.5">
              <Label>
                Datum naloga <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      errors.orderDate && "border-destructive"
                    )}
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

            {/* Datum isporuke */}
            <div className="space-y-1.5">
              <Label>Datum isporuke</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground",
                      errors.dueDate && "border-destructive"
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
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {errors.dueDate && (
                <span className="text-xs text-destructive">{errors.dueDate}</span>
              )}
            </div>
          </div>

          {/* Prioritet */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <Label htmlFor="priority" className="cursor-pointer">Prioritet</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Normalan</span>
              <Switch id="priority" checked={isUrgent} onCheckedChange={setIsUrgent} />
              {isUrgent ? (
                <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-destructive">
                  Hitno
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Hitno</span>
              )}
            </div>
          </div>

          {/* Napomena */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Napomena</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => {
                if (e.target.value.length <= 500) setNotes(e.target.value);
              }}
              placeholder="Interne napomene o ovom nalogu..."
              rows={3}
              className={cn(errors.notes && "border-destructive")}
            />
            <div className="flex justify-between">
              {errors.notes ? (
                <span className="text-xs text-destructive">{errors.notes}</span>
              ) : <span />}
              <span className="text-xs text-muted-foreground">{notes.length}/500</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Odustani
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Kreiranje..." : "Spremi nalog"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
