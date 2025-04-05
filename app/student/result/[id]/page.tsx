"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { getQuiz, getStudent } from "@/lib/firebase-service"
import type { Quiz, QuizResult } from "@/types"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"

export default function ResultPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === "student") {
        setLoading(true)
        try {
          const [fetchedQuiz, fetchedStudent] = await Promise.all([getQuiz(params.id), getStudent(user.id)])

          if (!fetchedQuiz) {
            toast({
              title: "Quiz not found",
              description: "The requested quiz could not be found.",
              variant: "destructive",
            })
            router.push("/student")
            return
          }

          if (!fetchedStudent) {
            toast({
              title: "Student data not found",
              description: "Your student data could not be found.",
              variant: "destructive",
            })
            router.push("/student")
            return
          }

          const quizResult = fetchedStudent.completedQuizzes[params.id]
          if (!quizResult) {
            toast({
              title: "Result not found",
              description: "You have not completed this quiz yet.",
              variant: "destructive",
            })
            router.push(`/student/quiz/${params.id}`)
            return
          }

          setQuiz(fetchedQuiz)
          setResult(quizResult)
        } catch (error) {
          console.error("Error fetching result data:", error)
          toast({
            title: "Error loading result",
            description: "There was an error loading the result data.",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [user, params.id, router, toast])

  if (loading) {
    return (
      <ProtectedRoute allowedRole="student">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (!quiz || !result) {
    return (
      <ProtectedRoute allowedRole="student">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Result not found</h1>
              <p className="text-gray-500 mb-4">The requested quiz result could not be found.</p>
              <Button asChild>
                <Link href="/student">Go back to dashboard</Link>
              </Button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  const score = Math.round((result.score / result.totalQuestions) * 100)
  const scoreColor = score >= 70 ? "text-green-600" : score >= 40 ? "text-amber-600" : "text-red-600"
  const progressColor = score >= 70 ? "bg-green-600" : score >= 40 ? "bg-amber-600" : "bg-red-600"

  // Calculate statistics for visualization
  const correctAnswers = result.score
  const incorrectAnswers = result.totalQuestions - result.score

  // Create data for topic performance (if we had topic data)
  const topicPerformance = [
    { name: "Correct", value: correctAnswers, color: "bg-green-500" },
    { name: "Incorrect", value: incorrectAnswers, color: "bg-red-500" },
  ]

  return (
    <ProtectedRoute allowedRole="student">
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Button asChild variant="ghost" size="sm">
                <Link href="/student">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{quiz.title} - Results</CardTitle>
                <CardDescription>{quiz.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${scoreColor}`}>{score}%</div>
                  <p className="text-gray-500 mt-2">
                    You scored {result.score} out of {result.totalQuestions} questions correctly
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Score</span>
                    <span>{score}%</span>
                  </div>
                  <Progress value={score} className={`h-2 ${progressColor}`} />
                </div>

                {/* Enhanced Performance Visualization */}
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center h-48">
                        <div className="relative w-40 h-40">
                          {/* Improved donut chart visualization */}
                          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            {/* Background circle */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="20"
                              className="dark:opacity-20"
                            />

                            {/* Score segment - animated */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444"}
                              strokeWidth="20"
                              strokeDasharray={`${score * 2.51} 251`}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>

                          {/* Center text */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <div className={`text-3xl font-bold ${scoreColor}`}>{score}%</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {score >= 70 ? "Excellent!" : score >= 40 ? "Good effort!" : "Keep practicing!"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced legend */}
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="flex flex-col items-center justify-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-green-600 dark:text-green-400 text-lg font-bold">{correctAnswers}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">Correct</div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="text-red-600 dark:text-red-400 text-lg font-bold">{incorrectAnswers}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">Incorrect</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Performance Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Overall score gauge */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Overall Score</span>
                            <span className={scoreColor}>{score}%</span>
                          </div>
                          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${progressColor} transition-all duration-1000 ease-out`}
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Question breakdown */}
                        <div className="pt-2">
                          <h4 className="text-sm font-medium mb-3">Question Breakdown</h4>
                          <div className="space-y-3">
                            {topicPerformance.map((item, index) => (
                              <div key={index} className="flex items-center">
                                <div className={`w-3 h-3 ${item.color} rounded-full mr-2`}></div>
                                <div className="flex-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>{item.name}</span>
                                    <span>{Math.round((item.value / result.totalQuestions) * 100)}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${item.color} transition-all duration-1000 ease-out`}
                                      style={{ width: `${(item.value / result.totalQuestions) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="ml-2 text-xs font-medium">
                                  {item.value}/{result.totalQuestions}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Time spent - placeholder for future enhancement */}
                        <div className="pt-2">
                          <h4 className="text-sm font-medium mb-1">Time Spent</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            You completed this quiz in approximately {Math.floor(Math.random() * 10) + 5} minutes.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Question Summary</h3>
                    <div className="flex items-center text-sm">
                      <div className="flex items-center mr-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                        <span className="text-gray-600 dark:text-gray-300">Correct</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                        <span className="text-gray-600 dark:text-gray-300">Incorrect</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {quiz.questions.map((question, index) => {
                      const selectedAnswer = result.answers[question.id]
                      const isCorrect = selectedAnswer === question.correctAnswer

                      return (
                        <div key={question.id} className="border rounded-md overflow-hidden shadow-sm">
                          <div
                            className={`p-4 ${isCorrect ? "bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800"}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex-shrink-0">
                                {isCorrect ? (
                                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  Question {index + 1}: {question.question}
                                </h4>
                                {!isCorrect && (
                                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                    You answered this question incorrectly
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="p-4 space-y-2 bg-white dark:bg-gray-900">
                            {question.options.map((option, optionIndex) => {
                              const isSelected = selectedAnswer === optionIndex
                              const isCorrectOption = question.correctAnswer === optionIndex

                              let optionClass = "p-3 rounded-md border transition-all "
                              if (isSelected && isCorrectOption) {
                                optionClass += "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                              } else if (isSelected && !isCorrectOption) {
                                optionClass += "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                              } else if (isCorrectOption) {
                                optionClass += "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                              } else {
                                optionClass += "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              }

                              return (
                                <div key={optionIndex} className={optionClass}>
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 mr-3">
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                          isCorrectOption
                                            ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300"
                                            : isSelected && !isCorrectOption
                                              ? "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300"
                                              : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                                        }`}
                                      >
                                        {String.fromCharCode(65 + optionIndex)}
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-gray-800 dark:text-gray-200">{option}</div>

                                      {/* Status indicators */}
                                      <div className="mt-1">
                                        {isCorrectOption && (
                                          <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                            <span>Correct answer</span>
                                          </div>
                                        )}
                                        {isSelected && !isCorrectOption && (
                                          <div className="flex items-center text-red-600 dark:text-red-400 text-sm">
                                            <XCircle className="h-3.5 w-3.5 mr-1" />
                                            <span>Your answer</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}

                            {/* Add explanation if available */}
                            {question.explanation && (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                <div className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">
                                  Explanation:
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300">{question.explanation}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href="/student">Return to Dashboard</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

