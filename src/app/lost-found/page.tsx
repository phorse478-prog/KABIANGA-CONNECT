"use client";

import { useState } from "react";
import { Search, MapPin, PackageSearch, Plus } from "lucide-react";

type LostItem = {
  id: number;
  title: string;
  category: "Lost" | "Found";
  location: string;
  description: string;
  contact: string;
};

const initialItems: LostItem[] = [
  {
    id: 1,
    title: "Black student ID card",
    category: "Found",
    location: "Main library, front desk",
    description: "Found near the study tables on the second floor. Please claim with a valid ID.",
    contact: "@student_support",
  },
  {
    id: 2,
    title: "Blue power bank",
    category: "Lost",
    location: "Hostel block C",
    description: "Last seen during a group study session. Reward for return.",
    contact: "+254 712 345 678",
  },
];

export default function LostFoundPage() {
  const [items, setItems] = useState<LostItem[]>(initialItems);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "Lost" as "Lost" | "Found",
    location: "",
    description: "",
    contact: "",
  });

  const filtered = items.filter((item) => {
    const text = `${item.title} ${item.location} ${item.description}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });

  function handleAddItem() {
    if (!form.title.trim() || !form.location.trim() || !form.description.trim()) return;

    setItems((current) => [
      {
        id: Date.now(),
        title: form.title.trim(),
        category: form.category,
        location: form.location.trim(),
        description: form.description.trim(),
        contact: form.contact.trim() || "Student services",
      },
      ...current,
    ]);

    setForm({
      title: "",
      category: "Lost",
      location: "",
      description: "",
      contact: "",
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4">
      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
          Campus helpdesk
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Lost & Found</h1>
        <p className="mt-1 text-sm text-gray-600">
          Report or recover lost items quickly across campus.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items, locations, or descriptions"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{item.category}</p>
                </div>
                <span
                  className={
                    item.category === "Lost"
                      ? "rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700"
                      : "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  }
                >
                  {item.category}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                {item.location}
              </div>

              <p className="mt-3 text-sm leading-6 text-gray-700">{item.description}</p>

              <div className="mt-4 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                Contact: <span className="font-medium text-gray-900">{item.contact}</span>
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-brand-700" />
            <h2 className="text-base font-semibold text-gray-900">Add a report</h2>
          </div>

          <div className="space-y-3">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Item name"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />

            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as "Lost" | "Found" })
              }
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="Lost">Lost</option>
              <option value="Found">Found</option>
            </select>

            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Location"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />

            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Describe the item or where it was last seen"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />

            <input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              placeholder="Contact number or handle"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />

            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Save report
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
