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
    title: 'AICE Basic 제1회 실전 모의고사: 퇴사여부 예측',
    description: '인공지능 개념, 데이터 전처리, 머신러닝/딥러닝 모델링 및 퇴사여부 예측 CSV 데이터셋 실습 포함 (60분 제한)',
    time_limit_minutes: 60,
    total_questions: 15,
    pass_score: 70,
    created_at: new Date().toISOString(),
    overview: `[시험 문제 개요]
• 주제: 퇴사여부 예측
• 배경: 최근에는 조직 문화, 업무 강도, 보상 수준 등 다양한 요인으로 인해 직원의 퇴사 가능성을 미리 파악하는 것이 중요해지고 있습니다. 퇴사 위험이 높은 직원을 사전에 예측하고 적절한 조치를 취함으로 인적 자원 손실을 줄이고 조직의 안정성을 높일 수 있습니다.
• 과제명: 인사 데이터를 기반으로 직원의 퇴사여부를 예측하는 AI 모델을 구현해보세요.
• 데이터 컬럼명: Age, Attrition, Department, DistanceFromHome, Education, Gender, JobInvolvement, JobRole, JobSatisfaction, MonthlyRate, OverTime`
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
      title: '알고리즘 유형 선택',
      description: '본 과제 해결에 알맞은 알고리즘의 유형을 고르시오.',
      category: 'AI 개념',
      type: 'single',
      options: ['회귀 모형', '분류 모형', '군집 모형', '시계열 모형'],
      answer: '분류 모형',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: '직원의 퇴사 여부(1: 퇴사, 0: 퇴사하지 않음)는 범주형 타겟변수를 예측하는 문제이므로 분류(Classification) 모형이 적절합니다.'
    },
    {
      id: 'p102',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 2,
      title: '결측치 변수 개수 파악',
      description: '결측치가 있는 변수의 개수를 적으세요.',
      category: '데이터 탐색',
      type: 'text',
      answer: '2',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: 'customer_data.csv 데이터셋에서 JobSatisfaction 및 MonthlyRate 컬럼에 결측치가 포함되어 있어 총 2개입니다.'
    },
    {
      id: 'p103',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 3,
      title: '수치형 변수 탐색',
      description: '데이터 유형이 수치형인 변수를 고르세요.',
      category: '데이터 이해',
      type: 'single',
      options: ['Department', 'OverTime', 'JobRole', 'JobSatisfaction'],
      answer: 'JobSatisfaction',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: 'Department, OverTime, JobRole은 범주형(문자형) 변수이고, JobSatisfaction은 수치형 변수입니다.'
    },
    {
      id: 'p104',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 4,
      title: '월급(MonthlyRate) 2분위수 계산',
      description: '월급(MonthlyRate)의 2분위수를 정수 형태로 작성하세요. (예: 00000)',
      category: '데이터 기술통계',
      type: 'text',
      answer: '14235',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: 'MonthlyRate 컬럼의 2분위수(중앙값, Median/50%) 수치입니다.'
    },
    {
      id: 'p105',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 5,
      title: '야근 여부에 따른 퇴사자 분포 분석',
      description: '야근 여부(OverTime)에 따른 퇴사 여부(Attrition)의 분포를 시각화하고, 퇴사한 직원들 중 야근을 한 직원의 수를 작성하세요.',
      category: '데이터 시각화',
      type: 'text',
      answer: '127',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: 'Attrition이 1인 직원의 OverTime 분포를 교차 분석하면 야근을 수행한 퇴사 직원 수는 127명입니다.'
    },
    {
      id: 'p106',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 6,
      title: '음의 상관관계 변수 탐색',
      description: '타겟변수와 가장 높은 음의 상관관계를 갖는 변수를 고르세요.',
      category: '상관관계 분석',
      type: 'single',
      options: ['Age', 'DistanceFromHome', 'Education', 'JobInvolvement'],
      answer: 'JobInvolvement',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: 'Attrition 변수와 직무 참여도(JobInvolvement) 변수가 가장 강한 음의 상관관계를 보입니다.'
    },
    {
      id: 'p107',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 7,
      title: 'IQR 이상치 탐색 (연령)',
      description: '퇴사 여부(Attrition) 별 직원의 연령(Age)를 시각화해보면, 퇴사한 직원 중 00보다 큰 경우 IQR 기준 이상치로 판단됩니다. 00에 해당하는 값을 작성하세요.',
      category: '이상치 처리',
      type: 'text',
      answer: '58',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: '퇴사 그룹 연령 분포의 Q3 + 1.5 * IQR 상한선 수치는 58세입니다.'
    },
    {
      id: 'p108',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 8,
      title: 'IQR 비교 (집과의 거리)',
      description: '퇴사 여부(Attrition)에 따른 집과의 거리(DistanceFromHome) 분포를 시각화하고, 집과의 거리(DistanceFromHome)의 사분위범위(IQR)가 더 큰 경우를 고르세요.',
      category: '데이터 시각화',
      type: 'single',
      options: ['퇴사함', '퇴사하지 않음'],
      answer: '퇴사함',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: '퇴사한 그룹(Attrition=1)의 DistanceFromHome IQR 박스 범위가 더 큽니다.'
    },
    {
      id: 'p109',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 9,
      title: '결측치 대체 (JobSatisfaction)',
      description: '직무 만족도(JobSatisfaction) 컬럼의 결측치를 4로 대체하세요. 데이터 가공 후, 변화된 직무 만족도(JobSatisfaction) 값이 4인 데이터의 개수를 작성하세요.\n※ 이 단계에서는 [가공데이터 저장]을 클릭하지 마세요.\n※ 정답 작성 시 정수 형태로 작성하세요. (예: 000)',
      category: '데이터 전처리',
      type: 'text',
      answer: '468',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: '기존 4인 개수에 결측치 수만큼 대체되어 총 468개가 됩니다.'
    },
    {
      id: 'p110',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 10,
      title: '결측치 행 삭제 (MonthlyRate)',
      description: '월급(MonthlyRate) 컬럼의 결측치를 포함하는 행을 삭제하세요. 데이터 가공 후, 변화된 데이터 행의 수를 작성하세요.\n※ 이 단계에서는 [가공데이터 저장]을 클릭하지 마세요.\n※ 정답 작성 시 정수 형태로 작성하세요. (예: 0000)',
      category: '데이터 전처리',
      type: 'text',
      answer: '1413',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: 'MonthlyRate 결측치 행을 dropna로 제거한 후 최종 남은 행 수는 1413개입니다.'
    },
    {
      id: 'p111',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 11,
      title: 'Ordinal 인코딩 적용',
      description: '주어진 범주형 컬럼들에 대해 Ordinal 인코딩을 적용하세요. 데이터 가공 후, 변화된 성별(Gender) 컬럼에서 Male의 인코딩 값을 고르세요.\n※ 인코딩 대상 컬럼: Department, Gender, JobRole, OverTime\n※ 수행 후 [가공데이터 저장]을 클릭하여 가공된 데이터를 저장하세요.',
      category: '피처 인코딩',
      type: 'single',
      options: ['0', '1'],
      answer: '1',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: 'Gender 컬럼 Ordinal Encoding 결과 Male은 1 (Female은 0)로 매핑됩니다.'
    },
    {
      id: 'p112',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 12,
      title: '머신러닝 모델 비교 (재현율 기준)',
      description: '3개의 머신러닝 모델을 다음과 같은 설정으로 학습하고, 이중 재현율 기준 성능이 평균적으로 가장 좋은 것을 고르세요.\n- 작업 데이터 선택: 문제 11번에서 신규로 저장한 데이터 사용\n- Input 컬럼: 변환 전 변수 제외 지정\n- Output 컬럼: Attrition (종속 변수)\n- ML 모델: Logistic Regression, Decision Tree, Random Forest',
      category: '머신러닝 평가',
      type: 'single',
      options: ['Logistic Regression', 'Decision Tree', 'Random Forest'],
      answer: 'Random Forest',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: 'Random Forest 모델이 교차 검증 재현율(Recall) 지표에서 가장 높은 성능을 보입니다.'
    },
    {
      id: 'p113',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 13,
      title: '딥러닝 모델 학습 및 Accuracy 계산',
      description: '딥러닝 모델을 다음과 같은 설정으로 학습하고, 학습된 모델의 Accuracy를 작성하세요.\n- Output: Attrition\n- Epochs: 10, Batch Size: 128, learning rate: 0.001\n- 정답은 반올림하여 소수점 네번째 자리까지 작성하세요. (예: 0.0000)',
      category: '딥러닝 모델링',
      type: 'text',
      answer: '0.8524',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: '설정된 파라미터로 딥러닝 모델을 10 에포크 학습시킨 후 검증 정확도는 0.8524입니다.'
    },
    {
      id: 'p114',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 14,
      title: '딥러닝 모델 기반 직원 퇴사여부 예측',
      description: '문제 13번에서 저장한 딥러닝 모델을 활용하여 다음과 같은 조건일 때의 직원의 퇴사 여부를 예측하세요.\n- Age: 28, Department_OE: 1, DistanceFromHome: 5, Education: 2, Gender_OE: 1, JobInvolvement: 1, JobRole_OE: 0, JobSatisfaction_IM: 3, MonthlyRate: 15000, OverTime_OE: 1',
      category: '모델 추론',
      type: 'single',
      options: ['0: 퇴사하지 않음', '1: 퇴사함'],
      answer: '1: 퇴사함',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: '주어진 조건(야근 1, 높은 직무참여도 문제 등)으로 추론 시 예측 결과는 1(퇴사함)입니다.'
    },
    {
      id: 'p115',
      exam_id: 'a1111111-1111-1111-1111-111111111111',
      order_num: 15,
      title: '딥러닝 모델 파라미터 고도화 (Accuracy 개선)',
      description: '문제 13번의 딥러닝 파라미터 중 "전체 데이터를 학습하는 횟수"를 100으로 설정하고, "1회 가중치 업데이트에 사용하는 데이터 수"를 256으로 설정하여 모델을 고도화하세요. 개선된 Accuracy는 반올림하여 소수점 네번째 자리까지 작성하세요. (예: 0.0000)',
      category: '하이퍼파라미터 튜닝',
      type: 'text',
      answer: '0.8850',
      csv_url: '/sample_data/customer_data.csv',
      score: 20,
      explanation: 'Epochs=100, Batch Size=256으로 고도화 후 검증 정확도는 0.8850으로 상향됩니다.'
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
    
    // Deduplicate by ID, with custom/updated items replacing mock items
    const examMap = new Map<string, Exam>();
    MOCK_EXAMS.forEach(e => examMap.set(e.id, e));
    custom.forEach(e => {
      if (e && e.id) {
        const mock = MOCK_EXAMS.find(m => m.id === e.id);
        const merged: Exam = {
          ...e,
          overview: e.overview || mock?.overview
        };
        examMap.set(e.id, merged);
      }
    });

    return Array.from(examMap.values());
  } catch {
    return MOCK_EXAMS;
  }
}

function saveLocalExam(exam: Exam) {
  if (typeof window === 'undefined') return;
  const current = getLocalExams();
  const idx = current.findIndex(e => e.id === exam.id);
  if (idx !== -1) {
    current[idx] = exam;
  } else {
    current.push(exam);
  }
  
  // Store custom items or modified mock items only
  const customOnly = current.filter(e => {
    const mock = MOCK_EXAMS.find(m => m.id === e.id);
    if (!mock) return true;
    return JSON.stringify(mock) !== JSON.stringify(e);
  });
  localStorage.setItem('aice_custom_exams', JSON.stringify(customOnly));
}

// Local storage problems fallback
function getLocalProblems(examId: string): Problem[] {
  const mockList = MOCK_PROBLEMS[examId] || [];
  if (typeof window === 'undefined') return mockList;
  try {
    const data = localStorage.getItem(`aice_custom_problems_${examId}`);
    if (!data) return mockList;
    const custom: Problem[] = JSON.parse(data);
    
    const probMap = new Map<number, Problem>();
    mockList.forEach(p => probMap.set(p.order_num, p));
    custom.forEach(p => probMap.set(p.order_num, p));

    return Array.from(probMap.values()).sort((a, b) => a.order_num - b.order_num);
  } catch {
    return mockList;
  }
}

function saveLocalProblem(examId: string, problem: Problem) {
  if (typeof window === 'undefined') return;
  const current = getLocalProblems(examId);
  const idx = current.findIndex(p => p.id === problem.id || p.order_num === problem.order_num);
  if (idx !== -1) {
    current[idx] = problem;
  } else {
    current.push(problem);
  }

  const mockList = MOCK_PROBLEMS[examId] || [];
  const customOnly = current.filter(p => {
    const mock = mockList.find(m => m.id === p.id);
    if (!mock) return true;
    return JSON.stringify(mock) !== JSON.stringify(p);
  });
  localStorage.setItem(`aice_custom_problems_${examId}`, JSON.stringify(customOnly));
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
        const uniqueMap = new Map<string, Exam>();
        data.forEach((item: any) => {
          const mock = MOCK_EXAMS.find(m => m.id === item.id);
          const examObj: Exam = {
            ...item,
            overview: item.overview || mock?.overview
          };
          uniqueMap.set(item.id, examObj);
        });
        return Array.from(uniqueMap.values());
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
          pass_score: examData.pass_score,
          overview: examData.overview || null
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
        const mock = MOCK_EXAMS.find(m => m.id === data.id);
        return {
          ...data,
          overview: data.overview || mock?.overview
        } as Exam;
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

export async function updateProblem(problemId: string, problemData: Partial<Problem>): Promise<Problem | null> {
  if (supabase) {
    try {
      const payload: any = {};
      if (problemData.order_num !== undefined) payload.order_num = problemData.order_num;
      if (problemData.title !== undefined) payload.title = problemData.title;
      if (problemData.description !== undefined) payload.description = problemData.description;
      if (problemData.category !== undefined) payload.category = problemData.category;
      if (problemData.type !== undefined) payload.type = problemData.type;
      if (problemData.options !== undefined) payload.options = problemData.options ? JSON.stringify(problemData.options) : null;
      if (problemData.answer !== undefined) payload.answer = problemData.answer;
      if (problemData.csv_url !== undefined) payload.csv_url = problemData.csv_url;
      if (problemData.score !== undefined) payload.score = problemData.score;
      if (problemData.explanation !== undefined) payload.explanation = problemData.explanation;

      const { data, error } = await supabase
        .schema('aice')
        .from('aice_problems')
        .update(payload)
        .eq('id', problemId)
        .select()
        .single();

      if (!error && data) {
        const updated = {
          ...data,
          options: typeof data.options === 'string' ? JSON.parse(data.options) : data.options
        } as Problem;
        saveLocalProblem(updated.exam_id, updated);
        return updated;
      }
    } catch (e) {
      console.warn('Supabase updateProblem error:', e);
    }
  }

  if (problemData.exam_id) {
    const list = getLocalProblems(problemData.exam_id);
    const found = list.find(p => p.id === problemId);
    if (found) {
      const updated = { ...found, ...problemData } as Problem;
      saveLocalProblem(problemData.exam_id, updated);
      return updated;
    }
  }
  return null;
}

export async function deleteProblem(problemId: string, examId: string): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase
        .schema('aice')
        .from('aice_problems')
        .delete()
        .eq('id', problemId);

      if (!error) {
        deleteLocalProblem(examId, problemId);
        return true;
      }
    } catch (e) {
      console.warn('Supabase deleteProblem error:', e);
    }
  }

  deleteLocalProblem(examId, problemId);
  return true;
}

function deleteLocalProblem(examId: string, problemId: string) {
  if (typeof window === 'undefined') return;
  const list = getLocalProblems(examId).filter(p => p.id !== problemId);
  localStorage.setItem(`aice_custom_problems_${examId}`, JSON.stringify(list));
}

export async function updateExam(examId: string, examData: Partial<Exam>): Promise<Exam | null> {
  if (supabase) {
    try {
      const payload: any = {};
      if (examData.title !== undefined) payload.title = examData.title;
      if (examData.description !== undefined) payload.description = examData.description;
      if (examData.time_limit_minutes !== undefined) payload.time_limit_minutes = examData.time_limit_minutes;
      if (examData.total_questions !== undefined) payload.total_questions = examData.total_questions;
      if (examData.pass_score !== undefined) payload.pass_score = examData.pass_score;
      if (examData.overview !== undefined) payload.overview = examData.overview;

      const { data, error } = await supabase
        .schema('aice')
        .from('aice_exams')
        .update(payload)
        .eq('id', examId)
        .select()
        .single();

      if (!error && data) {
        updateLocalExam(examId, data as Exam);
        return data as Exam;
      }
    } catch (e) {
      console.warn('Supabase updateExam error:', e);
    }
  }

  const allExams = getLocalExams();
  const found = allExams.find(e => e.id === examId);
  if (found) {
    const updated = { ...found, ...examData };
    updateLocalExam(examId, updated);
    return updated;
  }
  return null;
}

function updateLocalExam(examId: string, updated: Exam) {
  saveLocalExam(updated);
}

function clearLocalProblems(examId: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`aice_custom_problems_${examId}`);
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
      // 1. 기존 문항 덮어쓰기를 위해 해당 exam_id의 이전 문제 삭제 (Overwriting)
      await supabase
        .schema('aice')
        .from('aice_problems')
        .delete()
        .eq('exam_id', examId);

      // 2. 신규 문제 일괄 등록
      const { data, error } = await supabase
        .schema('aice')
        .from('aice_problems')
        .insert(formattedProblems)
        .select();

      if (!error && data) {
        clearLocalProblems(examId);
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

  // Local storage fallback (Overwriting)
  clearLocalProblems(examId);
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

export async function uploadCsvDataset(file: File): Promise<string> {
  if (supabase) {
    try {
      const fileName = `dataset_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { data, error } = await supabase
        .storage
        .from('aice_csv')
        .upload(fileName, file, { upsert: true });

      if (!error && data) {
        const { data: publicUrlData } = supabase
          .storage
          .from('aice_csv')
          .getPublicUrl(fileName);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (e) {
      console.warn('Supabase storage upload error, using local fallback:', e);
    }
  }

  if (typeof window !== 'undefined' && typeof window.URL?.createObjectURL === 'function') {
    return URL.createObjectURL(file);
  }
  return `/sample_data/${file.name}`;
}

export async function updateExamCsvUrl(examId: string, csvUrl: string): Promise<boolean> {
  if (supabase) {
    try {
      await supabase
        .schema('aice')
        .from('aice_problems')
        .update({ csv_url: csvUrl })
        .eq('exam_id', examId);
      return true;
    } catch (e) {
      console.warn('Supabase updateExamCsvUrl error:', e);
    }
  }
  return false;
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
