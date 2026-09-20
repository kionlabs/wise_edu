'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAllSubmissions, fetchExams } from '@/lib/supabase';
import { Submission, Exam } from '@/types/database';
import { 
  Users, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Search, 
  ShieldCheck, 
  BarChart3, 
  FileSpreadsheet,
  Filter
} from 'lucide-react';

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      const subData = await fetchAllSubmissions();
      const examData = await fetchExams();
      setSubmissions(subData);
      setExams(examData);
      setLoading(false);
    }

    loadAdminData();
  }, []);

  // Filter logic
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.student_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesExam = selectedExamId === 'ALL' || sub.exam_id === selectedExamId;

    return matchesSearch && matchesExam;
  });

  // Analytics Metrics
  const totalCount = filteredSubmissions.length;
  const passCount = filteredSubmissions.filter((s) => s.pass_status === 'PASS').length;
  const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;
  const avgScore =
    totalCount > 0
      ? Math.round(filteredSubmissions.reduce((acc, s) => acc + s.score, 0) / totalCount)
      : 0;

  // CSV Export Function
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
    link.setAttribute('download', `AICE_Basic_학생성적_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-bold shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">관리자 대시보드 (전체 학생 성적)</h1>
            <p className="text-xs text-slate-500">
              전체 학생 응시 현황, 평균 점수 및 합격률 분석, 성적 엑셀(CSV) 내보내기 관리
            </p>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition"
        >
          <Download className="w-4 h-4" />
          전체 성적 CSV 내보내기
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">총 응시 건수</span>
            <span className="text-2xl font-black text-slate-900">{totalCount}건</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">전체 평균 점수</span>
            <span className="text-2xl font-black text-slate-900">{avgScore}점</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">합격률</span>
            <span className="text-2xl font-black text-emerald-600">{passRate}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">등록된 모의고사</span>
            <span className="text-2xl font-black text-slate-900">{exams.length}개 회차</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="학생 이름, 학교, 학번 검색..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full sm:w-auto py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">전체 모의고사 회차 보기</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Scores Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                  <th className="py-3.5 px-4">학교명</th>
                  <th className="py-3.5 px-4">학번</th>
                  <th className="py-3.5 px-4">학생 이름</th>
                  <th className="py-3.5 px-4">응시 모의고사</th>
                  <th className="py-3.5 px-4 text-center">점수</th>
                  <th className="py-3.5 px-4 text-center">합격 여부</th>
                  <th className="py-3.5 px-4">제출 일시</th>
                  <th className="py-3.5 px-4 text-right">상세 결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{sub.school}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{sub.student_id}</td>
                    <td className="py-3.5 px-4 font-bold text-blue-700">{sub.student_name}</td>
                    <td className="py-3.5 px-4 font-medium">{sub.exam_title || 'AICE Basic 모의고사'}</td>
                    <td className="py-3.5 px-4 text-center font-black text-sm">
                      {sub.score} <span className="text-[11px] text-slate-400 font-normal">/ {sub.total_score}점</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                        sub.pass_status === 'PASS' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {sub.pass_status === 'PASS' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            합격
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            불합격
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(sub.submitted_at).toLocaleString('ko-KR')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/result?id=${sub.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition inline-flex items-center gap-1 text-[11px]"
                      >
                        결과 보기
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
