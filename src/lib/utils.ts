export { cn } from "cn";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Display form of an order number, e.g. 482 → "HB-10482". */
export function orderNumber(n: number): string {
  return `HB-${10000 + n}`;
}

/** Parses "HB-10482" (or "10482") back to the stored sequence number. */
export function parseOrderNumber(input: string): number | null {
  const digits = input.trim().toUpperCase().replace(/^HB-?/, "");
  if (!/^\d{5,}$/.test(digits)) return null;
  const n = Number(digits) - 10000;
  return n > 0 ? n : null;
}

export function normalizeCity(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Normalises Pakistani mobile numbers to +92XXXXXXXXXX when possible. */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (/^03\d{9}$/.test(digits)) return `+92${digits.slice(1)}`;
  if (/^923\d{9}$/.test(digits)) return `+${digits}`;
  return digits;
}

/** International digits without "+" as WhatsApp APIs expect ("0300 1234567" → "923001234567"), or null if implausible. */
export function toWhatsAppNumber(phone: string): string | null {
  const n = normalizePhone(phone.trim().replace(/^00/, "+"));
  const digits = n.startsWith("+") ? n.slice(1) : n;
  return /^[1-9]\d{9,14}$/.test(digits) ? digits : null;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
