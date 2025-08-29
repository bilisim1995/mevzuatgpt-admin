"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Eye, RefreshCw, CreditCard, User, Clock, TrendingUp, TrendingDown, ShoppingCart, Gift, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCreditTransactions, getUserCreditTransactions } from "@/lib/credit"
import { CreditTransaction, CreditTransactionFilters } from "@/types/credit"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function CreditList() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<CreditTransactionFilters['transaction_type'] | ''>('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<CreditTransaction | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const handleTypeFilterChange = (value: "" | "purchase" | "usage" | "refund" | "bonus" | "all-types") => {
    setTypeFilter(value === 'all-types' ? '' : value)
  }

  const loadTransactions = useCallback(async (pageNum: number = 1, resetList: boolean = true) => {
    try {
      if (resetList) setLoading(true)
      
      const filters: CreditTransactionFilters = {
        page: pageNum,
        limit: 50,
        transaction_type: typeFilter === '' ? undefined : typeFilter,
      }

      const response = await getCreditTransactions(filters)
      
      if (resetList) {
        setTransactions(response.transactions)
      } else {
        setTransactions(prev => [...prev, ...response.transactions])
      }
      
      setTotalCount(response.total_count)
      setHasMore(response.has_more)
      setPage(pageNum)
    } catch (error) {
      console.error('Kredi işlemleri yüklenirken hata:', error)
      toast.error('Kredi işlemleri yüklenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
      setTransactions([])
      setTotalCount(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTransactions(1, true)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [loadTransactions])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTransactions(1, true)
    setRefreshing(false)
  }

  const handleViewDetails = (transaction: CreditTransaction) => {
    setSelectedTransaction(transaction)
    setDetailsModalOpen(true)
  }

  const getTransactionTypeBadge = (type: string) => {
    const config = {
      purchase: { 
        label: 'Satın Alma', 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', 
        icon: ShoppingCart 
      },
      usage: { 
        label: 'Kullanım', 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', 
        icon: TrendingDown 
      },
      refund: { 
        label: 'İade', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', 
        icon: TrendingUp 
      },
      bonus: { 
        label: 'Bonus', 
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400', 
        icon: Gift 
      }
    }
    
    const typeConfig = config[type as keyof typeof config] || config.usage
    const Icon = typeConfig.icon
    
    return (
      <Badge className={cn('px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1', typeConfig.className)}>
        <Icon className="w-3 h-3" />
        {typeConfig.label}
      </Badge>
    )
  }

  const getAmountDisplay = (amount: number, type: string) => {
    const isPositive = amount > 0
    const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    
    return (
      <span className={cn('font-semibold', color)}>
        {amount > 0 ? '+' : ''}{amount}
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

  const filteredTransactions = transactions.filter(transaction =>
    transaction.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-600/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kredi Hareketleri</h2>
                <p className="text-gray-600 dark:text-gray-400">Tüm kredi işlemlerini takip edin</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Kullanıcı veya açıklama ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>
            
            <Select value={typeFilter || 'all-types'} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                <SelectValue placeholder="Tüm Tipler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">Tüm Tipler</SelectItem>
                <SelectItem value="purchase">Satın Alma</SelectItem>
                <SelectItem value="usage">Kullanım</SelectItem>
                <SelectItem value="refund">İade</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="h-10 px-4 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl hover:bg-white/70 dark:hover:bg-black/50 transition-all duration-300"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Transactions Table */}
          {loading && transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-green-600 dark:border-t-green-400 mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Kredi İşlemleri Yükleniyor</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen bekleyiniz...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Henüz kredi işlemi bulunmamaktadır</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Kullanıcı
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      İşlem Tipi
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Miktar
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Açıklama
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
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-200/10 dark:border-gray-700/10 hover:bg-white/5 dark:hover:bg-black/10 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {transaction.user_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {transaction.user_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getTransactionTypeBadge(transaction.transaction_type)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-lg font-bold">
                          {getAmountDisplay(transaction.amount, transaction.transaction_type)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 max-w-xs">
                          {transaction.description}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(transaction.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(transaction)}
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
                onClick={() => loadTransactions(page + 1, false)}
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
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Kredi İşlem Detayları
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Kullanıcı</h4>
                  <p className="text-blue-700 dark:text-blue-300">{selectedTransaction.user_name}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{selectedTransaction.user_email}</p>
                </div>
                <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">İşlem Tipi</h4>
                  {getTransactionTypeBadge(selectedTransaction.transaction_type)}
                </div>
                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Miktar</h4>
                  <div className="text-2xl font-bold">
                    {getAmountDisplay(selectedTransaction.amount, selectedTransaction.transaction_type)}
                  </div>
                </div>
                <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Tarih</h4>
                  <p className="text-orange-700 dark:text-orange-300">{formatDate(selectedTransaction.created_at)}</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Açıklama</h4>
                <p className="text-gray-700 dark:text-gray-300">{selectedTransaction.description}</p>
              </div>
              
              {selectedTransaction.search_log_id && (
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Arama Log ID</h4>
                  <p className="text-xs font-mono text-indigo-700 dark:text-indigo-300 break-all">
                    {selectedTransaction.search_log_id}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}