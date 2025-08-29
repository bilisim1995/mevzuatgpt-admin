"use client"

import { useState, useEffect } from "react"
import { Search, Users, Clock, Target, TrendingUp, Award, CheckCircle, XCircle } from "lucide-react"
import { getSearchLogStats } from "@/lib/search-logs"
import { SearchLogStats } from "@/types/search-logs"
import { cn } from "@/lib/utils"

export function SearchLogsStats() {
  const [stats, setStats] = useState<SearchLogStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await getSearchLogStats()
      setStats(data)
    } catch (error) {
      console.error('Arama istatistikleri yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30 animate-pulse">
              <div className="h-12 w-12 bg-gray-300/20 rounded-xl mb-4"></div>
              <div className="h-8 bg-gray-300/20 rounded mb-2"></div>
              <div className="h-4 bg-gray-300/20 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: "Toplam Arama",
      value: stats.total_searches,
      icon: Search,
      gradient: "from-blue-500/20 to-blue-600/20",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Aktif Kullanıcı",
      value: stats.total_users,
      icon: Users,
      gradient: "from-green-500/20 to-green-600/20",
      textColor: "text-green-600 dark:text-green-400"
    },
    {
      title: "Bugün Arama",
      value: stats.today_searches,
      icon: TrendingUp,
      gradient: "from-purple-500/20 to-purple-600/20",
      textColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Başarı Oranı",
      value: `%${((stats.successful_searches / stats.total_searches) * 100).toFixed(1)}`,
      icon: Target,
      gradient: "from-orange-500/20 to-orange-600/20",
      textColor: "text-orange-600 dark:text-orange-400"
    }
  ]

  const performanceCards = [
    {
      title: "Ortalama Süre",
      value: `${stats.avg_execution_time.toFixed(2)}s`,
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Ortalama Sonuç",
      value: stats.avg_results_count.toFixed(1),
      icon: Search,
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "Ortalama Kredi",
      value: stats.avg_credits_used.toFixed(1),
      icon: Award,
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Güvenilirlik",
      value: `%${(stats.avg_reliability_score * 100).toFixed(1)}`,
      icon: Target,
      color: "text-orange-600 dark:text-orange-400"
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
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
            </div>
          )
        })}
      </div>

      {/* Performance and Popular Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Performans Metrikleri
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {performanceCards.map((metric, index) => {
              const Icon = metric.icon
              return (
                <div key={index} className="text-center p-3 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${metric.color}`} />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{metric.value}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{metric.title}</p>
                </div>
              )
            })}
          </div>
          
          {/* Success Rate Breakdown */}
          <div className="mt-4 pt-4 border-t border-gray-200/20 dark:border-gray-700/20">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Başarı Analizi
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">Başarılı</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">{stats.successful_searches}</span>
                  <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                    %{((stats.successful_searches / stats.total_searches) * 100).toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-900 dark:text-red-100">Başarısız</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-red-700 dark:text-red-300">{stats.failed_searches}</span>
                  <span className="text-xs text-red-600 dark:text-red-400 ml-2">
                    %{((stats.failed_searches / stats.total_searches) * 100).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Queries */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Popüler Sorular
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stats.top_queries.map((query, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                    {query.query}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {query.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}