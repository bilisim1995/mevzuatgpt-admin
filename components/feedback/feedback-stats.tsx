"use client"

import { useState, useEffect } from "react"
import { ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, BarChart3 } from "lucide-react"
import { getFeedbackStats } from "@/lib/feedback"
import { FeedbackStats } from "@/types/feedback"
import { cn } from "@/lib/utils"

export function FeedbackStatsComponent() {
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await getFeedbackStats()
      setStats(data)
    } catch (error) {
      console.error('Feedback istatistikleri yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30 animate-pulse">
            <div className="h-12 w-12 bg-gray-300/20 rounded-xl mb-4"></div>
            <div className="h-8 bg-gray-300/20 rounded mb-2"></div>
            <div className="h-4 bg-gray-300/20 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: "Toplam Feedback",
      value: stats.total_feedback,
      icon: MessageSquare,
      gradient: "from-blue-500/20 to-blue-600/20",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Beğeni",
      value: stats.like_feedback,
      percentage: stats.like_percentage,
      icon: ThumbsUp,
      gradient: "from-green-500/20 to-green-600/20",
      textColor: "text-green-600 dark:text-green-400"
    },
    {
      title: "Beğenmeme",
      value: stats.dislike_feedback,
      percentage: stats.dislike_percentage,
      icon: ThumbsDown,
      gradient: "from-red-500/20 to-red-600/20",
      textColor: "text-red-600 dark:text-red-400"
    }
  ]

  return (
    <div className="space-y-6 mb-8">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div 
              key={index}
              className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  {stat.percentage !== undefined && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">%{stat.percentage.toFixed(1)}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}