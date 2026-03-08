"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { API } from "../api/api"
import { useRouter } from "next/navigation"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Load user on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await API.auth.getProfile()
        setUser(userData)
      } catch (error) {
        console.error("Failed to load user:", error)
        // If session invalid, ignore silently
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // Login function
  const login = async (credentials) => {
    const response = await API.auth.login(credentials)
    try {
      const userData = await API.auth.getProfile()
      setUser(userData)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-changed'));
      }
    } catch (_) {}
    return response
  }

  // Logout function
  const logout = () => {
    API.auth.logout()
    setUser(null)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-changed'));
    }
    router.push("/login")
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
