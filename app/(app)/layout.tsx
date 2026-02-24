import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AccountNav } from "./layout/AccountNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-semibold hover:opacity-90">PitchIQ</Link>
        <nav className="flex items-center gap-6">
          <Link href="/discover" className="text-[var(--muted)] hover:text-[var(--text)]">Discover</Link>
          <Link href="/target-list" className="text-[var(--muted)] hover:text-[var(--text)]">Target list</Link>
          <Link href="/pitches" className="text-[var(--muted)] hover:text-[var(--text)]">Pitches</Link>
          <Link href="/dashboard" className="text-[var(--muted)] hover:text-[var(--text)]">Dashboard</Link>
          <AccountNav />
          <form action="/logout" method="post">
            <button type="submit" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">Log out</button>
          </form>
        </nav>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
