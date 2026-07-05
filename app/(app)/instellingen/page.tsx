"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { openSettings } from "@/components/SettingsModal";

// Instellingen zijn nu een pop-up. Deze route blijft werken voor directe
// links/bookmarks: hij opent de pop-up en toont het overzicht erachter.
export default function InstellingenPage() {
  const router = useRouter();

  useEffect(() => {
    openSettings();
    router.replace("/overzicht");
  }, [router]);

  return null;
}
