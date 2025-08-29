"use client"

import { User, BarChart3, Settings } from "lucide-react"
import { MESSAGES } from "@/constants/messages"

const stats = [
  {
    title: MESSAGES.DASHBOARD.TOTAL_USERS,
    value: "1,234",
    icon: User,
    gradient: "from-gray-500/20 to-gray-700/20"
  },
  {
    title: MESSAGES.DASHBOARD.ANALYTICS,
    value: "5,678",
    icon: BarChart3,
    gradient: "from-gray-600/20 to-gray-800/20"
  },
  {
    title: MESSAGES.DASHBOARD.SYSTEM_HEALTH,
    value: "98%",
    icon: Settings,
    gradient: "from-gray-700/20 to-gray-900/20"
  }
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div 
            key={index}
            className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}