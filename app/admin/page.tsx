'use client';

import React, { useEffect, useState } from 'react';
import { 
  fetchAllSubmissions, 
  fetchExams, 
  createExam,
  updateExam, 
  fetchProblemsByExamId, 
  createProblem,
  bulkCreateProblems,
  uploadCsvDataset,
  updateExamCsvUrl
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
  FilePlus,
  Check,
  Upload,
  Code2,
  Rocket,
  Clock,
  Sparkles,
  Pencil,
  FileEdit
} from 'lucide-react';

export default function AdminPage() {
  // Admin Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Admin Portal Navigation Tab
  const [activeTab, setActiveTab] = useState<'submissions' | 'create_exam' | 'manage_problems' | 'bulk_upload'>('submissions');

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
  const [newExamTotalQuestions, setNewExamTotalQuestions] = useState(15);
  const [newExamPassScore, setNewExamPassScore] = useState(70);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [examMsg, setExamMsg] = useState('');

  // Form 1-2: Edit Exam State
  const [selectedEditExamId, setSelectedEditExamId] = useState<string>('');
  const [editExamTitle, setEditExamTitle] = useState('');
  const [editExamDesc, setEditExamDesc] = useState('');
  const [editExamTimeLimit, setEditExamTimeLimit] = useState(60);
  const [editExamTotalQuestions, setEditExamTotalQuestions] = useState(15);
  const [editExamPassScore, setEditExamPassScore] = useState(70);
  const [editExamCsvUrl, setEditExamCsvUrl] = useState('');
  const [isUploadingEditCsv, setIsUploadingEditCsv] = useState(false);
  const [isUpdatingExam, setIsUpdatingExam] = useState(false);
  const [editExamMsg, setEditExamMsg] = useState('');

  // Select Exam to Edit helper
  const handleSelectExamToEdit = async (examId: string, currentExams: Exam[] = exams) => {
    setSelectedEditExamId(examId);
    const target = currentExams.find(e => e.id === examId);
    if (target) {
      setEditExamTitle(target.title);
      setEditExamDesc(target.description);
      setEditExamTimeLimit(target.time_limit_minutes);
      setEditExamTotalQuestions(target.total_questions);
      setEditExamPassScore(target.pass_score);
      setEditExamMsg('');

      const existingProbs = await fetchProblemsByExamId(examId);
      const csv = existingProbs.find(p => p.csv_url)?.csv_url || '';
      setEditExamCsvUrl(csv);
    }
  };

  const handleEditCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingEditCsv(true);
    const uploadedUrl = await uploadCsvDataset(file);
    setEditExamCsvUrl(uploadedUrl);
    setIsUploadingEditCsv(false);
    setEditExamMsg(`'${file.name}' CSV 파일이 선택/업로드되었습니다. (저장 버튼을 누르면 적용됩니다)`);
  };

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

  // Form 3: Bulk Upload & CSV Upload State
  const [bulkTargetExamId, setBulkTargetExamId] = useState<string>('');
  const [bulkJsonInput, setBulkJsonInput] = useState('');
  const [csvFileUrl, setCsvFileUrl] = useState('/sample_data/customer_data.csv');
  const [csvFileName, setCsvFileName] = useState('customer_data.csv');
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');

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

      if (examData.length > 0) {
        if (!targetExamId) setTargetExamId(examData[0].id);
        if (!bulkTargetExamId) setBulkTargetExamId(examData[0].id);
        if (!selectedEditExamId) {
          handleSelectExamToEdit(examData[0].id, examData);
        }
      }
      setLoading(false);
    }

    loadAdminData();
  }, [isAuthenticated, targetExamId, bulkTargetExamId]);

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
    if (passcode.trim() === 'trekker00') {
      sessionStorage.setItem('aice_admin_authed', 'true');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('관리자 비밀번호가 올바르지 않습니다.');
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

    const updatedExams = [...exams, created];
    setExams(updatedExams);
    setTargetExamId(created.id);
    setBulkTargetExamId(created.id);
    handleSelectExamToEdit(created.id, updatedExams);
    setIsCreatingExam(false);
    setExamMsg(`'${created.title}' 회차가 성공적으로 등록되었습니다!`);
    
    // Reset form
    setNewExamTitle('');
    setNewExamDesc('');
  };

  // Submit Handler: Update Exam
  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditExamId) {
      setEditExamMsg('수정할 모의고사 회차를 선택해 주세요.');
      return;
    }
    if (!editExamTitle.trim() || !editExamDesc.trim()) {
      setEditExamMsg('모의고사 제목과 설명을 입력해 주세요.');
      return;
    }

    setIsUpdatingExam(true);
    setEditExamMsg('');

    await updateExam(selectedEditExamId, {
      title: editExamTitle.trim(),
      description: editExamDesc.trim(),
      time_limit_minutes: Number(editExamTimeLimit),
      total_questions: Number(editExamTotalQuestions),
      pass_score: Number(editExamPassScore)
    });

    if (editExamCsvUrl.trim()) {
      await updateExamCsvUrl(selectedEditExamId, editExamCsvUrl.trim());
    }

    const updatedExams = await fetchExams();
    setExams(updatedExams);

    setIsUpdatingExam(false);
    setEditExamMsg(`'${editExamTitle.trim()}' 회차 정보가 성공적으로 수정되었습니다!`);
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

  // CSV Dataset Upload Handler
  const handleCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCsv(true);
    setCsvFileName(file.name);

    const uploadedUrl = await uploadCsvDataset(file);
    setCsvFileUrl(uploadedUrl);
    setIsUploadingCsv(false);
    setBulkMsg(`'${file.name}' 데이터셋 파일이 준비되었습니다. (URL: ${uploadedUrl})`);
  };

  // Submit Handler: Bulk Upload Problems with CSV Mapping
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTargetExamId) {
      setBulkMsg('문제를 일괄 등록할 모의고사 회차를 선택해 주세요.');
      return;
    }
    if (!bulkJsonInput.trim()) {
      setBulkMsg('JSON 데이터 텍스트를 입력하거나 파일(.json)을 업로드해 주세요.');
      return;
    }

    setIsBulkUploading(true);
    setBulkMsg('');

    try {
      const parsed = JSON.parse(bulkJsonInput.trim());
      
      // Inject csv_url if provided and missing in raw json item
      const mappedList = parsed.map((item: any) => ({
        ...item,
        csv_url: item.csv_url || (csvFileUrl ? csvFileUrl : undefined)
      }));

      const res = await bulkCreateProblems(bulkTargetExamId, mappedList);
      
      if (res.error) {
        setBulkMsg(`오류: ${res.error}`);
      } else {
        // Also update existing problems' csv_url if needed
        if (csvFileUrl) {
          await updateExamCsvUrl(bulkTargetExamId, csvFileUrl);
        }

        setBulkMsg(`🎉 총 ${res.count}개 문항이 선택한 모의고사 회차에 일괄 등록되었으며, 실습용 CSV가 다운로드 매핑되었습니다!`);
        setBulkJsonInput('');
        
        if (targetExamId === bulkTargetExamId) {
          const probList = await fetchProblemsByExamId(bulkTargetExamId);
          setProblems(probList);
        }
      }
    } catch (err: any) {
      setBulkMsg(`JSON 형식 오류: ${err.message || '올바른 JSON 배열 형식인지 확인해 주세요.'}`);
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkJsonInput(content);
    };
    reader.readAsText(file);
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
                  placeholder="관리자 비밀번호를 입력하세요"
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
              AICE Basic 관리자 대시보드
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
          학생 성적 통계 및 모의고사 현황
        </button>

        <button
          onClick={() => setActiveTab('bulk_upload')}
          className={`pb-3.5 px-4 font-extrabold text-sm border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'bulk_upload'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Rocket className="w-4 h-4 text-purple-600" />
          문제 일괄 등록 (JSON/CSV 업로드)
        </button>

        <button
          onClick={() => setActiveTab('create_exam')}
          className={`pb-3.5 px-4 font-extrabold text-sm border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'create_exam'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileEdit className="w-4 h-4" />
          모의고사 회차 관리 (생성/수정)
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
          개별 문제 등록 및 관리
        </button>
      </div>

      {/* TAB 1: Submissions & Student Grades */}
      {activeTab === 'submissions' && (
        <div className="space-y-8">
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

          {/* Sub-section 1: 등록된 모의고사 현황 (Registered Exams Overview) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">등록된 모의고사 회차별 응시 현황</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((ex) => {
                const exSubs = submissions.filter((s) => s.exam_id === ex.id);
                const exPassCount = exSubs.filter((s) => s.pass_status === 'PASS').length;
                const exPassRate = exSubs.length > 0 ? Math.round((exPassCount / exSubs.length) * 100) : 0;
                const exAvgScore = exSubs.length > 0 ? Math.round(exSubs.reduce((a, b) => a + b.score, 0) / exSubs.length) : 0;

                return (
                  <div key={ex.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-purple-200 transition">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="font-extrabold text-sm text-slate-900 line-clamp-1">{ex.title}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md border border-purple-200">
                          {ex.time_limit_minutes}분 / {ex.total_questions}문항
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectExamToEdit(ex.id);
                            setActiveTab('create_exam');
                          }}
                          className="p-1 hover:bg-purple-100 text-purple-700 rounded-md transition"
                          title="회차 정보 수정"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ex.description}</p>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">응시자</span>
                        <span className="font-bold text-slate-900">{exSubs.length}명</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">평균점수</span>
                        <span className="font-bold text-blue-600">{exAvgScore}점</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">합격률</span>
                        <span className="font-bold text-emerald-600">{exPassRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sub-section 2: 학생 응시 성적 상세 테이블 (Student Submissions Table) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">학생 응시 성적 상세 리스트</h2>
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

            {/* Submissions Table */}
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
        </div>
      )}

      {/* TAB 2: Bulk Upload Problems Form (JSON + CSV Dataset Upload) */}
      {activeTab === 'bulk_upload' && (
        <div className="max-w-3xl bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Rocket className="w-6 h-6 text-purple-600" />
              문제 일괄 등록 & 실습용 CSV 파일 연결
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              실습용 CSV 데이터셋을 업로드하고, AI가 변환해 준 JSON 배열 텍스트를 복사·붙여넣기하면 선택한 회차에 15개 문항이 싹 등록됩니다.
            </p>
          </div>

          {bulkMsg && (
            <div className={`p-4 rounded-2xl text-xs font-bold leading-relaxed ${
              bulkMsg.includes('축하') || bulkMsg.includes('등록되었습니다') || bulkMsg.includes('준비되었습니다')
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {bulkMsg}
            </div>
          )}

          <form onSubmit={handleBulkUpload} className="space-y-6">
            {/* Step 1: Exam Session Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                1. 등록할 모의고사 회차 선택
              </label>
              <select
                value={bulkTargetExamId}
                onChange={(e) => setBulkTargetExamId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: CSV Dataset Upload Section */}
            <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <label className="block text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  2. 실습용 CSV 데이터셋 파일 업로드 (선택)
                </span>
                <span className="text-[11px] font-normal text-emerald-700">
                  학생들이 시험 화면에서 다운로드할 데이터셋
                </span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center justify-center gap-2 transition shrink-0">
                  <Upload className="w-4 h-4" />
                  <span>{isUploadingCsv ? 'CSV 업로드 중...' : 'CSV 파일 직접 선택'}</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="w-full text-xs font-semibold text-emerald-900 bg-white/80 px-3.5 py-2.5 rounded-xl border border-emerald-200/80 truncate">
                  현재 지정된 CSV 경로: <span className="font-mono text-emerald-700">{csvFileUrl}</span>
                </div>
              </div>

              {/* Sample Preset Choice Pills */}
              <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-800">
                <span className="font-bold">기본 샘플 선택:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCsvFileUrl('/sample_data/customer_data.csv');
                    setCsvFileName('customer_data.csv');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-200 font-bold transition"
                >
                  고객 데이터셋 (customer_data.csv)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCsvFileUrl('/sample_data/housing_prices.csv');
                    setCsvFileName('housing_prices.csv');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-200 font-bold transition"
                >
                  주택가격 데이터셋 (housing_prices.csv)
                </button>
              </div>
            </div>

            {/* Step 3: JSON Text / File Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Code2 className="w-4 h-4 text-purple-600" />
                  3. JSON 데이터 텍스트 입력 또는 .json 파일 선택
                </label>

                <label className="cursor-pointer text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg border border-purple-200 flex items-center gap-1 transition">
                  <Upload className="w-3.5 h-3.5" />
                  .json 파일 선택
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJsonFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                value={bulkJsonInput}
                onChange={(e) => setBulkJsonInput(e.target.value)}
                placeholder='AI가 생성해 준 JSON 배열을 붙여넣으세요. 예:
[
  {
    "order_num": 1,
    "title": "알고리즘 유형 선택",
    "content": "본 과제 해결에 알맞은...",
    "category": "AI 개념",
    "type": "single",
    "options": ["회귀 모형", "분류 모형"],
    "answer": "분류 모형",
    "score": 20,
    "explanation": "해설 문구..."
  }, ...
]'
                rows={10}
                className="w-full p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={isBulkUploading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 transition text-sm flex items-center justify-center gap-2"
            >
              <Rocket className="w-5 h-5" />
              <span>{isBulkUploading ? '문항 일괄 등록 중...' : '선택한 모의고사 회차에 문항 일괄 등록하기'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Exam Management (Edit / Create) */}
      {activeTab === 'create_exam' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Edit Existing Exam */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-purple-600" />
                기존 모의고사 회차 정보 수정
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                등록된 모의고사의 제목, 설명, 제한 시간 및 연결된 CSV 파일 정보 등을 변경할 수 있습니다.
              </p>
            </div>

            {editExamMsg && (
              <div className={`p-4 rounded-2xl text-xs font-semibold ${
                editExamMsg.includes('수정되었습니다') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {editExamMsg}
              </div>
            )}

            <form onSubmit={handleUpdateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  수정할 모의고사 회차 선택
                </label>
                <select
                  value={selectedEditExamId}
                  onChange={(e) => handleSelectExamToEdit(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  모의고사 제목
                </label>
                <input
                  type="text"
                  value={editExamTitle}
                  onChange={(e) => setEditExamTitle(e.target.value)}
                  placeholder="예: AICE Basic 제1회 실전 모의고사: 퇴사여부 예측"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  모의고사 설명
                </label>
                <textarea
                  value={editExamDesc}
                  onChange={(e) => setEditExamDesc(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    제한시간(분)
                  </label>
                  <input
                    type="number"
                    value={editExamTimeLimit}
                    onChange={(e) => setEditExamTimeLimit(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    총 문항 수
                  </label>
                  <input
                    type="number"
                    value={editExamTotalQuestions}
                    onChange={(e) => setEditExamTotalQuestions(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    커트라인(점)
                  </label>
                  <input
                    type="number"
                    value={editExamPassScore}
                    onChange={(e) => setEditExamPassScore(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Rich CSV Upload Section */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
                <label className="block text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    실습용 CSV 데이터셋 업로드 및 지정 (선택)
                  </span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <label className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center justify-center gap-2 transition shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>{isUploadingEditCsv ? 'CSV 업로드 중...' : 'CSV 파일 직접 업로드'}</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleEditCsvFileUpload}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={editExamCsvUrl}
                    onChange={(e) => setEditExamCsvUrl(e.target.value)}
                    placeholder="예: /sample_data/customer_data.csv"
                    className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-emerald-800 pt-0.5">
                  <span className="font-bold">기본 샘플 선택:</span>
                  <button
                    type="button"
                    onClick={() => setEditExamCsvUrl('/sample_data/customer_data.csv')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-200 font-bold transition text-[11px]"
                  >
                    고객 데이터셋 (customer_data.csv)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditExamCsvUrl('/sample_data/housing_prices.csv')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-200 font-bold transition text-[11px]"
                  >
                    주택가격 데이터셋 (housing_prices.csv)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingExam}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition text-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isUpdatingExam ? '수정사항 저장 중...' : '모의고사 회차 정보 수정 저장하기'}</span>
              </button>
            </form>
          </div>

          {/* Card 2: Create New Exam */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs space-y-6">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    제한시간(분)
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
                    커트라인(점)
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
        </div>
      )}

      {/* TAB 4: Manage Problems Form */}
      {activeTab === 'manage_problems' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Add Problem Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                개별 문제 등록
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
