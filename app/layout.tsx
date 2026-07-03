import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bedrijfs Command Center",
  description:
    "Eén dashboard voor omzet, klantenservice, voorraad en personeel — met AI die afwijkingen signaleert.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Zet het gekozen thema vóór de eerste paint om een flits te voorkomen */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
