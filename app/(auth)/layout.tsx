import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/session";

// Al ingelogd? Dan heeft de login/registratie geen zin → naar het dashboard.
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-10">
      {children}
    </div>
  );
}
