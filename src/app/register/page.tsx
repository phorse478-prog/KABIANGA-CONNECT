"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cx } from "@/lib/utils";

const ROLE_OPTIONS = [
  { value: "student", label: "Student", hint: "Buy, browse, and use the app" },
  { value: "seller", label: "Seller", hint: "List and sell products" },
  {
    value: "service_provider",
    label: "Service provider",
    hint: "Offer tutoring, design, printing, etc.",
  },
  {
    value: "hostel_owner",
    label: "Hostel owner",
    hint: "List rooms for rent",
  },
  { value: "food_vendor", label: "Food vendor", hint: "Sell food on campus" },
] as const;

type Role = (typeof ROLE_OPTIONS)[number]["value"];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    // The `profiles` row is created automatically by a database trigger.
    // Here we just record the extra role the person chose (everyone is
    // implicitly a "student" — admin is never self-assignable, enforced
    // by the insert policy on user_roles).
    if (data.user && role !== "student") {
      await supabase
        .from("user_roles")
        .insert({ user_id: data.user.id, role });
    }

    setLoading(false);
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center py-10">
      <div className="mb-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-lg font-bold text-white">
          KC
        </span>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Join the University of Kabianga student community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Wanjiru"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            I mainly want to...
          </label>
          <div className="space-y-2">
            {ROLE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cx(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition",
                  role === opt.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  name="role"
                  className="mt-1"
                  checked={role === opt.value}
                  onChange={() => setRole(opt.value)}
                />
                <span>
                  <span className="block font-medium text-gray-900">
                    {opt.label}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {opt.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            You can add more roles later from your profile.
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-700 hover:text-brand-800"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
