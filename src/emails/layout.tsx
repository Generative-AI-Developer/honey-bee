import type { ReactNode } from "react";
import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const colors = {
  cream: "#FBF6EC",
  ink: "#2B1D0E",
  ink2: "#5C4A36",
  muted: "#8A7862",
  line: "#E9DDC7",
  honey: "#E9A21A",
  amber: "#C97F06",
  sage: "#5E7A4A",
};

export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.cream, fontFamily: "Inter, Helvetica, Arial, sans-serif", color: colors.ink, margin: 0, padding: "24px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 16, border: `1px solid ${colors.line}`, overflow: "hidden" }}>
          <Section style={{ backgroundColor: colors.ink, padding: "20px 32px" }}>
            <Text style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#ffffff" }}>
              Abdul Sami Honey <span style={{ color: colors.honey }}>Enterprises</span>
            </Text>
          </Section>
          <Section style={{ padding: "28px 32px 8px" }}>{children}</Section>
          <Hr style={{ borderColor: colors.line, margin: "16px 32px" }} />
          <Section style={{ padding: "0 32px 24px" }}>
            <Text style={{ fontSize: 12, color: colors.muted, lineHeight: "18px", margin: 0 }}>
              Pure, raw honey from Pakistan · <Link href={siteUrl} style={{ color: colors.amber }}>{siteUrl.replace(/^https?:\/\//, "")}</Link>
              <br />
              Questions? Just reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      style={{ display: "inline-block", backgroundColor: colors.honey, color: colors.ink, fontWeight: 700, fontSize: 15, padding: "12px 24px", borderRadius: 999, textDecoration: "none" }}
    >
      {children}
    </Link>
  );
}

export const h1 = { fontFamily: "Georgia, serif", fontSize: 24, lineHeight: "30px", margin: "0 0 12px", color: colors.ink };
export const p = { fontSize: 15, lineHeight: "24px", color: colors.ink2, margin: "0 0 16px" };
export { siteUrl };
