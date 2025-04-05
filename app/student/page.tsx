"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getStudent, getStudentQuizzes, getTeacher } from "@/lib/firebase-service"
import type { Student, Quiz, Teacher } from "@/types"
import { BookOpen, CheckCircle, Clock, FileText, Award } from "lucide-react"

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentDashboard />
    </ProtectedRoute>
  )
}

function StudentDashboard() {
  const { user } = useAuth()
  const [student, setStudent] = useState<Student | null>(null)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
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

            const [fetchedTeacher, fetchedQuizzes] = await Promise.all([
              getTeacher(fetchedStudent.teacher),
              getStudentQuizzes(fetchedStudent.id),
            ])

            setTeacher(fetchedTeacher)
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

  const completedQuizzes = quizzes.filter((quiz) => student?.completedQuizzes[quiz.id])

  // Function to get a random theme color for quiz cards
  const getRandomTheme = () => {
    const themes = ["blue", "green", "yellow", "red"]
    return themes[Math.floor(Math.random() * themes.length)]
  }

  // Calculate overall score
  const calculateOverallScore = () => {
    if (!student || !completedQuizzes.length) return 0

    let totalScore = 0
    let totalQuestions = 0

    Object.values(student.completedQuizzes).forEach((result) => {
      totalScore += result.score
      totalQuestions += result.totalQuestions
    })

    return totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0
  }

  const overallScore = calculateOverallScore()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 space-y-6 fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-hover-effect">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Teacher</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4 text-classroom-blue" />
                <div className="text-lg font-medium">{loading ? "Loading..." : teacher?.name || "Not assigned"}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover-effect">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-classroom-yellow" />
                <div className="text-2xl font-bold">{loading ? "..." : pendingQuizzes.length}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover-effect">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Award className="mr-2 h-4 w-4 text-classroom-green" />
                <div
                  className={`text-2xl font-bold ${
                    overallScore >= 70 ? "text-green-600" : overallScore >= 40 ? "text-yellow-500" : "text-red-500"
                  }`}
                >
                  {loading ? "..." : `${overallScore}%`}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="bg-gray-100 p-1">
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all duration-200"
            >
              <Clock className="mr-2 h-4 w-4" />
              Pending Quizzes
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all duration-200"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Completed Quizzes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-4 animate-in">
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
                        <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-full bg-gray-200 rounded"></div>
                      </div>
                      <div className="classroom-card-footer">
                        <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
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
                        <div className="text-sm text-gray-500">{quiz.questions.length} questions</div>
                        <Button
                          asChild
                          className="bg-classroom-blue hover:bg-blue-700 transition-all duration-200 ripple"
                        >
                          <Link href={`/student/quiz/${quiz.id}`}>Start Quiz</Link>
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium">No pending quizzes</h3>
                  <p className="text-sm text-gray-500">You have completed all assigned quizzes</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="completed" className="space-y-4 animate-in">
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
                        <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-full bg-gray-200 rounded"></div>
                      </div>
                      <div className="classroom-card-footer">
                        <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))
              ) : completedQuizzes.length > 0 ? (
                completedQuizzes.map((quiz) => {
                  const result = student?.completedQuizzes[quiz.id]
                  const score = result ? Math.round((result.score / result.totalQuestions) * 100) : 0
                  const theme = score >= 70 ? "green" : score >= 40 ? "yellow" : "red"

                  return (
                    <div key={quiz.id} className={`classroom-card classroom-theme-${theme}`}>
                      <div className="classroom-card-header">
                        <div className="classroom-card-header-bg"></div>
                        <div className="absolute top-4 left-4 text-white">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div className="absolute top-4 right-4 bg-white text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                          {quiz.language}
                        </div>
                      </div>
                      <div className="classroom-card-content">
                        <h3 className="classroom-card-title">{quiz.title}</h3>
                        <p className="classroom-card-subtitle line-clamp-2">{quiz.description}</p>
                        <div
                          className={`mt-2 text-sm font-medium ${
                            score >= 70 ? "text-green-600" : score >= 40 ? "text-amber-600" : "text-red-600"
                          }`}
                        >
                          Score: {score}%
                        </div>
                      </div>
                      <div className="classroom-card-footer">
                        <div className="text-sm text-gray-500">{quiz.questions.length} questions</div>
                        <Button asChild variant="outline" className="hover:bg-gray-100 transition-all duration-200">
                          <Link href={`/student/result/${quiz.id}`}>View Results</Link>
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium">No completed quizzes</h3>
                  <p className="text-sm text-gray-500">Complete quizzes to see your results here</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

