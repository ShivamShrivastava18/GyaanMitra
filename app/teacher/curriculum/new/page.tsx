"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { createCurriculum } from "@/lib/firebase-service"
import { extractTopicsFromCurriculum, extractTopicsFromImage, checkGeminiApiStatus } from "@/lib/gemini-service"
import type { Curriculum, Module, Topic } from "@/types"
import { Plus, Trash2, Loader2, Upload, FileText, ImageIcon, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react"

export default function NewCurriculumPage() {
  return (
    <ProtectedRoute allowedRole="teacher">
      <NewCurriculum />
    </ProtectedRoute>
  )
}

function NewCurriculum() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [modules, setModules] = useState<Partial<Module>[]>([{ title: "", description: "", topics: [] }])
  const [loading, setLoading] = useState(false)
  const [extractingTopics, setExtractingTopics] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"manual" | "upload">("manual")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [fileType, setFileType] = useState<string>("")
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [processingFile, setProcessingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadId, setUploadId] = useState<string>(Date.now().toString()) // Unique ID for each upload
  const [apiStatus, setApiStatus] = useState<{ initialized: boolean; keyAvailable: boolean }>({
    initialized: false,
    keyAvailable: false,
  })
  const [formErrors, setFormErrors] = useState<{
    title?: string
    modules?: Record<
      number,
      {
        title?: string
        topics?: string
      }
    >
  }>({})

  useEffect(() => {
    setMounted(true)

    // Check API status
    const status = checkGeminiApiStatus()
    setApiStatus({
      initialized: status.initialized,
      keyAvailable: status.keyAvailable,
    })

    // If API is not initialized, show a toast
    if (!status.initialized || !status.keyAvailable) {
      toast({
        title: "API Status Warning",
        description: "The Gemini API is not properly configured. Topic extraction may not work correctly.",
        variant: "destructive",
        duration: 6000,
      })
    }
  }, [toast])

  const resetForm = () => {
    // Show confirmation dialog
    if (title || description || modules.some((m) => m.title || m.description || (m.topics && m.topics.length > 0))) {
      if (!window.confirm("Are you sure you want to reset the form? All your data will be lost.")) {
        return
      }
    }

    setTitle("")
    setDescription("")
    setModules([{ title: "", description: "", topics: [] }])
    setUploadedFile(null)
    setFileContent("")
    setFileType("")
    setFilePreview(null)
    setUploadError(null)
    setUploadId(Date.now().toString()) // Generate new upload ID
    setFormErrors({})

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    toast({
      title: "Form reset",
      description: "The curriculum form has been reset. You can start fresh.",
    })
  }

  const addModule = () => {
    setModules([...modules, { title: "", description: "", topics: [] }])
  }

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index))
  }

  const updateModule = (index: number, field: keyof Module, value: string) => {
    const updatedModules = [...modules]
    updatedModules[index] = { ...updatedModules[index], [field]: value }
    setModules(updatedModules)

    // Clear error for this field if it exists
    if (formErrors.modules && formErrors.modules[index] && formErrors.modules[index][field as "title"]) {
      const newErrors = { ...formErrors }
      if (newErrors.modules && newErrors.modules[index]) {
        delete newErrors.modules[index][field as "title"]
      }
      setFormErrors(newErrors)
    }
  }

  const addTopic = (moduleIndex: number) => {
    const updatedModules = [...modules]
    const module = updatedModules[moduleIndex]
    if (module.topics) {
      module.topics = [...module.topics, { title: "", description: "" }]
    } else {
      module.topics = [{ title: "", description: "" }]
    }
    setModules(updatedModules)

    // Clear topics error for this module if it exists
    if (formErrors.modules && formErrors.modules[moduleIndex] && formErrors.modules[moduleIndex].topics) {
      const newErrors = { ...formErrors }
      if (newErrors.modules && newErrors.modules[moduleIndex]) {
        delete newErrors.modules[moduleIndex].topics
      }
      setFormErrors(newErrors)
    }
  }

  const removeTopic = (moduleIndex: number, topicIndex: number) => {
    const updatedModules = [...modules]
    const module = updatedModules[moduleIndex]
    if (module.topics) {
      module.topics = module.topics.filter((_, i) => i !== topicIndex)
    }
    setModules(updatedModules)
  }

  const updateTopic = (moduleIndex: number, topicIndex: number, field: keyof Topic, value: string) => {
    const updatedModules = [...modules]
    const module = updatedModules[moduleIndex]
    if (module.topics) {
      module.topics[topicIndex] = {
        ...module.topics[topicIndex],
        [field]: value,
      }
    }
    setModules(updatedModules)
  }

  const extractTopics = async (moduleIndex: number) => {
    const module = modules[moduleIndex]
    if (!module.description || module.description.trim().length < 10) {
      toast({
        title: "Module description required",
        description: "Please provide a detailed module description to extract topics (at least 10 characters).",
        variant: "destructive",
      })
      return
    }

    // Check API status
    if (!apiStatus.initialized || !apiStatus.keyAvailable) {
      toast({
        title: "API Not Configured",
        description: "The Gemini API is not properly configured. Please check the API status page.",
        variant: "destructive",
      })
      return
    }

    setExtractingTopics(moduleIndex)
    try {
      // Generate a unique ID for this extraction
      const extractionId = `module-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      // Add context to the module description
      const enhancedContent = `
        Curriculum: ${title}
        Module: ${module.title}
        Description: ${module.description}
      `

      // Call the API with the enhanced content
      const topics = await extractTopicsFromCurriculum(enhancedContent, extractionId)

      if (!topics || topics.length === 0) {
        toast({
          title: "No topics found",
          description: "No topics could be extracted from the provided description. Try adding more detailed content.",
          variant: "destructive",
        })
        setExtractingTopics(null)
        return
      }

      const updatedModules = [...modules]
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        topics: topics.map((title) => ({
          title,
          description: `Details about ${title}`,
        })),
      }
      setModules(updatedModules)

      toast({
        title: "Topics extracted",
        description: `Successfully extracted ${topics.length} topics from the module description.`,
      })

      // Clear topics error for this module if it exists
      if (formErrors.modules && formErrors.modules[moduleIndex] && formErrors.modules[moduleIndex].topics) {
        const newErrors = { ...formErrors }
        if (newErrors.modules && newErrors.modules[moduleIndex]) {
          delete newErrors.modules[moduleIndex].topics
        }
        setFormErrors(newErrors)
      }
    } catch (error) {
      console.error("Error extracting topics:", error)
      toast({
        title: "Failed to extract topics",
        description: "There was an error extracting topics. Please try again or add them manually.",
        variant: "destructive",
      })
    } finally {
      setExtractingTopics(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadedFile(file)
      setFileType(file.type)
      setUploadId(Date.now().toString()) // Generate new upload ID for each file

      // Check if file is a text file
      if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        // Read file content as text
        const reader = new FileReader()
        reader.onload = async (event) => {
          if (event.target?.result) {
            const content = event.target.result as string
            setFileContent(content)
            setFilePreview(null)

            // Auto-fill title if empty
            if (!title) {
              setTitle(file.name.replace(/\.[^/.]+$/, ""))
            }

            // Auto-fill description if empty
            if (!description) {
              setDescription(content.substring(0, Math.min(200, content.length)) + (content.length > 200 ? "..." : ""))
            }
          }
        }
        reader.readAsText(file)
      }
      // If it's an image, create a preview
      else if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            setFilePreview(event.target.result as string)
            setFileContent("")

            // Auto-fill title if empty
            if (!title) {
              setTitle(file.name.replace(/\.[^/.]+$/, ""))
            }
          }
        }
        reader.readAsDataURL(file)
      }
      // If it's a PDF, we'll handle it differently
      else if (file.type === "application/pdf") {
        // Just set the file name for now
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ""))
        }

        // We'll process the file content during the extraction step
        setFileContent(`File will be processed when you click "Process Curriculum File" (${Date.now()})`)
        setFilePreview(null)
      } else {
        setUploadError("Unsupported file type. Please upload a text file, PDF, or image.")
        setUploadedFile(null)
        setFilePreview(null)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setUploadError(null)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setUploadedFile(file)
      setFileType(file.type)
      setUploadId(Date.now().toString()) // Generate new upload ID for each file

      // Check if file is a text file
      if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        // Read file content as text
        const reader = new FileReader()
        reader.onload = async (event) => {
          if (event.target?.result) {
            const content = event.target.result as string
            setFileContent(content)
            setFilePreview(null)

            // Auto-fill title if empty
            if (!title) {
              setTitle(file.name.replace(/\.[^/.]+$/, ""))
            }

            // Auto-fill description if empty
            if (!description) {
              setDescription(content.substring(0, Math.min(200, content.length)) + (content.length > 200 ? "..." : ""))
            }
          }
        }
        reader.readAsText(file)
      }
      // If it's an image, create a preview
      else if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            setFilePreview(event.target.result as string)
            setFileContent("")

            // Auto-fill title if empty
            if (!title) {
              setTitle(file.name.replace(/\.[^/.]+$/, ""))
            }
          }
        }
        reader.readAsDataURL(file)
      }
      // If it's a PDF, we'll handle it differently
      else if (file.type === "application/pdf") {
        // Just set the file name for now
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ""))
        }

        // We'll process the file content during the extraction step
        setFileContent(`File will be processed when you click "Process Curriculum File" (${Date.now()})`)
        setFilePreview(null)
      } else {
        setUploadError("Unsupported file type. Please upload a text file, PDF, or image.")
        setUploadedFile(null)
        setFilePreview(null)
      }
    }
  }

  const processUploadedFile = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file uploaded",
        description: "Please upload a curriculum file first.",
        variant: "destructive",
      })
      return
    }

    // Check API status
    if (!apiStatus.initialized || !apiStatus.keyAvailable) {
      toast({
        title: "API Not Configured",
        description: "The Gemini API is not properly configured. Please check the API status page.",
        variant: "destructive",
      })
      return
    }

    setProcessingFile(true)
    try {
      // Generate a unique ID for this file processing
      const processingId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      let topics: string[] = []

      // Process based on file type
      if (uploadedFile.type.startsWith("image/")) {
        if (!filePreview) {
          throw new Error("Image preview not available")
        }

        // Extract topics from image
        topics = await extractTopicsFromImage(filePreview, processingId)

        toast({
          title: "Processing image",
          description: "Analyzing image content for topics...",
        })
      } else if (uploadedFile.type === "application/pdf") {
        // For demonstration purposes, we'll use the file name and any description provided
        const extractedContent = `${title || uploadedFile.name}
${description || ""}`

        toast({
          title: "Processing PDF file",
          description:
            "For PDFs, please ensure you've provided a detailed title and description to help with topic extraction.",
        })

        // Extract topics from the title and description
        topics = await extractTopicsFromCurriculum(extractedContent, processingId)
      } else {
        // For text files, use the actual content
        topics = await extractTopicsFromCurriculum(fileContent, processingId)
      }

      if (!topics || topics.length === 0) {
        toast({
          title: "No topics found",
          description:
            "No topics could be extracted from the uploaded file. Try a different file or add topics manually.",
          variant: "destructive",
        })
        setProcessingFile(false)
        return
      }

      // Group topics into modules (create one module per 5 topics for better organization)
      const moduleSize = 5
      const newModules: Partial<Module>[] = []

      for (let i = 0; i < topics.length; i += moduleSize) {
        const moduleTopics = topics.slice(i, i + moduleSize)
        newModules.push({
          title: `Module ${Math.floor(i / moduleSize) + 1}: ${moduleTopics[0]}`,
          description: `Topics related to ${moduleTopics[0]} and related concepts`,
          topics: moduleTopics.map((title) => ({
            title,
            description: `Extracted from curriculum file: ${title}`,
          })),
        })
      }

      // Update the modules state
      setModules(newModules)

      // Switch to the manual tab
      setActiveTab("manual")

      toast({
        title: "File processed successfully",
        description: `Successfully extracted ${topics.length} topics from the uploaded file. You can now review and edit them.`,
        duration: 5000,
      })
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "Failed to process file",
        description: "There was an error processing the uploaded file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingFile(false)
    }
  }

  const validateForm = () => {
    const errors: {
      title?: string
      modules?: Record<
        number,
        {
          title?: string
          topics?: string
        }
      >
    } = {}

    let isValid = true

    // Validate title
    if (!title.trim()) {
      errors.title = "Title is required"
      isValid = false
    }

    // Validate modules
    if (modules.length === 0) {
      toast({
        title: "Modules required",
        description: "Please add at least one module to your curriculum.",
        variant: "destructive",
      })
      isValid = false
    } else {
      errors.modules = {}

      for (let i = 0; i < modules.length; i++) {
        const module = modules[i]
        errors.modules[i] = {}

        if (!module.title?.trim()) {
          errors.modules[i].title = "Module title is required"
          isValid = false
        }

        if (!module.topics || module.topics.length === 0) {
          errors.modules[i].topics = "At least one topic is required"
          isValid = false
        } else {
          for (let j = 0; j < (module.topics || []).length; j++) {
            const topic = module.topics?.[j]
            if (!topic?.title?.trim()) {
              errors.modules[i].topics = "All topics must have a title"
              isValid = false
              break
            }
          }
        }
      }
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || user.role !== "teacher") {
      toast({
        title: "Unauthorized",
        description: "You must be logged in as a teacher to create a curriculum.",
        variant: "destructive",
      })
      return
    }

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Form validation failed",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Prepare curriculum data
      const curriculumData: Omit<Curriculum, "id"> = {
        teacherId: user.id,
        title,
        description,
        modules: modules.map((module, i) => ({
          id: `module-${Date.now()}-${i}`,
          title: module.title || "",
          description: module.description || "",
          topics: (module.topics || []).map((topic, j) => ({
            id: `topic-${Date.now()}-${i}-${j}`,
            title: topic.title || "",
            description: topic.description || "",
          })),
        })),
      }

      // Create curriculum in Firebase
      const curriculumId = await createCurriculum(curriculumData)

      toast({
        title: "Curriculum created",
        description: "Your curriculum has been created successfully.",
      })

      // Redirect to curriculum page
      router.push(`/teacher/curriculum/${curriculumId}`)
    } catch (error) {
      console.error("Error creating curriculum:", error)
      toast({
        title: "Failed to create curriculum",
        description: "There was an error creating your curriculum. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
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
                <a href="/teacher/curriculum">Curriculums</a>
                <span className="separator">/</span>
                <span className="current">New Curriculum</span>
              </div>
              <h1 className="text-2xl font-bold dark:text-white">Create New Curriculum</h1>
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

          {/* API Status Warning */}
          {(!apiStatus.initialized || !apiStatus.keyAvailable) && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-300">API Configuration Issue</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  The Gemini API is not properly configured. Topic extraction may not work correctly.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="dark:border-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Curriculum Details</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Provide basic information about your curriculum
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className={`dark:text-white ${formErrors.title ? "text-red-500 dark:text-red-400" : ""}`}
                  >
                    Title {formErrors.title && <span className="text-red-500 dark:text-red-400">*</span>}
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      if (formErrors.title) {
                        setFormErrors({ ...formErrors, title: undefined })
                      }
                    }}
                    placeholder="e.g., Introduction to Computer Science"
                    required
                    className={`transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      formErrors.title
                        ? "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500"
                        : ""
                    }`}
                  />
                  {formErrors.title && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">{formErrors.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="dark:text-white">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a brief description of your curriculum"
                    rows={3}
                    className="transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="manual" onValueChange={(value) => setActiveTab(value as "manual" | "upload")}>
              <TabsList className="grid w-full grid-cols-2 mb-4 dark:bg-gray-800">
                <TabsTrigger
                  value="manual"
                  className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
                >
                  Create Manually
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
                >
                  Upload Curriculum
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold dark:text-white">Modules</h2>
                  <Button
                    type="button"
                    onClick={addModule}
                    variant="outline"
                    size="sm"
                    className="transition-all duration-200 dark:border-gray-700 dark:text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Module
                  </Button>
                </div>

                {modules.map((module, moduleIndex) => (
                  <Card key={moduleIndex} className="animate-in dark:border-gray-800">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg dark:text-white">Module {moduleIndex + 1}</CardTitle>
                        {modules.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeModule(moduleIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove Module</span>
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`module-${moduleIndex}-title`}
                          className={`dark:text-white ${formErrors.modules?.[moduleIndex]?.title ? "text-red-500 dark:text-red-400" : ""}`}
                        >
                          Title{" "}
                          {formErrors.modules?.[moduleIndex]?.title && (
                            <span className="text-red-500 dark:text-red-400">*</span>
                          )}
                        </Label>
                        <Input
                          id={`module-${moduleIndex}-title`}
                          value={module.title || ""}
                          onChange={(e) => updateModule(moduleIndex, "title", e.target.value)}
                          placeholder="e.g., Programming Basics"
                          required
                          className={`transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                            formErrors.modules?.[moduleIndex]?.title
                              ? "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500"
                              : ""
                          }`}
                        />
                        {formErrors.modules?.[moduleIndex]?.title && (
                          <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                            {formErrors.modules[moduleIndex].title}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`module-${moduleIndex}-description`} className="dark:text-white">
                          Description
                        </Label>
                        <Textarea
                          id={`module-${moduleIndex}-description`}
                          value={module.description || ""}
                          onChange={(e) => updateModule(moduleIndex, "description", e.target.value)}
                          placeholder="Describe the content of this module"
                          rows={3}
                          className="transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="dark:text-white">Topics</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={() => extractTopics(moduleIndex)}
                              variant="outline"
                              size="sm"
                              disabled={extractingTopics !== null}
                              className="transition-all duration-200 dark:border-gray-700 dark:text-white"
                            >
                              {extractingTopics === moduleIndex ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Extracting...
                                </>
                              ) : (
                                <>Extract Topics</>
                              )}
                            </Button>
                            <Button
                              type="button"
                              onClick={() => addTopic(moduleIndex)}
                              variant="outline"
                              size="sm"
                              className="transition-all duration-200 dark:border-gray-700 dark:text-white"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Topic
                            </Button>
                          </div>
                        </div>

                        {!module.topics || module.topics.length === 0 ? (
                          <div className="text-center p-4 border border-dashed rounded-md text-gray-500 dark:border-gray-700 dark:text-gray-400">
                            No topics yet. Add topics manually or extract them from the module description.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {module.topics?.map((topic, topicIndex) => (
                              <div
                                key={topicIndex}
                                className="border rounded-md p-4 space-y-2 animate-in dark:border-gray-700"
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium dark:text-white">Topic {topicIndex + 1}</h4>
                                  <Button
                                    type="button"
                                    onClick={() => removeTopic(moduleIndex, topicIndex)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove Topic</span>
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <Label
                                    htmlFor={`topic-${moduleIndex}-${topicIndex}-title`}
                                    className="dark:text-white"
                                  >
                                    Title
                                  </Label>
                                  <Input
                                    id={`topic-${moduleIndex}-${topicIndex}-title`}
                                    value={topic.title || ""}
                                    onChange={(e) => updateTopic(moduleIndex, topicIndex, "title", e.target.value)}
                                    placeholder="e.g., Variables and Data Types"
                                    required
                                    className="transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label
                                    htmlFor={`topic-${moduleIndex}-${topicIndex}-description`}
                                    className="dark:text-white"
                                  >
                                    Description
                                  </Label>
                                  <Textarea
                                    id={`topic-${moduleIndex}-${topicIndex}-description`}
                                    value={topic.description || ""}
                                    onChange={(e) =>
                                      updateTopic(moduleIndex, topicIndex, "description", e.target.value)
                                    }
                                    placeholder="Describe what this topic covers"
                                    rows={2}
                                    className="transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <Card className="dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="dark:text-white">Upload Curriculum File</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Upload a text file, PDF, or image containing your curriculum content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center dark:border-gray-700"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".txt,.md,.pdf,.jpg,.jpeg,.png"
                        className="hidden"
                      />

                      {uploadedFile ? (
                        <div className="space-y-4">
                          {filePreview ? (
                            <div className="flex justify-center">
                              <img
                                src={filePreview || "/placeholder.svg"}
                                alt="Preview"
                                className="max-h-48 rounded-md object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              {uploadedFile.type.startsWith("image/") ? (
                                <ImageIcon className="h-10 w-10 text-blue-500" />
                              ) : uploadedFile.type === "application/pdf" ? (
                                <FileText className="h-10 w-10 text-red-500" />
                              ) : (
                                <FileText className="h-10 w-10 text-blue-500" />
                              )}
                            </div>
                          )}
                          <div>
                            <p className="font-medium dark:text-white">{uploadedFile.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {(uploadedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            size="sm"
                            className="transition-all duration-200 dark:border-gray-700 dark:text-white"
                          >
                            Change File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center">
                            <Upload className="h-10 w-10 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Drag and drop your curriculum file here, or click to browse
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Supported formats: .txt, .md, .pdf, .jpg, .jpeg, .png
                          </p>
                          <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="transition-all duration-200 dark:border-gray-700 dark:text-white"
                          >
                            Browse Files
                          </Button>
                        </div>
                      )}
                    </div>

                    {uploadError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start dark:bg-red-900/20 dark:border-red-800">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-400">{uploadError}</p>
                      </div>
                    )}

                    {uploadedFile && (
                      <div className="space-y-4">
                        {(uploadedFile.type.startsWith("image/") || uploadedFile.type === "application/pdf") && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start dark:bg-blue-900/20 dark:border-blue-800">
                            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                              For PDFs and images, please ensure you've provided a detailed title and description above
                              to help with topic extraction.
                            </p>
                          </div>
                        )}

                        <Button
                          type="button"
                          onClick={processUploadedFile}
                          disabled={processingFile}
                          className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200 dark:bg-blue-700 dark:hover:bg-blue-800"
                        >
                          {processingFile ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Process Curriculum File"
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Curriculum"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

