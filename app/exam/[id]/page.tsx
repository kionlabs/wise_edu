'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getStoredSession, 
  fetchExamById, 
  fetchProblemsByExamId, 
  saveSubmission 
} from '@/lib/supabase';
import { StudentSession, Exam, Problem, Submission } from '@/types/database';
import { 
  Clock, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Send,
  FileSpreadsheet,
  HelpCircle
} from 'lucide-react';

interface ExamPageProps {
  params: Promise<{ id: string }>;
}

export default function ExamPage({ params }: ExamPageProps) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  const router = useRouter();

  const [session, setSession] = useState<StudentSession | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(60 * 60); // 60 minutes default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth & Data Initialization
  useEffect(() => {
    const currentSession = getStoredSession();
    if (!currentSession) {
      router.push('/');
      return;
    }
    setSession(currentSession);

    async function initExam() {
      setLoading(true);
      const examData = await fetchExamById(examId);
      const problemData = await fetchProblemsByExamId(examId);

      setExam(examData);
      setProblems(problemData);

      if (examData) {
        setTimeLeft(examData.time_limit_minutes * 60);
      }
      setLoading(false);
    }

    initExam();
  }, [examId, router]);

  // Countdown Timer
  useEffect(() => {
    if (loading || isSubmitting || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isSubmitting, timeLeft]);

  // Handle Answer Input
  const handleSelectAnswer = (problemId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [problemId]: value
    }));
  };

  // Submit Logic
  const executeSubmission = async () => {
    if (!session || !exam || isSubmitting) return;
    setIsSubmitting(true);

    // Calculate score
    let totalEarnedScore = 0;
    let maxTotalScore = 0;

    problems.forEach((p) => {
      maxTotalScore += p.score;
      const userAns = (answers[p.id] || '').trim();
      const correctAns = (p.answer || '').trim();
      if (userAns === correctAns) {
        totalEarnedScore += p.score;
      }
    });

    const passStatus = totalEarnedScore >= exam.pass_score ? 'PASS' : 'FAIL';

    const savedSub = await saveSubmission({
      exam_id: exam.id,
      school: session.school,
      student_id: session.student_id,
      student_name: session.student_name,
      answers: answers,
      score: totalEarnedScore,
      total_score: maxTotalScore,
      pass_status: passStatus
    });

    // Save current submission payload to sessionStorage for instant result view
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('latest_submission', JSON.stringify({
        ...savedSub,
        exam_title: exam.title,
        problems: problems
      }));
    }

    router.push(`/result?id=${savedSub.id}`);
  };

  const handleAutoSubmit = () => {
    alert('시험 제한시간(60분)이 종료되었습니다. 작성된 답안으로 자동 제출됩니다.');
    executeSubmission();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !exam) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">시험 문제를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  const currentProblem = problems[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Exam Header Bar with Timer */}
      <div className="sticky top-16 z-40 bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
              AICE Basic
            </span>
            <h1 className="text-lg font-bold text-slate-900">{exam.title}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            전체 {problems.length}문항 중 <span className="font-bold text-blue-600">{answeredCount}개</span> 답안 작성 완료
          </p>
        </div>

        {/* 60분 Timer Display */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-black tracking-wider shadow-inner ${
            timeLeft < 300 
              ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse' 
              : 'bg-slate-900 text-emerald-400'
          }`}>
            <Clock className="w-5 h-5 text-current" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition"
          >
            <Send className="w-4 h-4" />
            시험 제출하기
          </button>
        </div>
      </div>

      {/* Main Grid: Problem View + Question Navigation Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Cols: Current Problem Display */}
        <div className="lg:col-span-3 space-y-6">
          {currentProblem && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              {/* Problem Metadata Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                    Q{currentProblem.order_num}
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                    {currentProblem.category}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  배점: {currentProblem.score}점
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                  {currentProblem.title}
                </h2>
                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {currentProblem.description}
                </div>
              </div>

              {/* Practical CSV Download Component */}
              {currentProblem.csv_url && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-emerald-900 block">
                        실습용 데이터셋 CSV 파일 첨부
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        파일을 다운로드받아 파이썬 또는 엑셀로 분석 후 정답을 제출하세요.
                      </span>
                    </div>
                  </div>

                  <a
                    href={currentProblem.csv_url}
                    download
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    CSV 데이터 다운로드
                  </a>
                </div>
              )}

              {/* Answer Input Controls */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  답안 선택 및 입력
                </h3>

                {currentProblem.type === 'single' && currentProblem.options && (
                  <div className="space-y-2.5">
                    {currentProblem.options.map((option, idx) => {
                      const isSelected = answers[currentProblem.id] === option;
                      return (
                        <label
                          key={idx}
                          onClick={() => handleSelectAnswer(currentProblem.id, option)}
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold shadow-sm'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                          </div>
                          <span className="text-sm">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currentProblem.type === 'text' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={answers[currentProblem.id] || ''}
                      onChange={(e) => handleSelectAnswer(currentProblem.id, e.target.value)}
                      placeholder="정답 수치 또는 텍스트를 입력하세요 (예: 85)"
                      className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                    <p className="text-[11px] text-slate-500">
                      * 단답형 문항입니다. 특수문자 없이 정확한 정답 값을 입력해 주세요.
                    </p>
                  </div>
                )}
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => prev - 1)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전 문제
                </button>

                <span className="text-xs font-bold text-slate-400">
                  {currentIdx + 1} / {problems.length}
                </span>

                <button
                  disabled={currentIdx === problems.length - 1}
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
                >
                  다음 문제
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Question Navigation Grid */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              문항 답안 현황
            </h3>

            <div className="grid grid-cols-5 gap-2">
              {problems.map((p, idx) => {
                const isAnswered = Boolean(answers[p.id]);
                const isCurrent = currentIdx === idx;
                return (
                  <button
                    key={p.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-11 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition border ${
                      isCurrent
                        ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-600 text-white'
                        : isAnswered
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Q{p.order_num}</span>
                    {isAnswered && !isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-600"></span>
                <span>현재 풀고 있는 문항</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span>
                <span>답안 작성 완료 문항</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></span>
                <span>미작성 문항</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">모의고사를 제출하시겠습니까?</h3>
                <p className="text-xs text-slate-500">제출 후에는 답안 수정이 불가능합니다.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">총 문항 수:</span>
                <span className="font-bold text-slate-900">{problems.length}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">답안 작성 문항:</span>
                <span className="font-bold text-emerald-600">{answeredCount}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">미작성 문항:</span>
                <span className="font-bold text-rose-600">{problems.length - answeredCount}개</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition"
              >
                취소하고 더 풀기
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  executeSubmission();
                }}
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition"
              >
                {isSubmitting ? '제출 및 채점 중...' : '최종 제출하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
