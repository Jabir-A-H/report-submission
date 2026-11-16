"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

export interface UserProfile {
  id?: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role: string;
  zone_id?: number | null;
  active?: boolean;
  supabase_uid?: string;
  zone?: { name: string } | { name: string }[] | null;
  [key: string]: any;
}

export interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  role: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  zoneId: number | null;
  zoneName: string;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchUserProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setUser(authUser);
      const { data, error } = await supabase
        .from("people")
        .select("id, name, email, phone, role, zone_id, active, supabase_uid, zone(name)")
        .eq("supabase_uid", authUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error);
      }
      setProfile((data as unknown as UserProfile) || null);
    } catch (err) {
      console.error("Unexpected error in fetchUserProfile:", err);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      await fetchUserProfile(currentUser);
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  }, [supabase, fetchUserProfile]);

  useEffect(() => {
    let isMounted = true;

    // Initial check
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (isMounted) {
        fetchUserProfile(authUser);
      }
    }).catch(() => {
      if (isMounted) {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        if (session?.user) {
          fetchUserProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserProfile]);

  const role = profile?.role || "user";
  const isAdmin = role === "admin" || role === "superadmin";
  const isSuperAdmin = role === "superadmin";
  const zoneId = profile?.zone_id ?? null;
  const zoneObj = Array.isArray(profile?.zone) ? profile.zone[0] : profile?.zone;
  const zoneName = zoneObj?.name || "";

  const value = useMemo<UserContextType>(() => ({
    user,
    profile,
    role,
    isAdmin,
    isSuperAdmin,
    zoneId,
    zoneName,
    isLoading,
    refreshProfile,
  }), [user, profile, role, isAdmin, isSuperAdmin, zoneId, zoneName, isLoading, refreshProfile]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
