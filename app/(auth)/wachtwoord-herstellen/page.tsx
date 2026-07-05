import { ResetPasswordCard } from "@/components/auth/ResetPasswordCard";

export const metadata = { title: "Nieuw wachtwoord · Kompas" };

// searchParams is een promise in deze Next-versie → awaiten.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordCard token={token ?? ""} />;
}
