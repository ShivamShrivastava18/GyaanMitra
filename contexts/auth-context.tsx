"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getUserByEmail } from "@/lib/firebase-service"
import type { User } from "@/types"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Use localStorage to persist user session
const USER_STORAGE_KEY = "gyaanmitra_user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = typeof window !== "undefined" ? localStorage.getItem(USER_STORAGE_KEY) : null
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing stored user:", error)
        if (typeof window !== "undefined") {
          localStorage.removeItem(USER_STORAGE_KEY)
        }
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      // For demo purposes, we're not checking the password
      // In a real app, you would validate credentials properly
      const fetchedUser = await getUserByEmail(email)
      if (!fetchedUser) {
        throw new Error("User not found")
      }

      setUser(fetchedUser)
      // Store user in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fetchedUser))
      }
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      setUser(null)
      // Remove user from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_STORAGE_KEY)
      }
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

