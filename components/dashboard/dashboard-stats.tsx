"use client"

import { useState, useEffect } from "react"
import { Users, FileText, Search, Activity, Clock, Target, Database, Server, TrendingUp, Calendar, BarChart3, Zap } from "lucide-react"
import { getDashboardStats } from "@/lib/dashboard"
import { DashboardStats } from "@/types/dashboard"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function DashboardStatsComponent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await getDashboardStats()
      setStats(response.data)
    } catch (error) {
      console.error('Dashboard istatistikleri yüklenirken hata:', error)
      toast.error('İstatistikler yüklenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setLoading(false)
    }
  }

  const getSystemStatusBadge = (status: string) => {
    const config = {
      healthy: { label: 'Sağlıklı', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      warning: { label: 'Uyarı', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      error: { label: 'Hata', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
    }
    
    const statusConfig = config[status as keyof typeof config] || config.error
    
    return (
      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusConfig.className)}>
        {statusConfig.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30 animate-pulse">
              <div className="h-12 w-12 bg-gray-300/20 rounded-xl mb-4"></div>
              <div className="h-8 bg-gray-300/20 rounded mb-2"></div>
              <div className="h-4 bg-gray-300/20 rounded w-2/3"></div>
            </div>
          ))}
        </div>
        
        {/* Loading Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30 animate-pulse">
              <div className="h-6 bg-gray-300/20 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-300/20 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const overviewCards = [
    {
      title: "Toplam Üyeler",
      value: stats.overview.total_users.toLocaleString(),
      icon: Users,
      gradient: "from-blue-500/20 to-blue-600/20",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Toplam Dokümanlar",
      value: stats.overview.total_documents.toLocaleString(),
      icon: FileText,
      gradient: "from-green-500/20 to-green-600/20",
      textColor: "text-green-600 dark:text-green-400"
    },
    {
      title: "Toplam Sorgular",
      value: stats.overview.total_queries.toLocaleString(),
      icon: Search,
      gradient: "from-purple-500/20 to-purple-600/20",
      textColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Aktif Kullanıcılar (30g)",
      value: stats.overview.active_users_30d.toLocaleString(),
      icon: Activity,
      gradient: "from-orange-500/20 to-orange-600/20",
      textColor: "text-orange-600 dark:text-orange-400"
    }
  ]

  const activityCards = [
    {
      title: "Son 24 Saat Sorguları",
      value: stats.activity.queries_last_24h.toLocaleString(),
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Ortalama Güvenilirlik",
      value: `%${stats.activity.avg_reliability_score.toFixed(1)}`,
      icon: Target,
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "Kredi İşlemleri",
      value: stats.activity.total_credit_transactions.toLocaleString(),
      icon: BarChart3,
      color: "text-purple-600 dark:text-purple-400"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div>
        <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Genel Bakış
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewCards.map((card, index) => {
            const Icon = card.icon
            return (
              <div 
                key={index}
                className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.textColor}`} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Stats */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Sistem Aktivitesi
          </h3>
          <div className="space-y-4">
            {activityCards.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${activity.color}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{activity.title}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{activity.value}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Sistem Durumu
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-900 dark:text-blue-100">Yanıt Süresi</span>
              </div>
              <span className="font-semibold text-blue-700 dark:text-blue-300">
                {stats.system.response_time_ms.toFixed(1)}ms
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-900 dark:text-red-100">Redis</span>
              </div>
              {getSystemStatusBadge(stats.system.redis_status)}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-yellow-900 dark:text-yellow-100">Elasticsearch</span>
              </div>
              {getSystemStatusBadge(stats.system.elasticsearch_status)}
            </div>
            
            <div className="pt-3 border-t border-gray-200/20 dark:border-gray-700/20">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                Son güncelleme: {formatDate(stats.system.timestamp)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Popüler Kategoriler
          </h3>
          <div className="space-y-3">
            {stats.content.top_categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{index + 1}</span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {category.count} doküman
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Son Dokümanlar
          </h3>
          <div className="space-y-3">
            {stats.content.recent_documents.length > 0 ? (
              stats.content.recent_documents.map((doc, index) => (
                <div key={doc.id} className="p-3 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                      {doc.title}
                    </h4>
                    <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                      {doc.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {formatDate(doc.created_at)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Henüz doküman yok</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}