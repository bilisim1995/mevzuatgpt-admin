"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, Loader2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginUser } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { MESSAGES } from "@/constants/messages"
import { Turnstile } from "@marsidev/react-turnstile"

interface LoginFormProps {
  className?: string
}

export function LoginForm({ className }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileError, setTurnstileError] = useState("")
  const turnstileRef = useRef<any>(null)
  const router = useRouter()

  const handleTurnstileSuccess = (token: string) => {
    setTurnstileToken(token)
    setTurnstileError("")
  }

  const handleTurnstileError = () => {
    setTurnstileToken(null)
    setTurnstileError("Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin.")
  }

  const handleTurnstileExpired = () => {
    setTurnstileToken(null)
    setTurnstileError("Güvenlik doğrulaması süresi doldu. Lütfen tekrar deneyin.")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setTurnstileError("")

    // Turnstile token kontrolü
    if (!turnstileToken) {
      setTurnstileError("Lütfen güvenlik doğrulamasını tamamlayın.")
      setIsLoading(false)
      return
    }

    try {
      await loginUser({ email, password, turnstileToken })
      router.push("/admin/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : MESSAGES.AUTH.LOGIN_FAILED)
      // Hata durumunda Turnstile'ı resetle
      if (turnstileRef.current) {
        turnstileRef.current.reset()
      }
      setTurnstileToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("w-full max-w-md", className)}>
      {/* Glassmorphism Container */}
      <div className="relative bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/20 dark:border-gray-800/30">
        {/* Neumorphism Inner Container */}
        <div className="bg-gradient-to-br from-white/5 to-gray-50/10 dark:from-black/5 dark:to-gray-900/10 rounded-2xl p-6 shadow-inner">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
              {MESSAGES.AUTH.LOGIN_TITLE}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {MESSAGES.AUTH.LOGIN_SUBTITLE}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label 
                htmlFor="email" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                {MESSAGES.AUTH.EMAIL_LABEL}
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder={MESSAGES.AUTH.EMAIL_PLACEHOLDER}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl shadow-inner focus:bg-white/70 dark:focus:bg-black/50 transition-all duration-300 pl-4"
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label 
                htmlFor="password" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {MESSAGES.AUTH.PASSWORD_LABEL}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={MESSAGES.AUTH.PASSWORD_PLACEHOLDER}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl shadow-inner focus:bg-white/70 dark:focus:bg-black/50 transition-all duration-300 pl-4 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute inset-y-0 right-0 h-full w-12 flex items-center justify-center hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {/* Cloudflare Turnstile */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Güvenlik Doğrulaması
              </Label>
              <div className="flex justify-center">
                <Turnstile
                  ref={turnstileRef}
                  siteKey="0x4AAAAAAB3TQTCwwiPkpkO7"
                  onSuccess={handleTurnstileSuccess}
                  onError={handleTurnstileError}
                  onExpire={handleTurnstileExpired}
                  options={{
                    theme: 'light',
                    size: 'normal'
                  }}
                />
              </div>
              {turnstileError && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                  {turnstileError}
                </p>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 backdrop-blur-sm">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-800/30 flex items-center justify-center">
                    <span className="text-red-600 dark:text-red-400 text-sm font-bold">!</span>
                  </div>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">
                  {error.includes('yetkiniz') ? MESSAGES.AUTH.ACCESS_DENIED : 'Hata'}
                </p>
                <p className="text-xs text-red-500 dark:text-red-300 text-center mt-1">
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !turnstileToken}
              className="w-full h-12 bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-800 dark:from-white dark:to-gray-200 dark:hover:from-gray-100 dark:hover:to-gray-300 text-white dark:text-black rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {MESSAGES.AUTH.LOGGING_IN}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {MESSAGES.AUTH.LOGIN_BUTTON}
                </div>
              )}
            </Button>
          </form>

        </div>
      </div>
    </div>
  )
}