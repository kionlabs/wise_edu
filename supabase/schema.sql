-- ============================================================
-- AICE Basic 모의고사 Supabase Schema Script (aice 스키마 전용)
-- ============================================================

-- 0. aice 스키마 생성
CREATE SCHEMA IF NOT EXISTS aice;

-- 1. aice.aice_exams (모의고사 목록) 테이블 생성
CREATE TABLE IF NOT EXISTS aice.aice_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit_minutes INT NOT NULL DEFAULT 60,
    total_questions INT NOT NULL DEFAULT 5,
    pass_score INT NOT NULL DEFAULT 70,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. aice.aice_problems (문제) 테이블 생성
CREATE TABLE IF NOT EXISTS aice.aice_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES aice.aice_exams(id) ON DELETE CASCADE,
    order_num INT NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT '기초지식',
    type VARCHAR(20) NOT NULL CHECK (type IN ('single', 'multiple', 'text')),
    options JSONB, -- 객관식 보기를 JSON 배열로 저장 ['1번', '2번', ...]
    answer TEXT NOT NULL,
    csv_url TEXT, -- 실습용 CSV 파일 다운로드 경로
    score INT NOT NULL DEFAULT 20,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. aice.aice_students (학생 관리) 테이블 생성
CREATE TABLE IF NOT EXISTS aice.aice_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_school_student_id UNIQUE (school, student_id)
);

-- 4. aice.aice_submissions (응시 결과 및 답안) 테이블 생성
CREATE TABLE IF NOT EXISTS aice.aice_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES aice.aice_exams(id) ON DELETE CASCADE,
    school VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(50) NOT NULL,
    answers JSONB NOT NULL, -- { "problem_uuid_1": "user_answer_1", ... }
    score INT NOT NULL DEFAULT 0,
    total_score INT NOT NULL DEFAULT 100,
    pass_status VARCHAR(10) NOT NULL CHECK (pass_status IN ('PASS', 'FAIL')),
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 설정 및 Public Access 활성화
ALTER TABLE aice.aice_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE aice.aice_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE aice.aice_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE aice.aice_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for aice_exams" ON aice.aice_exams FOR SELECT USING (true);
CREATE POLICY "Allow public read access for aice_problems" ON aice.aice_problems FOR SELECT USING (true);
CREATE POLICY "Allow public all access for aice_students" ON aice.aice_students FOR ALL USING (true);
CREATE POLICY "Allow public all access for aice_submissions" ON aice.aice_submissions FOR ALL USING (true);

-- ============================================================
-- 샘플 시드 데이터 (Seed Data)
-- ============================================================

-- 1회차 모의고사 등록
INSERT INTO aice.aice_exams (id, title, description, time_limit_minutes, total_questions, pass_score)
VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'AICE Basic 제1회 실전 모의고사',
    '인공지능 개념, 데이터 처리, 머신러닝 기초 문항 및 CSV 데이터셋 실습 문제 포함 (60분 제한)',
    60,
    5,
    70
) ON CONFLICT (id) DO NOTHING;

-- 2회차 모의고사 등록
INSERT INTO aice.aice_exams (id, title, description, time_limit_minutes, total_questions, pass_score)
VALUES (
    'b2222222-2222-2222-2222-222222222222',
    'AICE Basic 제2회 데이터 분석 심화 모의고사',
    '피처 엔지니어링 및 모델 평가 지표 탐구 중심의 2회차 모의고사 (60분 제한)',
    60,
    5,
    70
) ON CONFLICT (id) DO NOTHING;

-- 1회차 문제 5개 생성
INSERT INTO aice.aice_problems (id, exam_id, order_num, title, description, category, type, options, answer, csv_url, score, explanation)
VALUES 
(
    'p1111111-1111-1111-1111-111111111101',
    'a1111111-1111-1111-1111-111111111111',
    1,
    '인공지능(AI)과 머신러닝(ML)의 기본 개념',
    '다음 중 머신러닝(Machine Learning)의 정의로 가장 적절한 것은 무엇인가요?',
    'AI 개념',
    'single',
    '["사람이 직접 모든 조건문을 작성하여 동작시키는 프로그램", "데이터로부터 패턴을 학습하여 스스로 예측이나 결정을 내리는 기술", "컴퓨터 하드웨어 성능만을 향상시키는 기술", "인터넷 웹페이지를 수집하는 크롤링 기법"]'::jsonb,
    '데이터로부터 패턴을 학습하여 스스로 예측이나 결정을 내리는 기술',
    NULL,
    20,
    '머신러닝은 사람이 명시적인 규칙을 코딩하는 대신, 데이터를 학습하여 패턴을 발견하고 예측을 수행하는 인공지능의 한 분야입니다.'
),
(
    'p1111111-1111-1111-1111-111111111102',
    'a1111111-1111-1111-1111-111111111112',
    2,
    '지도학습(Supervised Learning)의 특징',
    '다음 중 지도학습(Supervised Learning)에 해당하는 문제 유형을 고르세요.',
    '머신러닝',
    'single',
    '["라벨(Label/정답)이 포함된 데이터를 학습시키는 분류(Classification)", "정답 없이 유사한 특성을 가진 데이터끼리 묶는 군집화(Clustering)", "차원 축소(PCA) 알고리즘", "에이전트가 보상을 최대화하도록 학습하는 강화학습"]'::jsonb,
    '라벨(Label/정답)이 포함된 데이터를 학습시키는 분류(Classification)',
    NULL,
    20,
    '지도학습은 입력 데이터와 그에 상응하는 정답(Label)이 주어진 상태에서 학습하는 방식으로, 분류와 회귀가 이에 해당합니다.'
),
(
    'p1111111-1111-1111-1111-111111111103',
    'a1111111-1111-1111-1111-111111111113',
    3,
    '데이터 전처리 및 결측치 처리 (CSV 실습)',
    '제공된 고객 데이터셋(customer_data.csv)을 다운로드하여 분석하세요. 이 데이터셋에서 나이(age) 컬럼의 결측치(Null) 개수는 총 몇 개인가요?',
    '데이터 전처리',
    'single',
    '["3개", "5개", "8개", "12개"]'::jsonb,
    '5개',
    '/sample_data/customer_data.csv',
    20,
    'customer_data.csv 파일의 age 컬럼을 확인하면 결측치(NaN/Null)는 총 5개입니다.'
),
(
    'p1111111-1111-1111-1111-111111111104',
    'a1111111-1111-1111-1111-111111111114',
    4,
    '평가 지표 - 정확도(Accuracy) 계산',
    '총 100개의 데이터 중 모델이 85개를 올바르게 분류했을 때, 이 모델의 정확도(Accuracy)는 몇 %인가요?',
    '모델 평가',
    'text',
    NULL,
    '85',
    NULL,
    20,
    '정확도(Accuracy) = (맞춘 데이터 수 / 전체 데이터 수) * 100 = (85 / 100) * 100 = 85%'
),
(
    'p1111111-1111-1111-1111-111111111105',
    'a1111111-1111-1111-1111-111111111115',
    5,
    '인공지능 윤리(AI Ethics) 원칙',
    '다음 중 인공지능 윤리 가이드라인의 주요 핵심 요소로 볼 수 없는 것은 무엇인가요?',
    'AI 윤리',
    'single',
    '["투명성과 설명 가능성", "편향성 최소화 및 공정성", "개발자 개인 이익의 극대화", "개인정보 보호 및 데이터 보안"]'::jsonb,
    '개발자 개인 이익의 극대화',
    NULL,
    20,
    'AI 윤리는 공정성, 투명성, 개인정보 보호, 안전성을 중시하며 개발자 개인의 사적이익 극대화는 윤리적 핵심 원칙에 해당하지 않습니다.'
) ON CONFLICT (id) DO NOTHING;

-- 2회차 문제 5개 생성
INSERT INTO aice.aice_problems (id, exam_id, order_num, title, description, category, type, options, answer, csv_url, score, explanation)
VALUES 
(
    'p2222222-2222-2222-2222-222222222201',
    'b2222222-2222-2222-2222-222222222222',
    1,
    '데이터 탐색 - 평균값과 중앙값',
    '극단값(Outlier)이 존재하는 데이터셋에서 중앙경향성을 파악하기 위해 평균값보다 중앙값(Median)이 더 왜곡에 강한 이유는 무엇인가요?',
    '데이터 이해',
    'single',
    '["중앙값은 상위 50% 위치 값으로 극단값의 영향을 받지 않기 때문", "중앙값은 항상 평균보다 크기 때문", "중앙값은 텍스트 데이터에만 사용되기 때문", "중앙값 계산에는 컴퓨터 연산이 필요 없기 때문"]'::jsonb,
    '중앙값은 상위 50% 위치 값으로 극단값의 영향을 받지 않기 때문',
    NULL,
    20,
    '중앙값은 정렬된 데이터의 순서상 중간에 위치한 값이므로, 매우 크거나 작은 아웃라이어 수치에 의해 평균처럼 크게 흔들리지 않습니다.'
),
(
    'p2222222-2222-2222-2222-222222222202',
    'b2222222-2222-2222-2222-222222222202',
    2,
    '피처 인코딩 (One-Hot Encoding)',
    '범주형(Categorical) 변수(예: 사과, 바나나, 포도)를 머신러닝 모델이 이해할 수 있도록 0과 1로 변환하는 전처리 기법은 무엇인가요?',
    '데이터 전처리',
    'single',
    '["원-핫 인코딩 (One-Hot Encoding)", "정규화 (Normalization)", "결측치 대체 (Imputation)", "주성분 분석 (PCA)"]'::jsonb,
    '원-핫 인코딩 (One-Hot Encoding)',
    NULL,
    20,
    '원-핫 인코딩은 각 범주마다 새로운 이진(0 또는 1) 컬럼을 만들어 표현하는 기법입니다.'
),
(
    'p2222222-2222-2222-2222-222222222203',
    'b2222222-2222-2222-2222-222222222203',
    3,
    '주택 가격 데이터 분석 (CSV 실습)',
    '제공된 housing_prices.csv 데이터를 다운로드하여 확인하세요. 방 개수(rooms) 컬럼의 최댓값(Max) 수치는 얼마인가요?',
    '데이터 분석 실습',
    'single',
    '["5", "8", "10", "12"]'::jsonb,
    '8',
    '/sample_data/housing_prices.csv',
    20,
    'housing_prices.csv의 rooms 컬럼 중 가장 큰 값은 8입니다.'
),
(
    'p2222222-2222-2222-2222-222222222204',
    'b2222222-2222-2222-2222-222222222204',
    4,
    '과대적합(Overfitting) 개념',
    '학습 데이터에서는 성능이 매우 높으나 실전/테스트 데이터에서 성능이 급격히 떨어지는 현상을 무엇이라 하나요?',
    '모델 성능',
    'single',
    '["과대적합 (Overfitting)", "과소적합 (Underfitting)", "교차검증 (Cross Validation)", "앙상블 (Ensemble)"]'::jsonb,
    '과대적합 (Overfitting)',
    NULL,
    20,
    '과대적합은 모델이 학습 데이터의 노이즈까지 지나치게 과도하게 학습하여 새로운 데이터에 대한 일반화 성능이 떨어지는 상태입니다.'
),
(
    'p2222222-2222-2222-2222-222222222205',
    'b2222222-2222-2222-2222-222222222205',
    5,
    '혼동 행렬(Confusion Matrix) 지표',
    '재현율(Recall)을 계산하는 공식에서 분자에 들어가는 항목은 무엇인가요?',
    '모델 평가',
    'single',
    '["진짜 양성 (True Positive, TP)", "거짓 양성 (False Positive, FP)", "진짜 음성 (True Negative, TN)", "거짓 음성 (False Negative, FN)"]'::jsonb,
    '진짜 양성 (True Positive, TP)',
    NULL,
    20,
    'Recall = TP / (TP + FN) 으로, 분자에는 실제 양성을 맞춘 TP(True Positive)가 위치합니다.'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 남원용성고등학교 특강 수강생 30명 시드 데이터 (aice.aice_students)
-- ============================================================

INSERT INTO aice.aice_students (school, student_id, student_name)
VALUES
    ('남원용성고', '1101', '김재영'),
    ('남원용성고', '1103', '안아람'),
    ('남원용성고', '1108', '이학준'),
    ('남원용성고', '1109', '조원우'),
    ('남원용성고', '1204', '김도연'),
    ('남원용성고', '1206', '노현규'),
    ('남원용성고', '1207', '모수아'),
    ('남원용성고', '1212', '유지윤'),
    ('남원용성고', '1215', '이수빈'),
    ('남원용성고', '1302', '김영훈'),
    ('남원용성고', '1313', '장태민'),
    ('남원용성고', '1316', '천인재'),
    ('남원용성고', '1406', '박형기'),
    ('남원용성고', '1410', '이건'),
    ('남원용성고', '2102', '김희수'),
    ('남원용성고', '2103', '노영민'),
    ('남원용성고', '2208', '이슬아'),
    ('남원용성고', '2207', '윤유준'),
    ('남원용성고', '2401', '김민수'),
    ('남원용성고', '2405', '서지원'),
    ('남원용성고', '2408', '장태인'),
    ('남원용성고', '2410', '최장수'),
    ('남원용성고', '3205', '성유리'),
    ('남원용성고', '3209', '이민혁'),
    ('남원용성고', '3210', '이용인'),
    ('남원용성고', '3211', '이정진'),
    ('남원용성고', '3212', '이현승'),
    ('남원용성고', '3216', '장원준'),
    ('남원용성고', '3307', '박진혁'),
    ('남원용성고', '3317', '전승현')
ON CONFLICT (school, student_id) DO UPDATE 
SET student_name = EXCLUDED.student_name;
