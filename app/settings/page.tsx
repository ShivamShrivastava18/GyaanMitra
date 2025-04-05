"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"
import { Moon, Sun, Globe, Loader2 } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    quiz: true,
    curriculum: false,
  })

  const handleSave = async () => {
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      })
      setLoading(false)
    }, 1000)
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 dark:text-white">Settings</h1>

          <Tabs defaultValue="appearance">
            <TabsList className="grid w-full grid-cols-3 mb-6 dark:bg-gray-800">
              <TabsTrigger
                value="appearance"
                className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                Appearance
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                Privacy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-4">
              <Card className="dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="dark:text-white">Appearance</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Customize how GyaanMitra looks for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-white">Theme</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Select your preferred theme</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("light")}
                        className="transition-all duration-200"
                      >
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("dark")}
                        className="transition-all duration-200"
                      >
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("system")}
                        className="transition-all duration-200"
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        System
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card className="dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="dark:text-white">Notification Settings</CardTitle>
                  <CardDescription className="dark:text-gray-400">Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-white">Email Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive email notifications about important updates
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-white">Quiz Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Get notified when new quizzes are assigned to you
                      </p>
                    </div>
                    <Switch
                      checked={notifications.quiz}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, quiz: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-white">Curriculum Updates</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about curriculum changes</p>
                    </div>
                    <Switch
                      checked={notifications.curriculum}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, curriculum: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <Card className="dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="dark:text-white">Privacy Settings</CardTitle>
                  <CardDescription className="dark:text-gray-400">Manage your privacy preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-white">Data Collection</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Allow us to collect usage data to improve your experience
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-white">Profile Visibility</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Make your profile visible to other users
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

