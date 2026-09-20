'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredSession, clearStoredSession } from '@/lib/supabase';
import { StudentSession } from '@/types/database';
import { GraduationCap, LogOut, LayoutDashboard, UserCheck } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<StudentSession | null>(null);

  useEffect(() => {
    setSession(getStoredSession());
  }, [pathname]);

  const handleLogout = () => {
    clearStoredSession();
    setSession(null);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href={session ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              AICE Basic
            </span>
            <span className="text-[11px] block text-slate-500 font-semibold -mt-1">모의고사 테스트 플랫폼</span>
          </div>
        </Link>

        {/* Navigation Actions (학생 화면 보안 강화: 관리자 버튼 제거) */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              {/* Student Session Info Badge */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>{session.school}</span>
                <span className="text-slate-300">|</span>
                <span className="font-bold text-slate-900">{session.student_name}</span>
                <span className="text-slate-400">({session.student_id})</span>
              </div>

              {/* Dashboard Link */}
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  pathname === '/dashboard'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                대시보드
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
