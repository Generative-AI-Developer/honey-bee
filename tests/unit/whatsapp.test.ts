import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toWhatsAppNumber } from "@/lib/utils";

// Admin WhatsApp alerts: number formats and what each provider is sent.
// env.ts reads process.env at import time, so each test re-imports the service after stubbing.
async function load(vars: Record<string, string>) {
  vi.resetModules();
  vi.stubEnv("DATABASE_URL", "postgresql://test");
  vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-test-secret-123456");
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
  return import("@/services/whatsapp");
}

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("toWhatsAppNumber", () => {
  it("accepts Pakistani and international formats", () => {
    expect(toWhatsAppNumber("0300 1234567")).toBe("923001234567");
    expect(toWhatsAppNumber("+92 300 1234567")).toBe("923001234567");
    expect(toWhatsAppNumber("0092-300-1234567")).toBe("923001234567");
    expect(toWhatsAppNumber("+44 7700 900123")).toBe("447700900123");
  });
  it("rejects junk", () => {
    expect(toWhatsAppNumber("")).toBeNull();
    expect(toWhatsAppNumber("12345")).toBeNull();
    expect(toWhatsAppNumber("call me")).toBeNull();
  });
});

describe("sendWhatsApp", () => {
  it("uses the approved template on the Cloud API, with the customer's name as {{1}}", async () => {
    const { sendWhatsApp, whatsAppProvider } = await load({ WHATSAPP_TOKEN: "tok", WHATSAPP_PHONE_NUMBER_ID: "555", WHATSAPP_TEMPLATE: "new_order_alert" });
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    expect(whatsAppProvider()).toBe("cloud");
    const res = await sendWhatsApp({ to: "0300 1234567", text: "hi", templateParams: ["Ayesha Khan", "HB-10482", "Rs 6,400"] });
    expect(res.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://graph.facebook.com/v21.0/555/messages");
    expect(init.headers.Authorization).toBe("Bearer tok");
    const body = JSON.parse(init.body);
    expect(body.to).toBe("923001234567");
    expect(body.template.name).toBe("new_order_alert");
    expect(body.template.components[0].parameters[0]).toEqual({ type: "text", text: "Ayesha Khan" });
  });

  it("reports Cloud API errors instead of throwing", async () => {
    const { sendWhatsApp } = await load({ WHATSAPP_TOKEN: "tok", WHATSAPP_PHONE_NUMBER_ID: "555" });
    fetchMock.mockResolvedValue(Response.json({ error: { message: "Invalid OAuth access token" } }, { status: 401 }));
    const res = await sendWhatsApp({ to: "+923001234567", text: "hi" });
    expect(res).toEqual({ ok: false, error: "WhatsApp Cloud API: Invalid OAuth access token" });
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toMatchObject({ type: "text", text: { body: "hi" } });
  });

  it("sends plain text through CallMeBot", async () => {
    const { sendWhatsApp } = await load({ CALLMEBOT_API_KEY: "key1" });
    fetchMock.mockResolvedValue(new Response("<p>Message queued. You will receive it in a few seconds.</p>", { status: 200 }));
    const res = await sendWhatsApp({ to: "0300 1234567", text: "New order by Ali" });
    expect(res.ok).toBe(true);
    const url = new URL(fetchMock.mock.calls[0]![0]);
    expect(url.searchParams.get("phone")).toBe("923001234567");
    expect(url.searchParams.get("text")).toBe("New order by Ali");
    expect(url.searchParams.get("apikey")).toBe("key1");
  });

  it("logs to the console in development when nothing is connected", async () => {
    const { sendWhatsApp, whatsAppProvider } = await load({});
    expect(whatsAppProvider()).toBeNull();
    expect((await sendWhatsApp({ to: "0300 1234567", text: "hi" })).ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses an invalid number without calling any API", async () => {
    const { sendWhatsApp } = await load({ CALLMEBOT_API_KEY: "key1" });
    expect((await sendWhatsApp({ to: "123", text: "hi" })).ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
