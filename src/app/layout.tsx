import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppFooter from "@/components/layout/AppFooter";
import AppHeader from "@/components/layout/AppHeader";
import { AuthProvider } from "@/context/AuthContext";
import { TripProvider } from "@/context/TripContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trip-Mate 여행 플래너",
  description: "Trip-Mate MVP를 통해 전 세계 여행 일정을 한 곳에서 관리하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-50 text-slate-900 antialiased`}
      >
        <a href="#main" className="skip-link">
          본문으로 바로가기
        </a>
        <AuthProvider>
          <TripProvider>
            <div className="flex min-h-screen flex-col">
              <AppHeader />
              <main id="main" className="flex-1 focus:outline-none">
                {children}
              </main>
              <AppFooter />
            </div>
          </TripProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
