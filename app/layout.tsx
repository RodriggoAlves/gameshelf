import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "./contexts/I18nContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { getUser } from "./actions/auth";

export const metadata: Metadata = {
  title: "Zerey",
  description: "Organize sua biblioteca de jogos e descubra novos títulos.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <I18nProvider>
          <div className="app-wrapper">
            <Header isAdmin={isAdmin} />
            <main className="main-layout" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {children}
            </main>
            <Footer />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
