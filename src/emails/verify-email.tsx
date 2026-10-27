import { Text } from "@react-email/components";
import { EmailButton, EmailLayout, h1, p } from "./layout";

export function VerifyEmail({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout preview="Confirm your email to finish creating your Honey Bee account">
      <Text style={h1}>Welcome, {name.split(" ")[0]}!</Text>
      <Text style={p}>Please confirm your email address to activate your Honey Bee account and start ordering.</Text>
      <EmailButton href={url}>Confirm my email</EmailButton>
      <Text style={{ ...p, fontSize: 13, marginTop: 20 }}>This link expires in 1 hour. If you didn&apos;t sign up, you can ignore this email.</Text>
    </EmailLayout>
  );
}
