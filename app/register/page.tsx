"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createTeacher, createStudent, getAllTeachers } from "@/lib/firebase-service"
import { Loader2 } from "lucide-react"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"teacher" | "student">("teacher")
  const [teacherId, setTeacherId] = useState("")
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch teachers when role is student
  const fetchTeachers = async () => {
    if (role === "student") {
      setLoadingTeachers(true)
      try {
        const fetchedTeachers = await getAllTeachers()
        setTeachers(
          fetchedTeachers.map((teacher) => ({
            id: teacher.id,
            name: teacher.name,
          })),
        )
      } catch (error) {
        console.error("Error fetching teachers:", error)
        toast({
          title: "Error",
          description: "Failed to load teachers. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoadingTeachers(false)
      }
    }
  }

  useEffect(() => {
    if (role === "student") {
      fetchTeachers()
    }
  }, [role])

  const handleRoleChange = (newRole: string) => {
    setRole(newRole as "teacher" | "student")
    if (newRole === "student") {
      fetchTeachers()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name.",
        variant: "destructive",
      })
      return
    }

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email.",
        variant: "destructive",
      })
      return
    }

    if (role === "student" && !teacherId) {
      toast({
        title: "Teacher required",
        description: "Please select a teacher.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (role === "teacher") {
        await createTeacher({
          name,
          email,
        })
      } else {
        await createStudent({
          name,
          email,
          teacher: teacherId,
        })
      }

      toast({
        title: "Registration successful",
        description: "Your account has been created. You can now log in.",
      })

      router.push("/login")
    } catch (error) {
      console.error("Error registering:", error)
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <Image
              src="/placeholder.svg?height=40&width=40"
              alt="GyaanMitra Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <h1 className="text-2xl font-bold text-blue-600">GyaanMitra</h1>
          </div>
        </div>

        <Card className="border-0 shadow-lg animate-in">
          <CardHeader>
            <CardTitle className="text-xl text-center">Create an account</CardTitle>
            <CardDescription className="text-center">Register to use GyaanMitra Quiz Platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="teacher" className="w-full" onValueChange={handleRoleChange}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="teacher">Teacher</TabsTrigger>
                <TabsTrigger value="student">Student</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="transition-all duration-200"
                  />
                </div>

                {role === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="teacher">Select Teacher</Label>
                    {teachers.length > 0 ? (
                      <Select value={teacherId} onValueChange={setTeacherId}>
                        <SelectTrigger id="teacher" className="transition-all duration-200">
                          <SelectValue placeholder={loadingTeachers ? "Loading teachers..." : "Select a teacher"} />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-4 border rounded-md text-center">
                        <p className="text-sm text-gray-500">
                          {loadingTeachers ? (
                            <span className="flex items-center justify-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading teachers...
                            </span>
                          ) : (
                            <>
                              No teachers available. Please ask a teacher to register first or{" "}
                              <Button
                                variant="link"
                                className="p-0 h-auto text-blue-600"
                                onClick={() => setRole("teacher")}
                              >
                                register as a teacher
                              </Button>
                              .
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                  disabled={loading || (role === "student" && teachers.length === 0 && !loadingTeachers)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
              </form>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

