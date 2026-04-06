/**
 * useAuth — shared hook that resolves the Supabase session once on mount.
 *
 * Returns:
 *   session  – the active session object, or null if signed out
 *   loading  – true while the session is still being retrieved from storage
 *
 * Usage: call this at the top of any data-fetching hook, then gate the
 *        fetch behind `if (loading || !session) return;`
 */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 1. Resolve the initial session immediately (avoids the race on mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Keep in sync with sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}
