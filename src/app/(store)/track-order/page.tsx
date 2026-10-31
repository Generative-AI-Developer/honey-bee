import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { TrackOrderForm } from "@/components/store/track-order-form";

export const metadata: Metadata = { title: "Track your order", description: "Check the delivery status of your Abdul Sami Enterprises order.", alternates: { canonical: "/track-order" } };

export default function TrackOrderPage() {
  return (
    <AuthCard
      title="Track your order"
      subtitle="Enter your order number from the confirmation email."
      footer={
        <>
          Have an account?{" "}
          <Link href="/account/orders" className="font-semibold text-primary-strong">
            See all your orders
          </Link>
        </>
      }
    >
      <TrackOrderForm />
    </AuthCard>
  );
}
