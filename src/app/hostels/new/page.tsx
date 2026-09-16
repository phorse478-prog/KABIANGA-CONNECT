"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CHECKBOXES = [
  { key: "has_water", label: "Water available" },
  { key: "has_electricity", label: "Electricity" },
  { key: "has_wifi", label: "Wi-Fi" },
  { key: "has_security", label: "Security" },
  { key: "has_parking", label: "Parking" },
] as const;

export default function NewHostelPage() {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [distance, setDistance] = useState("");
  const [roomType, setRoomType] = useState("bedsitter");
  const [occupancy, setOccupancy] = useState("1");
  const [gender, setGender] = useState("mixed");
  const [amenities, setAmenities] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in as a hostel owner to list a hostel.");
      setSubmitting(false);
      return;
    }

    const { data: hostel, error: insertError } = await supabase
      .from("hostels")
      .insert({
        owner_id: user.id,
        name,
        description,
        price_per_month: Number(price),
        location,
        distance_from_campus_km: distance ? Number(distance) : null,
        room_type: roomType,
        occupancy: Number(occupancy),
        gender_preference: gender,
        status: "pending",
        ...amenities,
      })
      .select("id")
      .single();

    if (insertError || !hostel) {
      setError(insertError?.message ?? "Something went wrong. Try again.");
      setSubmitting(false);
      return;
    }

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const path = `${user.id}/${hostel.id}/${Date.now()}-${i}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("hostel-images")
        .upload(path, file);
      if (!uploadError) {
        await supabase
          .from("hostel_images")
          .insert({ hostel_id: hostel.id, storage_path: path, sort_order: i });
      }
    }

    setSubmitting(false);
    router.replace(`/hostels/${hostel.id}`);
  }

  return (
    <div className="mx-auto max-w-lg pb-10">
      <h1 className="text-lg font-semibold text-gray-900">List a hostel</h1>
      <p className="mt-1 text-sm text-gray-500">
        Goes live after a quick admin review.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Hostel name
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Price / month (KES)
            </label>
            <input
              required
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Distance from campus (km)
            </label>
            <input
              type="number"
              step="0.1"
              min={0}
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Kaptebengwet"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Room type
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="single">Single</option>
              <option value="shared">Shared</option>
              <option value="bedsitter">Bedsitter</option>
              <option value="one_bedroom">1 Bedroom</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Occupancy
            </label>
            <input
              type="number"
              min={1}
              value={occupancy}
              onChange={(e) => setOccupancy(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="mixed">Mixed</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Facilities
          </label>
          <div className="flex flex-wrap gap-2">
            {CHECKBOXES.map((c) => (
              <label
                key={c.key}
                className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600"
              >
                <input
                  type="checkbox"
                  checked={!!amenities[c.key]}
                  onChange={(e) =>
                    setAmenities((prev) => ({
                      ...prev,
                      [c.key]: e.target.checked,
                    }))
                  }
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Photos
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Publishing…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
