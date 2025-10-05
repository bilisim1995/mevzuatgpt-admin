'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Search, Download, RefreshCw, CreditCard, DollarSign, Calendar, User, ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Purchase, PurchaseStats } from '@/types/purchase'
import { getPurchases, getPurchaseStats } from '@/lib/purchase'

export function PurchaseList() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [stats, setStats] = useState<PurchaseStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const itemsPerPage = 10

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [purchasesData, statsData] = await Promise.all([
        getPurchases(),
        getPurchaseStats().catch(() => null)
      ])
      
      setPurchases(purchasesData.purchases || [])
      setStats(statsData)
    } catch (error) {
      console.error('Data loading error:', error);
      toast.error('Veriler yüklenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      case 'cancelled': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'Başarılı'
      case 'pending': return 'Beklemede'
      case 'failed': return 'Başarısız'
      case 'cancelled': return 'İptal'
      default: return status
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

  const formatPrice = (price: string) => {
    return `₺${parseFloat(price).toFixed(2)}`
  }

  const filteredPurchases = purchases.filter(purchase => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      (purchase.email?.toLowerCase().includes(searchLower) || false) ||
      (purchase.payment_id?.toLowerCase().includes(searchLower) || false) ||
      (purchase.conversation_id?.toLowerCase().includes(searchLower) || false) ||
      (purchase.user_ip?.toLowerCase().includes(searchLower) || false) ||
      (purchase.host_reference?.toLowerCase().includes(searchLower) || false) ||
      (purchase.fraud_status?.toLowerCase().includes(searchLower) || false) ||
      (purchase.commission_rate?.toString().toLowerCase().includes(searchLower) || false) ||
      (purchase.commission_fee?.toString().toLowerCase().includes(searchLower) || false) ||
      (purchase.user_agent?.toLowerCase().includes(searchLower) || false) ||
      (purchase.referrer?.toLowerCase().includes(searchLower) || false) ||
      (purchase.request_url?.toLowerCase().includes(searchLower) || false)
    
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage)

  const toggleRowExpansion = (purchaseId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(purchaseId)) {
        newSet.delete(purchaseId)
      } else {
        newSet.add(purchaseId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-6 w-full">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Toplam Satın Alım</p>
                  <p className="text-2xl font-bold">{stats.total_purchases}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Toplam Gelir</p>
                  <p className="text-2xl font-bold">₺{stats.total_revenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Başarı Oranı</p>
                  <p className="text-2xl font-bold">%{stats.success_rate.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Ortalama Sipariş</p>
                  <p className="text-2xl font-bold">₺{stats.average_order_value.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Satın Alımlar
            </div>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Yenile
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tüm alanlarda arama yapın (email, payment ID, IP, user agent, vb.)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Durum Filtresi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="success">Başarılı</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="failed">Başarısız</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Yükleniyor...</span>
            </div>
          ) : (
            // --- DEĞİŞİKLİK BURADA BAŞLIYOR ---
            // Bu sarmalayıcı div, hem dikey hem de yatay kaydırma sağlar.
            // overflow-auto: İçerik taştığında kaydırma çubukları ekler.
            // max-h-[600px]: Dikey kaydırmanın başlaması için bir maksimum yükseklik sınırı belirler.
            <div className="relative w-full overflow-auto max-h-[600px] border rounded-lg">
              <Table>
                 <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                   <TableRow>
                     <TableHead className="min-w-[50px] whitespace-nowrap"></TableHead>
                     <TableHead className="min-w-[200px] whitespace-nowrap">Email</TableHead>
                     <TableHead className="min-w-[100px] whitespace-nowrap">Durum</TableHead>
                     <TableHead className="min-w-[100px] whitespace-nowrap">Fiyat</TableHead>
                     <TableHead className="min-w-[80px] whitespace-nowrap">Kredi</TableHead>
                     <TableHead className="min-w-[150px] whitespace-nowrap">Payment ID</TableHead>
                     <TableHead className="min-w-[120px] whitespace-nowrap">Fraud Status</TableHead>
                     <TableHead className="min-w-[120px] whitespace-nowrap">Conversation ID</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                  {paginatedPurchases.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                         Satın alım bulunamadı
                       </TableCell>
                     </TableRow>
                  ) : (
                    paginatedPurchases.map((purchase) => (
                      <>
                        <TableRow key={purchase.id}>
                          <TableCell className="w-[50px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(purchase.id)}
                              className="p-1 h-6 w-6"
                            >
                              {expandedRows.has(purchase.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium" title={purchase.email}>{purchase.email}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(purchase.status)} text-white`}>
                              {getStatusText(purchase.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatPrice(purchase.price)}</TableCell>
                          <TableCell>{purchase.credit_amount}</TableCell>
                          <TableCell className="font-mono text-sm" title={purchase.payment_id}>{purchase.payment_id}</TableCell>
                          <TableCell>
                            <Badge variant={purchase.fraud_status === 'ok' ? 'default' : 'destructive'}>
                              {purchase.fraud_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs" title={purchase.conversation_id}>{purchase.conversation_id}</TableCell>
                        </TableRow>
                        {expandedRows.has(purchase.id) && (
                          <TableRow key={`${purchase.id}-details`} className="bg-gray-50 dark:bg-gray-800">
                            <TableCell colSpan={8} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Commission Bilgileri</h4>
                                  <div className="text-xs space-y-1">
                                    <div><span className="font-medium">Rate:</span> %{purchase.commission_rate}</div>
                                    <div><span className="font-medium">Fee:</span> ₺{purchase.commission_fee}</div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Host Bilgileri</h4>
                                  <div className="text-xs space-y-1">
                                    <div><span className="font-medium">Reference:</span> <span className="font-mono">{purchase.host_reference}</span></div>
                                    <div><span className="font-medium">IP:</span> <span className="font-mono">{purchase.user_ip}</span></div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Tarih Bilgileri</h4>
                                  <div className="text-xs space-y-1">
                                    <div><span className="font-medium">Oluşturulma:</span> {formatDate(purchase.created_at)}</div>
                                  </div>
                                </div>
                                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Teknik Bilgiler</h4>
                                  <div className="text-xs space-y-1">
                                    <div><span className="font-medium">User Agent:</span> <span className="break-all">{purchase.user_agent}</span></div>
                                    <div><span className="font-medium">Referrer:</span> <span className="break-all">{purchase.referrer}</span></div>
                                    <div><span className="font-medium">Request URL:</span> <span className="break-all">{purchase.request_url}</span></div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            // --- DEĞİŞİKLİK BURADA BİTİYOR ---
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Toplam {filteredPurchases.length} satın alım gösteriliyor
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Önceki
                </Button>
                <span className="px-3 py-1 text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}