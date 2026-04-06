"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TrackOrderRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to trackorder
    router.replace("/trackorder")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-white">Redirecting to order tracking...</p>
      </div>
    </div>
  )
}
