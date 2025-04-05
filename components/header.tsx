"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/components/ui/use-toast"
import { Menu, Bell, HelpCircle, Plus, Settings, LogOut, User, Home, BookOpen, Users, FileText } from "lucide-react"

export function Header() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { toast } = useToast()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const showHelpInfo = () => {
    router.push("/about")
  }

  // Navigation links based on user role
  const navLinks =
    user?.role === "teacher"
      ? [
          { href: "/teacher", label: "Dashboard", icon: Home },
          { href: "/teacher/curriculum", label: "Curriculums", icon: BookOpen },
          { href: "/teacher/students", label: "Students", icon: Users },
        ]
      : [
          { href: "/student", label: "Dashboard", icon: Home },
          { href: "/student/assignments", label: "Assignments", icon: BookOpen },
        ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden transition-all duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link href={user?.role === "teacher" ? "/teacher" : "/student"} className="flex items-center gap-2">
            <Image
              src="https://i.postimg.cc/qqSmDPdd/Chat-GPT-Image-Apr-5-2025-12-19-54-AM-1.png"
              alt="GyaanMitra Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-lg font-semibold text-classroom-blue dark:text-blue-400 hidden md:inline-block">
              GyaanMitra
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex ml-8 gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`)
            const Icon = link.icon

            return (
              <Button
                key={link.href}
                variant="ghost"
                asChild
                className={`transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-classroom-blue dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <Link href={link.href} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            )
          })}
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-md md:hidden z-50">
            <div className="flex flex-col p-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`)
                const Icon = link.icon

                return (
                  <Button
                    key={link.href}
                    variant="ghost"
                    asChild
                    className={`justify-start transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-classroom-blue dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href={link.href} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {user?.role === "teacher" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <Plus className="h-5 w-5" />
                  <span className="sr-only">Create</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-gray-900 dark:border-gray-800">
                <DropdownMenuItem asChild>
                  <Link href="/teacher/curriculum/new" className="cursor-pointer">
                    <BookOpen className="mr-2 h-4 w-4" />
                    New Curriculum
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/teacher/quiz/new" className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    New Quiz
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-all duration-200"
            onClick={showHelpInfo}
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-all duration-200"
            onClick={() => {
              toast({
                title: "Notifications",
                description: "You have no new notifications at this time.",
                duration: 3000,
              })
            }}
          >
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Visible Logout Button */}
          <Button variant="outline" size="sm" onClick={handleSignOut} className="mr-2 hidden md:flex">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-gray-200 dark:hover:ring-gray-700"
              >
                {user?.profileImage ? (
                  <Image
                    src={user.profileImage || "/placeholder.svg?height=32&width=32"}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 font-medium">
                    {user?.name ? getInitials(user.name) : "U"}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 dark:bg-gray-900 dark:border-gray-800">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium dark:text-white">{user?.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

