"use client";

import { useEffect, useState } from "react";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  company: string;
  avatar?: string;
} | null;

/** Laat alle useCurrentUser-hooks opnieuw ophalen (na profielwijziging). */
export function refreshCurrentUser() {
  window.dispatchEvent(new Event("kompas:user-refresh"));
}

/** Haalt de ingelogde gebruiker op via /api/auth/me (client-side). */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const load = () => {
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => {
          if (alive) {
            setUser((d?.user as CurrentUser) ?? null);
            setLoading(false);
          }
        })
        .catch(() => {
          if (alive) setLoading(false);
        });
    };

    load();
    window.addEventListener("kompas:user-refresh", load);
    return () => {
      alive = false;
      window.removeEventListener("kompas:user-refresh", load);
    };
  }, []);

  return { user, loading };
}
