import { ChangePasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");
  // Read fresh from the database (the session cookie caches profile fields for a few minutes).
  const fresh = await db.user.findUnique({ where: { id: user.id }, select: { name: true, phone: true, email: true, accounts: { select: { providerId: true } } } });
  const hasPassword = fresh?.accounts.some((a) => a.providerId === "credential");
  return (
    <>
      <ProfileForm name={fresh?.name ?? user.name} phone={fresh?.phone ?? null} email={user.email} />
      {hasPassword ? <ChangePasswordForm /> : <p className="card-surface p-5 text-sm text-foreground-soft">You sign in with Google, so there&apos;s no password to change.</p>}
    </>
  );
}
