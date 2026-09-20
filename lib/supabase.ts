import { createClient } from '@supabase/supabase-js';
import { Exam, Problem, Submission, StudentSession, Student } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function getScoreByOrderNum(orderNum: number): number {
  if (orderNum >= 1 && orderNum <= 10) return 6;
  return 8;
}

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
  { school: '테스트기관', student_id: '0011', student_name: '관리자' },
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
    pass_score: 80,
    created_at: new Date().toISOString(),
    overview: `[AICE Basic 모의고사: 퇴사여부 예측 (문제지)]

■ 주제: 퇴사여부 예측

■ 배경:
최근에는 조직 문화, 업무 강도, 보상 수준 등 다양한 요인으로 인해 직원의 퇴사 가능성을 미리 파악하는 것이 중요해지고 있습니다. 직원의 퇴사는 개인의 만족도뿐만 아니라 근속 기간, 업무 환경, 직무 역할, 성과 등 여러 요인이 복합적으로 작용해 발생하기 때문에 단순한 기준만으로 판단하기 어렵습니다. 만약 과거 직원 데이터를 기반으로 퇴사 가능성을 미리 예측할 수 있다면, 퇴사 위험이 높은 직원을 조기에 파악하고 인사 관리와 조직 운영을 보다 효과적으로 진행할 수 있을 것입니다.
이를 위해 데이터 분석과 머신러닝 모델을 활용하여 직원의 다양한 근무 지표를 종합적으로 고려해 퇴사 여부를 예측하고자 합니다.

■ 과제명:
인사 데이터를 기반으로 직원의 퇴사여부를 예측하는 AI 모델을 구현해보세요.

■ 데이터 컬럼명:
- Age: 연령
- Attrition: 퇴사 여부 (1: 퇴사, 0: 퇴사하지 않음)
- Department: 근무 부서
- DistanceFromHome: 집과의 거리
- Education: 교육 수준
- Gender: 성별
- JobInvolvement: 직무 참여도
- JobRole: 직무 역할
- JobSatisfaction: 직무 만족도
- MonthlyRate: 월급
- OverTime: 야근 여부`
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    title: 'AICE Basic 제2회 실전 모의고사: 자동차 가격 예측',
    description: '자동차 거래 데이터 기반 자동차 거래 가격 예측 AI 모델 구현 실전 모의고사 (15문항, 60분 제한)',
    time_limit_minutes: 60,
    total_questions: 15,
    pass_score: 80,
    created_at: new Date().toISOString(),
    is_result_released: false,
    overview: `[AICE Basic 실전 모의고사: 자동차 가격 예측 (문제지)]

■ 주제: 자동차 가격 예측

■ 배경:
최근 중고차 시장에서는 차량 상태와 정보에 따라 가격 편차가 크게 발생하면서, 합리적인 거래 가격을 산정하는 것이 중요한 문제로 대두되고 있습니다. 특히 연식, 주행 거리, 모델, 제조국, 차체 유형 등 다양한 요인이 복합적으로 작용하기 때문에 단순한 기준만으로 적정 가격을 판단하기는 어렵습니다.
만약 과거 거래 데이터를 기반으로 차량의 특성을 종합적으로 반영하여 가격을 예측할 수 있다면, 판매자와 구매자 모두 보다 객관적이고 합리적인 의사결정을 할 수 있을 것입니다.
이를 위해 데이터 분석과 머신러닝 및 딥러닝 모델을 활용하여 차량의 다양한 속성을 고려한 거래 가격 예측을 수행하고자 합니다.

■ 과제명:
자동차 가격 데이터를 기반으로 자동차 거래 가격을 예측하는 AI 모델을 구현해보세요.

■ 데이터 컬럼명:
- year: 차량 제조 연도
- make: 제조국
- model: 모델명
- transmission: 변속기 유형
- vin: 차량 식별 번호
- state: 거래가 이루어진 주
- condition: 차량 상태 점수
- odometer: 주행 거리
- interior: 차량 내부 색상
- sellingprice: 자동차 거래 가격
- body_type: 차체 유형
- color_group: 색상 계열`
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    title: 'AICE Basic 연습문제: 심장병 예측',
    description: '심장병 환자 데이터를 기반으로 환자의 심장병 여부를 예측하는 AI 모델 구현 연습문제 (15문항)',
    time_limit_minutes: 60,
    total_questions: 15,
    pass_score: 80,
    created_at: new Date().toISOString(),
    is_result_released: false,
    overview: `[AICE Basic 연습문제: 심장병 예측 (문제지)]

■ 주제: 심장병 예측

■ 배경:
최근에는 생활 습관 변화와 스트레스 증가로 인해 연령과 관계없이 심장병 위험을 가진 사람들이 늘어나고 있습니다. 이에 따라 심장병을 조기에 발견하고 예방하는 것이 더욱 중요해지고 있습니다. 심장병은 혈압, 콜레스테롤, 심박수 등 여러 요인이 복합적으로 작용해 발생하기 때문에 단순한 기준만으로 위험 여부를 판단하기 어렵습니다. 만약 과거 환자 데이터를 기반으로 심장병 발생 가능성을 미리 예측할 수 있다면, 고위험 환자를 조기에 발견하고 예방적 치료를 보다 효과적으로 진행할 수 있을 것입니다.
이를 위해 데이터 분석과 머신러닝 모델을 활용하여 환자의 다양한 건강 지표를 종합적으로 고려해 심장병 여부를 예측해보고자 합니다.

■ 과제명:
심장병 환자 데이터를 기반으로 환자의 심장병 여부를 예측하는 AI 모델을 구현해보세요.

■ 데이터 컬럼명:
- Age: 환자의 나이
- Sex: 환자의 성별
- ChestPainType: 흉통 유형
- RestingBP: 휴식 시 혈압
- Cholesterol: 혈청 콜레스테롤
- FastingBS: 공복 혈당 정상 여부
- RestingECG: 휴식 심전도 결과
- MaxHR: 최대 심박수
- ExerciseAngina: 운동 유발 협심증
- Oldpeak: ST 하강 정도
- ST_Slope: ST 구간 기울기
- HeartDisease: 심장병 레이블 (심장병 유: 1, 심장병 무: 0)`
  },
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    title: 'AICE Basic 연습문제 2: 와인 품질 예측',
    description: '와인의 여러 화학적 특성을 담은 데이터를 통해 와인의 품질을 예측하는 AI 모델 구현 연습문제 (15문항)',
    time_limit_minutes: 60,
    total_questions: 15,
    pass_score: 80,
    created_at: new Date().toISOString(),
    is_result_released: false,
    overview: `[AICE Basic 연습문제 2: 와인 품질 예측 (문제지)]

■ 주제: 와인 품질 예측

■ 배경:
최근에는 와인 생산 과정에서도 데이터 기반 품질 관리의 중요성이 점점 커지고 있습니다. 동일한 포도 품종을 사용하더라도 발효 과정, 화학적 성분, 저장 환경 등에 따라 와인의 맛과 향, 전반적인 품질이 달라질 수 있습니다.
와인의 품질은 산도, 당도, 알코올 함량, 황 함량 등 여러 화학적 특성이 복합적으로 작용하여 결정되기 때문에 단순히 하나의 기준만으로 품질을 판단하기 어렵습니다. 이러한 이유로 와인 품질 평가는 일반적으로 전문가의 감각 평가에 의존하는 경우가 많지만, 이는 주관적인 요소가 개입될 수 있다는 한계가 있습니다.
만약 와인의 화학적 특성 데이터를 기반으로 품질을 예측할 수 있다면, 생산 단계에서부터 품질을 보다 체계적으로 관리하고 일정한 품질을 유지하는 데 도움을 줄 수 있을 것입니다. 이를 위해 데이터 분석과 머신러닝 모델을 활용하여 와인의 다양한 화학적 특성을 종합적으로 고려하고, 이를 바탕으로 와인의 품질을 예측해보고자 합니다.

■ 과제명:
와인의 여러 화학적 특성을 담은 데이터를 통해 와인의 품질을 예측하는 AI 모델을 구현해보세요.

■ 데이터 컬럼명:
- fixed acidity: 고정산도
- volatile acidity: 휘발성산도
- citric acid: 구연산
- residual sugar: 잔류당
- chlorides: 염화물
- free sulfur dioxide: 유리 이산화황
- total sulfur dioxide: 총 이산화황
- density: 밀도
- pH: pH
- sulphates: 황산염
- alcohol: 알코올
- quality: 와인의 품질`
  },
  {
    id: 'e5555555-5555-5555-5555-555555555555',
    title: 'AICE Basic 연습문제 3: 은행 고객 이탈 예측',
    description: '은행 내 고객 이탈에 영향을 미치는 요인을 탐색 및 분석하고 고객의 이탈 여부를 예측하는 AI 모델 구현 연습문제 (15문항)',
    time_limit_minutes: 60,
    total_questions: 15,
    pass_score: 80,
    created_at: new Date().toISOString(),
    is_result_released: false,
    overview: `[AICE Basic 연습문제 3: 은행 고객 이탈 예측 (문제지)]

■ 주제: 은행 고객 이탈 예측

■ 배경:
최근 금융 산업에서는 경쟁이 심화되면서 기존 고객을 유지하는 것이 신규 고객을 확보하는 것만큼이나 중요한 과제로 떠오르고 있습니다. 특히 디지털 금융 서비스의 확산으로 고객들이 다양한 금융 기관을 쉽게 비교하고 이동할 수 있게 되면서, 고객 이탈 문제는 더욱 빈번하게 발생하고 있습니다. 은행 고객의 이탈은 단순히 한 명의 고객을 잃는 것을 넘어 장기적인 수익 감소로 이어질 수 있기 때문에, 이를 사전에 예측하고 대응하는 것은 매우 중요합니다. 그러나 고객의 이탈 여부는 계좌 잔고, 거래 빈도, 금융 상품 이용 내역, 고객 연령 및 활동 패턴 등 다양한 요인이 복합적으로 작용하여 결정되므로, 단순한 기준만으로 판단하기 어렵습니다. 이러한 이유로 은행에서는 과거 고객 데이터를 활용하여 이탈 가능성이 높은 고객을 사전에 식별하고, 맞춤형 혜택이나 마케팅 전략을 통해 고객을 유지하려는 노력이 필요합니다.
이를 위해 데이터 분석과 머신러닝 모델을 활용하여 고객의 다양한 금융 활동 데이터를 종합적으로 고려하고, 이를 바탕으로 고객의 이탈 여부를 예측해보고자 합니다.

■ 과제명:
은행 내 고객 이탈에 영향을 미치는 요인을 탐색 및 분석하고, 고객의 이탈 여부를 예측하는 AI 모델을 구현해보세요.

■ 데이터 컬럼명:
- RowNumber: 데이터셋의 각 행에 부여된 순번
- CustomerId: 고객 ID
- Surname: 고객의 성
- CreditScore: 신용 점수
- Geography: 고객의 거주 지역
- Gender: 성별
- Age: 나이
- Tenure: 은행 거래 연수
- Balance: 계좌 잔액
- NumOfProducts: 보유한 은행 상품 수
- HasCrCard: 신용카드 보유 여부 (보유: 1, 미보유: 0)
- IsActiveMember: 활동 회원 여부 (활동: 1, 미활동: 0)
- EstimatedSalary: 추정 연봉
- Exited: 고객 이탈 여부 (이탈: 1, 이탈하지 않음: 0)`
  },
  {
    id: 'f6666666-6666-6666-6666-666666666666',
    title: 'AICE Basic 연습문제 4: 학생 성적 예측',
    description: '다양한 학습 요인을 통해 학생의 최종 시험 점수를 예측하는 AI 모델 구현 연습문제 (15문항)',
    time_limit_minutes: 60,
    total_questions: 15,
    pass_score: 80,
    created_at: new Date().toISOString(),
    is_result_released: false,
    overview: `[AICE Basic 연습문제 4: 학생 성적 예측 (문제지)]

■ 주제: 학생 성적 예측

■ 배경:
최근 교육 분야에서는 단순히 시험 결과만으로 학생의 학업 성취도를 평가하는 것을 넘어, 학습 과정에서의 다양한 요인을 종합적으로 고려하려는 시도가 증가하고 있습니다. 학생의 성적은 단순히 공부 시간뿐만 아니라 출석률, 이전 성적, 학습 습관 등 여러 요인이 복합적으로 작용하여 결정됩니다. 따라서 특정 하나의 기준만으로 성적을 예측하거나 학업 성취도를 판단하기에는 한계가 있습니다. 이러한 이유로 학생의 다양한 학습 데이터를 기반으로 성적을 예측할 수 있다면, 학습 부진 학생을 조기에 파악하고 맞춤형 학습 지원을 제공하는 데에 도움이 될 수 있습니다. 또한 교육 기관에서는 이를 통해 보다 효과적인 교육 전략을 수립할 수 있습니다.
이를 위해 데이터 분석과 머신러닝 모델을 활용하여 학생의 다양한 학습 관련 지표를 종합적으로 고려하고, 이를 바탕으로 학생의 성적을 예측해보고자 합니다.

■ 과제명:
다양한 학습 요인을 통해 학생의 최종 시험 점수를 예측하는 AI 모델을 구현하세요.

■ 데이터 컬럼명:
- Hours_Studied: 주당 공부 시간
- Attendance: 수업 출석률
- Parental_Involvement: 부모의 참여 수준
- Access_to_Resources: 교육 자원 이용 가능 여부
- Extracurricular_Activities: 비교과 활동 참여 여부
- Sleep_Hours: 평균 수면 시간
- Previous_Scores: 이전 시험 점수
- Motivation_Level: 학생의 학습 동기 수준
- Internet_Access: 인터넷 접속 가능 여부
- Tutoring_Sessions: 튜터링 참여 횟수
- Family_Income: 가정 소득 수준
- Teacher_Quality: 교사의 수업 질
- School_Type: 학교 유형
- Peer_Influence: 또래가 학업 성취에 미치는 영향
- Physical_Activity: 주간 평균 신체 활동 시간
- Learning_Disabilities: 학습 장애 여부
- Parental_Education_Level: 부모의 최종 학력
- Distance_from_Home: 집과 학교 사이 거리
- Gender: 학생의 성별
- Exam_Score: 최종 시험 점수`
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
      score: 6,
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
      score: 6,
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
      score: 6,
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
      score: 6,
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
      score: 6,
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
      score: 6,
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
      score: 6,
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
      score: 6,
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
      score: 6,
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
      score: 6,
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
      score: 8,
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
      score: 8,
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
      score: 8,
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
      score: 8,
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
      score: 8,
      explanation: 'Epochs=100, Batch Size=256으로 고도화 후 검증 정확도는 0.8850으로 상향됩니다.'
    }
  ],
  'b2222222-2222-2222-2222-222222222222': [
    {
      id: 'p201',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 1,
      title: '알고리즘 유형 선택',
      description: '본 과제 해결에 알맞은 알고리즘의 유형을 고르시오.',
      category: 'AI 개념',
      type: 'single',
      options: ['회귀 모형', '분류 모형', '군집 모형', '시계열 모형'],
      answer: '회귀 모형',
      score: 6,
      explanation: '자동차 거래 가격(sellingprice)은 연속형 수치 타겟변수이므로 회귀(Regression) 모형이 적절합니다.'
    },
    {
      id: 'p202',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 2,
      title: '타겟 변수 작성',
      description: '본 과제의 타겟 변수를 적으세요.',
      category: '데이터 이해',
      type: 'text',
      answer: 'sellingprice',
      score: 6,
      explanation: '예측하고자 하는 목표 변수는 자동차 거래 가격인 sellingprice입니다.'
    },
    {
      id: 'p203',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 3,
      title: '개별 데이터 구분 변수 선택',
      description: '다음 변수 중 개별 데이터를 구분하는 값을 의미하는 변수를 고르세요.',
      category: '데이터 이해',
      type: 'single',
      options: ['year', 'vin', 'odometer', 'body_type'],
      answer: 'vin',
      score: 6,
      explanation: 'VIN(차대번호)은 각 차량의 고유 식별자로 개별 데이터를 구분하는 키 역할을 합니다.'
    },
    {
      id: 'p204',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 4,
      title: '특정 색상 차량 수 파악',
      description: '차량 내부 색상(interior)이 tan인 차량의 수를 작성하세요.',
      category: '데이터 탐색',
      type: 'text',
      answer: '440',
      score: 6,
      explanation: 'interior 컬럼의 값이 tan인 차량 데이터의 총 개수입니다.'
    },
    {
      id: 'p205',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 5,
      title: '왜도(Skewness) 양수 변수 탐색',
      description: '왜도가 양수 값을 가지는 변수를 고르세요.',
      category: '데이터 기술통계',
      type: 'single',
      options: ['year', 'condition', 'odometer'],
      answer: 'odometer',
      score: 6,
      explanation: '주행거리(odometer) 변수는 오른쪽으로 긴 꼬리를 가진 분포를 띠며 왜도가 양수입니다.'
    },
    {
      id: 'p206',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 6,
      title: '가격 구간별 최다 비율 제조국 탐색',
      description: '제조국(make) 별 자동차 거래 가격(sellingprice)을 시각화하고, 거래 가격(sellingprice)이 12k~12.99k 구간에 속하는 자동차 중 가장 많은 비율을 차지하는 제조국을 고르세요.',
      category: '데이터 시각화',
      type: 'single',
      options: ['Japan', 'USA', 'Europe', 'Korea'],
      answer: 'USA',
      score: 6,
      explanation: '12k~12.99k 구간 거래 가격 자동차 중 제조국 비율이 가장 높은 곳은 USA입니다.'
    },
    {
      id: 'p207',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 7,
      title: '타겟변수 최고 상관관계 변수 탐색',
      description: '자동차 거래 가격(sellingprice) 컬럼과 가장 큰 상관관계를 갖는 변수를 고르세요.',
      category: '상관관계 분석',
      type: 'single',
      options: ['year', 'condition', 'odometer'],
      answer: 'odometer',
      score: 6,
      explanation: 'sellingprice와 상관관계 절댓값이 가장 큰 변수는 주행거리(odometer)입니다.'
    },
    {
      id: 'p208',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 8,
      title: '타겟변수 최고 양의 상관관계 변수 탐색',
      description: '자동차 거래 가격(sellingprice) 컬럼과 양의 상관관계가 가장 큰 변수를 고르세요.',
      category: '상관관계 분석',
      type: 'single',
      options: ['year', 'condition', 'odometer'],
      answer: 'year',
      score: 6,
      explanation: 'sellingprice와 양(+)의 상관관계 수치가 가장 높은 변수는 연식(year)입니다.'
    },
    {
      id: 'p209',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 9,
      title: 'IQR 이상치 무존재 차체 유형 탐색',
      description: '차체 유형(body_type) 별 자동차 거래 가격(sellingprice)을 시각화하고 IQR 기준 이상치가 존재하지 않는 차체 유형(body)을 고르세요.',
      category: '이상치 탐색',
      type: 'single',
      options: ['Sedan', 'SUV', 'Van', 'Truck'],
      answer: 'Van',
      score: 6,
      explanation: 'Van 차체 유형의 경우 IQR 박스 플롯 기준 이상치 데이터가 관측되지 않습니다.'
    },
    {
      id: 'p210',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 10,
      title: '결측치 최빈값 대체',
      description: '종속변수를 제외한 모든 변수에 대해 결측치가 있는 경우, 최빈값으로 결측치를 대체하세요. 데이터 가공 후, 변화된 모델명(model)의 최빈값의 개수를 작성하세요.\n※ 이 단계에서는 [가공데이터 저장]을 클릭하지 마세요.',
      category: '데이터 전처리',
      type: 'text',
      answer: '125',
      score: 6,
      explanation: 'model 결측치를 최빈값으로 대체한 후 계산된 최빈값 데이터 개수입니다.'
    },
    {
      id: 'p211',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 11,
      title: '표준화 스케일링 및 제3사분위수 계산',
      description: '주어진 컬럼들에 대해 평균을 0, 표준편차를 1로 변환하는 스케일 기법을 적용하고, 변화된 주행 거리(odometer)의 제3사분위수 값을 작성하세요.\n※ 문제 10번에서 가공된 컬럼은 가공 후 컬럼의 Scale을 조정하세요.\n※ 스케일링 대상 컬럼: year, condition, odometer\n※ 수행 후 [가공데이터 저장]을 클릭하여 가공된 데이터를 저장하세요.\n※ 정답 작성 시 소수점은 반올림하여 소수점 아래 두자리까지 작성하세요. (예: 0.00)',
      category: '피처 스케일링',
      type: 'text',
      answer: '0.75',
      score: 8,
      explanation: 'StandardScaler 스케일링 후 odometer 컬럼의 제3사분위수(75%) 수치입니다.'
    },
    {
      id: 'p212',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 12,
      title: '머신러닝 모델 비교 (R2 결정계수 기준)',
      description: '3개의 머신러닝 모델을 다음과 같은 설정으로 학습하고, 이중 설명력(R2) 기준 성능이 평균적으로 가장 좋은 것을 고르세요.\n- 작업 데이터 선택: 문제 11번에서 데이터 가공을 통해 신규로 저장한 데이터를 사용하세요.\n- Input 컬럼: 문제 3번의 정답 변수는 제외 컬럼으로 지정 / 문제 10번의 결측치 처리에 사용된 변수 중 \'변환하기 전의 변수\'는 제외 / 문제 11번의 스케일 조정에 사용된 변수 중 \'변환하기 전의 변수\'는 제외\n- Output 컬럼: 종속 변수 (sellingprice)\n- 데이터 유형 선택: 종속 변수의 데이터 유형은 모델 유형에 맞게 설정하고, 나머지는 초기 설정값을 사용하세요.\n- ML 모델 선택: Linear Regression, Decision Tree, LightGBM',
      category: '머신러닝 평가',
      type: 'single',
      options: ['Linear Regression', 'Decision Tree', 'LightGBM'],
      answer: 'LightGBM',
      score: 8,
      explanation: 'LightGBM 모델이 R2(결정계수) 성능 지표에서 가장 높은 성적을 거둡니다.'
    },
    {
      id: 'p213',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 13,
      title: '딥러닝 모델 학습 및 MAE 수치 작성',
      description: '딥러닝 모델을 다음과 같은 설정으로 학습하고, 학습된 모델의 MAE를 작성하세요.\n- 작업 데이터 선택: 문제 11번의 데이터 가공을 통해 신규로 저장한 데이터\n- Output 컬럼: 종속 변수 (sellingprice)\n- Input 컬럼: 문제 3번/10번/11번 전처리 전 변수 제외, 모든 object형 변수의 인코더를 sparse로 설정\n- 컬럼 파라미터 설정: 종속변수 데이터 유형 설정, 활성함수 linear, FC 레이어 수 1, FC 레이어 크기 64, 드롭아웃 0, FC 활성함수 relu\n- 학습 파라미터 설정: Epochs 30, Batch Size 128, learning rate 0.001\n- 정답 작성: 반올림하여 소수점 네번째 자리까지 작성하세요. (예: 0.0000)',
      category: '딥러닝 모델링',
      type: 'text',
      answer: '1850.2500',
      score: 8,
      explanation: '지정된 파라미터로 딥러닝 모델 학습 후 산출된 MAE 검증 수치입니다.'
    },
    {
      id: 'p214',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 14,
      title: '딥러닝 모델 주요 변수 영향도 판단',
      description: '문제 13번에서 저장한 딥러닝 모델 분석 결과, 자동차 거래 가격 예측에 영향을 주는 상위 5개의 변수에 해당하지 않는 것을 고르세요.',
      category: '모델 해석',
      type: 'single',
      options: ['odometer_SS', 'body_type', 'color_group', 'make'],
      answer: 'color_group',
      score: 8,
      explanation: '자동차 거래 가격 예측 모델의 상위 5개 영향 변수 중 color_group은 포함되지 않습니다.'
    },
    {
      id: 'p215',
      exam_id: 'b2222222-2222-2222-2222-222222222222',
      order_num: 15,
      title: '딥러닝 모델 기반 자동차 거래 가격 예측 추론',
      description: '문제 13번에서 저장한 딥러닝 모델을 활용하여 다음과 같은 조건일 때의 자동차 거래 가격을 예측 후 반올림하여 정수로 작성하세요.\n- body_type: SUV\n- color_group: Light\n- condition_SS: 0.1\n- interior: black\n- make: Korea\n- model_IM: 1 Series\n- odometer_SS: 0.8\n- state: ab\n- transmission_IM: automatic\n- year_SS: 0.3',
      category: '모델 추론',
      type: 'text',
      answer: '13500',
      score: 8,
      explanation: '딥러닝 추론 모델을 통해 입력 조건으로 예측한 자동차 거래 가격 정수 수치입니다.'
    }
  ],
  'c3333333-3333-3333-3333-333333333333': [
    {
      id: 'p301',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 1,
      title: '알고리즘 유형 선택',
      description: '본 과제 해결에 알맞은 알고리즘의 유형을 고르시오.',
      category: 'AI 개념',
      type: 'single',
      options: ['회귀 모형', '분류 모형', '군집 모형', '시계열 모형'],
      answer: '분류 모형',
      score: 6,
      explanation: '심장병 여부(1: 심장병 유, 0: 심장병 무)는 범주형 타겟변수를 예측하는 문제이므로 분류(Classification) 모형이 적절합니다.'
    },
    {
      id: 'p302',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 2,
      title: '타겟 변수 작성',
      description: '본 과제의 타겟 변수를 적으세요.',
      category: '데이터 이해',
      type: 'text',
      answer: 'HeartDisease',
      score: 6,
      explanation: '예측하고자 하는 목표 변수는 심장병 여부인 HeartDisease입니다.'
    },
    {
      id: 'p303',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 3,
      title: '수치형 변수 개수 파악',
      description: '데이터 유형이 수치형(Numerical)인 변수의 개수를 작성하세요.',
      category: '데이터 탐색',
      type: 'text',
      answer: '6',
      score: 6,
      explanation: 'Age, RestingBP, Cholesterol, FastingBS, MaxHR, Oldpeak 총 6개 수치형 변수입니다.'
    },
    {
      id: 'p304',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 4,
      title: '기술통계 지표 선택',
      description: '수치형 변수의 중심 경향성을 파악하기 위해 사용하는 대표적인 지표 중 하나로, 데이터를 크기 순으로 정렬했을 때 가장 작은 값에 해당하는 것을 고르세요.',
      category: '데이터 기술통계',
      type: 'single',
      options: ['최소값', '중위수', '표준편차', '제1분위수'],
      answer: '최소값',
      score: 6,
      explanation: '데이터 정렬 시 가장 작은 위치의 값은 최소값(Min)입니다.'
    },
    {
      id: 'p305',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 5,
      title: '특정 변수 표준편차 계산',
      description: '휴식 시 혈압(RestingBP) 변수의 표준편차를 소수점 아래 두 자리까지 작성하세요. (예: 00.00)',
      category: '데이터 기술통계',
      type: 'text',
      answer: '22.11',
      score: 6,
      explanation: 'RestingBP 컬럼 데이터의 표준편차 계산 결과입니다.'
    },
    {
      id: 'p306',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 6,
      title: '특정 조건 데이터 개수 구하기',
      description: '휴식 시 혈압(RestingBP)이 170 이상인 환자의 수를 작성하세요.',
      category: '데이터 탐색',
      type: 'text',
      answer: '18',
      score: 6,
      explanation: 'RestingBP >= 170 조건을 만족하는 데이터의 총 개수는 18개입니다.'
    },
    {
      id: 'p307',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 7,
      title: '왜도(Skewness) 최대 변수 선택',
      description: '다음 수치형 변수 중 왜도(Skewness) 값이 가장 큰 변수를 고르세요.',
      category: '데이터 기술통계',
      type: 'single',
      options: ['Age', 'MaxHR', 'Oldpeak', 'RestingBP'],
      answer: 'RestingBP',
      score: 6,
      explanation: '제시된 변수들 중 분포의 비대칭도(왜도)가 가장 높은 변수는 RestingBP입니다.'
    },
    {
      id: 'p308',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 8,
      title: '흉통 유형(ChestPainType) 최빈값 탐색',
      description: '흉통 유형(ChestPainType) 중 가장 빈도수가 적은(최솟값) 유형을 고르세요.',
      category: '데이터 탐색',
      type: 'single',
      options: ['ATA', 'NAP', 'ASY', 'TA'],
      answer: 'TA',
      score: 6,
      explanation: 'ChestPainType 변수의 카테고리 중 빈도수가 가장 적은 유형은 TA(Typical Angina)입니다.'
    },
    {
      id: 'p309',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 9,
      title: '결측치 포함 데이터 개수 파악',
      description: '전체 데이터 중 결측치(Null/NaN)가 하나라도 포함된 행(Row)의 개수를 작성하세요.',
      category: '데이터 전처리',
      type: 'text',
      answer: '12',
      score: 6,
      explanation: '결측치를 포함하는 전체 행의 개수는 12개입니다.'
    },
    {
      id: 'p310',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 10,
      title: '결측치 평균값 대체 및 평균 계산',
      description: '수치형 변수의 결측치를 해당 변수의 평균값으로 대체한 후, 평균 처리된 혈청 콜레스테롤(Cholesterol)의 평균값을 소수점 둘째 자리까지 작성하세요. (예: 00.00)',
      category: '데이터 전처리',
      type: 'text',
      answer: '50.11',
      score: 6,
      explanation: 'Cholesterol 결측치를 평균으로 대체 후 산출된 전체 평균 수치입니다.'
    },
    {
      id: 'p311',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 11,
      title: 'Min-Max 스케일링 후 값 작성',
      description: '최대-최소 스케일링(Min-Max Scaling)을 적용한 후, 변환된 최대 심박수(MaxHR)의 최소값을 작성하세요.',
      category: '피처 스케일링',
      type: 'text',
      answer: '0.18',
      score: 8,
      explanation: 'Min-Max 스케일링 적용 후 MaxHR 변수의 최소값 수치입니다.'
    },
    {
      id: 'p312',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 12,
      title: '머신러닝 모델 비교 (정확도 Accuracy 기준)',
      description: '다음 머신러닝 분류 알고리즘 중 기본 파라미터 상태에서 교차 검증 정확도(Accuracy)가 가장 높게 나타나는 모델을 고르세요.',
      category: '머신러닝 평가',
      type: 'single',
      options: ['KNN', 'Decision Tree', 'Random Forest'],
      answer: 'Random Forest',
      score: 8,
      explanation: 'Random Forest 분류기가 교차 검증 정확도에서 가장 뛰어난 성능을 보입니다.'
    },
    {
      id: 'p313',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 13,
      title: '최고 성능 모델 AUC-ROC 수치 작성',
      description: '문제 12번에서 선택한 최고 성능 머신러닝 모델의 AUC-ROC 점수를 반올림하여 소수점 네 자리까지 작성하세요. (예: 0.0000)',
      category: '머신러닝 평가',
      type: 'text',
      answer: '0.8696',
      score: 8,
      explanation: 'Random Forest 모델의 test 데이터셋 기준 AUC-ROC 수치입니다.'
    },
    {
      id: 'p314',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 14,
      title: '특성 중요도(Feature Importance) 최상위 변수 선택',
      description: '학습된 머신러닝 모델의 특성 중요도(Feature Importance)를 분석했을 때, 심장병 예측에 가장 중요한 영향을 미치지 않는(상위 3개 외) 변수를 고르세요.',
      category: '모델 해석',
      type: 'single',
      options: ['Oldpeak', 'MaxHR', 'RestingECG', 'ChestPainType'],
      answer: 'RestingECG',
      score: 8,
      explanation: '상위 중요 변수(Oldpeak, MaxHR, ChestPainType)에 비해 RestingECG의 영향도가 상대적으로 낮습니다.'
    },
    {
      id: 'p315',
      exam_id: 'c3333333-3333-3333-3333-333333333333',
      order_num: 15,
      title: '신규 환자 데이터 기반 심장병 예측 추론',
      description: '최종 선택된 모델을 사용하여 다음 조건을 가진 신규 환자의 심장병 유무 예측 결과를 고르세요.\n- Age: 55, Sex: M, ChestPainType: ASY, RestingBP: 140, Cholesterol: 240, FastingBS: 1, MaxHR: 130, ExerciseAngina: Y, Oldpeak: 1.5, ST_Slope: Flat',
      category: '모델 추론',
      type: 'single',
      options: ['0: 심장병 없음', '1: 심장병 있음'],
      answer: '1: 심장병 있음',
      score: 8,
      explanation: '지정된 신규 환자 특성을 입력하여 예측된 결과는 1(심장병 있음)입니다.'
    }
  ],
  'd4444444-4444-4444-4444-444444444444': [
    {
      id: 'p401',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 1,
      title: '타겟 변수 작성',
      description: '본 과제의 타겟 변수를 적으세요.',
      category: '데이터 이해',
      type: 'text',
      answer: 'quality',
      score: 6,
      explanation: '예측하고자 하는 목표 변수는 와인의 품질인 quality입니다.'
    },
    {
      id: 'p402',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 2,
      title: '중복 행 비율 계산',
      description: '중복 행이 차지하는 비율을 반올림하여 소수점 둘째자리까지 작성하세요. (예: 00.00)',
      category: '데이터 탐색',
      type: 'text',
      answer: '15.65',
      score: 6,
      explanation: '데이터셋 내 중복 행(Duplicate rows)이 차지하는 비율 계산 결과입니다.'
    },
    {
      id: 'p403',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 3,
      title: '결측치 최솟값 컬럼 선택',
      description: '결측값이 가장 적은 컬럼을 고르세요.',
      category: '데이터 탐색',
      type: 'single',
      options: ['fixed acidity', 'volatile acidity', 'free sulfur dioxide', 'alcohol'],
      answer: 'alcohol',
      score: 6,
      explanation: '제시된 컬럼 중 결측치가 가장 적은 컬럼은 alcohol입니다.'
    },
    {
      id: 'p404',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 4,
      title: '제3분위수 최댓값 변수 선택',
      description: '다음의 변수들의 제3분위수를 확인하고 가장 큰 값을 가지는 변수를 고르세요.',
      category: '데이터 기술통계',
      type: 'single',
      options: ['free sulfur dioxide', 'total sulfur dioxide', 'pH', 'alcohol'],
      answer: 'total sulfur dioxide',
      score: 6,
      explanation: '제시된 변수들 중 제3분위수(75%) 수치가 가장 큰 변수는 total sulfur dioxide입니다.'
    },
    {
      id: 'p405',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 5,
      title: '수치형 변수 최고 상관관계 조합 선택',
      description: '수치형 변수들의 상관관계를 확인하고, 가장 큰 상관관계를 가지는 조합을 고르세요.',
      category: '상관관계 분석',
      type: 'single',
      options: ['pH, fixed acidity', 'density, fixed acidity', 'citric acid, fixed acidity', 'free sulfur dioxide, total sulfur dioxide'],
      answer: 'free sulfur dioxide, total sulfur dioxide',
      score: 6,
      explanation: '상관계수 절댓값이 가장 큰 수치형 변수 조합은 free sulfur dioxide와 total sulfur dioxide입니다.'
    },
    {
      id: 'p406',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 6,
      title: '상단경계 최댓값 품질 등급 파악',
      description: '와인의 품질(quality) 별 구연산(citric acid)을 시각화하고 상단경계가 가장 높은 품질을 작성하세요.',
      category: '데이터 시각화',
      type: 'text',
      answer: '8',
      score: 6,
      explanation: 'quality별 citric acid 시각화 결과 상단경계가 가장 높은 quality 등급은 8입니다.'
    },
    {
      id: 'p407',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 7,
      title: '최다 빈도 품질 등급 파악',
      description: '시각화 분석에서 품질(quality)의 빈도 분포를 시각화한 후, 가장 많은 데이터를 가진 품질 등급을 작성하세요.',
      category: '데이터 시각화',
      type: 'text',
      answer: '5',
      score: 6,
      explanation: 'quality 빈도 분포 시각화 시 가장 많은 데이터를 가진 품질 등급은 5입니다.'
    },
    {
      id: 'p408',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 8,
      title: '특정 품질 와인의 최다 알코올 범위 선택',
      description: '품질(quality)이 6인 와인이 가장 많이 존재하는 알코올(alcohol)의 범위를 고르세요.',
      category: '데이터 탐색',
      type: 'single',
      options: ['9 ~ 9.19', '9.2 ~ 9.39', '9.4 ~ 9.59', '9.6 ~ 9.79'],
      answer: '9.4 ~ 9.59',
      score: 6,
      explanation: 'quality가 6인 데이터 중 alcohol 분포가 가장 많은 구간은 9.4 ~ 9.59입니다.'
    },
    {
      id: 'p409',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 9,
      title: '결측치 행 삭제 후 데이터 개수 작성',
      description: '종속변수를 제외한 모든 변수에 대해 결측치가 존재하는 행을 삭제하세요. 모든 결측치 처리를 마치고 변화된 전체 데이터 행 개수를 작성하세요. (예: 0000)\n※ 이 단계에서는 [가공데이터 저장]을 클릭하지 마세요.',
      category: '데이터 전처리',
      type: 'text',
      answer: '1590',
      score: 6,
      explanation: '결측치 행 삭제 후 남아있는 전체 데이터 행 개수입니다.'
    },
    {
      id: 'p410',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 10,
      title: '피처 스케일링 후 제1사분위수 작성',
      description: '다음의 컬럼들에 대해 지정된 Scale strategy를 적용하고, pH의 변화된 제1사분위값을 작성하세요. 단, 문제 9번에서 가공된 데이터 기반으로 Scale을 조정하세요.\n- 표준화 적용: free sulfur dioxide, residual sugar, total sulfur dioxide\n- 최대-최소 정규화 적용: pH\n※ 수행 후 [가공데이터 저장]을 클릭하여 가공된 데이터를 저장하세요.\n※ 정답 작성 시 소수점은 반올림하여 소수점 아래 두자리까지 작성하세요. (예: 0.00)',
      category: '피처 스케일링',
      type: 'text',
      answer: '0.37',
      score: 6,
      explanation: 'pH 컬럼 정규화 적용 후 제1사분위수 수치입니다.'
    },
    {
      id: 'p411',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 11,
      title: '머신러닝 모델 비교 (MAE 기준)',
      description: '3개의 머신러닝 모델을 다음과 같은 설정으로 학습하고, 이중 MAE 기준 성능이 평균적으로 가장 좋은 것을 고르세요.\n- 작업 데이터 선택: 문제 10번에서 데이터 가공을 통해 신규로 저장한 데이터를 사용하세요.\n- Input 컬럼: 문제 10번의 스케일 조정에 사용된 변수 중 \'변환하기 전의 변수\'는 제외 컬럼으로 지정하세요.\n- Output 컬럼: 종속 변수를 Output 컬럼으로 지정하세요.\n- 데이터 유형 선택: 종속 변수의 데이터 유형은 모델 유형에 맞게 설정하고, 나머지는 초기 설정값을 사용하세요.\n- ML 모델 선택: Linear Regression, Decision Tree, Random Forest\n- 모델 Parameter 설정: 초기 설정값을 사용하세요.',
      category: '머신러닝 평가',
      type: 'single',
      options: ['Linear Regression', 'Decision Tree', 'Random Forest'],
      answer: 'Random Forest',
      score: 8,
      explanation: 'Random Forest 모델이 평균 MAE 평가 지표에서 가장 우수한 성능을 나타냅니다.'
    },
    {
      id: 'p412',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 12,
      title: '딥러닝 모델 학습 및 MSE 수치 작성',
      description: '딥러닝 모델을 다음과 같은 설정으로 학습하고, 학습된 모델의 MSE를 작성하세요.\n- 작업 데이터 선택: 문제 10번의 데이터 가공을 통해 신규로 저장한 데이터를 사용하세요.\n- Output 컬럼: 종속 변수를 Output 컬럼으로 지정하세요.\n- Input 컬럼: 문제 10번의 스케일 조정에 사용된 변수 중 \'변환하기 전의 변수\'는 제외 컬럼으로 지정하세요.\n- 컬럼 파라미터 설정: 종속변수의 데이터 유형은 모델 유형에 맞게 설정하세요. 활성함수: linear, FC 레이어 수: 1, FC 레이어 크기: 64, 드롭아웃: 0, FC 활성함수: relu\n- 학습 파라미터 설정: Epochs: 10, Batch Size: 64, learning rate: 0.001, 그 외 초기 설정값을 사용하세요.\n- 답안 작성: 모델 학습 후 오른쪽 상단의 [모델 저장]기능을 통해 모델을 저장하세요. 정답은 반올림하여 소수점 네번째 자리까지 작성하세요. (예: 0.0000)',
      category: '딥러닝 모델링',
      type: 'text',
      answer: '0.4215',
      score: 8,
      explanation: '설정 파라미터로 학습 후 산출된 딥러닝 모델의 MSE 평가 수치입니다.'
    },
    {
      id: 'p413',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 13,
      title: '딥러닝 모델 상위 영향 변수 선택',
      description: '문제 12번에서 학습한 딥러닝 모델 분석 결과, 와인 품질 예측에 영향을 주는 상위 5개의 변수에 해당하는 것을 고르세요.',
      category: '모델 해석',
      type: 'single',
      options: ['citric acid', 'alcohol', 'density', 'residual sugar_SS'],
      answer: 'alcohol',
      score: 8,
      explanation: '딥러닝 모델 영향도 분석 결과 상위 5개 변수에 포함되는 컬럼은 alcohol입니다.'
    },
    {
      id: 'p414',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 14,
      title: '딥러닝 모델 기반 와인 품질 예측 추론',
      description: '문제 12번에서 학습한 딥러닝 모델을 활용하여 다음과 같은 조건일 때의 와인의 품질을 예측하세요. 정답은 반올림하여 정수로 작성하세요. (예: 0)\n- alcohol: 10.42\n- chlorides: 0\n- citric acid: 0\n- density: 1\n- fixed acidity: 4.6\n- free sulfur dioxide_SS: 0\n- pH_MS: 0.4\n- residual sugar_SS: 0\n- sulphates: 0.33\n- total sulfur dioxide_SS: 0\n- volatile acidity: 0.5',
      category: '모델 추론',
      type: 'text',
      answer: '6',
      score: 8,
      explanation: '입력 조건으로 예측된 와인 품질 정수 수치입니다.'
    },
    {
      id: 'p415',
      exam_id: 'd4444444-4444-4444-4444-444444444444',
      order_num: 15,
      title: '딥러닝 모델 파라미터 고도화 및 MSE 작성',
      description: '문제 12번에서 학습한 딥러닝 모델을 고도화할 예정입니다. 문항 12번의 딥러닝 파라미터 중 "전체 데이터를 학습하는 횟수"를 의미하는 파라미터를 50으로 설정하고, "1회 가중치 업데이트에 사용하는 데이터 수"를 32로 설정하여 모델을 학습하세요. 개선된 MSE는 반올림하여 소수점 네번째 자리까지 작성하세요. (예: 0.0000)\n- 문제에 제시된 요구사항 외 나머지 설정은 12번 문항과 동일한 설정으로 학습합니다.\n- 문제에서 제시된 파라미터만 변경하여 모델을 고도화하세요.',
      category: '모델 고도화',
      type: 'text',
      answer: '0.3852',
      score: 8,
      explanation: 'Epochs 50, Batch Size 32로 고도화하여 학습한 딥러닝 모델의 개선된 MSE 수치입니다.'
    }
  ],
  'e5555555-5555-5555-5555-555555555555': [
    {
      id: 'p501',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 1,
      title: '알고리즘 유형 선택',
      description: '본 과제 해결에 알맞은 알고리즘의 유형을 고르시오.',
      category: 'AI 개념',
      type: 'single',
      options: ['회귀 모형', '분류 모형', '군집 모형', '시계열 모형'],
      answer: '분류 모형',
      score: 6,
      explanation: '고객 이탈 여부(1: 이탈, 0: 미이탈)는 범주형 타겟변수를 예측하는 문제이므로 분류(Classification) 모형이 적절합니다.'
    },
    {
      id: 'p502',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 2,
      title: '타겟 변수 작성',
      description: '본 과제의 타겟 변수를 적으세요.',
      category: '데이터 이해',
      type: 'text',
      answer: 'Exited',
      score: 6,
      explanation: '예측하고자 하는 목표 변수는 고객 이탈 여부인 Exited입니다.'
    },
    {
      id: 'p503',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 3,
      title: '학습 제외 변수 선택',
      description: '다음 변수 중 모델학습에서 제외해야 하는 변수를 고르세요.',
      category: '데이터 이해',
      type: 'single',
      options: ['CustomerId', 'CreditScore', 'Tenure', 'EstimatedSalary'],
      answer: 'CustomerId',
      score: 6,
      explanation: 'CustomerId는 고유 식별값으로 모델 예측 학습에서 제외해야 합니다.'
    },
    {
      id: 'p504',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 4,
      title: '특정 상품 수 보유 고객 비율 계산',
      description: '보유한 은행 상품 수(NumOfProducts)가 2개인 고객의 비율(%)을 작성하세요. (정답 작성 시 소수점은 반올림하여 두자리까지 작성, 예: 00.00)',
      category: '데이터 기술통계',
      type: 'text',
      answer: '45.90',
      score: 6,
      explanation: 'NumOfProducts가 2인 고객의 비율(%) 계산 결과입니다.'
    },
    {
      id: 'p505',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 5,
      title: '특정 신용점수 구간 이탈/유지 고객 수 차이 작성',
      description: '신용 점수(CreditScore)가 705 – 709인 고객 중 은행을 이탈한 고객과 은행을 유지하고 있는 고객의 수의 차이를 작성하세요.',
      category: '데이터 탐색',
      type: 'text',
      answer: '12',
      score: 6,
      explanation: 'CreditScore 705~709 구간의 이탈 고객과 유지 고객 수의 차이입니다.'
    },
    {
      id: 'p506',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 6,
      title: '타겟변수 최고 양의 상관관계 변수 선택',
      description: '타겟변수와 가장 큰 양의 상관관계를 갖는 변수를 고르세요.',
      category: '상관관계 분석',
      type: 'single',
      options: ['Age', 'Balance', 'NumOfProducts', 'IsActiveMember'],
      answer: 'Age',
      score: 6,
      explanation: '타겟 변수 Exited와 양(+)의 상관관계가 가장 높은 변수는 Age입니다.'
    },
    {
      id: 'p507',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 7,
      title: '이탈 고객 계좌 잔액 중앙값 최댓값 지역 선택',
      description: '고객 이탈 여부(Exited)에 대한 고객의 거주 지역(Geography)별 고객의 계좌 잔액(Balance)를 시각화하고, 은행을 이탈한 고객들의 계좌 잔액(Balance)의 중앙값이 가장 높은 지역을 고르세요.',
      category: '데이터 시각화',
      type: 'single',
      options: ['France', 'Spain', 'Germany'],
      answer: 'Germany',
      score: 6,
      explanation: '이탈 고객 계좌 잔액 중앙값이 가장 높은 지역은 Germany입니다.'
    },
    {
      id: 'p508',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 8,
      title: '최장 IQR 가진 은행 상품 수 작성',
      description: '보유한 은행 상품 수(NumOfProducts)에 따른 고객 나이(Age)를 시각화하고, 가장 긴 IQR을 가진 은행 상품의 수를 작성하세요.',
      category: '데이터 시각화',
      type: 'text',
      answer: '4',
      score: 6,
      explanation: 'NumOfProducts별 Age 박스플롯 분석 시 IQR 박스 길이가 가장 긴 상품 수는 4개입니다.'
    },
    {
      id: 'p509',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 9,
      title: '결측치 대체 후 최빈값 개수 작성',
      description: '종속변수를 제외한 모든 변수에 대해 결측치가 있는 경우, 주어진 조건대로 결측치를 처리하세요. 데이터 가공 후, 변화된 IsActiveMember의 최빈값의 개수를 작성하세요. (예: 0000)\n- 평균값 대체 대상 컬럼: EstimatedSalary\n- 최빈값 대체 대상 컬럼: EstimatedSalary를 제외한 나머지 컬럼\n※ 이 단계에서는 [가공데이터 저장]을 클릭하지 마세요.',
      category: '데이터 전처리',
      type: 'text',
      answer: '5151',
      score: 6,
      explanation: 'IsActiveMember 최빈값 대체 후 산출된 최빈값의 개수입니다.'
    },
    {
      id: 'p510',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 10,
      title: '이상치 제거 후 남은 데이터 행 개수 작성',
      description: '다음의 조건에 따라 Age 컬럼의 IQR 기준 이상치를 제거한 후, 남은 데이터의 행 개수를 작성하세요. (예: 0000)\n- 문제 9번에서 가공된 데이터를 기준으로 이상치 처리를 수행하세요.\n- multiplier는 1.5로 설정합니다.\n※ 수행 후 [가공데이터 저장]을 클릭하여 가공된 데이터를 저장하세요.',
      category: '이상치 처리',
      type: 'text',
      answer: '9641',
      score: 6,
      explanation: 'Age 이상치 제거 후 남은 최종 데이터 행의 개수입니다.'
    },
    {
      id: 'p511',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 11,
      title: '머신러닝 모델 비교 (재현율 Recall 기준)',
      description: '3개의 머신러닝 모델을 다음과 같은 설정으로 학습하고, 이중 재현율 기준 성능이 평균적으로 가장 좋은 것을 고르세요.\n- 작업 데이터 선택: 문제 10번에서 데이터 가공을 통해 신규로 저장한 데이터를 사용하세요.\n- Input 컬럼: 문제 3번의 정답 변수는 제외 컬럼으로 지정하세요. / 문제 9번의 결측치 처리에 사용된 변수 중 \'변환하기 전의 변수\'는 제외 컬럼으로 지정하세요. / RowNumber 컬럼도 제외 컬럼으로 지정하세요.\n- Output 컬럼: 종속 변수를 Output 컬럼으로 지정하세요.\n- 데이터 유형 선택: 종속 변수의 데이터 유형은 모델 유형에 맞게 설정하고, 나머지는 초기 설정값을 사용하세요.\n- ML 모델 선택: KNN, Decision Tree, Random Forest\n- 모델 Parameter 설정: 초기 설정값을 사용하세요.',
      category: '머신러닝 평가',
      type: 'single',
      options: ['KNN', 'Decision Tree', 'Random Forest'],
      answer: 'Random Forest',
      score: 8,
      explanation: 'Random Forest 모델이 평균 재현율(Recall) 성능에서 가장 뛰어납니다.'
    },
    {
      id: 'p512',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 12,
      title: '딥러닝 모델 최적 에포크 회차 작성',
      description: '딥러닝 모델을 다음과 같은 설정으로 학습하고, 가장 성능이 좋은 모델은 몇 번째 학습인지 작성하세요.\n- 작업 데이터 선택: 문제 10번의 데이터 가공을 통해 신규로 저장한 데이터를 사용하세요.\n- Output 컬럼: 종속 변수를 Output 컬럼으로 지정하세요.\n- Input 컬럼: 문제 3번 정답 변수 제외 / 문제 9번 변환 전 변수 제외 / RowNumber 제외 / 모든 Object형 변수 인코더 sparse 설정\n- 컬럼 파라미터 설정: 종속변수 유형 모델맞춤, 활성함수 softmax, FC 레이어 1, 레이어 크기 100, 드롭아웃 0, FC 활성함수 relu\n- 학습 파라미터 설정: Epochs 20, Batch Size 128, learning rate 0.001\n- 답안 작성: 모델 저장 후 정수 형태로 작성하세요.',
      category: '딥러닝 모델링',
      type: 'text',
      answer: '18',
      score: 8,
      explanation: '딥러닝 학습 과정에서 가장 좋은 성능을 기록한 에포크 회차입니다.'
    },
    {
      id: 'p513',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 13,
      title: '딥러닝 모델 상위 이탈 영향 변수 선택',
      description: '문제 12번에서 학습한 딥러닝 모델 분석 결과, 고객이 이탈할 때 영향을 주는 상위 5개의 변수에 해당하는 것을 고르세요.',
      category: '모델 해석',
      type: 'single',
      options: ['EstimatedSalary_IM', 'CreditScore', 'Tenure_IM', 'NumOfProducts'],
      answer: 'NumOfProducts',
      score: 8,
      explanation: '이탈 예측 딥러닝 모델의 상위 5개 변수 영향도 분석 결과 포함되는 컬럼은 NumOfProducts입니다.'
    },
    {
      id: 'p514',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 14,
      title: '딥러닝 모델 기반 고객 이탈 여부 예측 추론',
      description: '문제 12번에서 학습한 딥러닝 모델을 활용하여 다음과 같은 조건일 때의 고객의 이탈 여부를 예측하세요.\n- Age: 25\n- Balance: 100000\n- CreditScore: 0\n- EstimatedSalary_IM: 150000\n- Gender: Female\n- Geography: France\n- HasCrCard: 1\n- IsActiveMember_IM: 0\n- NumOfProducts: 1\n- Surname_IM: Hargrave\n- Tenure_IM: 2',
      category: '모델 추론',
      type: 'single',
      options: ['1: 이탈함', '0: 이탈하지 않음'],
      answer: '0: 이탈하지 않음',
      score: 8,
      explanation: '제시된 고객 특성 입력 시 예측된 결과는 0(이탈하지 않음)입니다.'
    },
    {
      id: 'p515',
      exam_id: 'e5555555-5555-5555-5555-555555555555',
      order_num: 15,
      title: '딥러닝 모델 파라미터 고도화 및 Accuracy 작성',
      description: '문제 12번에서 학습한 딥러닝 모델을 고도화할 예정입니다. 문항 12번의 딥러닝 파라미터 중 "전체 데이터를 학습하는 횟수"를 의미하는 파라미터를 50으로 설정하고, 또한 드롭아웃은 0.4로 설정하고, FC 레이어의 크기는 64로 설정하여 모델을 학습하세요. 학습 후 모델의 Accuracy를 작성하세요.\n- 문제에 제시된 요구사항 외 나머지 설정은 12번 문항과 동일한 설정으로 학습합니다.\n- 문제에서 제시된 파라미터만 변경하여 모델을 고도화하세요.\n- 답안은 반올림하여 소수점 네번째 자리까지 작성하세요. (예: 0.0000)',
      category: '모델 고도화',
      type: 'text',
      answer: '0.8540',
      score: 8,
      explanation: '파라미터 고도화 후 최종 산출된 딥러닝 모델의 Accuracy 수치입니다.'
    }
  ],
  'f6666666-6666-6666-6666-666666666666': [
    {
      id: 'p601',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 1,
      title: '알고리즘 유형 선택',
      description: '본 과제 해결에 알맞은 알고리즘의 유형을 고르시오.',
      category: 'AI 개념',
      type: 'single',
      options: ['회귀 모형', '분류 모형', '군집 모형', '시계열 모형'],
      answer: '회귀 모형',
      score: 6,
      explanation: '최종 시험 점수(Exam_Score)는 연속형 수치 데이터를 예측하는 문제이므로 회귀(Regression) 모형이 적절합니다.'
    },
    {
      id: 'p602',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 2,
      title: '문자형 변수 개수 작성',
      description: '문자형 변수의 개수를 작성하세요.',
      category: '데이터 이해',
      type: 'text',
      answer: '13',
      score: 6,
      explanation: '범주형/문자형(Object/String) 데이터 유형을 가진 변수의 총 개수입니다.'
    },
    {
      id: 'p603',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 3,
      title: '종속변수 기술통계량 비교',
      description: '본 과제의 종속변수의 기술통계량을 확인하고, 최빈값 개수보다 큰 값을 가지는 것을 고르세요.',
      category: '데이터 기술통계',
      type: 'single',
      options: ['왜도', '데이터의 총합', '제2사분위수', '제4사분위수'],
      answer: '데이터의 총합',
      score: 6,
      explanation: 'Exam_Score 기술통계량 중 최빈값 개수 수치보다 큰 값을 가지는 지표는 데이터의 총합입니다.'
    },
    {
      id: 'p604',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 4,
      title: '최고 결측치 비율 작성',
      description: '다음 중 결측치가 가장 많은 변수의 결측치 비율을 작성하세요. (예: 0.00)',
      category: '데이터 탐색',
      type: 'text',
      answer: '1.36',
      score: 6,
      explanation: '가장 많은 결측치를 보유한 컬럼의 결측치 비율 수치입니다.'
    },
    {
      id: 'p605',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 5,
      title: '수치형 변수 최고 상관관계 조합 선택',
      description: '수치형 변수들의 상관관계를 확인하고 가장 큰 상관관계를 가지는 조합을 고르세요.',
      category: '상관관계 분석',
      type: 'single',
      options: ['Hours_Studied, Exam_Score', 'Exam_Score, Tutoring_Sessions', 'Exam_Score, Attendance', 'Previous_Scores, Exam_Score'],
      answer: 'Exam_Score, Attendance',
      score: 6,
      explanation: '상관계수 절댓값이 가장 높은 수치형 변수 조합은 Exam_Score와 Attendance입니다.'
    },
    {
      id: 'p606',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 6,
      title: '특정 공부시간 이상 여학생 수 작성',
      description: '주당 공부 시간(Hours_Studied)이 38시간 이상인 여학생의 수를 작성하세요.',
      category: '데이터 탐색',
      type: 'text',
      answer: '8',
      score: 6,
      explanation: 'Hours_Studied >= 38 및 Gender == Female 조건의 데이터 수입니다.'
    },
    {
      id: 'p607',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 7,
      title: '특정 수면시간 학생의 최다 학습동기 수준 선택',
      description: '평균 수면 시간(Sleep_Hours)이 7시간인 학생들 중 가장 많은 수를 차지하는 학생들의 학습 동기 수준(Motivation_Level)을 고르세요.',
      category: '데이터 탐색',
      type: 'single',
      options: ['Low', 'Medium', 'High'],
      answer: 'Medium',
      score: 6,
      explanation: 'Sleep_Hours가 7인 학생 집단 중 Motivation_Level 비율이 가장 높은 범주는 Medium입니다.'
    },
    {
      id: 'p608',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 8,
      title: '이상치 미존재 조합 선택',
      description: '학교 유형(School_Type)별 인터넷 접속 가능 여부(Internet_Access)에 따른 주당 공부 시간(Hours_Studied)에 대해 시각화하세요. 이상치가 존재하지 않는 인터넷 접속 가능 여부(Internet_Access), 학교 유형(School_Type) 조합을 고르세요.',
      category: '데이터 시각화',
      type: 'single',
      options: ['Yes, Public', 'Yes, Private', 'No, Public', 'No, Private'],
      answer: 'No, Public',
      score: 6,
      explanation: 'Hours_Studied 시각화 박스플롯 결과 이상치가 없는 범주 조합은 No, Public입니다.'
    },
    {
      id: 'p609',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 9,
      title: '결측치 최빈값 대체 후 최빈값 비율 작성',
      description: '종속변수를 제외한 모든 변수에 대해 결측치가 있는 경우, 최빈값으로 결측치를 대체하세요. 데이터 가공 후, 변화된 Parental_Education_Level의 최빈값의 비율을 작성하세요. (예: 00.00)\n- 결측치 대체 후에는 결측치 처리 전의 컬럼은 삭제합니다.\n※ 이 단계에서는 [가공데이터 저장]을 클릭하지 마세요.',
      category: '데이터 전처리',
      type: 'text',
      answer: '50.14',
      score: 6,
      explanation: 'Parental_Education_Level 최빈값 대체 후 최빈값의 비율 수치입니다.'
    },
    {
      id: 'p610',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 10,
      title: '인코딩 적용 후 전체 컬럼 수 작성',
      description: '다음의 조건에 따라 인코딩을 수행하고, 가공 후 데이터의 전체 컬럼 수를 작성하세요. (예: 00)\n- 문제 9번에서 가공된 데이터를 기준으로 인코딩을 수행하세요.\n- Ordinal 인코딩: Parental_Involvement, Access_to_Resources, Motivation_Level, Family_Income, Teacher_Quality\n- One-hot 인코딩: Extracurricular_Activities, Internet_Access, Learning_Disabilities\n※ 수행 후 [가공데이터 저장]을 클릭하여 가공된 데이터를 저장하세요.',
      category: '피처 인코딩',
      type: 'text',
      answer: '23',
      score: 6,
      explanation: '인코딩 적용 및 기존 컬럼 삭제 후 최종 데이터셋의 전체 컬럼 수입니다.'
    },
    {
      id: 'p611',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 11,
      title: '머신러닝 모델 비교 (설명력 R2 기준)',
      description: '3개의 머신러닝 모델을 다음과 같은 설정으로 학습하고, 이중 설명력 지표 기준 성능이 평균적으로 가장 좋은 것을 고르세요.\n- 작업 데이터 선택: 문제 10번에서 데이터 가공을 통해 신규로 저장한 데이터를 사용하세요.\n- Input 컬럼: 별도의 제외 컬럼은 없이 기본 설정을 유지하세요.\n- Output 컬럼: 종속 변수를 Output 컬럼으로 지정하세요.\n- 데이터 유형 선택: 종속 변수의 데이터 유형은 모델 유형에 맞게 설정하고, 나머지는 초기 설정값을 사용하세요.\n- ML 모델 선택: Linear Regression, Random Forest, LightGBM',
      category: '머신러닝 평가',
      type: 'single',
      options: ['Linear Regression', 'Random Forest', 'LightGBM'],
      answer: 'Linear Regression',
      score: 8,
      explanation: 'Linear Regression 모델이 R2 설명력 성능에서 평균적으로 가장 우수한 성적을 냅니다.'
    },
    {
      id: 'p612',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 12,
      title: '딥러닝 모델 학습 및 MAE 수치 작성',
      description: '딥러닝 모델을 다음과 같은 설정으로 학습하고, 학습된 모델의 MAE를 작성하세요.\n- 작업 데이터 선택: 문제 10번 신규 저장 데이터\n- Output 컬럼: 종속 변수 (Exam_Score)\n- Input 컬럼: 모든 Object형 변수의 인코더를 sparse로 설정\n- 컬럼 파라미터 설정: 활성함수 linear, FC 레이어 수 1, FC 레이어 크기 256, 드롭아웃 0, FC 활성함수 relu\n- 학습 파라미터 설정: Epochs 30, Batch Size 128, learning rate 0.001\n- 답안 작성: 소수점 네번째 자리까지 반올림 작성 (예: 0.0000)',
      category: '딥러닝 모델링',
      type: 'text',
      answer: '0.2121',
      score: 8,
      explanation: '딥러닝 모델 학습 후 산출된 MAE 검증 수치입니다.'
    },
    {
      id: 'p613',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 13,
      title: '딥러닝 모델 상위 영향 변수 미포함 항목 선택',
      description: '문제 12번에서 학습한 딥러닝 모델 분석 결과, 학생 최종 성적 예측에 영향을 주는 상위 5개의 변수에 해당하지 않는 것을 고르세요.',
      category: '모델 해석',
      type: 'single',
      options: ['Hours_Studied', 'Sleep_Hours', 'Parental_Involvement_OE', 'Attendance'],
      answer: 'Sleep_Hours',
      score: 8,
      explanation: '학생 성적 예측 딥러닝 모델 상위 5개 변수 중 Sleep_Hours는 포함되지 않습니다.'
    },
    {
      id: 'p614',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 14,
      title: '딥러닝 모델 기반 학생 최종 점수 예측 추론',
      description: '문제 12번에서 학습한 딥러닝 모델을 활용하여 다음과 같은 조건일 때의 학생 최종 점수를 예측하여 정수 형태로 작성하세요.\n- Access_to_Resources_OE: 0, Attendance: 80, Distance_from_Home_IM: Moderate\n- Extracurricular_Activities_No: 0, Extracurricular_Activities_Yes: 1, Family_Income_OE: 1\n- Gender: Female, Hours_Studied: 18, Internet_Access_No: 0, Internet_Access_Yes: 1\n- Learning_Disabilities_No: 1, Learning_Disabilities_Yes: 0, Motivation_Level_OE: 1\n- Parental_Education_Level_IM: High School, Parental_Involvement_OE: 0\n- Peer_Influence: Positive, Physical_Activity: 1, Previous_Scores: 78\n- School_Type: Public, Sleep_Hours: 7, Teacher_Quality_IM_OE: 0, Tutoring_Sessions: 0',
      category: '모델 추론',
      type: 'text',
      answer: '66',
      score: 8,
      explanation: '지정된 학생 조건 입력 시 예측되는 최종 시험 점수 정수 수치입니다.'
    },
    {
      id: 'p615',
      exam_id: 'f6666666-6666-6666-6666-666666666666',
      order_num: 15,
      title: '딥러닝 모델 파라미터 고도화 및 MAE 작성',
      description: '문제 12번에서 학습한 딥러닝 모델을 고도화할 예정입니다. "모델의 가중치를 업데이트하기 위해 손실함수를 최소화하는 방식"을 sgd로 설정하고 "한 번의 가중치 업데이트 시 얼마나 이동할지를 결정하는 값"은 0.1로 설정하세요. 또한 모델 성능이 10번 연속으로 개선되지 않을 때 학습을 조기 종료하도록 설정하여 모델을 학습하세요. 개선된 MAE를 작성하세요.\n- 문제에 제시된 요구사항 외 나머지 설정은 12번 문항과 동일한 설정으로 학습합니다.\n- 문제에서 제시된 파라미터만 변경하여 모델을 고도화하세요.\n- 답안은 반올림하여 소수점 네번째 자리까지 작성하세요. (예: 0.0000)',
      category: '모델 고도화',
      type: 'text',
      answer: '0.2020',
      score: 8,
      explanation: 'Optimizer=sgd, Learning Rate=0.1, Early Stopping Patience=10 고도화 후 산출된 MAE 수치입니다.'
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
        const useOverview = (e.overview && e.overview.length >= 300) ? e.overview : (mock?.overview || e.overview);
        const merged: Exam = {
          ...e,
          overview: useOverview
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
          const useOverview = (item.overview && item.overview.length >= 300) ? item.overview : (mock?.overview || item.overview);
          const examObj: Exam = {
            ...item,
            overview: useOverview
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
        const useOverview = (data.overview && data.overview.length >= 300) ? data.overview : (mock?.overview || data.overview);
        return {
          ...data,
          overview: useOverview
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
      if (examData.is_result_released !== undefined) payload.is_result_released = examData.is_result_released;

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

export async function toggleExamResultRelease(examId: string, released: boolean): Promise<Exam | null> {
  return await updateExam(examId, { is_result_released: released });
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
    score: Number(p.score || getScoreByOrderNum(p.order_num || idx + 1)),
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

function normalizeSubmission(item: any): Submission {
  let score = item.score;
  let total_score = item.total_score || 100;
  let pass_status = item.pass_status;

  if (total_score === 300) {
    score = Math.round((score / 300) * 100);
    total_score = 100;
    pass_status = score >= 80 ? 'PASS' : 'FAIL';
  }

  return {
    ...item,
    score,
    total_score,
    pass_status,
    exam_title: item.aice_exams?.title || item.exam_title || 'AICE Basic 모의고사'
  } as Submission;
}

export async function fetchSubmissionsByStudent(school: string, studentId: string): Promise<Submission[]> {
  const localSubs = getLocalSubmissions().filter(
    s => s.school === school && s.student_id === studentId
  ).map(normalizeSubmission);

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
        return data.map(normalizeSubmission);
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
        return data.map(normalizeSubmission);
      }
    } catch (e) {
      console.warn('Supabase fetchAllSubmissions error:', e);
    }
  }

  return getLocalSubmissions().map(normalizeSubmission);
}
