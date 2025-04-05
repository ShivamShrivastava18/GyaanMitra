export type UserRole = "teacher" | "student"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  profileImage?: string
}

export interface Teacher extends User {
  role: "teacher"
  students: string[] // Array of student IDs
  curriculums: string[] // Array of curriculum IDs
}

export interface Student extends User {
  role: "student"
  teacher: string // Teacher ID
  assignedQuizzes: string[] // Array of quiz IDs
  completedQuizzes: Record<string, QuizResult> // Quiz ID to result mapping
}

export interface Module {
  id: string
  title: string
  description: string
  topics: Topic[]
}

export interface Topic {
  id: string
  title: string
  description: string
}

export interface Curriculum {
  id: string
  teacherId: string
  title: string
  description: string
  modules: Module[]
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

export interface Quiz {
  id: string
  topicId: string
  title: string
  description: string
  language: string
  questions: QuizQuestion[]
  createdBy: string // Teacher ID
  assignedTo: string[] // Array of student IDs
}

export interface QuizResult {
  quizId: string
  studentId: string
  score: number
  totalQuestions: number
  answers: Record<string, number> // Question ID to selected answer index
  completedAt: Date
}

