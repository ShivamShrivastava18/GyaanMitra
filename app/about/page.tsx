"use client"
import Image from "next/image"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Code, Lightbulb } from "lucide-react"

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Aditi Singh",
      role: "Team Lead, Expert",
      image: "https://i.postimg.cc/KjxckHWx/Frame-1.png",
    },
    {
      name: "Paavas Goyal",
      role: "Developer, Designer",
      image: "https://i.postimg.cc/C57hj4yD/Frame-2.png",
    },
    {
      name: "Shivam Shrivastava",
      role: "Developer, AI Expert",
      image: "https://i.postimg.cc/PqXPvBsK/Screenshot-2025-04-04-22-36-27-603-com-linkedin-android.png",
    },
    {
      name: "Nitya Santosh",
      role: "Developer, Designer",
      image: "https://i.postimg.cc/pV4hcGzX/Screenshot-2025-04-04-22-36-47-264-com-linkedin-android.png",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center dark:text-white">About GyaanMitra</h1>

          <div className="mb-12 text-center">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              GyaanMitra is an AI-powered quiz generation platform designed to help teachers create personalized quizzes
              from any curriculum content.
            </p>
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 shadow-md">
                <img
                  src="https://i.postimg.cc/qqSmDPdd/Chat-GPT-Image-Apr-5-2025-12-19-54-AM-1.png"
                  alt="GyaanMitra Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                    <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 dark:text-white">Our Mission</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      To revolutionize education by leveraging AI to create personalized learning experiences that adapt
                      to each student's needs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full mr-4">
                    <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 dark:text-white">What We Do</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      We help teachers extract topics from curriculum content and automatically generate quizzes in
                      multiple languages to assess student understanding.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">Our Team</h2>
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {teamMembers.map((member, index) => (
              <Card key={index} className="dark:border-gray-800">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 shadow-md mb-4">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold mb-1 dark:text-white">{member.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="dark:border-gray-800 mb-12">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full mr-4">
                  <Code className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">Technology</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    GyaanMitra is built using cutting-edge technologies:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Next.js for the frontend and API routes</li>
                    <li>Google's Gemini AI for topic extraction and quiz generation</li>
                    <li>Firebase for authentication and database</li>
                    <li>Tailwind CSS and shadcn/ui for the user interface</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Have questions or feedback? We'd love to hear from you!
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Contact us at <span className="text-blue-600 dark:text-blue-400">support@gyaanmitra.com</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

