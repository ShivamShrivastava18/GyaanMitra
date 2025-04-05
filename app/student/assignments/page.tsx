"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStudent, getStudentQuizzes } from "@/lib/firebase-service"
import type { Student, Quiz } from "@/types"
import { FileText, Clock } from "lucide-react"

export default function AssignmentsPage() {
  return (
    <ProtectedRoute allowedRole="student">
      <AssignmentsContent />
    </ProtectedRoute>
  )
}

function AssignmentsContent() {
  const { user } = useAuth()
  const [student, setStudent] = useState<Student | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === "student") {
        setLoading(true)
        try {
          const fetchedStudent = await getStudent(user.id)
          if (fetchedStudent) {
            setStudent(fetchedStudent)
            const fetchedQuizzes = await getStudentQuizzes(fetchedStudent.id)
            setQuizzes(fetchedQuizzes)
          }
        } catch (error) {
          console.error("Error fetching student data:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [user])

  const pendingQuizzes = quizzes.filter((quiz) => !student?.completedQuizzes[quiz.id])

  // Function to get a random theme color for quiz cards
  const getRandomTheme = () => {
    const themes = ["blue", "green", "yellow", "red"]
    return themes[Math.floor(Math.random() * themes.length)]
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 space-y-6 fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold dark:text-white">Assignments</h1>
        </div>

        <Card className="card-hover-effect dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-classroom-yellow" />
              <div className="text-2xl font-bold dark:text-white">{loading ? "..." : pendingQuizzes.length}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="classroom-card animate-pulse">
                  <div className="classroom-card-header">
                    <div className="classroom-card-header-bg"></div>
                  </div>
                  <div className="classroom-card-content">
                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="classroom-card-footer">
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))
          ) : pendingQuizzes.length > 0 ? (
            pendingQuizzes.map((quiz) => {
              const theme = getRandomTheme()
              return (
                <div key={quiz.id} className={`classroom-card classroom-theme-${theme}`}>
                  <div className="classroom-card-header">
                    <div className="classroom-card-header-bg"></div>
                    <div className="absolute top-4 left-4 text-white">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="absolute top-4 right-4 bg-white text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                      {quiz.language}
                    </div>
                  </div>
                  <div className="classroom-card-content">
                    <h3 className="classroom-card-title">{quiz.title}</h3>
                    <p className="classroom-card-subtitle line-clamp-2">{quiz.description}</p>
                  </div>
                  <div className="classroom-card-footer">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{quiz.questions.length} questions</div>
                    <Button asChild className="bg-classroom-blue hover:bg-blue-700 transition-all duration-200 ripple">
                      <Link href={`/student/quiz/${quiz.id}`}>Start Quiz</Link>
                    </Button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-lg font-medium dark:text-white">No pending assignments</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">You have completed all assigned quizzes</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

