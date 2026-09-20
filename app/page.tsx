'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setStoredSession, getStoredSession, verifyStudent } from '@/lib/supabase';
import { 
  GraduationCap, 
  ArrowRight, 
  User, 
  School, 
  Hash, 
  Sparkles,
  ShieldCheck,
  BookCheck,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [school, setSchool] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const session = getStoredSession();
    if (session) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school.trim() || !studentId.trim() || !studentName.trim()) {
      setError('모든 항목(학교, 학번, 이름)을 올바르게 입력해 주세요.');
      return;
    }

    setError('');
    setIsVerifying(true);

    try {
      // Supabase aice.aice_students DB 및 fallback 데이터 검증
      const result = await verifyStudent(school, studentId, studentName);

      if (!result.valid) {
        setError(result.message || '등록되지 않은 학생입니다. 학교, 학번, 이름을 확인해 주세요.');
        setIsVerifying(false);
        return;
      }

      // 검증 성공시 세션 저장 후 대시보드로 이동
      await setStoredSession({
        school: school.trim(),
        student_id: studentId.trim(),
        student_name: studentName.trim()
      });

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('학생 정보 검증 중 오류가 발생했습니다.');
      setIsVerifying(false);
    }
  };

  const fillDemoStudent = () => {
    setSchool('남원용성고');
    setStudentId('1101');
    setStudentName('김재영');
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-10 px-4 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
      {/* Background Ambient Decorative Light Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Main Card Container */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/60 border border-white/80 p-8 sm:p-10 transition-all">
          
          {/* Header Section */}
          <div className="text-center space-y-3 mb-8">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/10">
                <GraduationCap className="w-11 h-11 stroke-[2.2]" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>

            <div className="space-y-1 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                <ShieldCheck className="w-3.5 h-3.5" /> AICE Basic 공식 실전 모의고사
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 pt-1">
                학생 로그인
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                등록된 학교, 학번, 이름을 입력한 후 대시보드로 이동하세요.
              </p>
            </div>
          </div>

          {/* Test Auto-fill Chip Button */}
          <div className="mb-6 text-center">
            <button
              type="button"
              onClick={fillDemoStudent}
              className="group inline-flex items-center gap-2 py-2 px-4 bg-slate-100/80 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-full text-xs font-semibold shadow-xs transition-all duration-200 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
              <span>남원용성고 1101 김재영 자동 입력하기</span>
            </button>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* School Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                학교 이름
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-slate-100 group-focus-within:bg-blue-50 group-focus-within:text-blue-600 text-slate-400 flex items-center justify-center transition-colors">
                  <School className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="예: 남원용성고"
                  className="w-full pl-14 pr-4 py-3.5 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Student ID Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                학번 / 수험번호
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-slate-100 group-focus-within:bg-blue-50 group-focus-within:text-blue-600 text-slate-400 flex items-center justify-center transition-colors">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="예: 1101"
                  className="w-full pl-14 pr-4 py-3.5 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Student Name Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                학생 이름
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-slate-100 group-focus-within:bg-blue-50 group-focus-within:text-blue-600 text-slate-400 flex items-center justify-center transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="예: 김재영"
                  className="w-full pl-14 pr-4 py-3.5 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Large Gradient Submit Button */}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-all duration-200"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>학생 정보 확인 중...</span>
                </>
              ) : (
                <>
                  <span>대시보드로 이동하기</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Footer Info Feature Pills */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3 text-center text-[11px] text-slate-500 font-medium">
            <div className="flex items-center justify-center gap-1.5 bg-slate-50 py-2 px-3 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>60분 타이머 포함</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 bg-slate-50 py-2 px-3 rounded-xl">
              <BookCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>aice.aice_students 연동</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
