"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  CheckCircle2,
  XCircle,
  UserCheck,
  ShieldAlert,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean | null;
  user_id: string;
}

export default function AdminApproval() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .order("active", { ascending: true });

    if (!error) setUsers(data || []);
    setLoading(false);
  }

  async function toggleActive(id: number, currentStatus: boolean | null) {
    const { error } = await supabase
      .from("people")
      .update({ active: !currentStatus })
      .eq("id", id);

    if (!error) {
      setUsers(
        users.map((u) =>
          u.id === id ? { ...u, active: !currentStatus } : u
        )
      );
    }
  }

  const pendingCount = users.filter((u) => !u.active).length;
  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">
              ব্যবহারকারী অনুমোদন
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {pendingCount > 0
                ? `${pendingCount} জন অপেক্ষমাণ`
                : "কোনো অপেক্ষমাণ ব্যবহারকারী নেই"}
            </p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="p-2.5 border border-border rounded-xl bg-card hover:bg-muted transition-all"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin text-primary" : "text-muted-foreground"}
          />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
              অপেক্ষমাণ
            </p>
            <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-green-600 tracking-wider">
              সক্রিয়
            </p>
            <p className="text-2xl font-black text-green-700">{activeCount}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">নাম / ইমেইল</th>
                <th className="px-6 py-4">স্ট্যাটাস</th>
                <th className="px-6 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{user.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.active ? (
                      <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-green-500/10 text-green-600 ring-1 ring-green-500/20">
                        <CheckCircle2 className="w-3 h-3" /> সক্রিয়
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
                        <Clock className="w-3 h-3" /> অপেক্ষমাণ
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleActive(user.id, user.active)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        user.active
                          ? "text-red-500 hover:bg-red-500/10"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                      }`}
                    >
                      {user.active ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      {user.active ? "নিষ্ক্রিয় করুন" : "অনুমোদন করুন"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="p-20 text-center text-muted-foreground font-medium italic">
              কোনো ব্যবহারকারী পাওয়া যায়নি
            </div>
          )}
        </div>
      )}
    </div>
  );
}
