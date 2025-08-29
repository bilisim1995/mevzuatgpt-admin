"use client"

import { useState, useEffect } from "react"
import { BarChart3, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react"
import { getSupportTicketStats } from "@/lib/support"
import { SupportTicketStats } from "@/types/support"
import { cn } from "@/lib/utils"

export function SupportStats() {
  const [stats, setStats] = useState<SupportTicketStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await getSupportTicketStats()
      setStats(data)
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error)
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
      title: "Toplam Ticket",
      value: stats.total_tickets,
      icon: MessageSquare,
      gradient: "from-blue-500/20 to-blue-600/20",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Açık Ticketlar",
      value: stats.open_tickets,
      icon: XCircle,
      gradient: "from-red-500/20 to-red-600/20",
      textColor: "text-red-600 dark:text-red-400"
    },
    {
      title: "Yanıtlanan",
      value: stats.answered_tickets,
      icon: MessageSquare,
      gradient: "from-yellow-500/20 to-yellow-600/20",
      textColor: "text-yellow-600 dark:text-yellow-400"
    },
    {
      title: "Kapalı Ticketlar",
      value: stats.closed_tickets,
      icon: CheckCircle,
      gradient: "from-green-500/20 to-green-600/20",
      textColor: "text-green-600 dark:text-green-400"
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Category and Priority Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Stats */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Kategoriye Göre Dağılım
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.by_category).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {category === 'technical' ? 'Teknik' :
                   category === 'billing' ? 'Faturalandırma' :
                   category === 'general' ? 'Genel' :
                   category === 'feature_request' ? 'Özellik Talebi' :
                   category === 'bug_report' ? 'Hata Bildirimi' :
                   category === 'account' ? 'Hesap' : category}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Stats */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Önceliğe Göre Dağılım
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.by_priority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <span className={cn(
                  "text-sm font-medium capitalize",
                  priority === 'urgent' ? 'text-red-600 dark:text-red-400' :
                  priority === 'high' ? 'text-orange-600 dark:text-orange-400' :
                  priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                )}>
                  {priority === 'low' ? 'Düşük' :
                   priority === 'medium' ? 'Orta' :
                   priority === 'high' ? 'Yüksek' :
                   priority === 'urgent' ? 'Acil' : priority}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ortalama Yanıt Süresi</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.avg_response_time}h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}