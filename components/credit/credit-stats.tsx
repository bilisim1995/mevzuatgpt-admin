"use client"

import { useState, useEffect } from "react"
import { CreditCard, TrendingUp, TrendingDown, Gift, ShoppingCart } from "lucide-react"
import { getCreditTransactionStats } from "@/lib/credit"
import { CreditTransactionStats } from "@/types/credit"
import { cn } from "@/lib/utils"

export function CreditStats() {
  const [stats, setStats] = useState<CreditTransactionStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await getCreditTransactionStats()
      setStats(data)
    } catch (error) {
      console.error('Kredi istatistikleri yüklenirken hata:', error)
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
      title: "Toplam İşlem",
      value: stats.total_transactions,
      icon: CreditCard,
      gradient: "from-blue-500/20 to-blue-600/20",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Satın Alınan",
      value: `+${stats.total_credits_purchased}`,
      count: stats.by_type.purchase.count,
      icon: ShoppingCart,
      gradient: "from-green-500/20 to-green-600/20",
      textColor: "text-green-600 dark:text-green-400"
    },
    {
      title: "Kullanılan",
      value: `-${stats.total_credits_used}`,
      count: stats.by_type.usage.count,
      icon: TrendingDown,
      gradient: "from-red-500/20 to-red-600/20",
      textColor: "text-red-600 dark:text-red-400"
    },
    {
      title: "Bonus Verilen",
      value: `+${stats.total_credits_bonus}`,
      count: stats.by_type.bonus.count,
      icon: Gift,
      gradient: "from-purple-500/20 to-purple-600/20",
      textColor: "text-purple-600 dark:text-purple-400"
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
                  {stat.count !== undefined && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.count} işlem</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
            </div>
          )
        })}
      </div>

      {/* Transaction Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Types */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            İşlem Tipleri
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Satın Alma</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-900 dark:text-white">{stats.by_type.purchase.count}</span>
                <span className="text-xs text-green-600 dark:text-green-400 ml-2">+{stats.by_type.purchase.total_amount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Kullanım</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-900 dark:text-white">{stats.by_type.usage.count}</span>
                <span className="text-xs text-red-600 dark:text-red-400 ml-2">{stats.by_type.usage.total_amount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">İade</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-900 dark:text-white">{stats.by_type.refund.count}</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">+{stats.by_type.refund.total_amount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Bonus</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-900 dark:text-white">{stats.by_type.bonus.count}</span>
                <span className="text-xs text-purple-600 dark:text-purple-400 ml-2">+{stats.by_type.bonus.total_amount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Flow Summary */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Kredi Akışı
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
              <span className="text-sm font-medium text-green-900 dark:text-green-100">Toplam Gelen</span>
              <span className="font-bold text-green-700 dark:text-green-300">
                +{stats.total_credits_purchased + stats.total_credits_bonus + stats.total_credits_refunded}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
              <span className="text-sm font-medium text-red-900 dark:text-red-100">Toplam Giden</span>
              <span className="font-bold text-red-700 dark:text-red-300">
                -{stats.total_credits_used}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Net Değişim</span>
              <span className="font-bold text-blue-700 dark:text-blue-300">
                +{stats.total_credits_purchased + stats.total_credits_bonus + stats.total_credits_refunded - stats.total_credits_used}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}