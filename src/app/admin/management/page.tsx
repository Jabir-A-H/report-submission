"use client";

import { useState, useEffect, useMemo } from "react";
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
  Map,
  Plus,
  Users2,
  TrendingUp,
  FileText,
} from "lucide-react";

import { deleteUserAction } from "./actions";

// ─── Types ───────────────────────────────────────────────────────────
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

type ZoneWithStats = {
  id: number;
  name: string;
  user_count: number;
  report_count: number;
};

// ─── Component ───────────────────────────────────────────────────────
export default function ManagementPage() {
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<"users" | "zones">("users");

  // ── Users state ──
  const [users, setUsers] = useState<Person[]>([]);
  const [userZones, setUserZones] = useState<Zone[]>([]);
  const [search, setSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [userActionLoading, setUserActionLoading] = useState<number | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<number | null>(null);

  // ── Zones state ──
  const [zonesWithStats, setZonesWithStats] = useState<ZoneWithStats[]>([]);
  const [newZoneName, setNewZoneName] = useState("");
  const [zonesLoading, setZonesLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [zoneActionLoading, setZoneActionLoading] = useState<number | null>(null);
  const [confirmDeleteZone, setConfirmDeleteZone] = useState<number | null>(null);
  const [zoneError, setZoneError] = useState<string | null>(null);

  // ── Users data fetch ──
  async function fetchUsers() {
    setUsersLoading(true);
    const [{ data: usersData }, { data: zonesData }] = await Promise.all([
      supabase.from("people").select("*, zone(name)").order("active", { ascending: true }).order("name"),
      supabase.from("zone").select("id, name").order("name"),
    ]);
    if (usersData) setUsers(usersData as any);
    if (zonesData) setUserZones(zonesData);
    setUsersLoading(false);
  }

  // ── Zones data fetch ──
  async function fetchZones() {
    setZonesLoading(true);
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
      setZonesWithStats(enriched);
    }
    setZonesLoading(false);
  }

  useEffect(() => {
    fetchUsers();
    fetchZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── User actions ──
  async function toggleActive(user: Person) {
    setUserActionLoading(user.id);
    const { error } = await supabase
      .from("people")
      .update({ active: !user.active })
      .eq("id", user.id);
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u))
      );
    }
    setUserActionLoading(null);
  }

  async function changeZone(userId: number, newZoneId: number) {
    setUserActionLoading(userId);
    const { error } = await supabase
      .from("people")
      .update({ zone_id: newZoneId })
      .eq("id", userId);
    if (!error) {
      const zoneName = userZones.find((z) => z.id === newZoneId)?.name || "";
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, zone_id: newZoneId, zone: { name: zoneName } } : u
        )
      );
    }
    setUserActionLoading(null);
  }

  async function deleteUser(user: Person) {
    setUserActionLoading(user.id);
    const res = await deleteUserAction(user.supabase_uid, user.id);
    if (res.success) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      alert("ইউজার মুছতে ব্যর্থ হয়েছে: " + res.error);
    }
    setUserActionLoading(null);
    setConfirmDeleteUser(null);
  }

  // ── Zone actions ──
  async function addZone() {
    const trimmed = newZoneName.trim();
    if (!trimmed) return;

    setAddLoading(true);
    setZoneError(null);

    const exists = zonesWithStats.some((z) => z.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setZoneError("এই নামে একটি জোন ইতিমধ্যে বিদ্যমান।");
      setAddLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("zone")
      .insert({ name: trimmed })
      .select()
      .single();

    if (insertError) {
      setZoneError("জোন যোগ করতে সমস্যা হয়েছে।");
    } else if (data) {
      setZonesWithStats((prev) => [...prev, { ...data, user_count: 0, report_count: 0 }]);
      setNewZoneName("");
    }
    setAddLoading(false);
  }

  async function deleteZone(zoneId: number) {
    const zone = zonesWithStats.find((z) => z.id === zoneId);
    if (zone && zone.user_count > 0) {
      setZoneError(`"${zone.name}" জোনে ${zone.user_count} জন ইউজার রয়েছে। আগে তাদের অন্য জোনে সরান।`);
      setConfirmDeleteZone(null);
      return;
    }

    setZoneActionLoading(zoneId);
    const { error: delError } = await supabase.from("zone").delete().eq("id", zoneId);
    if (!delError) {
      setZonesWithStats((prev) => prev.filter((z) => z.id !== zoneId));
    } else {
      setZoneError("মুছতে সমস্যা হয়েছে। এই জোনের সাথে রিপোর্ট যুক্ত থাকতে পারে।");
    }
    setZoneActionLoading(null);
    setConfirmDeleteZone(null);
  }

  // ── Derived user data ──
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter((u) => u.active).length;
  const pendingCount = users.filter((u) => !u.active).length;
  const adminCount = users.filter((u) => u.role === "admin" || u.role === "superadmin").length;

  const userStats = [
    { label: "সক্রিয় ইউজার", value: activeCount, icon: UserCheck, color: "text-green-600", bg: "bg-green-100" },
    { label: "অপেক্ষমাণ", value: pendingCount, icon: UserPlus, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "অ্যাডমিন", value: adminCount, icon: ShieldCheck, color: "text-primary", bg: "bg-primary/10" },
    { label: "মোট", value: users.length, icon: Users, color: "text-gray-600", bg: "bg-gray-100" },
  ];

  // ── Refresh handler ──
  function handleRefresh() {
    if (activeTab === "users") fetchUsers();
    else fetchZones();
  }

  const isLoading = activeTab === "users" ? usersLoading : zonesLoading;

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="container py-8 space-y-8 pb-32">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground">ব্যবহারকারী এবং জোন সমূহ নিয়ন্ত্রণ করুন</p>
        </div>
        <button
          onClick={handleRefresh}
          className="modern-btn border border-border bg-card px-4 py-2 text-sm font-bold flex items-center gap-2 active:scale-95 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 text-sm font-bold transition-colors cursor-pointer ${
              activeTab === "users"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ব্যবহারকারী
          </button>
          <button
            onClick={() => setActiveTab("zones")}
            className={`px-6 py-3 text-sm font-bold transition-colors cursor-pointer ${
              activeTab === "zones"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            জোন
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* ═══════════════════ USERS TAB ═══════════════════ */}
      {activeTab === "users" && !usersLoading && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {userStats.map((stat) => (
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
                    disabled={userActionLoading === user.id}
                    className="w-full p-2 text-sm bg-muted/30 border border-border rounded-xl font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                  >
                    {userZones.map((z) => (
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
                      disabled={userActionLoading === user.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                        user.active
                          ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                          : "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                      }`}
                    >
                      {userActionLoading === user.id ? (
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
                    {confirmDeleteUser === user.id ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => deleteUser(user)}
                          disabled={userActionLoading === user.id}
                          className="px-2.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {userActionLoading === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "হ্যাঁ"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteUser(null)}
                          className="px-2.5 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold active:scale-95 transition-all cursor-pointer"
                        >
                          না
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteUser(user.id)}
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
        </>
      )}

      {/* ═══════════════════ ZONES TAB ═══════════════════ */}
      {activeTab === "zones" && !zonesLoading && (
        <>
          {/* Zone Stats Header */}
          <div className="flex items-center gap-3">
            <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">মোট জোন</p>
                <p className="text-lg font-black leading-none">{zonesWithStats.length}</p>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {zoneError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-sm font-bold flex items-center justify-between animate-in fade-in duration-200">
              <span>{zoneError}</span>
              <button onClick={() => setZoneError(null)} className="text-red-400 hover:text-red-600 font-black">✕</button>
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
                {zonesWithStats.map((zone) => (
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

                    {confirmDeleteZone === zone.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => deleteZone(zone.id)}
                          disabled={zoneActionLoading === zone.id}
                          className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-black active:scale-90 transition-all disabled:opacity-50"
                        >
                          {zoneActionLoading === zone.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "হ্যাঁ"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteZone(null)}
                          className="px-2 py-1 rounded-lg bg-muted text-xs font-black active:scale-90 transition-all"
                        >
                          না
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteZone(zone.id)}
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
        </>
      )}
    </div>
  );
}
