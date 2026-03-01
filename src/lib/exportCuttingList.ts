import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExportParams {
  orderIds: string[];
  filenamePrefix: string;
}

export async function exportCuttingList({ orderIds, filenamePrefix }: ExportParams) {
  if (!orderIds.length) {
    toast.info("Nema naloga za izvoz.");
    return;
  }

  toast.loading("Priprema liste rezanja...", { id: "export-cutting" });

  try {
    // Fetch orders
    const { data: orders, error: ordErr } = await supabase
      .from("orders")
      .select("id, order_number, customer_id, customers(name), articles(id, name, parts(id, part_number, name, material, length, width, thickness, quantity))")
      .in("id", orderIds);
    if (ordErr) throw ordErr;

    const rows: string[][] = [];

    for (const order of orders ?? []) {
      const customerName = (order as any).customers?.name ?? "";
      for (const article of (order as any).articles ?? []) {
        for (const part of article.parts ?? []) {
          rows.push([
            order.order_number,
            order.order_number, // Naziv_naloga = order_number (no separate name field)
            customerName,
            article.name,
            part.part_number,
            part.name,
            part.material ?? "",
            part.length != null ? String(part.length) : "",
            part.width != null ? String(part.width) : "",
            part.thickness != null ? String(part.thickness) : "",
            String(part.quantity),
            "", // Rub_gore
            "", // Rub_dolje
            "", // Rub_lijevo
            "", // Rub_desno
            "", // CNC_program
          ]);
        }
      }
    }

    // Sort: Materijal ASC, Debljina DESC, Duljina DESC
    rows.sort((a, b) => {
      const matCmp = (a[6] || "").localeCompare(b[6] || "");
      if (matCmp !== 0) return matCmp;
      const thickCmp = (parseFloat(b[9]) || 0) - (parseFloat(a[9]) || 0);
      if (thickCmp !== 0) return thickCmp;
      return (parseFloat(b[7]) || 0) - (parseFloat(a[7]) || 0);
    });

    const headers = [
      "Broj_naloga", "Naziv_naloga", "Kupac", "Naziv_artikla",
      "Broj_dijela", "Naziv_dijela", "Materijal",
      "Duljina_mm", "Sirina_mm", "Debljina_mm", "Kolicina",
      "Rub_gore", "Rub_dolje", "Rub_lijevo", "Rub_desno", "CNC_program",
    ];

    const csvContent = [
      headers.join(";"),
      ...rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(";")),
    ].join("\r\n");

    // BOM for UTF-8 Excel compatibility
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().split("T")[0];
    a.download = `Lista_rezanja_${filenamePrefix}_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Lista rezanja izvezena", { id: "export-cutting" });
  } catch (err) {
    toast.error("Greška pri izvozu", { id: "export-cutting" });
    console.error(err);
  }
}
