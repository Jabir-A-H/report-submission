"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Map,
  Plus,
  Trash2,
  MapPin,
  Users2,
  TrendingUp,
  Loader2,
  RefreshCw,
  FileText,
} from "lucide-react";

type ZoneWithStats = {
  id: number;
  name: string;
  user_count: number;
  report_count: number;
};

export default function ZoneManagementPage() {
  const [zones, setZones] = useState<ZoneWithStats[]>([]);
  const [newZoneName, setNewZoneName] = useState("");
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function fetchZones() {
    setLoading(true);
    // Fetch zones, then count users and reports per zone
    const { data: zonesData } = await supabase.from("zone").select("id, name").order("name");
    
    if (zonesData) {
      const enriched: ZoneWithStats[] = await Promise.all(
        zonesData.map(async (zone) => {
          const [{ count: userCount }, { count: reportCount }] = await Promise.all([
            supabase.from("people").select("*", { count: "exact", head: true }).eq("zone_id", zone.id),
            supabase.from("report").select("*", { count: "exact", head: true }).eq("zone_id", zone.id),
          ]);
          return {
            ...zone,
            user_count: userCount ?? 0,
            report_count: reportCount ?? 0,
          };
        })
      );
      setZones(enriched);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addZone() {
    const trimmed = newZoneName.trim();
    if (!trimmed) return;
    
    setAddLoading(true);
    setError(null);

    // Check for duplicates
    const exists = zones.some((z) => z.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setError("এই নামে একটি জোন ইতিমধ্যে বিদ্যমান।");
      setAddLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("zone")
      .insert({ name: trimmed })
      .select()
      .single();

    if (insertError) {
      setError("জোন যোগ করতে সমস্যা হয়েছে।");
    } else if (data) {
      setZones((prev) => [...prev, { ...data, user_count: 0, report_count: 0 }]);
      setNewZoneName("");
    }
    setAddLoading(false);
  }

  async function deleteZone(zoneId: number) {
    const zone = zones.find((z) => z.id === zoneId);
    if (zone && zone.user_count > 0) {
      setError(`"${zone.name}" জোনে ${zone.user_count} জন ইউজার রয়েছে। আগে তাদের অন্য জোনে সরান।`);
      setConfirmDelete(null);
      return;
    }

    setActionLoading(zoneId);
    const { error: delError } = await supabase.from("zone").delete().eq("id", zoneId);
    if (!delError) {
      setZones((prev) => prev.filter((z) => z.id !== zoneId));
    } else {
      setError("মুছতে সমস্যা হয়েছে। এই জোনের সাথে রিপোর্ট যুক্ত থাকতে পারে।");
    }
    setActionLoading(null);
    setConfirmDelete(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">জোন ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground">সিস্টেমের জোন বা এলাকা সমূহ নিয়ন্ত্রণ করুন</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">মোট জোন</p>
              <p className="text-lg font-black leading-none">{zones.length}</p>
            </div>
          </div>
          <button
            onClick={fetchZones}
            className="modern-btn border border-border bg-card px-4 py-2 text-sm font-bold flex items-center gap-2 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-sm font-bold flex items-center justify-between animate-in fade-in duration-200">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-black">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Zone List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            <span>জোন তালিকা</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="premium-card p-5 border-muted/50 hover:border-primary/20 transition-all group flex items-start justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{zone.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-bold">
                      <span className="flex items-center gap-1">
                        <Users2 className="w-3 h-3" /> {zone.user_count} ইউজার
                      </span>
                      <span className="flex items-center gap-1 border-l pl-3">
                        <FileText className="w-3 h-3" /> {zone.report_count} রিপোর্ট
                      </span>
                    </div>
                  </div>
                </div>

                {confirmDelete === zone.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => deleteZone(zone.id)}
                      disabled={actionLoading === zone.id}
                      className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-black active:scale-90 transition-all disabled:opacity-50"
                    >
                      {actionLoading === zone.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "হ্যাঁ"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-2 py-1 rounded-lg bg-muted text-xs font-black active:scale-90 transition-all"
                    >
                      না
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(zone.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Zone Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            <span>নতুন জোন</span>
          </h2>

          <div className="premium-card p-6 border-primary/20 bg-linear-to-b from-primary/5 to-transparent">
            <p className="text-sm text-muted-foreground mb-6">
              একটি নতুন জোন বা এলাকা তৈরি করতে নিচের ফর্মটি ব্যবহার করুন।
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">জোনের নাম</label>
                <input
                  type="text"
                  placeholder="জোনের নাম লিখুন..."
                  className="modern-input"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addZone()}
                />
              </div>
              <button
                onClick={addZone}
                disabled={addLoading || !newZoneName.trim()}
                className="modern-btn btn-primary w-full py-4 font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {addLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>জোন যোগ করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
