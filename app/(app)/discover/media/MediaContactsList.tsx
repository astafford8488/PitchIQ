"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Contact = { id: string; name: string | null; email: string | null; title: string | null; outlet_name: string | null; source: string | null; created_at: string };

export function MediaContactsList({ contacts: initialContacts, inListIds }: { contacts: Contact[]; inListIds: string[] }) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initialContacts);
  const [inList, setInList] = useState<Set<string>>(new Set(inListIds));
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", title: "", outlet_name: "" });

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, source: "manual" }),
    });
    const data = await res.json();
    setAdding(false);
    if (res.ok) {
      setContacts((prev) => [{ ...data, created_at: new Date().toISOString() }, ...prev]);
      setForm({ name: "", email: "", title: "", outlet_name: "" });
    }
  }

  async function addToList(contactId: string) {
    const res = await fetch("/api/contact-target-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_id: contactId }),
    });
    if (res.ok) setInList((prev) => new Set(prev).add(contactId));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addContact} className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-3">
        <h2 className="font-semibold">Add contact</h2>
        <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm" />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm" />
        <input type="text" placeholder="Title (e.g. Reporter)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm" />
        <input type="text" placeholder="Outlet (e.g. TechCrunch)" value={form.outlet_name} onChange={(e) => setForm((f) => ({ ...f, outlet_name: e.target.value }))} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm" />
        <button type="submit" disabled={adding} className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{adding ? "Adding…" : "Add contact"}</button>
      </form>

      <div>
        <h2 className="font-semibold mb-2">Contacts</h2>
        {contacts.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">No contacts yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3">
                <div>
                  <span className="font-medium">{c.name || c.outlet_name || "Unnamed"}</span>
                  {c.outlet_name && c.name && <span className="text-[var(--muted)] ml-2">({c.outlet_name})</span>}
                  {c.email && <span className="block text-sm text-[var(--muted)]">{c.email}</span>}
                </div>
                {inList.has(c.id) ? (
                  <span className="text-sm text-[var(--muted)]">In your list</span>
                ) : (
                  <button type="button" onClick={() => addToList(c.id)} className="text-sm bg-[var(--accent)] text-[var(--bg)] px-3 py-1.5 rounded hover:bg-[var(--accent-hover)]">Add to list</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
