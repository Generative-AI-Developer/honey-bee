import { Text } from "@react-email/components";
import { EmailLayout, h1, p } from "./layout";

export function ContactMessageEmail({ name, email, phone, topic, message }: { name: string; email: string; phone: string; topic: string; message: string }) {
  return (
    <EmailLayout preview={`New message from ${name}: ${topic}`}>
      <Text style={h1}>New message from the website</Text>
      <Text style={p}>
        <b>From:</b> {name}
        <br />
        <b>Email:</b> {email || "not given"}
        <br />
        <b>Phone:</b> {phone || "not given"}
        <br />
        <b>Topic:</b> {topic}
      </Text>
      <Text style={{ ...p, whiteSpace: "pre-wrap", backgroundColor: "#faf7ef", borderRadius: 12, padding: 16 }}>{message}</Text>
      <Text style={{ ...p, fontSize: 13 }}>Reply to this email to answer {name.split(" ")[0]} directly.</Text>
    </EmailLayout>
  );
}
