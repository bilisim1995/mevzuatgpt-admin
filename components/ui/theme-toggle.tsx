"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="h-10 w-10 rounded-xl bg-white/20 dark:bg-black/30 backdrop-blur-md border-2 border-gray-300/40 dark:border-gray-600/40 hover:bg-white/30 dark:hover:bg-black/40 hover:border-gray-400/60 dark:hover:border-gray-500/60 transition-all duration-300 shadow-lg hover:shadow-xl"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500 dark:text-amber-400" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-700 dark:text-slate-300" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}