"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getTeacherCurriculums, getTeacherStudents, createQuiz } from "@/lib/firebase-service"
import { generateQuiz } from "@/lib/gemini-service"
import type { Curriculum, Student, Quiz, QuizQuestion } from "@/types"
import { Loader2, RefreshCw, ArrowLeft, Check } from "lucide-react"

export default function NewQuizPage() {
  return (
    <ProtectedRoute allowedRole="teacher">
      <NewQuizContent />
    </ProtectedRoute>
  )
}

function NewQuizContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [curriculumId, setCurriculumId] = useState("")
  const [topicIds, setTopicIds] = useState<string[]>([])
  const [language, setLanguage] = useState("English")
  const [numQuestions, setNumQuestions] = useState(5)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [topics, setTopics] = useState<{ id: string; title: string; moduleTitle: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([])
  const [step, setStep] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === "teacher") {
        try {
          const [fetchedCurriculums, fetchedStudents] = await Promise.all([
            getTeacherCurriculums(user.id),
            getTeacherStudents(user.id),
          ])
          setCurriculums(fetchedCurriculums)
          setStudents(fetchedStudents)
        } catch (error) {
          console.error("Error fetching data:", error)
          toast({
            title: "Error",
            description: "Failed to load curriculums and students. Please try again.",
            variant: "destructive",
          })
        }
      }
    }

    fetchData()
  }, [user, toast])

  useEffect(() => {
    if (curriculumId) {
      const curriculum = curriculums.find((c) => c.id === curriculumId)
      if (curriculum) {
        const allTopics = curriculum.modules.flatMap((module) =>
          module.topics.map((topic) => ({
            id: topic.id,
            title: topic.title,
            moduleTitle: module.title,
          })),
        )
        setTopics(allTopics)
        setTopicIds([])
      }
    } else {
      setTopics([])
      setTopicIds([])
    }
  }, [curriculumId, curriculums])

  const handleTopicToggle = (topicId: string) => {
    setTopicIds((prev) => (prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]))
  }

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map((student) => student.id))
    }
  }

  const handleGenerateQuiz = async () => {
    if (!curriculumId) {
      toast({
        title: "Curriculum required",
        description: "Please select a curriculum.",
        variant: "destructive",
      })
      return
    }

    if (topicIds.length === 0) {
      toast({
        title: "Topics required",
        description: "Please select at least one topic.",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    try {
      const curriculum = curriculums.find((c) => c.id === curriculumId)
      if (!curriculum) throw new Error("Curriculum not found")

      const selectedTopics = curriculum.modules
        .flatMap((module) => module.topics)
        .filter((topic) => topicIds.includes(topic.id))

      const topicContents = selectedTopics
        .map((topic) => `Topic: ${topic.title}\nDescription: ${topic.description}`)
        .join("\n\n")

      const questions = await generateQuiz(topicContents, numQuestions, language)
      setGeneratedQuestions(questions)

      if (questions.length === 0) {
        toast({
          title: "Generation failed",
          description: "Failed to generate quiz questions. Please try again or modify your selection.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Quiz generated",
        description: `Successfully generated ${questions.length} questions.`,
      })

      setStep(2)
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast({
        title: "Generation failed",
        description: "There was an error generating the quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleCreateQuiz = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your quiz.",
        variant: "destructive",
      })
      return
    }

    if (selectedStudents.length === 0) {
      toast({
        title: "Students required",
        description: "Please select at least one student to assign this quiz to.",
        variant: "destructive",
      })
      return
    }

    if (generatedQuestions.length === 0) {
      toast({
        title: "Questions required",
        description: "Please generate questions for your quiz.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const curriculum = curriculums.find((c) => c.id === curriculumId)
      if (!curriculum) throw new Error("Curriculum not found")

      const selectedTopics = curriculum.modules
        .flatMap((module) => module.topics)
        .filter((topic) => topicIds.includes(topic.id))

      const quizData: Omit<Quiz, "id"> = {
        teacherId: user?.id || "",
        title: title.trim(),
        description: description.trim(),
        curriculumId,
        topics: selectedTopics.map((topic) => ({
          id: topic.id,
          title: topic.title,
        })),
        language,
        questions: generatedQuestions,
        assignedStudents: selectedStudents,
      }

      const quizId = await createQuiz(quizData)

      toast({
        title: "Quiz created",
        description: "Your quiz has been created and assigned to the selected students.",
      })

      router.push(`/teacher/quiz/${quizId}`)
    } catch (error) {
      console.error("Error creating quiz:", error)
      toast({
        title: "Failed to create quiz",
        description: "There was an error creating your quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setCurriculumId("")
    setTopicIds([])
    setLanguage("English")
    setNumQuestions(5)
    setSelectedStudents([])
    setGeneratedQuestions([])
    setStep(1)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="breadcrumbs">
                <a href="/teacher">Dashboard</a>
                <span className="separator">/</span>
                <a href="/teacher/quiz">Quizzes</a>
                <span className="separator">/</span>
                <span className="current">New Quiz</span>
              </div>
              <h1 className="text-2xl font-bold dark:text-white">Create New Quiz</h1>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="transition-all duration-200 dark:border-gray-700 dark:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="transition-all duration-200 dark:border-gray-700 dark:text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <Card className="dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="dark:text-white">Quiz Details</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Provide basic information about your quiz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="dark:text-white">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Introduction to Programming Quiz"
                      className="transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="dark:text-white">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide a brief description of your quiz"
                      rows={3}
                      className="transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="dark:text-white">Content Selection</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Select the curriculum and topics to include in your quiz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="curriculum" className="dark:text-white">
                      Curriculum
                    </Label>
                    <Select value={curriculumId} onValueChange={setCurriculumId}>
                      <SelectTrigger
                        id="curriculum"
                        className="transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <SelectValue placeholder="Select a curriculum" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {curriculums.map((curriculum) => (
                          <SelectItem key={curriculum.id} value={curriculum.id}>
                            {curriculum.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {curriculumId && (
                    <div className="space-y-2">
                      <Label className="dark:text-white">Topics</Label>
                      <div className="border rounded-md p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
                        {topics.length > 0 ? (
                          topics.map((topic) => (
                            <div key={topic.id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`topic-${topic.id}`}
                                checked={topicIds.includes(topic.id)}
                                onChange={() => handleTopicToggle(topic.id)}
                                className="classroom-checkbox"
                              />
                              <label
                                htmlFor={`topic-${topic.id}`}
                                className="ml-2 text-sm dark:text-white cursor-pointer"
                              >
                                <span className="font-medium">{topic.title}</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2">
                                  (from {topic.moduleTitle})
                                </span>
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center">
                            No topics available in this curriculum
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="language" className="dark:text-white">
                        Language
                      </Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger
                          id="language"
                          className="transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
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
                      <Label htmlFor="numQuestions" className="dark:text-white">
                        Number of Questions
                      </Label>
                      <Select
                        value={numQuestions.toString()}
                        onValueChange={(value) => setNumQuestions(Number.parseInt(value))}
                      >
                        <SelectTrigger
                          id="numQuestions"
                          className="transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                          <SelectValue placeholder="Select number" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value="3">3 questions</SelectItem>
                          <SelectItem value="5">5 questions</SelectItem>
                          <SelectItem value="10">10 questions</SelectItem>
                          <SelectItem value="15">15 questions</SelectItem>
                          <SelectItem value="20">20 questions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleGenerateQuiz}
                  disabled={generating || !curriculumId || topicIds.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Quiz"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="dark:text-white">Generated Questions</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Review the generated questions for your quiz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedQuestions.map((question, index) => (
                    <div key={index} className="border rounded-md p-4 space-y-2 dark:border-gray-700">
                      <h3 className="font-medium dark:text-white">
                        Question {index + 1}: {question.question}
                      </h3>
                      <div className="pl-4 space-y-1">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`flex items-center ${
                              optionIndex === question.correctOptionIndex
                                ? "text-green-600 dark:text-green-400 font-medium"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {optionIndex === question.correctOptionIndex && (
                              <Check className="h-4 w-4 mr-1 flex-shrink-0" />
                            )}
                            <span>
                              {String.fromCharCode(65 + optionIndex)}. {option}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="dark:text-white">Assign to Students</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Select the students who should take this quiz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="dark:text-white">Students</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllStudents}
                      className="transition-all duration-200 dark:border-gray-700 dark:text-white"
                    >
                      {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="border rounded-md p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800 max-h-60 overflow-y-auto">
                    {students.length > 0 ? (
                      students.map((student) => (
                        <div key={student.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`student-${student.id}`}
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleStudentToggle(student.id)}
                            className="classroom-checkbox"
                          />
                          <label
                            htmlFor={`student-${student.id}`}
                            className="ml-2 flex items-center dark:text-white cursor-pointer"
                          >
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 flex items-center justify-center mr-2 font-medium text-xs">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{student.name}</span>
                            <span className="text-gray-500 dark:text-gray-400 ml-2">({student.email})</span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center">No students available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="transition-all duration-200 dark:border-gray-700 dark:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateQuiz}
                  disabled={loading || selectedStudents.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Quiz"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

