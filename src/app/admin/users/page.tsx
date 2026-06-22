"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  ShieldCheck,
  Trash2,
  Search,
  MapPin,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { deleteUserAction } from "./actions";

type Person = {
  id: number;
  user_id: string;
  name: string;
  email: string;
  role: string;
  active: boolean | null;
  zone_id: number;
  zone?: { name: string };
  supabase_uid: string | null;
};

type Zone = { id: number; name: string };

export default function UserManagementPage() {
  const [users, setUsers] = useState<Person[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const supabase = createClient();

  async function fetchData() {
    setLoading(true);
    const [{ data: usersData }, { data: zonesData }] = await Promise.all([
      supabase.from("people").select("*, zone(name)").order("active", { ascending: true }).order("name"),
      supabase.from("zone").select("id, name").order("name"),
    ]);
    if (usersData) setUsers(usersData as any);
    if (zonesData) setZones(zonesData);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleActive(user: Person) {
    setActionLoading(user.id);
    const { error } = await supabase
      .from("people")
      .update({ active: !user.active })
      .eq("id", user.id);
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u))
      );
    }
    setActionLoading(null);
  }

  async function changeZone(userId: number, newZoneId: number) {
    setActionLoading(userId);
    const { error } = await supabase
      .from("people")
      .update({ zone_id: newZoneId })
      .eq("id", userId);
    if (!error) {
      const zoneName = zones.find((z) => z.id === newZoneId)?.name || "";
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, zone_id: newZoneId, zone: { name: zoneName } } : u
        )
      );
    }
    setActionLoading(null);
  }

  async function deleteUser(user: Person) {
    setActionLoading(user.id);
    const res = await deleteUserAction(user.supabase_uid, user.id);
    if (res.success) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      alert("ইউজার মুছতে ব্যর্থ হয়েছে: " + res.error);
    }
    setActionLoading(null);
    setConfirmDelete(null);
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter((u) => u.active).length;
  const pendingCount = users.filter((u) => !u.active).length;
  const adminCount = users.filter((u) => u.role === "admin" || u.role === "superadmin").length;

  const stats = [
    { label: "সক্রিয় ইউজার", value: activeCount, icon: UserCheck, color: "text-green-600", bg: "bg-green-100" },
    { label: "অপেক্ষমাণ", value: pendingCount, icon: UserPlus, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "অ্যাডমিন", value: adminCount, icon: ShieldCheck, color: "text-primary", bg: "bg-primary/10" },
    { label: "মোট", value: users.length, icon: Users, color: "text-gray-600", bg: "bg-gray-100" },
  ];

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
          <h1 className="text-3xl font-black tracking-tight">ইউজার ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground">সিস্টেমের সকল ব্যবহারকারী এবং তাদের অনুমতি নিয়ন্ত্রণ করুন</p>
        </div>
        <button
          onClick={fetchData}
          className="modern-btn border border-border bg-card px-4 py-2 text-sm font-bold flex items-center gap-2 active:scale-95 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="premium-card p-4 flex items-center gap-4 border-muted/50">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
          className="modern-input pl-10 h-12 bg-muted/30 focus:bg-background w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="premium-card p-6 border-muted/50 hover:border-primary/30 transition-all group relative overflow-hidden"
          >
            {/* Avatar + Name */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xl border-2 border-primary/20">
                {user.name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-lg truncate">{user.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">User ID</p>
                <p className="font-bold">#{user.user_id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">ভূমিকা</p>
                <p className="font-bold capitalize">{user.role}</p>
              </div>
            </div>

            {/* Zone Reassignment */}
            <div className="mt-4 space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1">
                <MapPin className="w-3 h-3" /> জোন
              </p>
              <select
                value={user.zone_id}
                onChange={(e) => changeZone(user.id, parseInt(e.target.value))}
                disabled={actionLoading === user.id}
                className="w-full p-2 text-sm bg-muted/30 border border-border rounded-xl font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions Footer */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-muted/30">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  user.active
                    ? "bg-green-500/10 text-green-600 border border-green-500/20"
                    : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                }`}
              >
                {user.active ? "সক্রিয়" : "অপেক্ষমাণ"}
              </span>

              <div className="flex items-center gap-2">
                {/* Approve / Deactivate */}
                <button
                  onClick={() => toggleActive(user)}
                  disabled={actionLoading === user.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                    user.active
                      ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                      : "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                  }`}
                >
                  {actionLoading === user.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : user.active ? (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      <span>নিষ্ক্রিয় করুন</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>অনুমোদন করুন</span>
                    </>
                  )}
                </button>

                {/* Delete */}
                {confirmDelete === user.id ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => deleteUser(user)}
                      disabled={actionLoading === user.id}
                      className="px-2.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "হ্যাঁ"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-2.5 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      না
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(user.id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 active:scale-95 transition-all shadow-sm cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground font-bold">
          কোনো ইউজার পাওয়া যায়নি।
        </div>
      )}
    </div>
  );
}
