import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "AICE Basic 모의고사 웹 앱",
  description: "AICE Basic 실전 모의고사 및 실습 문제 응시, 자동 채점 및 관리자 성적 확인 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
            © 2026 AICE Basic Mock Examination System. All rights reserved. (Next.js, Tailwind CSS, Supabase)
          </div>
        </footer>
      </body>
    </html>
  );
}
