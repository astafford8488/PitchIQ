import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-4">
        <Link href="/" className="text-xl font-semibold hover:opacity-90">PitchIQ</Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">{children}</main>
    </div>
  );
}
