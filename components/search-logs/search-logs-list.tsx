"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Eye, RefreshCw, User, Clock, Target, Award, RotateCcw, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getSearchLogs } from "@/lib/search-logs"
import { SearchLog, SearchLogFilters } from "@/types/search-logs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function SearchLogsList() {
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<SearchLog | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadSearchLogs = useCallback(async (pageNum: number = 1, resetList: boolean = true) => {
    try {
      if (resetList) setLoading(true)
      
      const filters: SearchLogFilters = {
        page: pageNum,
        limit: 50,
      }

      const response = await getSearchLogs(filters)
      
      if (resetList) {
        setSearchLogs(response.search_logs)
      } else {
        setSearchLogs(prev => [...prev, ...response.search_logs])
      }
      
      setTotalCount(response.total_count)
      setHasMore(response.has_more)
      setPage(pageNum)
    } catch (error) {
      console.error('Arama kayıtları yüklenirken hata:', error)
      toast.error('Arama kayıtları yüklenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
      setSearchLogs([])
      setTotalCount(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadSearchLogs(1, true)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [loadSearchLogs])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSearchLogs(1, true)
    setRefreshing(false)
  }

  const handleViewDetails = (log: SearchLog) => {
    setSelectedLog(log)
    setDetailsModalOpen(true)
  }

  const getReliabilityBadge = (score: number) => {
    if (score >= 0.8) {
      return (
        <Badge className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          Yüksek ({(score * 100).toFixed(0)}%)
        </Badge>
      )
    } else if (score >= 0.6) {
      return (
        <Badge className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          Orta ({(score * 100).toFixed(0)}%)
        </Badge>
      )
    } else {
      return (
        <Badge className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
          Düşük ({(score * 100).toFixed(0)}%)
        </Badge>
      )
    }
  }

  const getResultsBadge = (count: number) => {
    if (count === 0) {
      return (
        <Badge variant="outline" className="px-2 py-1 text-xs font-medium rounded-full text-red-600 dark:text-red-400">
          Sonuç Yok
        </Badge>
      )
    } else if (count <= 2) {
      return (
        <Badge variant="outline" className="px-2 py-1 text-xs font-medium rounded-full text-yellow-600 dark:text-yellow-400">
          {count} Sonuç
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="px-2 py-1 text-xs font-medium rounded-full text-green-600 dark:text-green-400">
          {count} Sonuç
        </Badge>
      )
    }
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

  const filteredLogs = searchLogs.filter(log =>
    log.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.response.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Arama Kayıtları</h2>
                <p className="text-gray-600 dark:text-gray-400">Kullanıcı sorularını ve sistem performansını takip edin</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Soru, kullanıcı veya cevap ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>

            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="h-10 px-4 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl hover:bg-white/70 dark:hover:bg-black/50 transition-all duration-300"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Search Logs Table */}
          {loading && searchLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Arama Kayıtları Yükleniyor</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen bekleyiniz...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Henüz arama kaydı bulunmamaktadır</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Soru & Kullanıcı
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sonuç
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Performans
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Güvenilirlik
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tarih
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-200/10 dark:border-gray-700/10 hover:bg-white/5 dark:hover:bg-black/10 transition-colors">
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Search className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                              {log.query}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-6">
                            <User className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {log.user_name} ({log.user_email})
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {getResultsBadge(log.results_count)}
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Award className="w-3 h-3" />
                            {log.credits_used} kredi
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className={cn(
                            "font-medium",
                            log.execution_time > 3 ? "text-red-600 dark:text-red-400" :
                            log.execution_time > 2 ? "text-yellow-600 dark:text-yellow-400" :
                            "text-green-600 dark:text-green-400"
                          )}>
                            {log.execution_time.toFixed(2)}s
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getReliabilityBadge(log.reliability_score)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(log)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <Button
                onClick={() => loadSearchLogs(page + 1, false)}
                disabled={loading}
                variant="outline"
                className="bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl hover:bg-white/70 dark:hover:bg-black/50 transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-gray-800 dark:border-t-gray-200"></div>
                    Yükleniyor...
                  </div>
                ) : (
                  'Daha Fazla Yükle'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Arama Detayları
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Kullanıcı</h4>
                  <p className="text-blue-700 dark:text-blue-300">{selectedLog.user_name}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{selectedLog.user_email}</p>
                </div>
                <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">IP Adresi</h4>
                  <p className="text-green-700 dark:text-green-300">{selectedLog.ip_address}</p>
                </div>
                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Sonuç Sayısı</h4>
                  {getResultsBadge(selectedLog.results_count)}
                </div>
                <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Tarih</h4>
                  <p className="text-orange-700 dark:text-orange-300">{formatDate(selectedLog.created_at)}</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Kullanıcı Sorusu
                </h4>
                <p className="text-gray-700 dark:text-gray-300">{selectedLog.query}</p>
              </div>
              
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl">
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Sistem Cevabı</h4>
                <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap text-sm">
                    {selectedLog.response}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-xl">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Çalışma Süresi
                  </h4>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {selectedLog.execution_time.toFixed(2)}s
                  </p>
                </div>
                <div className="p-4 bg-pink-50/50 dark:bg-pink-900/20 rounded-xl">
                  <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Kullanılan Kredi
                  </h4>
                  <p className="text-2xl font-bold text-pink-700 dark:text-pink-300">
                    {selectedLog.credits_used}
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl">
                <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Güvenilirlik Skoru
                </h4>
                <div className="flex items-center gap-4">
                  {getReliabilityBadge(selectedLog.reliability_score)}
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${selectedLog.reliability_score * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}