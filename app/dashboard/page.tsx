'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoredSession, fetchExams, fetchSubmissionsByStudent, syncLocalSubmissionsToSupabase } from '@/lib/supabase';
import { StudentSession, Exam, Submission } from '@/types/database';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Award, 
  BookOpen, 
  History, 
  UserCheck,
  Sparkles,
  Play,
  ShieldCheck,
  BarChart2,
  Lock,
  RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<StudentSession | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const currentSession = getStoredSession();
    if (!currentSession) {
      router.push('/');
      return;
    }
    setSession(currentSession);

    async function loadDashboardData(sess: StudentSession) {
      setLoading(true);
      try {
        await syncLocalSubmissionsToSupabase();
      } catch (e) {
        console.warn('Dashboard sync error:', e);
      }
      const examData = await fetchExams();
      setExams(examData);

      const subData = await fetchSubmissionsByStudent(sess.school, sess.student_id);
      setSubmissions(subData);
      setLoading(false);
    }

    loadDashboardData(currentSession);
  }, [router]);

  const handleManualSync = async () => {
    if (!session) return;
    setIsSyncing(true);
    try {
      await syncLocalSubmissionsToSupabase();
      const freshSubData = await fetchSubmissionsByStudent(session.school, session.student_id);
      setSubmissions(freshSubData);
    } catch (e) {
      console.warn('Manual sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!session) return null;

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto">
      {/* 1. Header / Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 text-white p-8 sm:p-10 shadow-2xl shadow-blue-950/20">
        {/* Background Decorative Lighting Orbs */}
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 bottom-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-blue-100 border border-white/20">
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span>{session.school}</span>
              <span className="opacity-40">•</span>
              <span>학번: {session.student_id}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              {session.student_name} 학생, 환영합니다! 👋
            </h1>

            <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl font-medium leading-relaxed">
              AICE Basic 공식 실전 모의고사 대시보드입니다. 준비된 모의고사 회차를 선택하여 실전처럼 시험에 응시하고 결과를 확인하세요.
            </p>
          </div>

          {/* Quick Summary Counter Cards */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0">
            <div className="text-center px-4">
              <span className="block text-3xl font-black">{exams.length}회차</span>
              <span className="text-xs text-blue-200 font-semibold mt-0.5 block">응시 가능 모의고사</span>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center px-4">
              <span className="block text-3xl font-black text-emerald-300">{submissions.length}회</span>
              <span className="text-xs text-blue-200 font-semibold mt-0.5 block">완료한 시험 이력</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Available Exam Cards Grid Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">모의고사 회차 선택</h2>
              <p className="text-xs text-slate-500 font-medium">원하는 회차의 [시험 시작하기] 버튼을 눌러 응시하세요.</p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> 모든 시험 제한시간 60분
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 bg-slate-200/70 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.map((exam, idx) => (
              <div
                key={exam.id}
                className="group bg-white rounded-3xl border border-slate-200/90 p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Decorative Subtle Line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 group-hover:h-2 transition-all" />

                <div className="space-y-4">
                  {/* Category & Badge Bar */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200/70">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      제{idx + 1}회차 공식 모의고사
                    </span>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {exam.time_limit_minutes}분
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {exam.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {exam.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Meta & Start Exam Button */}
                <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      총 {exam.total_questions}문항
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      {exam.pass_score}점 이상 합격
                    </span>
                  </div>

                  <Link
                    href={`/exam/${exam.id}`}
                    className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 transition-all duration-200 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>시험 시작하기</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Student Past Exam History Section */}
      <div className="space-y-5 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">내 응시 이력 요약</h2>
              <p className="text-xs text-slate-500 font-medium">이전에 응시한 모의고사 제출 기록 및 채점 결과입니다.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200/80 flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '동기화 중...' : '데이터 새로고침'}</span>
            </button>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              누적 {submissions.length}건
            </span>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-10 text-center text-slate-500 space-y-3 shadow-xs">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-slate-800">아직 응시한 시험 기록이 없습니다.</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              위의 모의고사 카드에서 [시험 시작하기]를 클릭하여 첫 번째 모의고사에 도전해 보세요!
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs divide-y divide-slate-100">
            {submissions.map((sub) => {
              const matchedExam = exams.find((e) => e.id === sub.exam_id);
              const isReleased = Boolean(matchedExam?.is_result_released);
              const isPass = sub.pass_status === 'PASS';

              return (
                <div key={sub.id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-3.5 rounded-2xl flex items-center justify-center shrink-0 ${
                      !isReleased 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : isPass 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                      {!isReleased ? (
                        <Lock className="w-6 h-6 stroke-[2.2]" />
                      ) : isPass ? (
                        <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
                      ) : (
                        <XCircle className="w-6 h-6 stroke-[2.2]" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900">
                          {sub.exam_title || 'AICE Basic 모의고사'}
                        </h4>
                        {!isReleased ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> 성적 공개 대기 중 (강의 진행)
                          </span>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide ${
                            isPass 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {isPass ? 'PASS (합격)' : 'FAIL (불합격)'}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-3 font-medium">
                        <span>응시 일시: {new Date(sub.submitted_at).toLocaleString('ko-KR')}</span>
                        <span>•</span>
                        <span>{sub.school} ({sub.student_name})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 font-bold uppercase block">획득 점수</span>
                      {!isReleased ? (
                        <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 inline-block">
                          🔒 비공개 (강의 후 공개)
                        </span>
                      ) : (
                        <span className="text-xl font-black text-slate-900">
                          {sub.score} <span className="text-xs font-normal text-slate-500">/ {sub.total_score}점</span>
                        </span>
                      )}
                    </div>

                    {!isReleased ? (
                      <button
                        type="button"
                        onClick={() => alert('답안 제출이 완료되었습니다.\n강사님의 해설 강의 종료 후 관리자가 결과를 공개하면 채점 성적과 문항별 해설을 열람하실 수 있습니다.')}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-purple-50 text-slate-500 hover:text-purple-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 border border-slate-200"
                      >
                        <Lock className="w-4 h-4 text-purple-600" />
                        <span>결과 공개 대기 중</span>
                      </button>
                    ) : (
                      <Link
                        href={`/result?id=${sub.id}`}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-md shadow-purple-500/20"
                      >
                        <Award className="w-4 h-4" />
                        <span>채점 결과 및 해설 보기</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
