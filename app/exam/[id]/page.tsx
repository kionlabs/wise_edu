'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getStoredSession, 
  fetchExamById, 
  fetchProblemsByExamId, 
  saveSubmission,
  checkAnswerCorrect 
} from '@/lib/supabase';
import { StudentSession, Exam, Problem } from '@/types/database';
import { 
  Clock, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Send,
  FileSpreadsheet,
  FileText,
  Database,
  Sparkles,
  Layers,
  ListChecks,
  User,
  Check,
  ChevronDown
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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(60 * 60); // 60 minutes default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmittedBlindModal, setIsSubmittedBlindModal] = useState(false);
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

  // Quick scroll to problem
  const scrollToProblem = (orderNum: number) => {
    const el = document.getElementById(`question-card-${orderNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Submit Logic
  const executeSubmission = async () => {
    if (!session || !exam || isSubmitting) return;
    setIsSubmitting(true);

    let totalEarnedScore = 0;
    let maxTotalScore = 0;

    problems.forEach((p) => {
      maxTotalScore += p.score;
      if (checkAnswerCorrect(answers[p.id], p.answer, p)) {
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

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('latest_submission', JSON.stringify({
        ...savedSub,
        exam_title: exam.title,
        problems: problems
      }));
    }

    setIsSubmitting(false);
    setIsSubmittedBlindModal(true);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-700">AICE Basic 시험 환경을 로딩 중입니다...</p>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).filter(k => Boolean(answers[k])).length;
  const datasetCsvUrl = problems.find(p => p.csv_url)?.csv_url || '/sample_data/customer_data.csv';

  // Dynamic overview parser from exam.overview
  const parsedOverview = (() => {
    const text = exam.overview || '';
    let subject = '';
    const subjectMatch = text.match(/■\s*주제\s*:\s*([^\n]+)/);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
    }

    let background = '';
    const bgMatch = text.match(/■\s*배경\s*:\s*([\s\S]*?)(?=■\s*과제명|\n\n■|$)/);
    if (bgMatch) {
      background = bgMatch[1].trim();
    }

    let task = '';
    const taskMatch = text.match(/■\s*과제명\s*:\s*([\s\S]*?)(?=■\s*데이터 컬럼명|\n\n■|$)/);
    if (taskMatch) {
      task = taskMatch[1].trim();
    }

    const columns: { name: string; desc: string }[] = [];
    const colSectionMatch = text.match(/■\s*데이터 컬럼명[^\n]*:\s*([\s\S]*$)/);
    if (colSectionMatch) {
      const colLines = colSectionMatch[1].split('\n');
      colLines.forEach(line => {
        const match = line.trim().match(/^[-•]?\s*([a-zA-Z0-9_]+)\s*:\s*(.+)$/);
        if (match) {
          columns.push({ name: match[1].trim(), desc: match[2].trim() });
        }
      });
    }

    if (!subject) {
      subject = exam.title.replace(/^AICE Basic (실전 )?(모의고사|연습문제 \d+|연습문제):\s*/, '').trim();
    }
    if (!task) {
      task = exam.description;
    }

    return { subject, background, task, columns };
  })();

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] w-full max-w-[1920px] mx-auto pb-4 px-2 sm:px-4">
      {/* Top Fixed Header Bar */}
      <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-md">
            AICE
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[11px] font-extrabold rounded border border-purple-400/30">
                AICE Basic 실전 시험
              </span>
              <span className="text-xs text-slate-400">
                • {session?.school} {session?.student_id} {session?.student_name}
              </span>
            </div>
            <h1 className="text-base sm:text-xl font-black tracking-tight text-white line-clamp-1">
              {exam.title}
            </h1>
          </div>
        </div>

        {/* Live Timer & Primary CSV Download Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <a
            href={datasetCsvUrl}
            download
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition animate-pulse"
          >
            <Download className="w-4 h-4" />
            <span>실습용 CSV 데이터셋 다운로드</span>
          </a>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg sm:text-xl font-black tracking-wider shadow-inner ${
            timeLeft < 300 
              ? 'bg-rose-500 text-white border border-rose-300 animate-bounce' 
              : 'bg-slate-800 text-emerald-400 border border-slate-700'
          }`}>
            <Clock className="w-5 h-5 text-current" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Split Screen Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* ============================================================== */}
        {/* LEFT PANEL: Exam Guide & Dataset Info (50% Width)              */}
        {/* ============================================================== */}
        <div className="lg:col-span-6 flex flex-col space-y-4 overflow-y-auto lg:max-h-[calc(100vh-6.5rem)] min-h-[650px] pr-2">
          
          {/* Section 1: Exam Background & Task Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  시험 문제 개요 & 과제 수행 가이드 (PDF Page 1)
                </h2>
              </div>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs sm:text-sm font-extrabold rounded-lg border border-purple-200">
                과제: {parsedOverview.subject}
              </span>
            </div>

            {/* Structured Info Boxes */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-purple-900 block text-xs uppercase tracking-wider">■ 주제</span>
                <p className="font-bold text-slate-900 text-sm sm:text-base">{parsedOverview.subject}</p>
              </div>

              {parsedOverview.background && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-extrabold text-purple-900 block text-xs uppercase tracking-wider">■ 배경</span>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                    {parsedOverview.background}
                  </p>
                </div>
              )}

              {parsedOverview.task && (
                <div className="p-4 bg-purple-50/80 rounded-xl border border-purple-200 space-y-1">
                  <span className="font-extrabold text-purple-900 block text-xs uppercase tracking-wider">■ 과제명</span>
                  <p className="font-bold text-purple-950 text-sm sm:text-base">
                    {parsedOverview.task}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Data Columns 명세 Table */}
          {parsedOverview.columns.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  ■ 데이터 컬럼명 명세 (Data Column Definitions)
                </h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-extrabold uppercase text-[11px] sm:text-xs">
                      <th className="py-3.5 px-4 w-1/3">컬럼명 (Column)</th>
                      <th className="py-3.5 px-4">설명 및 범주 (Description)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedOverview.columns.map((col, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-purple-950 bg-purple-50/50">
                          {col.name}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {col.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  위 데이터 컬럼 명세를 참고하여 파이썬 AIDU 또는 Jupyter Notebook에서 실습용 CSV 데이터를 탐색하고 모델을 구축하세요.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* RIGHT PANEL: Vertical Scrollable 15 Questions List (50% Width) */}
        {/* ============================================================== */}
        <div className="lg:col-span-6 flex flex-col space-y-4 lg:max-h-[calc(100vh-6.5rem)] min-h-[700px]">
          
          {/* Quick Question Jump Pill Bar & Progress Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-5.5 h-5.5 text-purple-600" />
                <h3 className="text-base font-extrabold text-slate-900">문제 풀이 & 답안 작성</h3>
              </div>
              <span className="text-xs sm:text-sm font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
                {answeredCount} / {problems.length} 문항 완료
              </span>
            </div>

            {/* Quick Jumper Grid (1 ~ 15) */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              {problems.map((p) => {
                const isAnswered = Boolean(answers[p.id]);
                return (
                  <button
                    key={p.id}
                    onClick={() => scrollToProblem(p.order_num)}
                    className={`py-2 rounded-xl font-mono font-black text-xs sm:text-sm transition border flex items-center justify-center gap-1 ${
                      isAnswered
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-purple-100 hover:text-purple-900'
                    }`}
                  >
                    <span>Q{p.order_num}</span>
                    {isAnswered && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Questions Continuous List (Q1 to Q15) */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 min-h-[450px]">
            {problems.map((p) => {
              const isAnswered = Boolean(answers[p.id]);

              return (
                <div
                  key={p.id}
                  id={`question-card-${p.order_num}`}
                  className={`bg-white rounded-2xl border p-6 shadow-xs transition space-y-5 ${
                    isAnswered ? 'border-emerald-400 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Problem Badge Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shadow-xs ${
                        isAnswered ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white'
                      }`}>
                        Q{p.order_num}
                      </span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-800 font-extrabold text-xs sm:text-sm rounded-lg">
                        {p.category}
                      </span>
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200/60">
                        {p.type === 'single' ? '객관식' : '단답형'}
                      </span>
                    </div>

                    {isAnswered && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-lg flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> 작성 완료
                      </span>
                    )}
                  </div>

                  {/* Problem Title & Text */}
                  <div className="space-y-2.5">
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                      {p.title}
                    </h4>
                    {p.description && (
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200/80 font-medium">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Answer Input Controls */}
                  <div className="pt-1">
                    {p.type === 'single' && p.options && (
                      <div className="space-y-2.5">
                        {p.options.map((option, idx) => {
                          const isSelected = answers[p.id] === option;
                          return (
                            <label
                              key={idx}
                              onClick={() => handleSelectAnswer(p.id, option)}
                              className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer text-xs sm:text-sm font-semibold transition ${
                                isSelected
                                  ? 'bg-purple-50 border-purple-500 text-purple-950 font-bold shadow-xs ring-1 ring-purple-400/30'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
                              }`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                              </div>
                              <span className="leading-snug">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {p.type === 'text' && (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={answers[p.id] || ''}
                          onChange={(e) => handleSelectAnswer(p.id, e.target.value)}
                          placeholder="정답 수치 또는 텍스트 입력 (예: 14235)"
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm sm:text-base font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition text-purple-950"
                        />
                        <p className="text-xs text-slate-400">
                          * 문제 지문에서 요구하는 정수/소수점 형식을 정확히 작성해 주세요.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Fixed Action Bar for Submit */}
          <div className="p-4 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm sm:text-base rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2.5 transition active:scale-[0.99]"
            >
              <Send className="w-5 h-5" />
              <span>최종 시험 제출하기 ({answeredCount}/{problems.length} 완료)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Final Submission Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  시험을 최종 제출하시겠습니까?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  제출 완료 후 즉시 자동 채점 및 결과 리포트가 생성됩니다.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-2 border border-slate-200/90 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">총 문제 수:</span>
                <span className="font-bold text-slate-900">{problems.length}문항</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">답안 작성 완료:</span>
                <span className="font-extrabold text-emerald-600">{answeredCount}문항</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">미작성 문항:</span>
                <span className="font-extrabold text-rose-600">{problems.length - answeredCount}문항</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition"
              >
                취소하고 더 풀기
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  executeSubmission();
                }}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/25 flex items-center gap-1.5 transition"
              >
                {isSubmitting ? '채점 및 저장 중...' : '확인 (최종 제출)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Completed Modal (Blind Test Workflow) */}
      {isSubmittedBlindModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 text-center space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12 stroke-[2.2]" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-black rounded-full border border-purple-200">
                답안 제출 완료
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight pt-1">
                답안 제출이 완료되었습니다! 🎉
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium pt-2">
                제출하신 답안이 데이터베이스에 안전하게 등록되었습니다.<br />
                <span className="font-extrabold text-purple-700">강사님의 해설 강의 후 채점 결과가 공개</span>되면 대시보드에서 본인의 성적과 문항별 정답/해설을 확인하실 수 있습니다.
              </p>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-500/25 transition"
            >
              대시보드로 이동하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
