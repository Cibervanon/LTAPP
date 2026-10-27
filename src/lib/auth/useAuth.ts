"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useAuth() {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState<{
    user: { id: string; email: string | null } | null;
    profile: Profile | null;
  }>({ user: null, profile: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setSession({
          user: { id: session.user.id, email: session.user.email ?? null },
          profile: profile ?? null,
        });
      } else {
        setSession({ user: null, profile: null });
      }
      setLoading(false);
    };

    load();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if (event === "SIGNED_IN" && sess?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sess.user.id)
          .single();
        setSession({
          user: { id: sess.user.id, email: sess.user.email ?? null },
          profile: profile ?? null,
        });
      } else if (event === "SIGNED_OUT") {
        setSession({ user: null, profile: null });
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession({ user: null, profile: null });
  };

  return { session, loading, signIn, signUp, signOut };
}
