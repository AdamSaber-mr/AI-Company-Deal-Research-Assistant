"use client";

import { useEffect } from "react";
import { migrateLegacyData, notifyScope, setActiveUserId } from "@/lib/scope";
import { DEFAULT_SETTINGS, hasStoredSettings, saveSettings } from "@/lib/settings";

/**
 * Zet de per-account naamruimte voor localStorage (chats + instellingen) op
 * basis van de ingelogde gebruiker uit de server-sessie. Doet dat synchroon in
 * render zodat de eerste client-snapshot al de juiste sleutel leest, en vult
 * bij een gloednieuw account de instellingen met naam + bedrijf.
 */
export function AccountScope({
  user,
  children,
}: {
  user: { id: string; name: string; company: string };
  children: React.ReactNode;
}) {
  setActiveUserId(user.id);

  useEffect(() => {
    setActiveUserId(user.id);
    // Data van vóór de account-scheiding eenmalig aan dit account koppelen.
    if (migrateLegacyData(user.id)) notifyScope();
    if (!hasStoredSettings()) {
      saveSettings({
        ...DEFAULT_SETTINGS,
        ownerName: user.name,
        companyName: user.company,
      });
    }
  }, [user.id, user.name, user.company]);

  return <>{children}</>;
}
