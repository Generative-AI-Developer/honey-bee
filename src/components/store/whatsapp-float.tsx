import { WhatsAppFloatLink } from "@/components/store/whatsapp-float-link";
import { toWhatsAppNumber } from "@/lib/utils";
import { getSettings } from "@/server/settings";

export const WHATSAPP_GREETING = "Assalam-o-Alaikum! I'd like to ask about your honey.";

/** Floating "Chat on WhatsApp" button on every store page (hidden when no valid number is set). */
export async function WhatsAppFloat() {
  const settings = await getSettings();
  const number = toWhatsAppNumber(settings.store.whatsapp);
  if (!number) return null;
  return <WhatsAppFloatLink href={`https://wa.me/${number}?text=${encodeURIComponent(WHATSAPP_GREETING)}`} />;
}
