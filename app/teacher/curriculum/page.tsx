"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { getTeacherCurriculums } from "@/lib/firebase-service"
import type { Curriculum } from "@/types"
import { Plus, BookOpen, School } from "lucide-react"

export default function CurriculumsPage() {
  return (
    <ProtectedRoute allowedRole="teacher">
      <CurriculumsContent />
    </ProtectedRoute>
  )
}

function CurriculumsContent() {
  const { user } = useAuth()
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === "teacher") {
        setLoading(true)
        try {
          const fetchedCurriculums = await getTeacherCurriculums(user.id)
          setCurriculums(fetchedCurriculums)
        } catch (error) {
          console.error("Error fetching curriculums:", error)
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 space-y-6 fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold dark:text-white">Curriculums</h1>
          <Button asChild className="bg-classroom-blue hover:bg-blue-700 transition-all duration-200 ripple">
            <Link href="/teacher/curriculum/new">
              <Plus className="mr-2 h-4 w-4" />
              New Curriculum
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array(6)
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
              <Button asChild className="bg-classroom-blue hover:bg-blue-700 transition-all duration-200 ripple">
                <Link href="/teacher/curriculum/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Curriculum
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

