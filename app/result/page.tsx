'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAllSubmissions, fetchProblemsByExamId, fetchExamById, checkAnswerCorrect } from '@/lib/supabase';
import { Submission, Problem, Exam } from '@/types/database';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  LayoutDashboard, 
  HelpCircle, 
  Check, 
  X,
  BookOpen,
  UserCheck,
  Lock
} from 'lucide-react';

function ResultContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('id');
  const router = useRouter();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubmission() {
      setLoading(true);
      const allSubs = await fetchAllSubmissions();
      const found = allSubs.find((s) => s.id === submissionId) || allSubs[0];

      if (found) {
        setSubmission(found);
        const [probList, examData] = await Promise.all([
          fetchProblemsByExamId(found.exam_id),
          fetchExamById(found.exam_id)
        ]);
        setProblems(probList);
        setExam(examData);
      }
      setLoading(false);
    }

    loadSubmission();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-600">시험 정보 및 제출 데이터를 로딩 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
        <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">채점 결과 데이터를 찾을 수 없습니다.</h2>
        <Link href="/dashboard" className="inline-block px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs">
          대시보드로 이동
        </Link>
      </div>
    );
  }

  // Blind Check: Block viewing results if exam results are unreleased by admin
  if (exam && !exam.is_result_released) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 text-center space-y-6 shadow-xl">
        <div className="w-20 h-20 bg-purple-100 text-purple-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-10 h-10 stroke-[2.2]" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-purple-50 text-purple-800 text-xs font-black rounded-full border border-purple-200">
            🔒 성적 결과 비공개 (BLIND TEST)
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight pt-1">
            강사님의 해설 강의 진행 중
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium pt-1">
            답안 제출이 안전하게 저장되었습니다.<br />
            <span className="font-extrabold text-purple-700">강사님의 해설 강의 완료 후 관리자가 결과를 공개</span>하면 본인의 점수, 합격 여부, 상세 오답 노트를 열람하실 수 있습니다.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>대시보드로 돌아가기</span>
        </Link>
      </div>
    );
  }

  const isPass = submission.pass_status === 'PASS';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Banner Card: Pass/Fail Score Callout */}
      <div className={`rounded-3xl p-8 text-white shadow-xl relative overflow-hidden ${
        isPass 
          ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800' 
          : 'bg-gradient-to-br from-rose-600 via-red-600 to-rose-800'
      }`}>
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold">
                <UserCheck className="w-4 h-4" />
                {submission.school} | {submission.student_name} ({submission.student_id})
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">
                {submission.exam_title || 'AICE Basic 모의고사'}
              </h1>
              <p className="text-xs opacity-80">
                제출 일시: {new Date(submission.submitted_at).toLocaleString('ko-KR')}
              </p>
            </div>

            {/* Pass Status Badge */}
            <div className={`px-6 py-3 rounded-2xl backdrop-blur-md flex items-center gap-3 border shadow-inner ${
              isPass ? 'bg-white/20 border-white/30' : 'bg-black/20 border-white/20'
            }`}>
              {isPass ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-200" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-200" />
              )}
              <div>
                <span className="text-xs uppercase font-extrabold block opacity-80">최종 결과</span>
                <span className="text-2xl font-black">{isPass ? '합격 (PASS)' : '불합격 (FAIL)'}</span>
              </div>
            </div>
          </div>

          {/* Score Counter */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10 flex items-center justify-around text-center">
            <div>
              <span className="text-xs opacity-80 block mb-1">나의 획득 점수</span>
              <span className="text-4xl sm:text-5xl font-black tracking-tight">{submission.score}</span>
              <span className="text-sm font-normal opacity-80"> 점</span>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div>
              <span className="text-xs opacity-80 block mb-1">총 배점</span>
              <span className="text-4xl sm:text-5xl font-black tracking-tight">{submission.total_score}</span>
              <span className="text-sm font-normal opacity-80"> 점</span>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div>
              <span className="text-xs opacity-80 block mb-1">합격 커트라인</span>
              <span className="text-4xl sm:text-5xl font-black tracking-tight">{exam?.pass_score || 80}</span>
              <span className="text-sm font-normal opacity-80"> 점</span>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Dashboard Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-extrabold text-slate-900">상세 오답 노트 및 해설</h2>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
        >
          <LayoutDashboard className="w-4 h-4" />
          대시보드로 돌아가기
        </Link>
      </div>

      {/* Problems Breakdown List */}
      <div className="space-y-6">
        {problems.map((prob, idx) => {
          const userAns = submission.answers[prob.id] || '';
          const correctAns = prob.answer || '';
          const isCorrect = checkAnswerCorrect(userAns, correctAns, prob);

          return (
            <div
              key={prob.id}
              className={`bg-white rounded-2xl border p-6 space-y-4 shadow-sm transition ${
                isCorrect ? 'border-emerald-200' : 'border-rose-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center ${
                    isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}>
                    Q{prob.order_num}
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded">
                    {prob.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                    isCorrect 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {isCorrect ? `정답 (+${prob.score}점)` : `오답 (0점)`}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-base font-bold text-slate-900">{prob.title}</h3>
                <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                  {prob.description}
                </p>
              </div>

              {/* User Answer vs Correct Answer Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className={`p-3 rounded-xl border ${
                  isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                }`}>
                  <span className="text-slate-500 font-medium block mb-1">제출한 답안:</span>
                  <span className={`font-bold text-sm ${isCorrect ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {userAns || '(미작성)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200">
                  <span className="text-slate-500 font-medium block mb-1">정답:</span>
                  <span className="font-bold text-sm text-blue-900">
                    {correctAns}
                  </span>
                </div>
              </div>

              {/* Detailed Explanation */}
              {prob.explanation && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Award className="w-4 h-4 text-blue-600" />
                    문제 해설
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {prob.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
