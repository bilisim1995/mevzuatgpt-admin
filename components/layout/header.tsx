"use client"

import { BarChart3 } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ProfileDropdown } from "@/components/layout/profile-dropdown"
import { useAuth } from "@/hooks/use-auth"
import { MESSAGES } from "@/constants/messages"

export function Header() {
  const { user } = useAuth()

  return (
    <header className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-800/30">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-black dark:from-white dark:to-gray-200 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white dark:text-black" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {MESSAGES.DASHBOARD.TITLE}
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}