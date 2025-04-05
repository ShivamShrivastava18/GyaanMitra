"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTeacherStudents } from "@/lib/firebase-service"
import type { Student } from "@/types"
import { Users, Award, CheckCircle, FileText } from "lucide-react"

export default function StudentsPage() {
  return (
    <ProtectedRoute allowedRole="teacher">
      <StudentsContent />
    </ProtectedRoute>
  )
}

function StudentsContent() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [studentPerformance, setStudentPerformance] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === "teacher") {
        setLoading(true)
        try {
          const fetchedStudents = await getTeacherStudents(user.id)
          setStudents(fetchedStudents)

          // Calculate student performance
          const performance: Record<string, number> = {}
          fetchedStudents.forEach((student) => {
            const completedQuizzes = Object.values(student.completedQuizzes || {})
            if (completedQuizzes.length > 0) {
              let totalScore = 0
              let totalQuestions = 0

              completedQuizzes.forEach((result) => {
                totalScore += result.score
                totalQuestions += result.totalQuestions
              })

              performance[student.id] = Math.round((totalScore / totalQuestions) * 100)
            } else {
              performance[student.id] = 0
            }
          })

          setStudentPerformance(performance)
        } catch (error) {
          console.error("Error fetching students:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [user])

  // Function to get color based on performance
  const getPerformanceColor = (score: number) => {
    if (score >= 70) return "text-green-600 dark:text-green-400"
    if (score >= 40) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 space-y-6 fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold dark:text-white">Students</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-hover-effect dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-300">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-classroom-blue" />
                <div className="text-2xl font-bold dark:text-white">{students.length}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover-effect dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-300">Avg. Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Award className="mr-2 h-4 w-4 text-classroom-green" />
                <div className="text-2xl font-bold dark:text-white">
                  {Object.values(studentPerformance).length > 0
                    ? Math.round(
                        Object.values(studentPerformance).reduce((a, b) => a + b, 0) /
                          Object.values(studentPerformance).length,
                      )
                    : 0}
                  %
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover-effect dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-300">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-classroom-yellow" />
                <div className="text-2xl font-bold dark:text-white">
                  {students.length > 0
                    ? Math.round(
                        (students.filter((s) => Object.keys(s.completedQuizzes || {}).length > 0).length /
                          students.length) *
                          100,
                      )
                    : 0}
                  %
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover-effect dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-300">Assigned Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-classroom-red" />
                <div className="text-2xl font-bold dark:text-white">
                  {students.reduce((total, student) => total + student.assignedQuizzes.length, 0)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Student List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border dark:border-gray-800 overflow-hidden">
              <div className="grid grid-cols-5 p-4 font-medium border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                <div>Name</div>
                <div>Email</div>
                <div>Assigned Quizzes</div>
                <div>Completed Quizzes</div>
                <div>Performance</div>
              </div>
              {loading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="grid grid-cols-5 p-4 border-b dark:border-gray-800 animate-pulse">
                      <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))
              ) : students.length > 0 ? (
                students.map((student) => {
                  const performance = studentPerformance[student.id] || 0
                  const performanceColor = getPerformanceColor(performance)

                  return (
                    <div
                      key={student.id}
                      className="grid grid-cols-5 p-4 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200"
                    >
                      <div className="font-medium flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 flex items-center justify-center mr-2 font-medium">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="dark:text-white">{student.name}</span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 flex items-center">{student.email}</div>
                      <div className="flex items-center dark:text-white">{student.assignedQuizzes.length}</div>
                      <div className="flex items-center dark:text-white">
                        {Object.keys(student.completedQuizzes || {}).length}
                      </div>
                      <div className="flex items-center">
                        <div className={`font-medium ${performanceColor}`}>{performance}%</div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Users className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-medium dark:text-white">No students yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Students will appear here once they are assigned to you
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

