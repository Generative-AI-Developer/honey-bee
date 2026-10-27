import { Text } from "@react-email/components";
import { EmailButton, EmailLayout, h1, p } from "./layout";

export function ResetPasswordEmail({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout preview="Reset your Honey Bee password">
      <Text style={h1}>Reset your password</Text>
      <Text style={p}>Hi {name.split(" ")[0]}, we received a request to reset your password. Click below to choose a new one.</Text>
      <EmailButton href={url}>Choose a new password</EmailButton>
      <Text style={{ ...p, fontSize: 13, marginTop: 20 }}>
        This link expires in 1 hour. If you didn&apos;t request this, you can safely ignore this email; your password won&apos;t change.
      </Text>
    </EmailLayout>
  );
}
