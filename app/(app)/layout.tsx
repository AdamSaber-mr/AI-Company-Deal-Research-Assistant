import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/session";
import { Sidebar } from "@/components/Sidebar";

// Alles onder deze groep vereist een sessie. Niet ingelogd → naar /login.
// (redirect() gooit, dus buiten try/catch aanroepen.)
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
