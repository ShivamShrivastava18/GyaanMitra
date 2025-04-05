"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTeacherStudents, getTeacherCurriculums, getTeacherQuizzes } from "@/lib/firebase-service"
import type { Student, Curriculum, Quiz } from "@/types"
import { BookOpen, Users, FileText, Plus, School, BarChart, Award, CheckCircle, Calendar } from "lucide-react"

export default function TeacherDashboardPage() {
  return (
    <ProtectedRoute allowedRole="teacher">
      <TeacherDashboard />
    </ProtectedRoute>
  )
}

function TeacherDashboard() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [studentPerformance, setStudentPerformance] = useState<Record<string, number>>({})
  const [recentActivity, setRecentActivity] = useState<{ date: Date; action: string; details: string }[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === "teacher") {
        setLoading(true)
        try {
          const [fetchedStudents, fetchedCurriculums, fetchedQuizzes] = await Promise.all([
            getTeacherStudents(user.id),
            getTeacherCurriculums(user.id),
            getTeacherQuizzes(user.id),
          ])
          setStudents(fetchedStudents)
          setCurriculums(fetchedCurriculums)
          setQuizzes(fetchedQuizzes)

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

          // Generate some sample recent activity
          // In a real app, this would come from the database
          const activity = [
            {
              date: new Date(Date.now() - 1000 * 60 * 60 * 2),
              action: "Quiz Completed",
              details: `${fetchedStudents[0]?.name || "A student"} completed "${fetchedQuizzes[0]?.title || "a quiz"}"`,
            },
            {
              date: new Date(Date.now() - 1000 * 60 * 60 * 24),
              action: "Curriculum Created",
              details: `You created "${fetchedCurriculums[0]?.title || "a curriculum"}"`,
            },
            {
              date: new Date(Date.now() - 1000 * 60 * 60 * 48),
              action: "Quiz Created",
              details: `You created "${fetchedQuizzes[0]?.title || "a quiz"}"`,
            },
          ]

          setRecentActivity(activity)
        } catch (error) {
          console.error("Error fetching teacher data:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [user])

  // Function to get a random theme color for curriculum cards
  const getRandomTheme = () => {
    const themes = ["blue", "green", "yellow", "red"]
    return themes[Math.floor(Math.random() * themes.length)]
  }

  // Function to get color based on performance
  const getPerformanceColor = (score: number) => {
    if (score >= 70) return "text-green-600 dark:text-green-400"
    if (score >= 40) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  // Format date for recent activity
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 space-y-6 fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold dark:text-white">Teacher Dashboard</h1>
          <div className="flex gap-2">
            <Button asChild className="bg-classroom-blue hover:bg-blue-700 transition-all duration-200 ripple">
              <Link href="/teacher/curriculum/new">
                <Plus className="mr-2 h-4 w-4" />
                New Curriculum
              </Link>
            </Button>
          </div>
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
              <CardTitle className="text-sm font-medium dark:text-gray-300">Curriculums</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4 text-classroom-green" />
                <div className="text-2xl font-bold dark:text-white">{curriculums.length}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover-effect dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-300">Quizzes Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-classroom-yellow" />
                <div className="text-2xl font-bold dark:text-white">{quizzes.length}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover-effect dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-300">Avg. Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Award className="mr-2 h-4 w-4 text-classroom-red" />
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
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Tabs defaultValue="curriculums" className="w-full">
              <TabsList className="bg-gray-100 dark:bg-gray-800 p-1">
                <TabsTrigger
                  value="curriculums"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-200"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Curriculums
                </TabsTrigger>
                <TabsTrigger
                  value="students"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-200"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Students
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-200"
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  Performance
                </TabsTrigger>
              </TabsList>
              <TabsContent value="curriculums" className="space-y-4 animate-in">
                <div className="grid gap-4 md:grid-cols-2">
                  {loading ? (
                    Array(4)
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
                  ) : curriculums.length > 0 ? (
                    curriculums.map((curriculum) => {
                      const theme = getRandomTheme()
                      return (
                        <div key={curriculum.id} className={`classroom-card classroom-theme-${theme}`}>
                          <div className="classroom-card-header">
                            <div className="classroom-card-header-bg"></div>
                            <div className="absolute top-4 left-4 text-white">
                              <School className="h-6 w-6" />
                            </div>
                          </div>
                          <div className="classroom-card-content">
                            <h3 className="classroom-card-title">{curriculum.title}</h3>
                            <p className="classroom-card-subtitle line-clamp-2">{curriculum.description}</p>
                          </div>
                          <div className="classroom-card-footer">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {curriculum.modules.length} modules,
                              {curriculum.modules.reduce((total, module) => total + module.topics.length, 0)} topics
                            </div>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                            >
                              <Link href={`/teacher/curriculum/${curriculum.id}`}>Open</Link>
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                      <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" />
                      <h3 className="text-lg font-medium dark:text-white">No curriculums yet</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Create your first curriculum to start generating quizzes
                      </p>
                      <Button
                        asChild
                        className="bg-classroom-blue hover:bg-blue-700 transition-all duration-200 ripple"
                      >
                        <Link href="/teacher/curriculum/new">
                          <Plus className="mr-2 h-4 w-4" />
                          New Curriculum
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="students" className="space-y-4 animate-in">
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
              </TabsContent>

              <TabsContent value="performance" className="space-y-4 animate-in">
                <Card className="dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="dark:text-white">Student Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {students.length > 0 ? (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          {students.map((student) => {
                            const performance = studentPerformance[student.id] || 0
                            const performanceColor =
                              performance >= 70 ? "bg-green-500" : performance >= 40 ? "bg-amber-500" : "bg-red-500"

                            return (
                              <div key={student.id} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 flex items-center justify-center mr-2 font-medium text-xs">
                                      {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium dark:text-white">{student.name}</span>
                                  </div>
                                  <span className={`text-sm ${getPerformanceColor(performance)}`}>{performance}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${performanceColor}`}
                                    style={{ width: `${performance}%` }}
                                  ></div>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <Card className="dark:border-gray-800">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium dark:text-gray-300">Average Score</CardTitle>
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

                          <Card className="dark:border-gray-800">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium dark:text-gray-300">Highest Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center">
                                <Award className="mr-2 h-4 w-4 text-classroom-yellow" />
                                <div className="text-2xl font-bold dark:text-white">
                                  {Object.values(studentPerformance).length > 0
                                    ? Math.max(...Object.values(studentPerformance))
                                    : 0}
                                  %
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="dark:border-gray-800">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium dark:text-gray-300">Completion Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center">
                                <CheckCircle className="mr-2 h-4 w-4 text-classroom-blue" />
                                <div className="text-2xl font-bold dark:text-white">
                                  {students.length > 0
                                    ? Math.round(
                                        (students.filter((s) => Object.keys(s.completedQuizzes || {}).length > 0)
                                          .length /
                                          students.length) *
                                          100,
                                      )
                                    : 0}
                                  %
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <BarChart className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" />
                        <h3 className="text-lg font-medium dark:text-white">No performance data yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Performance data will appear once students complete quizzes
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="dark:border-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 pb-4 border-b dark:border-gray-800 last:border-0 last:pb-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium dark:text-white">{activity.action}</h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(activity.date)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{activity.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <Calendar className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="dark:border-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button asChild className="w-full justify-start bg-classroom-blue hover:bg-blue-700">
                    <Link href="/teacher/curriculum/new">
                      <Plus className="mr-2 h-4 w-4" />
                      New Curriculum
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start bg-classroom-green hover:bg-green-700">
                    <Link href="/teacher/quiz/new">
                      <FileText className="mr-2 h-4 w-4" />
                      Create Quiz
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full justify-start bg-classroom-yellow hover:bg-yellow-600 text-gray-900 hover:text-gray-900"
                  >
                    <Link href="/teacher/students">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Students
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

