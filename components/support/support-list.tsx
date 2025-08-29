"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Eye, MessageSquare, RefreshCw, Trash2, RotateCcw, User, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupportTickets, deleteSupportTicket } from "@/lib/support"
import { SupportTicket, SupportTicketFilters } from "@/types/support"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { SupportTicketDetails } from "./support-ticket-details"

export function SupportList() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<SupportTicket | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'all-statuses' ? '' : value)
  }

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value === 'all-categories' ? '' : value)
  }

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value === 'all-priorities' ? '' : value)
  }

  const loadTickets = useCallback(async (pageNum: number = 1, resetList: boolean = true) => {
    try {
      if (resetList) setLoading(true)
      
      const filters: SupportTicketFilters = {
        page: pageNum,
        limit: 20,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        priority: priorityFilter || undefined,
      }

      const response = await getSupportTickets(filters)
      
      if (resetList) {
        setTickets(response.tickets)
      } else {
        setTickets(prev => [...prev, ...response.tickets])
      }
      
      setTotalCount(response.total_count)
      setHasMore(response.has_more)
      setPage(pageNum)
    } catch (error) {
      console.error('Ticketlar yüklenirken hata:', error)
      toast.error('Ticketlar yüklenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
      setTickets([])
      setTotalCount(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, categoryFilter, priorityFilter])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTickets(1, true)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [loadTickets])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTickets(1, true)
    setRefreshing(false)
  }

  const handleDeleteClick = (ticket: SupportTicket) => {
    setTicketToDelete(ticket)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return
    
    try {
      await deleteSupportTicket(ticketToDelete.id)
      setTickets(prev => prev.filter(t => t.id !== ticketToDelete.id))
      toast.success('Ticket başarıyla silindi', {
        description: `"${ticketToDelete.ticket_number}" silindi`
      })
      setDeleteModalOpen(false)
      setTicketToDelete(null)
    } catch (error) {
      toast.error('Ticket silinirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    }
  }

  const handleViewDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setDetailsModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Açık', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
      in_progress: { label: 'İşlemde', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      waiting_response: { label: 'Yanıt Bekleniyor', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      resolved: { label: 'Çözüldü', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      closed: { label: 'Kapalı', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
    
    return (
      <Badge className={cn('px-2 py-1 text-xs font-medium rounded-full', config.className)}>
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Düşük', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      medium: { label: 'Orta', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      high: { label: 'Yüksek', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
      urgent: { label: 'Acil', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
    
    return (
      <Badge variant="outline" className={cn('px-2 py-1 text-xs font-medium rounded-full', config.className)}>
        {config.label}
      </Badge>
    )
  }

  const getCategoryLabel = (category: string) => {
    const categoryLabels = {
      technical: 'Teknik',
      billing: 'Faturalandırma',
      general: 'Genel',
      feature_request: 'Özellik Talebi',
      bug_report: 'Hata Bildirimi',
      account: 'Hesap'
    }
    
    return categoryLabels[category as keyof typeof categoryLabels] || category
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

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Ticket ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>
            
            <Select value={statusFilter || 'all-statuses'} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                <SelectValue placeholder="Tüm Durumlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-statuses">Tüm Durumlar</SelectItem>
                <SelectItem value="open">Açık</SelectItem>
                <SelectItem value="in_progress">İşlemde</SelectItem>
                <SelectItem value="waiting_response">Yanıt Bekleniyor</SelectItem>
                <SelectItem value="resolved">Çözüldü</SelectItem>
                <SelectItem value="closed">Kapalı</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter || 'all-categories'} onValueChange={handleCategoryFilterChange}>
              <SelectTrigger className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                <SelectValue placeholder="Tüm Kategoriler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-categories">Tüm Kategoriler</SelectItem>
                <SelectItem value="technical">Teknik</SelectItem>
                <SelectItem value="billing">Faturalandırma</SelectItem>
                <SelectItem value="general">Genel</SelectItem>
                <SelectItem value="feature_request">Özellik Talebi</SelectItem>
                <SelectItem value="bug_report">Hata Bildirimi</SelectItem>
                <SelectItem value="account">Hesap</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter || 'all-priorities'} onValueChange={handlePriorityFilterChange}>
              <SelectTrigger className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                <SelectValue placeholder="Tüm Öncelikler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-priorities">Tüm Öncelikler</SelectItem>
                <SelectItem value="low">Düşük</SelectItem>
                <SelectItem value="medium">Orta</SelectItem>
                <SelectItem value="high">Yüksek</SelectItem>
                <SelectItem value="urgent">Acil</SelectItem>
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

          {/* Tickets Table */}
          {loading && tickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Ticketlar Yükleniyor</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen bekleyiniz...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Henüz ticket bulunmamaktadır</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ticket
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Kullanıcı
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Kategori
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Öncelik
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Durum
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Son Yanıt
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-gray-200/10 dark:border-gray-700/10 hover:bg-white/5 dark:hover:bg-black/10 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {ticket.ticket_number}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {ticket.subject}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <MessageSquare className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">{ticket.message_count}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {ticket.user_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {ticket.user_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(ticket.category)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        {getPriorityBadge(ticket.priority)}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(ticket.last_reply_at)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(ticket)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(ticket)}
                            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
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
                onClick={() => loadTickets(page + 1, false)}
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">
              Ticket Silme Onayı
            </DialogTitle>
            <DialogDescription>
              <strong>"{ticketToDelete?.ticket_number}"</strong> numaralı ticketi silmek istediğinizden emin misiniz?
              <br />
              <span className="text-red-500 text-sm mt-2 block">
                Bu işlem geri alınamaz. Ticket ve tüm mesajları kalıcı olarak silinecektir.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Ticket Detayları - {selectedTicket?.ticket_number}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <SupportTicketDetails 
              ticket={selectedTicket} 
              onClose={() => setDetailsModalOpen(false)}
              onUpdate={() => loadTickets(1, true)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}