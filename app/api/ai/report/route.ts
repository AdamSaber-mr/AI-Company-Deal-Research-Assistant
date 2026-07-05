import { getCurrentUser } from "@/lib/server/session";
import { aiAvailable, generateReport } from "@/lib/server/ai";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Niet ingelogd." }, { status: 401 });
  if (!aiAvailable()) return Response.json({ fallback: true });

  const markdown = await generateReport(me);
  if (!markdown) return Response.json({ fallback: true });
  return Response.json({ report: { markdown } });
}
