"use client"

import { LoginForm } from "@/components/auth/login-form"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { MESSAGES } from "@/constants/messages"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-gray-400/10 to-gray-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-gray-500/10 to-gray-700/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-gray-300/5 to-gray-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Login Form */}
      <div className="relative z-10">
        <LoginForm />
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {MESSAGES.COMMON.COPYRIGHT}
        </p>
      </div>
    </div>
  )
}