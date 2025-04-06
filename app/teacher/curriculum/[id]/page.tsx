"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { getCurriculum, getTeacherStudents, createQuiz, getTeacherQuizzes } from "@/lib/firebase-service"
import { generateQuiz } from "@/lib/gemini-service"
import type { Curriculum, Student, Quiz, QuizQuestion } from "@/types"
import { ArrowLeft, BookOpen, FileText, Loader2, Plus, CheckCircle } from "lucide-react"

export default function CurriculumPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute allowedRole="teacher">
      <CurriculumContent params={params} />
    </ProtectedRoute>
  )
}

function CurriculumContent({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTopics, setSelectedTopics] = useState<
    {
      moduleId: string
      moduleTitle: string
      topicId: string
      topicTitle: string
    }[]
  >([])
  const [quizTitle, setQuizTitle] = useState("")
  const [quizDescription, setQuizDescription] = useState("")
  const [quizLanguage, setQuizLanguage] = useState("English")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === "teacher") {
        // If the ID is "new", we're creating a new curriculum, so don't try to fetch it
        if (params.id === "new") {
          router.push("/teacher/curriculum/new")
          return
        }

        setLoading(true)
        try {
          const [fetchedCurriculum, fetchedStudents, fetchedQuizzes] = await Promise.all([
            getCurriculum(params.id),
            getTeacherStudents(user.id),
            getTeacherQuizzes(user.id),
          ])

          if (!fetchedCurriculum) {
            toast({
              title: "Curriculum not found",
              description: "The requested curriculum could not be found.",
              variant: "destructive",
            })
            router.push("/teacher")
            return
          }

          setCurriculum(fetchedCurriculum)
          setStudents(fetchedStudents)

          // Filter quizzes to only show those from this curriculum
          const curriculumQuizzes = fetchedQuizzes.filter((quiz) => {
            // Check if the quiz's topicId belongs to any topic in this curriculum
            return fetchedCurriculum.modules.some((module) => module.topics.some((topic) => topic.id === quiz.topicId))
          })
          setQuizzes(curriculumQuizzes)
        } catch (error) {
          console.error("Error fetching curriculum data:", error)
          toast({
            title: "Error loading curriculum",
            description: "There was an error loading the curriculum data.",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [user, params.id, router, toast])

  const handleTopicSelect = (moduleId: string, moduleTitle: string, topicId: string, topicTitle: string) => {
    // Check if this topic is already selected
    const isAlreadySelected = selectedTopics.some((topic) => topic.topicId === topicId)

    if (isAlreadySelected) {
      // Remove the topic if it's already selected
      setSelectedTopics(selectedTopics.filter((topic) => topic.topicId !== topicId))
    } else {
      // Add the topic to selected topics
      setSelectedTopics([
        ...selectedTopics,
        {
          moduleId,
          moduleTitle,
          topicId,
          topicTitle,
        },
      ])
    }
  }

  const openQuizDialog = () => {
    if (selectedTopics.length === 0) {
      toast({
        title: "No topics selected",
        description: "Please select at least one topic to generate a quiz.",
        variant: "destructive",
      })
      return
    }

    // Generate a title based on selected topics
    const topicTitles = selectedTopics.map((t) => t.topicTitle)
    const title =
      topicTitles.length === 1
        ? `Quiz on ${topicTitles[0]}`
        : `Quiz on ${topicTitles.slice(0, -1).join(", ")} and ${topicTitles[topicTitles.length - 1]}`

    setQuizTitle(title)
    setQuizDescription(`Test your knowledge of ${topicTitles.join(", ")}`)
    setOpenDialog(true)
  }

  const handleGenerateQuiz = async () => {
    if (selectedTopics.length === 0) return

    setGeneratingQuiz(true)
    try {
      const topicTitles = selectedTopics.map((t) => t.topicTitle)
      const questions = await generateQuiz({
        topics: topicTitles,
        language: quizLanguage,
        numberOfQuestions: Math.min(10, selectedTopics.length * 2), // 2 questions per topic, max 10
      })

      setGeneratedQuestions(
        questions.map((q, i) => ({
          ...q,
          id: `q-${Date.now()}-${i}`,
        })),
      )

      toast({
        title: "Quiz generated",
        description: `Successfully generated ${questions.length} questions for the quiz.`,
      })
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast({
        title: "Failed to generate quiz",
        description: "There was an error generating the quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingQuiz(false)
    }
  }

  const handleCreateQuiz = async () => {
    if (!user || user.role !== "teacher" || selectedTopics.length === 0 || generatedQuestions.length === 0) return

    try {
      // Use the first selected topic as the primary topic for the quiz
      const primaryTopicId = selectedTopics[0].topicId

      const quizData: Omit<Quiz, "id"> = {
        topicId: primaryTopicId,
        title: quizTitle,
        description: quizDescription,
        language: quizLanguage,
        questions: generatedQuestions,
        createdBy: user.id,
        assignedTo: selectedStudents,
      }

      await createQuiz(quizData)

      toast({
        title: "Quiz created",
        description: "Your quiz has been created and assigned to the selected students.",
      })

      // Refresh quizzes
      const fetchedQuizzes = await getTeacherQuizzes(user.id)
      const curriculumQuizzes = fetchedQuizzes.filter((quiz) => {
        return curriculum?.modules.some((module) => module.topics.some((topic) => topic.id === quiz.topicId))
      })
      setQuizzes(curriculumQuizzes)

      setOpenDialog(false)
      setSelectedTopics([])
      setGeneratedQuestions([])
      setSelectedStudents([])
    } catch (error) {
      console.error("Error creating quiz:", error)
      toast({
        title: "Failed to create quiz",
        description: "There was an error creating the quiz. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </main>
      </div>
    )
  }

  if (!curriculum) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Curriculum not found</h1>
            <p className="text-gray-500 mb-4">The requested curriculum could not be found.</p>
            <Button asChild>
              <Link href="/teacher">Go back to dashboard</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Button asChild variant="ghost" size="sm">
              <Link href="/teacher">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{curriculum.title}</h1>
              <p className="text-gray-500">{curriculum.description}</p>
            </div>

            {selectedTopics.length > 0 && (
              <Button onClick={openQuizDialog} className="bg-blue-600 hover:bg-blue-700">
                <FileText className="mr-2 h-4 w-4" />
                Generate Quiz ({selectedTopics.length})
              </Button>
            )}
          </div>

          <Tabs defaultValue="modules">
            <TabsList>
              <TabsTrigger value="modules">Modules & Topics</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            </TabsList>

            <TabsContent value="modules" className="space-y-6">
              <div className="space-y-4">
                {curriculum.modules.map((module) => (
                  <Card key={module.id}>
                    <CardHeader className="pb-2">
                      <CardTitle>{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <h3 className="text-sm font-medium mb-2">Topics</h3>
                      <div className="space-y-2">
                        {module.topics.map((topic) => {
                          const isSelected = selectedTopics.some((t) => t.topicId === topic.id)
                          return (
                            <div
                              key={topic.id}
                              className={`flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors topic-item ${
                                isSelected
                                  ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 selected"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center">
                                <Checkbox
                                  id={`topic-${topic.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() =>
                                    handleTopicSelect(module.id, module.title, topic.id, topic.title)
                                  }
                                  className="mr-3"
                                />
                                <div>
                                  <h4 className="font-medium dark:text-white">{topic.title}</h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{topic.description}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="quizzes">
              <Card>
                <CardHeader>
                  <CardTitle>Quizzes</CardTitle>
                  <CardDescription>View and manage quizzes created from this curriculum</CardDescription>
                </CardHeader>
                <CardContent>
                  {quizzes.length > 0 ? (
                    <div className="space-y-4">
                      {quizzes.map((quiz) => {
                        // Find the topic this quiz is for
                        let topicName = ""
                        curriculum.modules.forEach((module) => {
                          module.topics.forEach((topic) => {
                            if (topic.id === quiz.topicId) {
                              topicName = topic.title
                            }
                          })
                        })

                        return (
                          <div
                            key={quiz.id}
                            className="border rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-lg">{quiz.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{quiz.description}</p>
                                <div className="flex items-center mt-2 space-x-4">
                                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded-full">
                                    {quiz.language}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {quiz.questions.length} questions
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {quiz.assignedTo.length} students assigned
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <BookOpen className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No quizzes yet</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Generate quizzes from topics in the Modules tab
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generate Quiz for Selected Topics</DialogTitle>
                <DialogDescription>
                  Create a quiz based on {selectedTopics.length} selected topic{selectedTopics.length > 1 ? "s" : ""}{" "}
                  and assign it to students
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="quiz-title">Quiz Title</Label>
                  <Input id="quiz-title" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-description">Description</Label>
                  <Input
                    id="quiz-description"
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-language">Language</Label>
                  <Select value={quizLanguage} onValueChange={setQuizLanguage}>
                    <SelectTrigger id="quiz-language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Bengali">Bengali</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Telugu">Telugu</SelectItem>
                      <SelectItem value="Marathi">Marathi</SelectItem>
                      <SelectItem value="Gujarati">Gujarati</SelectItem>
                      <SelectItem value="Kannada">Kannada</SelectItem>
                      <SelectItem value="Malayalam">Malayalam</SelectItem>
                      <SelectItem value="Punjabi">Punjabi</SelectItem>
                      <SelectItem value="Urdu">Urdu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Selected Topics</Label>
                  <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
                    {selectedTopics.map((topic) => (
                      <div key={topic.topicId} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span>{topic.topicTitle}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500"
                          onClick={() =>
                            handleTopicSelect(topic.moduleId, topic.moduleTitle, topic.topicId, topic.topicTitle)
                          }
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Assign to Students</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedStudents.length === students.length) {
                          setSelectedStudents([])
                        } else {
                          setSelectedStudents(students.map((student) => student.id))
                        }
                      }}
                    >
                      {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                    {students.length > 0 ? (
                      students.map((student) => (
                        <div key={student.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStudents([...selectedStudents, student.id])
                              } else {
                                setSelectedStudents(selectedStudents.filter((id) => id !== student.id))
                              }
                            }}
                          />
                          <Label htmlFor={`student-${student.id}`} className="text-sm">
                            {student.name}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center text-gray-500 py-2">No students available</div>
                    )}
                  </div>
                </div>

                {generatedQuestions.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Generated Questions</Label>
                    <div className="max-h-60 overflow-y-auto pr-2">
                      <Accordion type="single" collapsible className="w-full">
                        {generatedQuestions.map((question, index) => (
                          <AccordionItem key={question.id} value={question.id}>
                            <AccordionTrigger className="text-left">
                              {index + 1}. {question.question}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-6">
                                {question.options.map((option, optionIndex) => (
                                  <div
                                    key={optionIndex}
                                    className={`p-2 rounded-md ${
                                      optionIndex === question.correctAnswer
                                        ? "bg-green-50 border border-green-200 dark:bg-green-900/30 dark:border-green-800"
                                        : "bg-gray-50 dark:bg-gray-800"
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optionIndex)}. {option}
                                    {optionIndex === question.correctAnswer && (
                                      <span className="ml-2 text-green-600 dark:text-green-400 text-sm">(Correct)</span>
                                    )}
                                  </div>
                                ))}
                                {question.explanation && (
                                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-md">
                                    <strong>Explanation:</strong> {question.explanation}
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                ) : (
                  <Button onClick={handleGenerateQuiz} disabled={generatingQuiz} className="w-full">
                    {generatingQuiz ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Quiz...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Quiz Questions
                      </>
                    )}
                  </Button>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateQuiz}
                  disabled={generatedQuestions.length === 0 || selectedStudents.length === 0}
                >
                  Create and Assign Quiz
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}

