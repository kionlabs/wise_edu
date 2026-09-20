export interface Exam {
  id: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  total_questions: number;
  pass_score: number;
  created_at: string;
  overview?: string;
}

export interface Problem {
  id: string;
  exam_id: string;
  order_num: number;
  title: string;
  description: string;
  category: string;
  type: 'single' | 'multiple' | 'text';
  options?: string[];
  answer: string;
  csv_url?: string;
  score: number;
  explanation?: string;
}

export interface Submission {
  id: string;
  exam_id: string;
  school: string;
  student_id: string;
  student_name: string;
  answers: Record<string, string>; // { [problemId]: userAnswer }
  score: number;
  total_score: number;
  pass_status: 'PASS' | 'FAIL';
  submitted_at: string;
  exam_title?: string;
}

export interface Student {
  id?: string;
  school: string;
  student_id: string;
  student_name: string;
  created_at?: string;
}

export interface StudentSession {
  school: string;
  student_id: string;
  student_name: string;
}
