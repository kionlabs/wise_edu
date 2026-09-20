import { createClient } from '@supabase/supabase-js';
import { Exam, Problem, Submission, StudentSession, Student } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-project')
);

// Supabase Client 생성시 db: { schema: 'aice' } 옵션 지정
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: 'aice' }
    })
  : null;

// LocalStorage Helper for Student Session
const SESSION_KEY = 'aice_student_session';

export const getStoredSession = (): StudentSession | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const setStoredSession = async (session: StudentSession) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  if (supabase) {
    try {
      await supabase
        .schema('aice')
        .from('aice_students')
        .upsert(
          {
            school: session.school,
            student_id: session.student_id,
            student_name: session.student_name,
          },
          { onConflict: 'school,student_id' }
        );
    } catch (e) {
      console.warn('Supabase aice_students upsert warning:', e);
    }
  }
};

export const clearStoredSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
};

// -------------------------------------------------------------
// 남원용성고등학교 특강 수강생 30명 시드 및 Mock 목록
// -------------------------------------------------------------
export const MOCK_STUDENTS: Student[] = [
  { school: '한국고등학교', student_id: '20260101', student_name: '홍길동' },
  { school: '남원용성고', student_id: '1101', student_name: '김재영' },
  { school: '남원용성고', student_id: '1103', student_name: '안아람' },
  { school: '남원용성고', student_id: '1108', student_name: '이학준' },
  { school: '남원용성고', student_id: '1109', student_name: '조원우' },
  { school: '남원용성고', student_id: '1204', student_name: '김도연' },
  { school: '남원용성고', student_id: '1206', student_name: '노현규' },
  { school: '남원용성고', student_id: '1207', student_name: '모수아' },
  { school: '남원용성고', student_id: '1212', student_name: '유지윤' },
  { school: '남원용성고', student_id: '1215', student_name: '이수빈' },
  { school: '남원용성고', student_id: '1302', student_name: '김영훈' },
  { school: '남원용성고', student_id: '1313', student_name: '장태민' },
  { school: '남원용성고', student_id: '1316', student_name: '천인재' },
  { school: '남원용성고', student_id: '1406', student_name: '박형기' },
  { school: '남원용성고', student_id: '1410', student_name: '이건' },
  { school: '남원용성고', student_id: '1410', student_name: '이 건' },
  { school: '남원용성고', student_id: '2102', student_name: '김희수' },
  { school: '남원용성고', student_id: '2103', student_name: '노영민' },
  { school: '남원용성고', student_id: '2208', student_name: '이슬아' },
  { school: '남원용성고', student_id: '2207', student_name: '윤유준' },
  { school: '남원용성고', student_id: '2401', student_name: '김민수' },
  { school: '남원용성고', student_id: '2405', student_name: '서지원' },
  { school: '남원용성고', student_id: '2408', student_name: '장태인' },
  { school: '남원용성고', student_id: '2410', student_name: '최장수' },
  { school: '남원용성고', student_id: '3205', student_name: '성유리' },
  { school: '남원용성고', student_id: '3209', student_name: '이민혁' },
  { school: '남원용성고', student_id: '3210', student_name: '이용인' },
  { school: '남원용성고', student_id: '3211', student_name: '이정진' },
  { school: '남원용성고', student_id: '3212', student_name: '이현승' },
  { school: '남원용성고', student_id: '3216', student_name: '장원준' },
  { school: '남원용성고', student_id: '3307', student_name: '박진혁' },
  { school: '남원용성고', student_id: '3317', student_name: '전승현' }
];

// 학생 등록 대조 검증 함수
export async function verifyStudent(
  school: string,
  studentId: string,
  studentName: string
): Promise<{ valid: boolean; message?: string }> {
  const cleanSchool = school.trim();
  const cleanStudentId = studentId.trim();
  const cleanStudentName = studentName.trim().replace(/\s+/g, '');

  if (supabase) {
    try {
      const { data, error } = await supabase
        .schema('aice')
        .from('aice_students')
        .select('*')
        .eq('school', cleanSchool)
        .eq('student_id', cleanStudentId)
        .maybeSingle();

      if (!error && data) {
        const dbName = data.student_name.replace(/\s+/g, '');
        if (dbName === cleanStudentName) {
          return { valid: true };
        } else {
          return {
            valid: false,
            message: `학생 이름이 일치하지 않습니다. (입력한 학번: ${cleanStudentId})`
          };
        }
      }
    } catch (e) {
      console.warn('Supabase verifyStudent error, checking local fallback:', e);
    }
  }

  // Fallback Check against MOCK_STUDENTS
  const match = MOCK_STUDENTS.find(
    (s) => s.school === cleanSchool && s.student_id === cleanStudentId
  );

  if (match) {
    const matchName = match.student_name.replace(/\s+/g, '');
    if (matchName === cleanStudentName) {
      return { valid: true };
    } else {
      return {
        valid: false,
        message: `학생 이름이 일치하지 않습니다. (입력한 학번: ${cleanStudentId})`
      };
    }
  }

  return {
    valid: false,
    message: '등록되지 않은 학생입니다. 학교, 학번, 이름을 확인해 주세요.'
  };
}

// -------------------------------------------------------------
// Fallback Mock Data (DB 연결 실패나 미설정 시에도 즉시 구동)
// -------------------------------------------------------------
const MOCK_EXAMS: Exam[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    title: 'AICE Basic 제1회 실전 모의고사',
    description: '인공지능 개념, 데이터 처리, 머신러닝 기초 문항 및 CSV 데이터셋 실습 문제 포함 (60분 제한)',
    time_limit_minutes: 60,
    total_questions: 5,
    pass_score: 70,
    created_at: new Date().toISOString()
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    title: 'AICE Basic 제2회 데이터 분석 심화 모의고사',
    description: '피처 엔지니어링 및 모델 평가 지표 탐구 중심의 2회차 모의고사 (60분 제한)',
    time_limit_minutes: 60,
    total_questions: 5,
    pass_score: 70,
    created_at: new Date().toISOString()
  }
];

const MOCK_PROBLEMS: Record<string, Problem[]> = {
  'a1111111-1111-1111-1111-111111111111': [
    {
      id: 'p101',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 1,
      title: '인공지능(AI)과 머신러닝(ML)의 기본 개념',
      description: '다음 중 머신러닝(Machine Learning)의 정의로 가장 적절한 것은 무엇인가요?',
      category: 'AI 개념',
      type: 'single',
      options: [
        '사람이 직접 모든 조건문을 작성하여 동작시키는 프로그램',
        '데이터로부터 패턴을 학습하여 스스로 예측이나 결정을 내리는 기술',
        '컴퓨터 하드웨어 성능만을 향상시키는 기술',
        '인터넷 웹페이지를 수집하는 크롤링 기법'
      ],
      answer: '데이터로부터 패턴을 학습하여 스스로 예측이나 결정을 내리는 기술',
      score: 20,
      explanation: '머신러닝은 사람이 명시적인 규칙을 코딩하는 대신, 데이터를 학습하여 패턴을 발견하고 예측을 수행하는 인공지능의 한 분야입니다.'
    },
    {
      id: 'p102',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 2,
      title: '지도학습(Supervised Learning)의 특징',
      description: '다음 중 지도학습(Supervised Learning)에 해당하는 문제 유형을 고르세요.',
      category: '머신러닝',
      type: 'single',
      options: [
        '라벨(Label/정답)이 포함된 데이터를 학습시키는 분류(Classification)',
        '정답 없이 유사한 특성을 가진 데이터끼리 묶는 군집화(Clustering)',
        '차원 축소(PCA) 알고리즘',
        '에이전트가 보상을 최대화하도록 학습하는 강화학습'
      ],
      answer: '라벨(Label/정답)이 포함된 데이터를 학습시키는 분류(Classification)',
      score: 20,
      explanation: '지도학습은 입력 데이터와 그에 상응하는 정답(Label)이 주어진 상태에서 학습하는 방식으로, 분류와 회귀가 이에 해당합니다.'
    },
    {
      id: 'p103',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 3,
      title: '데이터 전처리 및 결측치 처리 (CSV 실습)',
      description: '제공된 고객 데이터셋(customer_data.csv)을 다운로드하여 분석하세요. 이 데이터셋에서 나이(age) 컬럼의 결측치(Null) 개수는 총 몇 개인가요?',
      category: '데이터 전처리',
      type: 'single',
      options: ['3개', '5개', '8개', '12개'],
      answer: '5개',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: 'customer_data.csv 파일의 age 컬럼을 확인하면 결측치(NaN/Null)는 총 5개입니다.'
    },
    {
      id: 'p104',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 4,
      title: '평가 지표 - 정확도(Accuracy) 계산',
      description: '총 100개의 데이터 중 모델이 85개를 올바르게 분류했을 때, 이 모델의 정확도(Accuracy)는 몇 %인가요? (숫자만 입력)',
      category: '모델 평가',
      type: 'text',
      answer: '85',
      score: 20,
      explanation: '정확도(Accuracy) = (맞춘 데이터 수 / 전체 데이터 수) * 100 = (85 / 100) * 100 = 85%'
    },
    {
      id: 'p105',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 5,
      title: '인공지능 윤리(AI Ethics) 원칙',
      description: '다음 중 인공지능 윤리 가이드라인의 주요 핵심 요소로 볼 수 없는 것은 무엇인가요?',
      category: 'AI 윤리',
      type: 'single',
      options: [
        '투명성과 설명 가능성',
        '편향성 최소화 및 공정성',
        '개발자 개인 이익의 극대화',
        '개인정보 보호 및 데이터 보안'
      ],
      answer: '개발자 개인 이익의 극대화',
      score: 20,
      explanation: 'AI 윤리는 공정성, 투명성, 개인정보 보호, 안전성을 중시하며 개발자 개인의 사적이익 극대화는 윤리적 핵심 원칙에 해당하지 않습니다.'
    }
  ],
  'b2222222-2222-2222-2222-222222222222': [
    {
      id: 'p201',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 1,
      title: '데이터 탐색 - 평균값과 중앙값',
      description: '극단값(Outlier)이 존재하는 데이터셋에서 중앙경향성을 파악하기 위해 평균값보다 중앙값(Median)이 더 왜곡에 강한 이유는 무엇인가요?',
      category: '데이터 이해',
      type: 'single',
      options: [
        '중앙값은 상위 50% 위치 값으로 극단값의 영향을 받지 않기 때문',
        '중앙값은 항상 평균보다 크기 때문',
        '중앙값은 텍스트 데이터에만 사용되기 때문',
        '중앙값 계산에는 컴퓨터 연산이 필요 없기 때문'
      ],
      answer: '중앙값은 상위 50% 위치 값으로 극단값의 영향을 받지 않기 때문',
      score: 20,
      explanation: '중앙값은 정렬된 데이터의 순서상 중간에 위치한 값이므로, 매우 크거나 작은 아웃라이어 수치에 의해 평균처럼 크게 흔들리지 않습니다.'
    },
    {
      id: 'p202',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 2,
      title: '피처 인코딩 (One-Hot Encoding)',
      description: '범주형(Categorical) 변수(예: 사과, 바나나, 포도)를 머신러닝 모델이 이해할 수 있도록 0과 1로 변환하는 전처리 기법은 무엇인가요?',
      category: '데이터 전처리',
      type: 'single',
      options: [
        '원-핫 인코딩 (One-Hot Encoding)',
        '정규화 (Normalization)',
        '결측치 대체 (Imputation)',
        '주성분 분석 (PCA)'
      ],
      answer: '원-핫 인코딩 (One-Hot Encoding)',
      score: 20,
      explanation: '원-핫 인코딩은 각 범주마다 새로운 이진(0 또는 1) 컬럼을 만들어 표현하는 기법입니다.'
    },
    {
      id: 'p203',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 3,
      title: '주택 가격 데이터 분석 (CSV 실습)',
      description: '제공된 housing_prices.csv 데이터를 다운로드하여 확인하세요. 방 개수(rooms) 컬럼의 최댓값(Max) 수치는 얼마인가요?',
      category: '데이터 분석 실습',
      type: 'single',
      options: ['5', '8', '10', '12'],
      answer: '8',
      csv_url: '/sample_data/housing_prices.csv',
      score: 20,
      explanation: 'housing_prices.csv의 rooms 컬럼 중 가장 큰 값은 8입니다.'
    },
    {
      id: 'p204',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 4,
      title: '과대적합(Overfitting) 개념',
      description: '학습 데이터에서는 성능이 매우 높으나 실전/테스트 데이터에서 성능이 급격히 떨어지는 현상을 무엇이라 하나요?',
      category: '모델 성능',
      type: 'single',
      options: [
        '과대적합 (Overfitting)',
        '과소적합 (Underfitting)',
        '교차검증 (Cross Validation)',
        '앙상블 (Ensemble)'
      ],
      answer: '과대적합 (Overfitting)',
      score: 20,
      explanation: '과대적합은 모델이 학습 데이터의 노이즈까지 지나치게 과도하게 학습하여 새로운 데이터에 대한 일반화 성능이 떨어지는 상태입니다.'
    },
    {
      id: 'p205',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 5,
      title: '혼동 행렬(Confusion Matrix) 지표',
      description: '재현율(Recall)을 계산하는 공식에서 분자에 들어가는 항목은 무엇인가요?',
      category: '모델 평가',
      type: 'single',
      options: [
        '진짜 양성 (True Positive, TP)',
        '거짓 양성 (False Positive, FP)',
        '진짜 음성 (True Negative, TN)',
        '거짓 음성 (False Negative, FN)'
      ],
      answer: '진짜 양성 (True Positive, TP)',
      score: 20,
      explanation: 'Recall = TP / (TP + FN) 으로, 분자에는 실제 양성을 맞춘 TP(True Positive)가 위치합니다.'
    }
  ]
};

// Local storage exams fallback
function getLocalExams(): Exam[] {
  if (typeof window === 'undefined') return MOCK_EXAMS;
  try {
    const data = localStorage.getItem('aice_custom_exams');
    if (!data) return MOCK_EXAMS;
    const custom: Exam[] = JSON.parse(data);
    return [...MOCK_EXAMS, ...custom];
  } catch {
    return MOCK_EXAMS;
  }
}

function saveLocalExam(exam: Exam) {
  if (typeof window === 'undefined') return;
  const existing = getLocalExams().filter(e => !MOCK_EXAMS.some(m => m.id === e.id));
  existing.push(exam);
  localStorage.setItem('aice_custom_exams', JSON.stringify(existing));
}

// Local storage problems fallback
function getLocalProblems(examId: string): Problem[] {
  if (typeof window === 'undefined') return MOCK_PROBLEMS[examId] || [];
  try {
    const data = localStorage.getItem(`aice_custom_problems_${examId}`);
    const mockList = MOCK_PROBLEMS[examId] || [];
    if (!data) return mockList;
    const custom: Problem[] = JSON.parse(data);
    return [...mockList, ...custom];
  } catch {
    return MOCK_PROBLEMS[examId] || [];
  }
}

function saveLocalProblem(examId: string, problem: Problem) {
  if (typeof window === 'undefined') return;
  const mockList = MOCK_PROBLEMS[examId] || [];
  const existing = getLocalProblems(examId).filter(p => !mockList.some(m => m.id === p.id));
  existing.push(problem);
  localStorage.setItem(`aice_custom_problems_${examId}`, JSON.stringify(existing));
}

// -------------------------------------------------------------
// Supabase Data Access Functions (aice 스키마 타겟팅)
// -------------------------------------------------------------

export async function fetchExams(): Promise<Exam[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .schema('aice')
        .from('aice_exams')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as Exam[];
      }
    } catch (e) {
      console.warn('Supabase fetchExams error, using fallback:', e);
    }
  }
  return getLocalExams();
}

export async function createExam(examData: Omit<Exam, 'id' | 'created_at'>): Promise<Exam> {
  const newExam: Exam = {
    ...examData,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `exam_${Date.now()}`,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .schema('aice')
        .from('aice_exams')
        .insert([{
          title: examData.title,
          description: examData.description,
          time_limit_minutes: examData.time_limit_minutes,
          total_questions: examData.total_questions,
          pass_score: examData.pass_score
        }])
        .select()
        .single();

      if (!error && data) {
        saveLocalExam(data as Exam);
        return data as Exam;
      }
    } catch (e) {
      console.warn('Supabase createExam error, saving locally:', e);
    }
  }

  saveLocalExam(newExam);
  return newExam;
}

export async function fetchExamById(examId: string): Promise<Exam | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .schema('aice')
        .from('aice_exams')
        .select('*')
        .eq('id', examId)
        .single();
      if (!error && data) {
        return data as Exam;
      }
    } catch (e) {
      console.warn('Supabase fetchExamById error, using fallback:', e);
    }
  }
  const allExams = getLocalExams();
  return allExams.find(e => e.id === examId) || allExams[0];
}

export async function fetchProblemsByExamId(examId: string): Promise<Problem[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .schema('aice')
        .from('aice_problems')
        .select('*')
        .eq('exam_id', examId)
        .order('order_num', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map(p => ({
          ...p,
          options: typeof p.options === 'string' ? JSON.parse(p.options) : p.options
        })) as Problem[];
      }
    } catch (e) {
      console.warn('Supabase fetchProblemsByExamId error, using fallback:', e);
    }
  }
  return getLocalProblems(examId);
}

export async function createProblem(problemData: Omit<Problem, 'id'>): Promise<Problem> {
  const newProblem: Problem = {
    ...problemData,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prob_${Date.now()}`
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .schema('aice')
        .from('aice_problems')
        .insert([{
          exam_id: problemData.exam_id,
          order_num: problemData.order_num,
          title: problemData.title,
          description: problemData.description,
          category: problemData.category,
          type: problemData.type,
          options: problemData.options ? JSON.stringify(problemData.options) : null,
          answer: problemData.answer,
          csv_url: problemData.csv_url || null,
          score: problemData.score,
          explanation: problemData.explanation
        }])
        .select()
        .single();

      if (!error && data) {
        saveLocalProblem(problemData.exam_id, data as Problem);
        return data as Problem;
      }
    } catch (e) {
      console.warn('Supabase createProblem error, saving locally:', e);
    }
  }

  saveLocalProblem(problemData.exam_id, newProblem);
  return newProblem;
}

export async function bulkCreateProblems(examId: string, rawList: any[]): Promise<{ count: number; error?: string }> {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return { count: 0, error: '올바른 JSON 배열 형식이 아닙니다. [...] 형태여야 합니다.' };
  }

  const formattedProblems = rawList.map((p, idx) => ({
    exam_id: examId,
    order_num: p.order_num || idx + 1,
    title: p.title || `문제 ${idx + 1}`,
    description: p.content || p.description || '',
    category: p.category || '기초지식',
    type: p.type === 'text' ? 'text' : 'single',
    options: p.options ? (typeof p.options === 'string' ? p.options : JSON.stringify(p.options)) : null,
    answer: String(p.answer || ''),
    csv_url: p.csv_url || null,
    score: Number(p.score || 20),
    explanation: p.explanation || ''
  }));

  if (supabase) {
    try {
      const { data, error } = await supabase
        .schema('aice')
        .from('aice_problems')
        .insert(formattedProblems)
        .select();

      if (!error && data) {
        data.forEach(item => saveLocalProblem(examId, {
          ...item,
          options: typeof item.options === 'string' ? JSON.parse(item.options) : item.options
        } as Problem));
        return { count: data.length };
      } else if (error) {
        console.warn('Supabase bulkCreateProblems error:', error);
      }
    } catch (e) {
      console.warn('Supabase bulkCreateProblems exception:', e);
    }
  }

  // Local storage fallback
  formattedProblems.forEach((p, idx) => {
    const localItem: Problem = {
      ...p,
      id: `bulk_prob_${Date.now()}_${idx}`,
      options: p.options ? JSON.parse(p.options) : undefined
    } as Problem;
    saveLocalProblem(examId, localItem);
  });

  return { count: formattedProblems.length };
}

export async function saveSubmission(submission: Omit<Submission, 'id' | 'submitted_at'>): Promise<Submission> {
  const newSubmission: Submission = {
    ...submission,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sub_${Date.now()}`,
    submitted_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .schema('aice')
        .from('aice_submissions')
        .insert([{
          exam_id: submission.exam_id,
          school: submission.school,
          student_id: submission.student_id,
          student_name: submission.student_name,
          answers: submission.answers,
          score: submission.score,
          total_score: submission.total_score,
          pass_status: submission.pass_status
        }])
        .select()
        .single();

      if (!error && data) {
        saveLocalSubmission(data as Submission);
        return data as Submission;
      }
    } catch (e) {
      console.warn('Supabase saveSubmission error, saving locally:', e);
    }
  }

  saveLocalSubmission(newSubmission);
  return newSubmission;
}

function saveLocalSubmission(sub: Submission) {
  if (typeof window === 'undefined') return;
  const existing = getLocalSubmissions();
  existing.unshift(sub);
  localStorage.setItem('aice_submissions', JSON.stringify(existing));
}

function getLocalSubmissions(): Submission[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('aice_submissions');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function fetchSubmissionsByStudent(school: string, studentId: string): Promise<Submission[]> {
  const localSubs = getLocalSubmissions().filter(
    s => s.school === school && s.student_id === studentId
  );

  if (supabase) {
    try {
      const { data, error } = await supabase
        .schema('aice')
        .from('aice_submissions')
        .select('*, aice_exams(title)')
        .eq('school', school)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          exam_title: item.aice_exams?.title || 'AICE Basic 모의고사'
        })) as Submission[];
      }
    } catch (e) {
      console.warn('Supabase fetchSubmissionsByStudent error:', e);
    }
  }

  return localSubs;
}

export async function fetchAllSubmissions(): Promise<Submission[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .schema('aice')
        .from('aice_submissions')
        .select('*, aice_exams(title)')
        .order('submitted_at', { ascending: false });

      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          exam_title: item.aice_exams?.title || 'AICE Basic 모의고사'
        })) as Submission[];
      }
    } catch (e) {
      console.warn('Supabase fetchAllSubmissions error:', e);
    }
  }

  return getLocalSubmissions();
}
