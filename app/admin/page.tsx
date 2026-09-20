'use client';

import React, { useEffect, useState } from 'react';
import { 
  fetchAllSubmissions, 
  fetchExams, 
  createExam, 
  fetchProblemsByExamId, 
  createProblem 
} from '@/lib/supabase';
import { Submission, Exam, Problem } from '@/types/database';
import { 
  ShieldCheck, 
  Users, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Search, 
  BarChart3, 
  FileSpreadsheet,
  Filter,
  Plus,
  BookOpen,
  Lock,
  ArrowRight,
  LogOut,
  HelpCircle,
  Sparkles,
  FilePlus,
  Check
} from 'lucide-react';

export default function AdminPage() {
  // Admin Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Admin Portal Navigation Tab
  const [activeTab, setActiveTab] = useState<'submissions' | 'create_exam' | 'manage_problems'>('submissions');

  // Shared Data States
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Submissions Tab Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>('ALL');

  // Form 1: Create Exam State
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDesc, setNewExamDesc] = useState('');
  const [newExamTimeLimit, setNewExamTimeLimit] = useState(60);
  const [newExamTotalQuestions, setNewExamTotalQuestions] = useState(5);
  const [newExamPassScore, setNewExamPassScore] = useState(70);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [examMsg, setExamMsg] = useState('');

  // Form 2: Manage Problems State
  const [targetExamId, setTargetExamId] = useState<string>('');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [probOrderNum, setProbOrderNum] = useState(1);
  const [probCategory, setProbCategory] = useState('데이터 전처리');
  const [probTitle, setProbTitle] = useState('');
  const [probDesc, setProbDesc] = useState('');
  const [probType, setProbType] = useState<'single' | 'text'>('single');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [probAnswer, setProbAnswer] = useState('');
  const [probCsvUrl, setProbCsvUrl] = useState('');
  const [probScore, setProbScore] = useState(20);
  const [probExplanation, setProbExplanation] = useState('');
  const [isCreatingProblem, setIsCreatingProblem] = useState(false);
  const [probMsg, setProbMsg] = useState('');

  // Check Admin Authentication from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthed = sessionStorage.getItem('aice_admin_authed') === 'true';
      if (isAuthed) {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Fetch Admin Data
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadAdminData() {
      setLoading(true);
      const subData = await fetchAllSubmissions();
      const examData = await fetchExams();
      setSubmissions(subData);
      setExams(examData);

      if (examData.length > 0 && !targetExamId) {
        setTargetExamId(examData[0].id);
      }
      setLoading(false);
    }

    loadAdminData();
  }, [isAuthenticated]);

  // Load problems when targetExamId changes
  useEffect(() => {
    if (!targetExamId) return;
    async function loadProblems() {
      const probList = await fetchProblemsByExamId(targetExamId);
      setProblems(probList);
      setProbOrderNum(probList.length + 1);
    }
    loadProblems();
  }, [targetExamId]);

  // Passcode verification logic
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'admin1234' || passcode.trim() === 'aice2026') {
      sessionStorage.setItem('aice_admin_authed', 'true');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('관리자 비밀번호가 일치하지 않습니다. (기본 비밀번호: admin1234)');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('aice_admin_authed');
    setIsAuthenticated(false);
    setPasscode('');
  };

  // Submit Handler: Create Exam
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim() || !newExamDesc.trim()) {
      setExamMsg('모의고사 제목과 설명을 입력해 주세요.');
      return;
    }

    setIsCreatingExam(true);
    setExamMsg('');

    const created = await createExam({
      title: newExamTitle.trim(),
      description: newExamDesc.trim(),
      time_limit_minutes: Number(newExamTimeLimit),
      total_questions: Number(newExamTotalQuestions),
      pass_score: Number(newExamPassScore)
    });

    setExams((prev) => [...prev, created]);
    setTargetExamId(created.id);
    setIsCreatingExam(false);
    setExamMsg(`'${created.title}' 회차가 성공적으로 등록되었습니다!`);
    
    // Reset form
    setNewExamTitle('');
    setNewExamDesc('');
  };

  // Submit Handler: Create Problem
  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetExamId) {
      setProbMsg('문제를 등록할 대상 모의고사 회차를 선택해 주세요.');
      return;
    }
    if (!probTitle.trim() || !probAnswer.trim()) {
      setProbMsg('문제 제목과 정답을 올바르게 입력해 주세요.');
      return;
    }

    setIsCreatingProblem(true);
    setProbMsg('');

    const optionsArray = probType === 'single' ? [opt1, opt2, opt3, opt4].filter(Boolean) : undefined;

    const created = await createProblem({
      exam_id: targetExamId,
      order_num: Number(probOrderNum),
      title: probTitle.trim(),
      description: probDesc.trim(),
      category: probCategory.trim(),
      type: probType,
      options: optionsArray,
      answer: probAnswer.trim(),
      csv_url: probCsvUrl.trim() || undefined,
      score: Number(probScore),
      explanation: probExplanation.trim() || undefined
    });

    setProblems((prev) => [...prev, created]);
    setIsCreatingProblem(false);
    setProbMsg(`Q${created.order_num} 문항이 성공적으로 추가되었습니다!`);

    // Reset form fields
    setProbTitle('');
    setProbDesc('');
    setOpt1(''); setOpt2(''); setOpt3(''); setOpt4('');
    setProbAnswer('');
    setProbCsvUrl('');
    setProbExplanation('');
    setProbOrderNum((prev) => prev + 1);
  };

  // Submissions Filtering
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.student_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesExam = selectedExamFilter === 'ALL' || sub.exam_id === selectedExamFilter;
    return matchesSearch && matchesExam;
  });

  // Export CSV
  const exportToCSV = () => {
    if (filteredSubmissions.length === 0) {
      alert('내보낼 학생 성적 데이터가 없습니다.');
      return;
    }

    const headers = ['학교명', '학번', '학생이름', '모의고사 회차', '점수', '총점', '합격여부', '응시일시'];
    const rows = filteredSubmissions.map((s) => [
      `"${s.school}"`,
      `"${s.student_id}"`,
      `"${s.student_name}"`,
      `"${s.exam_title || 'AICE Basic 모의고사'}"`,
      s.score,
      s.total_score,
      s.pass_status,
      `"${new Date(s.submitted_at).toLocaleString('ko-KR')}"`
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AICE_Basic_남원용성고_성적리스트_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Metrics
  const totalSubCount = filteredSubmissions.length;
  const passCount = filteredSubmissions.filter((s) => s.pass_status === 'PASS').length;
  const passRate = totalSubCount > 0 ? Math.round((passCount / totalSubCount) * 100) : 0;
  const avgScore =
    totalSubCount > 0
      ? Math.round(filteredSubmissions.reduce((acc, s) => acc + s.score, 0) / totalSubCount)
      : 0;

  // Render 1: Admin Passcode Login Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 sm:my-20">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              지국장(관리자) 인증
            </h1>
            <p className="text-xs text-slate-500">
              보안을 위해 관리자 비밀번호를 입력하신 후 접속하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPasscode('admin1234')}
            className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            테스트용 관리자 비밀번호(admin1234) 자동 입력
          </button>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                관리자 비밀번호
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="비밀번호 입력 (예: admin1234)"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition"
            >
              <span>관리자 페이지 접속</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render 2: Authenticated Admin Portal
  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Top Admin Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-purple-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-xs font-extrabold rounded-md">
                지국장 전용 모듈
              </span>
              <span className="text-xs text-slate-400">• 남원용성고 포함 관리</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              AICE Basic 관리자 센터
            </h1>
          </div>
        </div>

        <button
          onClick={handleAdminLogout}
          className="px-4 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition self-start md:self-auto"
        >
          <LogOut className="w-4 h-4" />
          관리자 세션 종료
        </button>
      </div>

      {/* Tab Controls Bar */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3.5 px-4 font-extrabold text-sm border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'submissions'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          학생 성적 통계 및 CSV 다운로드
        </button>

        <button
          onClick={() => setActiveTab('create_exam')}
          className={`pb-3.5 px-4 font-extrabold text-sm border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'create_exam'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FilePlus className="w-4 h-4" />
          모의고사 회차 신규 생성
        </button>

        <button
          onClick={() => setActiveTab('manage_problems')}
          className={`pb-3.5 px-4 font-extrabold text-sm border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'manage_problems'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          회차별 문제 등록 및 관리
        </button>
      </div>

      {/* TAB 1: Submissions & Student Grades */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          {/* Top Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">총 제출 건수</span>
                <span className="text-2xl font-black text-slate-900">{totalSubCount}건</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">전체 평균 점수</span>
                <span className="text-2xl font-black text-slate-900">{avgScore}점</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">합격률</span>
                <span className="text-2xl font-black text-emerald-600">{passRate}%</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">등록 모의고사</span>
                <span className="text-2xl font-black text-slate-900">{exams.length}개 회차</span>
              </div>
            </div>
          </div>

          {/* Filter Bar & CSV Export Button */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="학생 이름, 학교, 학번 검색..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedExamFilter}
                  onChange={(e) => setSelectedExamFilter(e.target.value)}
                  className="w-full sm:w-auto py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL">전체 모의고사 회차 필터</option>
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={exportToCSV}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              전체 성적 CSV 내보내기
            </button>
          </div>

          {/* Student Submissions Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-semibold">학생 성적 데이터를 불러오는 중입니다...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-sm">조건에 일치하는 응시 기록이 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-4 px-5">학교명</th>
                      <th className="py-4 px-5">학번</th>
                      <th className="py-4 px-5">학생 이름</th>
                      <th className="py-4 px-5">응시 모의고사</th>
                      <th className="py-4 px-5 text-center">점수</th>
                      <th className="py-4 px-5 text-center">합격 여부</th>
                      <th className="py-4 px-5">제출 일시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-5 font-bold text-slate-900">{sub.school}</td>
                        <td className="py-4 px-5 font-mono text-slate-600">{sub.student_id}</td>
                        <td className="py-4 px-5 font-bold text-blue-700">{sub.student_name}</td>
                        <td className="py-4 px-5 font-semibold text-slate-700">{sub.exam_title || 'AICE Basic 모의고사'}</td>
                        <td className="py-4 px-5 text-center font-black text-sm">
                          {sub.score} <span className="text-[11px] text-slate-400 font-normal">/ {sub.total_score}점</span>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold ${
                            sub.pass_status === 'PASS' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {sub.pass_status === 'PASS' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                합격 (PASS)
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                불합격 (FAIL)
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-500 text-[11px]">
                          {new Date(sub.submitted_at).toLocaleString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Create Exam Form */}
      {activeTab === 'create_exam' && (
        <div className="max-w-2xl bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" />
              신규 모의고사 회차 생성
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              새로운 모의고사(예: AICE Basic 제3회 실전 모의고사) 정보를 입력하여 추가하세요.
            </p>
          </div>

          {examMsg && (
            <div className={`p-4 rounded-2xl text-xs font-semibold ${
              examMsg.includes('성공') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {examMsg}
            </div>
          )}

          <form onSubmit={handleCreateExam} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                모의고사 제목
              </label>
              <input
                type="text"
                value={newExamTitle}
                onChange={(e) => setNewExamTitle(e.target.value)}
                placeholder="예: AICE Basic 제3회 실전 모의고사"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                모의고사 설명
              </label>
              <textarea
                value={newExamDesc}
                onChange={(e) => setNewExamDesc(e.target.value)}
                placeholder="예: 인공지능 응용 및 실무 데이터 전처리 포함 실전 모의고사"
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  제한시간 (분)
                </label>
                <input
                  type="number"
                  value={newExamTimeLimit}
                  onChange={(e) => setNewExamTimeLimit(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  총 문항 수
                </label>
                <input
                  type="number"
                  value={newExamTotalQuestions}
                  onChange={(e) => setNewExamTotalQuestions(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  합격 커트라인 (점)
                </label>
                <input
                  type="number"
                  value={newExamPassScore}
                  onChange={(e) => setNewExamPassScore(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingExam}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition text-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isCreatingExam ? '회차 생성 중...' : '신규 모의고사 회차 생성하기'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Manage Problems Form */}
      {activeTab === 'manage_problems' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Add Problem Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                신규 문제 등록
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                특정 모의고사 회차에 포함될 문제, 보기, 정답, 해설, CSV 링크를 등록하세요.
              </p>
            </div>

            {probMsg && (
              <div className={`p-4 rounded-2xl text-xs font-semibold ${
                probMsg.includes('추가') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {probMsg}
              </div>
            )}

            <form onSubmit={handleCreateProblem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  대상 모의고사 회차 선택
                </label>
                <select
                  value={targetExamId}
                  onChange={(e) => setTargetExamId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    문제 번호
                  </label>
                  <input
                    type="number"
                    value={probOrderNum}
                    onChange={(e) => setProbOrderNum(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    문제 카테고리
                  </label>
                  <input
                    type="text"
                    value={probCategory}
                    onChange={(e) => setProbCategory(e.target.value)}
                    placeholder="예: 데이터 전처리, AI 윤리"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    문항 배점
                  </label>
                  <input
                    type="number"
                    value={probScore}
                    onChange={(e) => setProbScore(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  문제 제목
                </label>
                <input
                  type="text"
                  value={probTitle}
                  onChange={(e) => setProbTitle(e.target.value)}
                  placeholder="예: 데이터 전처리 - 결측치 처리"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  문제 지문 / 내용
                </label>
                <textarea
                  value={probDesc}
                  onChange={(e) => setProbDesc(e.target.value)}
                  placeholder="문제 상세 설명 및 질문을 입력해 주세요."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  문제 유형
                </label>
                <select
                  value={probType}
                  onChange={(e) => setProbType(e.target.value as 'single' | 'text')}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="single">객관식 (Single Choice)</option>
                  <option value="text">단답형 (Text Input)</option>
                </select>
              </div>

              {probType === 'single' && (
                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    객관식 보기 입력 (1~4번)
                  </label>
                  <input
                    type="text"
                    value={opt1}
                    onChange={(e) => setOpt1(e.target.value)}
                    placeholder="보기 1번"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    value={opt2}
                    onChange={(e) => setOpt2(e.target.value)}
                    placeholder="보기 2번"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    value={opt3}
                    onChange={(e) => setOpt3(e.target.value)}
                    placeholder="보기 3번"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    value={opt4}
                    onChange={(e) => setOpt4(e.target.value)}
                    placeholder="보기 4번"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  정답 (정확히 일치하는 텍스트/수치)
                </label>
                <input
                  type="text"
                  value={probAnswer}
                  onChange={(e) => setProbAnswer(e.target.value)}
                  placeholder="예: 객관식의 경우 해당 보기 텍스트 전체 입력 / 단답형의 경우 수치 85"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  실습용 CSV 다운로드 URL (선택)
                </label>
                <input
                  type="text"
                  value={probCsvUrl}
                  onChange={(e) => setProbCsvUrl(e.target.value)}
                  placeholder="예: /sample_data/customer_data.csv"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  문제 해설
                </label>
                <textarea
                  value={probExplanation}
                  onChange={(e) => setProbExplanation(e.target.value)}
                  placeholder="학생들에게 보여줄 정답 및 해설 문구를 입력하세요."
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingProblem}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition text-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isCreatingProblem ? '문항 등록 중...' : '새로운 문항 등록하기'}</span>
              </button>
            </form>
          </div>

          {/* Right 1 Col: Registered Problems Preview */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                등록된 문항 목록 ({problems.length}개)
              </h3>

              {problems.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  등록된 문항이 없습니다.
                </p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {problems.map((p) => (
                    <div key={p.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-700">Q{p.order_num}. {p.category}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">{p.score}점</span>
                      </div>
                      <h4 className="font-bold text-slate-900 leading-snug">{p.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{p.description}</p>
                      <div className="pt-1 text-[11px] font-bold text-emerald-700">
                        정답: {p.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
