"use client"

import Link from "next/link"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { getQuiz, submitQuizResult } from "@/lib/firebase-service"
import type { Quiz } from "@/types"
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react"

export default function QuizPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchQuiz = async () => {
      if (user && user.role === "student") {
        setLoading(true)
        try {
          const fetchedQuiz = await getQuiz(params.id)
          if (!fetchedQuiz) {
            toast({
              title: "Quiz not found",
              description: "The requested quiz could not be found.",
              variant: "destructive",
            })
            router.push("/student")
            return
          }

          // Check if the quiz is assigned to the student
          if (!fetchedQuiz.assignedTo.includes(user.id)) {
            toast({
              title: "Access denied",
              description: "You are not assigned to this quiz.",
              variant: "destructive",
            })
            router.push("/student")
            return
          }

          setQuiz(fetchedQuiz)

          // Initialize answers object with empty values
          const initialAnswers: Record<string, number> = {}
          fetchedQuiz.questions.forEach((question) => {
            initialAnswers[question.id] = -1 // -1 means unanswered
          })
          setAnswers(initialAnswers)
        } catch (error) {
          console.error("Error fetching quiz:", error)
          toast({
            title: "Error loading quiz",
            description: "There was an error loading the quiz data.",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchQuiz()
  }, [user, params.id, router, toast])

  const handleAnswerChange = (questionId: string, answerIndex: number) => {
    setAnswers({
      ...answers,
      [questionId]: answerIndex,
    })
  }

  const handleNext = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user || user.role !== "student" || !quiz) return

    // Check if all questions are answered
    const unansweredQuestions = Object.values(answers).filter((answer) => answer === -1).length
    if (unansweredQuestions > 0) {
      toast({
        title: "Incomplete quiz",
        description: `You have ${unansweredQuestions} unanswered questions. Please answer all questions before submitting.`,
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      // Calculate score
      let score = 0
      quiz.questions.forEach((question) => {
        if (answers[question.id] === question.correctAnswer) {
          score++
        }
      })

      // Submit result
      await submitQuizResult({
        quizId: quiz.id,
        studentId: user.id,
        score,
        totalQuestions: quiz.questions.length,
        answers,
      })

      toast({
        title: "Quiz submitted",
        description: "Your quiz has been submitted successfully.",
      })

      // Redirect to result page
      router.push(`/student/result/${quiz.id}`)
    } catch (error) {
      console.error("Error submitting quiz:", error)
      toast({
        title: "Error submitting quiz",
        description: "There was an error submitting your quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const currentQuestion = quiz?.questions[currentQuestionIndex]
  const progress = quiz ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0
  const allAnswered = quiz ? quiz.questions.every((q) => answers[q.id] !== -1) : false

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

  if (!quiz) {
    return (
      <ProtectedRoute allowedRole="student">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Quiz not found</h1>
              <p className="text-gray-500 mb-4">The requested quiz could not be found.</p>
              <Button asChild>
                <Link href="/student">Go back to dashboard</Link>
              </Button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRole="student">
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{quiz.title}</h1>
              <p className="text-gray-500">{quiz.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {currentQuestion && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-xl">
                    {currentQuestionIndex + 1}. {currentQuestion.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={answers[currentQuestion.id]?.toString() || ""}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, Number.parseInt(value))}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 rounded-md border p-3 transition-colors hover:bg-gray-50"
                      >
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  {currentQuestionIndex < quiz.questions.length - 1 ? (
                    <Button onClick={handleNext}>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!allAnswered || submitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Submit Quiz
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}

            <div className="flex flex-wrap gap-2 justify-center">
              {quiz.questions.map((_, index) => {
                const questionId = quiz.questions[index].id
                const isAnswered = answers[questionId] !== undefined && answers[questionId] !== -1
                const isCurrent = index === currentQuestionIndex

                return (
                  <Button
                    key={index}
                    variant={isCurrent ? "default" : "outline"}
                    size="sm"
                    className={`w-10 h-10 p-0 ${
                      isAnswered
                        ? isCurrent
                          ? "bg-blue-600"
                          : "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200"
                        : ""
                    }`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    {index + 1}
                  </Button>
                )
              })}
            </div>

            {!allAnswered && (
              <div className="mt-6 p-4 border rounded-md bg-amber-50 border-amber-200 flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-amber-800">Please answer all questions before submitting the quiz.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

