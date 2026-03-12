import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { AdminTabs } from "./AdminTabs";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">← App</Link>
        <h1 className="text-2xl font-bold">Admin</h1>
      </div>
      <AdminTabs />
      {children}
    </div>
  );
}
