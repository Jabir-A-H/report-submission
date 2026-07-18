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
  Filter,
  X,
  Layers,
  ArrowRight,
} from "lucide-react";

import { deleteUserAction } from "./actions";
import { useLanguage } from "@/components/providers/language-provider";

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

type Zone = { id: number; name: string; zone_type?: string | null; parent_id?: number | null };

type ZoneWithStats = {
  id: number;
  name: string;
  zone_type?: string | null;
  parent_id?: number | null;
  parent_name?: string | null;
  user_count: number;
  report_count: number;
};

// ─── Component ───────────────────────────────────────────────────────
export default function ManagementPage() {
  const { t } = useLanguage();

  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<"users" | "zones">("users");

  // ── Users state ──
  const [users, setUsers] = useState<Person[]>([]);
  const [userZones, setUserZones] = useState<Zone[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [zoneFilter, setZoneFilter] = useState<"all" | number>("all");
  const [isMobileFiltersExpanded, setIsMobileFiltersExpanded] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userActionLoading, setUserActionLoading] = useState<number | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<number | null>(null);

  // ── Zones state ──
  const [zonesWithStats, setZonesWithStats] = useState<ZoneWithStats[]>([]);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneType, setNewZoneType] = useState<string>("zone");
  const [newZoneParentId, setNewZoneParentId] = useState<number | "">("");
  const [zonesLoading, setZonesLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [zoneActionLoading, setZoneActionLoading] = useState<number | null>(null);
  const [confirmDeleteZone, setConfirmDeleteZone] = useState<number | null>(null);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [selectedZoneForUsers, setSelectedZoneForUsers] = useState<ZoneWithStats | null>(null);

  // ── Users data fetch ──
  async function fetchUsers() {
    setUsersLoading(true);
    const [{ data: usersData }, { data: zonesData }] = await Promise.all([
      supabase.from("people").select("*, zone(name)").order("active", { ascending: true }).order("name"),
      supabase.from("zone").select("*").order("name"),
    ]);
    if (usersData) setUsers(usersData as any);
    if (zonesData) setUserZones(zonesData);
    setUsersLoading(false);
  }

  // ── Zones data fetch ──
  async function fetchZones() {
    setZonesLoading(true);
    const { data: zonesData } = await supabase.from("zone").select("*").order("name");

    if (zonesData) {
      const enriched: ZoneWithStats[] = await Promise.all(
        zonesData.map(async (zone) => {
          const parentZone = zonesData.find((z) => z.id === zone.parent_id);
          const [{ count: userCount }, { count: reportCount }] = await Promise.all([
            supabase.from("people").select("*", { count: "exact", head: true }).eq("zone_id", zone.id),
            supabase.from("report").select("*", { count: "exact", head: true }).eq("zone_id", zone.id),
          ]);
          return {
            ...zone,
            parent_name: parentZone?.name || null,
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
    if (!newZoneName.trim()) return;
    setAddLoading(true);
    setZoneError(null);

    const parentIdVal = newZoneParentId !== "" ? Number(newZoneParentId) : null;
    const parentNameVal = zonesWithStats.find((z) => z.id === parentIdVal)?.name || null;

    let { data, error } = await supabase
      .from("zone")
      .insert([
        {
          name: newZoneName.trim(),
          zone_type: newZoneType || "zone",
          parent_id: parentIdVal,
        },
      ])
      .select()
      .single();

    // Fallback for unmigrated database schemas missing zone_type/parent_id columns
    if (error && error.code === "42703") {
      const res = await supabase
        .from("zone")
        .insert([{ name: newZoneName.trim() }])
        .select()
        .single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      setZoneError(error.message);
    } else if (data) {
      setZonesWithStats((prev) => [
        ...prev,
        {
          ...data,
          parent_name: parentNameVal,
          user_count: 0,
          report_count: 0,
        },
      ]);
      setUserZones((prev) => [
        ...prev,
        { id: data.id, name: data.name, zone_type: data.zone_type, parent_id: data.parent_id },
      ]);
      setNewZoneName("");
      setNewZoneType("zone");
      setNewZoneParentId("");
      setIsAddZoneModalOpen(false);
    }
    setAddLoading(false);
  }

  async function deleteZone(zoneId: number) {
    const zone = zonesWithStats.find((z) => z.id === zoneId);
    if (zone && (zone.user_count > 0 || zone.report_count > 0)) {
      setZoneError(`এই জোনে ${zone.user_count} জন ইউজার ও ${zone.report_count} টি রিপোর্ট আছে। আগে এগুলো সরিয়ে নিন।`);
      setConfirmDeleteZone(null);
      return;
    }

    setZoneActionLoading(zoneId);
    const { error: delError } = await supabase.from("zone").delete().eq("id", zoneId);
    if (!delError) {
      setZonesWithStats((prev) => prev.filter((z) => z.id !== zoneId));
      setUserZones((prev) => prev.filter((z) => z.id !== zoneId));
    } else {
      setZoneError("মুছতে সমস্যা হয়েছে। এই জোনের সাথে রিপোর্ট বা অধীনস্থ জোন যুক্ত থাকতে পারে।");
    }
    setZoneActionLoading(null);
    setConfirmDeleteZone(null);
  }

  // ── Derived user data with Search & Filters ──
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search check
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.user_id?.toLowerCase().includes(q) ||
        u.zone?.name?.toLowerCase().includes(q);

      // Status check
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && Boolean(u.active)) ||
        (statusFilter === "pending" && !u.active);

      // Role check
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "user" && u.role === "user") ||
        (roleFilter === "admin" && (u.role === "admin" || u.role === "superadmin"));

      // Zone check
      const matchesZone =
        zoneFilter === "all" || u.zone_id === Number(zoneFilter);

      return matchesSearch && matchesStatus && matchesRole && matchesZone;
    });
  }, [users, search, statusFilter, roleFilter, zoneFilter]);

  const activeCount = users.filter((u) => u.active).length;
  const pendingCount = users.filter((u) => !u.active).length;
  const adminCount = users.filter((u) => u.role === "admin" || u.role === "superadmin").length;

  const userStats = [
    { label: t.labels.activeUser, value: activeCount, icon: UserCheck, color: "text-green-600", bg: "bg-green-100" },
    { label: t.labels.pendingUser, value: pendingCount, icon: UserPlus, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Admin", value: adminCount, icon: ShieldCheck, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total", value: users.length, icon: Users, color: "text-gray-600", bg: "bg-gray-100" },
  ];

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setRoleFilter("all");
    setZoneFilter("all");
  }

  const hasActiveFilters = Boolean(search || statusFilter !== "all" || roleFilter !== "all" || zoneFilter !== "all");

  // Assigned users for selected modal zone
  const assignedUsersForSelectedZone = useMemo(() => {
    if (!selectedZoneForUsers) return [];
    return users.filter((u) => u.zone_id === selectedZoneForUsers.id);
  }, [selectedZoneForUsers, users]);

  function getZoneTypeLabel(type?: string | null) {
    switch (type) {
      case "city":
        return t.labels.cityLevel;
      case "thana":
        return t.labels.thanaLevel;
      case "ward":
        return t.labels.wardLevel;
      case "zone":
      default:
        return t.labels.zoneLevel;
    }
  }

  function getZoneTypeBadgeClass(type?: string | null) {
    switch (type) {
      case "city":
        return "bg-purple-500/10 text-purple-600 border border-purple-500/20";
      case "thana":
        return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
      case "ward":
        return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
      case "zone":
      default:
        return "bg-blue-500/10 text-blue-600 border border-blue-500/20";
    }
  }

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
          <h1 className="text-3xl font-black tracking-tight">{t.management}</h1>
          <p className="text-muted-foreground">{t.labels.managementSubtitle}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="modern-btn border border-border bg-card px-4 py-2 text-sm font-bold flex items-center gap-2 active:scale-95 transition-all self-start md:self-auto cursor-pointer"
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
            {t.labels.activeUser.split(" ")[1] || "Users"}
          </button>
          <button
            onClick={() => setActiveTab("zones")}
            className={`px-6 py-3 text-sm font-bold transition-colors cursor-pointer ${
              activeTab === "zones"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Zones
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
          {/* Desktop Stats Grid (Hidden on small screens) */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Mobile Compact KPI Ribbon (Hidden on desktop) */}
          <div className="sm:hidden flex items-center justify-between p-3 bg-card border border-border/80 rounded-2xl shadow-2xs text-xs font-bold divide-x divide-border/60">
            <div className="flex items-center gap-1.5 px-2 text-green-600 first:pl-0">
              <span>{t.userStats.active}:</span>
              <strong className="font-black text-sm">{activeCount}</strong>
            </div>
            <div className="flex items-center gap-1.5 px-2 text-amber-600">
              <span>{t.userStats.pending}:</span>
              <strong className="font-black text-sm">{pendingCount}</strong>
            </div>
            <div className="flex items-center gap-1.5 px-2 text-primary">
              <span>{t.userStats.admin}:</span>
              <strong className="font-black text-sm">{adminCount}</strong>
            </div>
            <div className="flex items-center gap-1.5 px-2 text-muted-foreground last:pr-0">
              <span>{t.userStats.total}:</span>
              <strong className="font-black text-sm text-foreground">{users.length}</strong>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="premium-card p-4 sm:p-5 border-muted/50 bg-card space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-foreground">
                <Filter className="w-4 h-4 text-primary" />
                <span>{t.labels.filterOptions || "Search & Filter Options"}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile Filter Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersExpanded(!isMobileFiltersExpanded)}
                  className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/80 bg-muted/40 text-[11px] font-bold text-foreground active:scale-95 transition-all cursor-pointer"
                >
                  <span>{isMobileFiltersExpanded ? t.labels.hideFilters : (t.labels.filterOptions || "Filter Options")}</span>
                  {hasActiveFilters && !isMobileFiltersExpanded && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t.labels.resetFilters}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Always visible Search input on both mobile and desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t.labels.searchUsers}
                  className="modern-input pl-10 pr-8 h-11 bg-muted/20 focus:bg-background text-sm font-bold w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Collapsible Dropdowns on mobile, always grid-aligned on sm and up */}
              <div className={`${isMobileFiltersExpanded ? "grid grid-cols-1 gap-3.5" : "hidden"} sm:contents`}>
                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full h-11 px-3.5 text-sm bg-muted/20 border border-border rounded-xl font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">{t.labels.allStatus}</option>
                    <option value="active">{t.labels.activeUser}</option>
                    <option value="pending">{t.labels.pendingUser}</option>
                  </select>
                </div>

                {/* Role Filter */}
                <div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="w-full h-11 px-3.5 text-sm bg-muted/20 border border-border rounded-xl font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">{t.labels.allRoles}</option>
                    <option value="user">{t.labels.normalUser}</option>
                    <option value="admin">{t.labels.adminRole}</option>
                  </select>
                </div>

                {/* Zone Filter */}
                <div>
                  <select
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="w-full h-11 px-3.5 text-sm bg-muted/20 border border-border rounded-xl font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">{t.labels.allZones}</option>
                    {userZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Filter Results Summary */}
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pt-1 border-t border-border/40">
              <span>{t.labels.displayedUsers}: <strong className="text-foreground font-black">{filteredUsers.length}</strong> {t.labels.outOfTotal.replace("জনের মধ্যে", "").trim()} ({t.labels.activeUser.split(" ")[1] || "Users"} {users.length})</span>
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="premium-card p-6 border-muted/50 hover:border-primary/30 transition-all group relative overflow-hidden"
              >
                {/* Avatar + Name */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xl border-2 border-primary/20 shrink-0">
                    {user.name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg truncate">{user.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">User ID</p>
                    <p className="font-bold truncate">#{user.user_id}</p>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">ভূমিকা</p>
                    <p className="font-bold capitalize truncate">{user.role}</p>
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
                    {user.active ? t.userStats.active : t.userStats.pending}
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
            <div className="text-center py-12 text-muted-foreground font-bold space-y-3">
              <p className="text-base">{t.labels.noUsersFound}</p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-primary/10 text-primary font-black rounded-xl text-xs hover:bg-primary/20 transition-all cursor-pointer"
                >
                  {t.labels.resetFilters}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════ ZONES TAB ═══════════════════ */}
      {activeTab === "zones" && !zonesLoading && (
        <>
          {/* Zone Stats Header with Right-Aligned Add Zone Plus Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="bg-primary/5 px-4 py-3 rounded-2xl border border-primary/10 flex items-center gap-3 self-start">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.zoneStats.total}</p>
                <p className="text-xl font-black leading-none">{zonesWithStats.length}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setZoneError(null);
                setNewZoneName("");
                setNewZoneType("zone");
                setNewZoneParentId("");
                setIsAddZoneModalOpen(true);
              }}
              className="modern-btn btn-primary px-5 py-3 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2.5 font-black active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>{t.labels.addZone}</span>
            </button>
          </div>

          {/* Error Banner */}
          {zoneError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-sm font-bold flex items-center justify-between animate-in fade-in duration-200">
              <span>{zoneError}</span>
              <button onClick={() => setZoneError(null)} className="text-red-400 hover:text-red-600 font-black cursor-pointer">✕</button>
            </div>
          )}

          {/* Full-Width Zone List Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              <span>{t.labels.zoneListTitle}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {zonesWithStats.map((zone) => (
                <div
                  key={zone.id}
                  className="premium-card p-5 border-muted/50 hover:border-primary/20 transition-all group flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Zone Name + Delete Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-lg truncate text-foreground">{zone.name}</h3>
                          {/* Zone Type Badge */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${getZoneTypeBadgeClass(zone.zone_type)}`}>
                              {getZoneTypeLabel(zone.zone_type)}
                            </span>
                            {zone.parent_name && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground flex items-center gap-1">
                                <Layers className="w-2.5 h-2.5" />
                                <span>{t.labels.subordinate} {zone.parent_name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {confirmDeleteZone === zone.id ? (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => deleteZone(zone.id)}
                            disabled={zoneActionLoading === zone.id}
                            className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-black active:scale-90 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {zoneActionLoading === zone.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "হ্যাঁ"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteZone(null)}
                            className="px-2.5 py-1.5 rounded-lg bg-muted text-xs font-black active:scale-90 transition-all cursor-pointer"
                          >
                            না
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteZone(zone.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all active:scale-90 shrink-0 cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Stats & Assigned Users Quick View Button */}
                  <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>{zone.report_count} {t.labels.reportsCount}</span>
                    </span>

                    <button
                      onClick={() => setSelectedZoneForUsers(zone)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-black text-xs hover:bg-primary/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Users2 className="w-3.5 h-3.5" />
                      <span>{zone.user_count} {t.labels.viewUsers}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Assigned Users Quick View Modal ─── */}
          {selectedZoneForUsers && (
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedZoneForUsers(null);
                }
              }}
            >
              <div className="premium-card p-6 bg-card border border-border shadow-2xl max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                <div className="flex items-start justify-between border-b border-border/60 pb-3 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-primary block">অন্তর্ভুক্ত ইউজার তালিকা</span>
                    <h3 className="text-xl font-black text-foreground flex items-center gap-2 mt-0.5">
                      <span>{selectedZoneForUsers.name}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${getZoneTypeBadgeClass(selectedZoneForUsers.zone_type)}`}>
                        {getZoneTypeLabel(selectedZoneForUsers.zone_type)}
                      </span>
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedZoneForUsers(null)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto space-y-2.5 pr-1 grow max-h-[50vh]">
                  {assignedUsersForSelectedZone.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground font-bold text-sm">
                      এই জোনে বর্তমানে কোনো ইউজার যুক্ত নেই।
                    </div>
                  ) : (
                    assignedUsersForSelectedZone.map((u) => (
                      <div
                        key={u.id}
                        className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                            {u.name?.[0] || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-sm truncate text-foreground">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              u.role === "admin" || u.role === "superadmin"
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {u.role}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.active
                                ? "bg-green-500/10 text-green-600"
                                : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {u.active ? t.userStats.active : t.userStats.pending}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedZoneForUsers(null)}
                    className="px-4 py-2.5 rounded-xl border border-border bg-muted/40 font-bold text-xs hover:bg-muted transition-all cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                  <button
                    onClick={() => {
                      const zId = selectedZoneForUsers.id;
                      setSelectedZoneForUsers(null);
                      setActiveTab("users");
                      setZoneFilter(zId);
                    }}
                    className="modern-btn btn-primary px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
                  >
                    <span>এই জোনের ইউজার বিস্তারিত পরিচালনা করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Floating New Zone Modal with Hierarchy & Zone Type ─── */}
          {isAddZoneModalOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200"
              onClick={(e) => {
                if (e.target === e.currentTarget && !newZoneName.trim() && !addLoading) {
                  setIsAddZoneModalOpen(false);
                  setZoneError(null);
                }
              }}
            >
              <div className="premium-card p-6 bg-card border border-border shadow-2xl max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-lg font-black flex items-center gap-2 text-foreground">
                    <Plus className="w-5 h-5 text-primary" />
                    <span>নতুন এলাকা বা জোন তৈরি করুন</span>
                  </h3>
                  <button
                    onClick={() => {
                      setIsAddZoneModalOpen(false);
                      setZoneError(null);
                    }}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {zoneError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-xs font-bold">
                    {zoneError}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Zone Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">জোনের / এলাকার নাম</label>
                    <input
                      type="text"
                      placeholder="এলাকার নাম লিখুন (যেমন: মিরপুর জোন বা ধানমন্ডি থানা)..."
                      className="modern-input h-11 text-sm font-bold w-full"
                      value={newZoneName}
                      onChange={(e) => setNewZoneName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addZone()}
                      autoFocus
                    />
                  </div>

                  {/* Zone Type Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">এলাকার ধরন (Zone Type)</label>
                    <select
                      value={newZoneType}
                      onChange={(e) => setNewZoneType(e.target.value)}
                      className="w-full h-11 px-3 text-sm bg-muted/20 border border-border rounded-xl font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                    >
                      <option value="zone">জোন পর্যায় (Zone)</option>
                      <option value="city">সিটি / নগর পর্যায় (City - যেমন: DCS)</option>
                      <option value="thana">থানা পর্যায় (Thana)</option>
                      <option value="ward">ওয়ার্ড / হালকা পর্যায় (Ward)</option>
                    </select>
                  </div>

                  {/* Hierarchy Parent Zone Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ঊর্ধ্বতন জোন / প্যারেন্ট (Hierarchy Parent)</label>
                    <select
                      value={newZoneParentId}
                      onChange={(e) => setNewZoneParentId(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-11 px-3 text-sm bg-muted/20 border border-border rounded-xl font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                    >
                      <option value="">— কোনো ঊর্ধ্বতন জোন নেই (Root / City level)</option>
                      {zonesWithStats.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({getZoneTypeLabel(z.zone_type)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setIsAddZoneModalOpen(false);
                        setZoneError(null);
                      }}
                      className="flex-1 py-3.5 rounded-xl border border-border bg-muted/40 font-bold text-sm hover:bg-muted transition-all cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      onClick={addZone}
                      disabled={addLoading || !newZoneName.trim()}
                      className="flex-1 modern-btn btn-primary py-3.5 font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {addLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          <span>যোগ করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
