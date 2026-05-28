import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClmShell } from "@/components/clm/ClmShell";
import { getCurrentProfile } from "@/lib/auth/session";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vertia Legal",
  description: "Control documental inteligente para estudios jurídicos y contables",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
        <ClmShell profile={profile}>{children}</ClmShell>
      </body>
    </html>
  );
}
