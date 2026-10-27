import "server-only";
import type { ReactElement } from "react";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { env, isProd } from "@/lib/env";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
};

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Sends a transactional email. Without RESEND_API_KEY (development), the email is
 * printed to the console and saved as HTML under .emails/ so flows like
 * "verify your email" can still be completed locally.
 * Never throws: a failed email must not break checkout or sign-up.
 */
export async function sendEmail({ to, subject, react, replyTo }: SendEmailInput): Promise<boolean> {
  try {
    const html = await render(react);
    const text = await render(react, { plainText: true });

    if (resend) {
      const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html, text, replyTo });
      if (error) {
        console.error("[email] Resend error:", error);
        return false;
      }
      return true;
    }

    if (isProd) {
      console.warn(`[email] RESEND_API_KEY missing — email "${subject}" to ${to} was NOT sent.`);
      return false;
    }

    const dir = path.join(process.cwd(), ".emails");
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}-${slug(subject)}.html`);
    await writeFile(file, html);
    const links = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]).filter((l) => !l?.includes("fonts."));
    console.info(`\n[email] To: ${to}\n[email] Subject: ${subject}\n[email] Saved: ${file}\n${links.length ? `[email] Links:\n  ${[...new Set(links)].join("\n  ")}\n` : ""}`);
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
}
