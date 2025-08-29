"use client"

import { User, LogOut, Mail, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { MESSAGES } from "@/constants/messages"

export function ProfileDropdown() {
  const { user, logout } = useAuth()

  const getInitials = (fullName: string) => {
    if (!fullName) return 'TK' // Test Kullanıcı
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Test verileri veya gerçek kullanıcı verileri
  const displayName = user?.full_name || 'Test Kullanıcı'
  const displayEmail = user?.email || 'test@mevzuatgpt.org'
  const displayRole = user?.role === 'admin' ? 'Yönetici' : (user?.role || 'admin')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-12 w-12 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md border border-gray-200/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-black/30 transition-all duration-300"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-gray-800 to-black dark:from-white dark:to-gray-200 text-white dark:text-black font-semibold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl rounded-2xl p-2" 
        align="end"
      >
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-gray-800 to-black dark:from-white dark:to-gray-200 text-white dark:text-black font-semibold text-lg">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {displayName}
                </p>
                <div className="flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {displayRole}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200/30 dark:border-gray-700/30">
              <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {displayEmail}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200/30 dark:bg-gray-700/30" />
        <DropdownMenuItem 
          onClick={logout}
          className="cursor-pointer p-3 rounded-xl hover:bg-red-50/50 dark:hover:bg-red-900/20 focus:bg-red-50/50 dark:focus:bg-red-900/20 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 mr-3 text-red-600 dark:text-red-400" />
          <span className="text-red-600 dark:text-red-400 font-medium">
            {MESSAGES.AUTH.LOGOUT}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}