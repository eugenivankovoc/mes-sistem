/**
 * Translate common Supabase / network errors to Croatian user-friendly messages.
 */
export function translateSupabaseError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  const lower = msg.toLowerCase();

  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("network request failed")) {
    return "Greška u mreži. Provjerite internet vezu.";
  }
  if (lower.includes("jwt expired") || lower.includes("token is expired") || lower.includes("session_not_found")) {
    return "Sesija je istekla. Prijavite se ponovo.";
  }
  if (lower.includes("duplicate key") || lower.includes("unique constraint") || lower.includes("already exists")) {
    return "Zapis s tim brojem već postoji.";
  }
  if (lower.includes("foreign key") || lower.includes("violates foreign key")) {
    return "Nije moguće obrisati – postoje povezani zapisi.";
  }
  if (lower.includes("permission denied") || lower.includes("row-level security")) {
    return "Nemate dozvolu za ovu radnju.";
  }
  if (lower.includes("not found") || lower.includes("pgrst116")) {
    return "Zapis nije pronađen.";
  }
  if (lower.includes("too many requests") || lower.includes("rate limit")) {
    return "Previše zahtjeva. Pričekajte pa pokušajte ponovo.";
  }

  // Return original if short enough, otherwise generic
  if (msg.length > 0 && msg.length < 120) return msg;
  return "Greška. Pokušajte ponovo.";
}
