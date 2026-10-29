import "server-only";
import { env, isProd } from "@/lib/env";
import { toWhatsAppNumber } from "@/lib/utils";

// WhatsApp alerts for the shop owner. The provider is picked from env keys:
//  - Meta WhatsApp Cloud API (official): WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID.
//    Messages a business starts must use an approved template (WHATSAPP_TEMPLATE); without one,
//    plain text is only delivered if the admin messaged the business number in the last 24 hours.
//  - CallMeBot (free, for sending to your own number): CALLMEBOT_API_KEY.
//  - Neither: development prints the message to the console; production logs a warning.
// Never throws: a failed alert must not break checkout.

export type WhatsAppMessage = {
  to: string;
  text: string;
  /** Values for the approved template's {{1}}, {{2}}… placeholders (Cloud API with WHATSAPP_TEMPLATE only). */
  templateParams?: string[];
};

export type WhatsAppProvider = "cloud" | "callmebot" | null;

export function whatsAppProvider(): WhatsAppProvider {
  if (env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) return "cloud";
  if (env.CALLMEBOT_API_KEY) return "callmebot";
  return null;
}

export async function sendWhatsApp({ to, text, templateParams }: WhatsAppMessage): Promise<{ ok: boolean; error?: string }> {
  const number = toWhatsAppNumber(to);
  if (!number) return fail(`"${to}" is not a valid WhatsApp number. Use the format +92 300 1234567.`);
  try {
    const provider = whatsAppProvider();
    if (provider === "cloud") return await sendCloud(number, text, templateParams);
    if (provider === "callmebot") return await sendCallMeBot(number, text);
    if (isProd) return fail("WhatsApp is not connected (set WHATSAPP_* or CALLMEBOT_API_KEY).");
    console.info(`\n[whatsapp] To: +${number}\n[whatsapp] ${text}\n`);
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Sending failed.");
  }
}

async function sendCloud(number: string, text: string, params: string[] = []) {
  const template = env.WHATSAPP_TEMPLATE;
  const body = template
    ? {
        messaging_product: "whatsapp",
        to: number,
        type: "template",
        template: {
          name: template,
          language: { code: env.WHATSAPP_TEMPLATE_LANG },
          components: params.length ? [{ type: "body", parameters: params.map((p) => ({ type: "text", text: p })) }] : [],
        },
      }
    : { messaging_product: "whatsapp", to: number, type: "text", text: { body: text, preview_url: false } };
  const res = await fetch(`https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (res.ok) return { ok: true };
  const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
  return fail(`WhatsApp Cloud API: ${data.error?.message ?? `HTTP ${res.status}`}`);
}

async function sendCallMeBot(number: string, text: string) {
  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", number);
  url.searchParams.set("text", text);
  url.searchParams.set("apikey", env.CALLMEBOT_API_KEY!);
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  const body = await res.text().catch(() => "");
  // CallMeBot answers 200 with an HTML page; failures mention "error" or an invalid key.
  if (res.ok && !/error|invalid|not (been )?activated/i.test(body)) return { ok: true };
  return fail(`CallMeBot: ${body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) || `HTTP ${res.status}`}`);
}

function fail(error: string) {
  console.error("[whatsapp]", error);
  return { ok: false, error };
}
