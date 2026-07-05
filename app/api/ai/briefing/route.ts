import { getCurrentUser } from "@/lib/server/session";
import { aiAvailable, generateBriefing } from "@/lib/server/ai";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Niet ingelogd." }, { status: 401 });
  if (!aiAvailable()) return Response.json({ fallback: true });

  const briefing = await generateBriefing(me);
  if (!briefing) return Response.json({ fallback: true });
  return Response.json({ briefing });
}
