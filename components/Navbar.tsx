'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredSession, clearStoredSession } from '@/lib/supabase';
import { StudentSession } from '@/types/database';
import { GraduationCap, LogOut, LayoutDashboard, ShieldCheck, UserCheck } from 'lucide-react';

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href={session ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:bg-blue-700 transition">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              AICE Basic
            </span>
            <span className="text-xs block text-slate-500 font-medium">모의고사 테스트 플랫폼</span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              {/* Student Session Info Badge */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>{session.school}</span>
                <span className="text-slate-300">|</span>
                <span className="font-semibold text-slate-900">{session.student_name}</span>
                <span className="text-slate-400">({session.student_id})</span>
              </div>

              {/* Dashboard Link */}
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  pathname === '/dashboard'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                대시보드
              </Link>

              {/* Admin Link */}
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  pathname === '/admin'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                관리자
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </>
          ) : (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              관리자 페이지
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
