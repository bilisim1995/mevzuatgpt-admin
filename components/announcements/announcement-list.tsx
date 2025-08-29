"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Edit, Trash2, RefreshCw, Megaphone, Eye, RotateCcw, Calendar, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAnnouncements, deleteAnnouncement, getAnnouncementDetails } from "@/lib/announcements"
import { Announcement, AnnouncementFilters } from "@/types/announcement"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { AnnouncementForm } from "./announcement-form"

export function AnnouncementList() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value === 'all-priorities' ? '' : value)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'all-statuses' ? '' : value)
  }

  const loadAnnouncements = useCallback(async (pageNum: number = 1, resetList: boolean = true) => {
    try {
      if (resetList) setLoading(true)
      
      const filters: AnnouncementFilters = {
        page: pageNum,
        limit: 20,
        search: searchTerm || undefined,
        priority: priorityFilter === '' ? undefined : priorityFilter as AnnouncementFilters['priority'],
        is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      }

      const response = await getAnnouncements(filters)
      
      if (resetList) {
        setAnnouncements(response.announcements)
      } else {
        setAnnouncements(prev => [...prev, ...response.announcements])
      }
      
      setTotalCount(response.pagination.total)
      setHasMore(response.pagination.has_next)
      setPage(pageNum)
    } catch (error) {
      console.error('Duyurular yüklenirken hata:', error)
      toast.error('Duyurular yüklenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
      setAnnouncements([])
      setTotalCount(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, priorityFilter, statusFilter])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAnnouncements(1, true)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [loadAnnouncements])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnnouncements(1, true)
    setRefreshing(false)
  }

  const handleDeleteClick = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!announcementToDelete) return
    
    try {
      await deleteAnnouncement(announcementToDelete.id)
      setAnnouncements(prev => prev.filter(a => a.id !== announcementToDelete.id))
      toast.success('Duyuru başarıyla silindi', {
        description: `"${announcementToDelete.title}" silindi`
      })
      setDeleteModalOpen(false)
      setAnnouncementToDelete(null)
    } catch (error) {
      toast.error('Duyuru silinirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    }
  }

  const handleViewDetails = async (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setDetailsModalOpen(true)
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormModalOpen(true)
  }

  const handleCreate = () => {
    setEditingAnnouncement(null)
    setFormModalOpen(true)
  }

  const handleFormSuccess = () => {
    setFormModalOpen(false)
    setEditingAnnouncement(null)
    loadAnnouncements(1, true)
  }

  const getPriorityBadge = (priority: string) => {
    const config = {
      low: { label: 'Düşük', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: '📝' },
      normal: { label: 'Normal', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: 'ℹ️' },
      high: { label: 'Yüksek', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: '⚠️' },
      urgent: { label: 'Acil', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: '🚨' }
    }
    
    const priorityConfig = config[priority as keyof typeof config] || config.normal
    
    return (
      <Badge className={cn('px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1', priorityConfig.className)}>
        <span>{priorityConfig.icon}</span>
        {priorityConfig.label}
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={cn(
        'px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1',
        isActive 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      )}>
        {isActive ? (
          <>
            <CheckCircle className="w-3 h-3" />
            Aktif
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3" />
            Pasif
          </>
        )}
      </Badge>
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

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Duyuru Yönetimi</h2>
                <p className="text-gray-600 dark:text-gray-400">Sistem duyurularını oluşturun ve yönetin</p>
              </div>
            </div>
            <Button
              onClick={handleCreate}
              className="h-10 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Duyuru
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Duyuru ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>
            
            <Select value={priorityFilter || 'all-priorities'} onValueChange={handlePriorityFilterChange}>
              <SelectTrigger className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                <SelectValue placeholder="Tüm Öncelikler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-priorities">Tüm Öncelikler</SelectItem>
                <SelectItem value="low">📝 Düşük</SelectItem>
                <SelectItem value="normal">ℹ️ Normal</SelectItem>
                <SelectItem value="high">⚠️ Yüksek</SelectItem>
                <SelectItem value="urgent">🚨 Acil</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter || 'all-statuses'} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                <SelectValue placeholder="Tüm Durumlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-statuses">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
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

          {/* Announcements Table */}
          {loading && announcements.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-orange-600 dark:border-t-orange-400 mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Duyurular Yükleniyor</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen bekleyiniz...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Henüz duyuru bulunmamaktadır</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Başlık
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Öncelik
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Durum
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Yayın Tarihi
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Oluşturma
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((announcement) => (
                    <tr key={announcement.id} className="border-b border-gray-200/10 dark:border-gray-700/10 hover:bg-white/5 dark:hover:bg-black/10 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Megaphone className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {announcement.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {announcement.content.substring(0, 50)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getPriorityBadge(announcement.priority)}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(announcement.is_active)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(announcement.publish_date)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(announcement.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(announcement)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(announcement)}
                            className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                          >
                            <Edit className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(announcement)}
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
                onClick={() => loadAnnouncements(page + 1, false)}
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
              Duyuru Silme Onayı
            </DialogTitle>
            <DialogDescription>
              <strong>"{announcementToDelete?.title}"</strong> adlı duyuruyu silmek istediğinizden emin misiniz?
              <br />
              <span className="text-red-500 text-sm mt-2 block">
                Bu işlem geri alınamaz. Duyuru kalıcı olarak silinecektir.
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
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Duyuru Detayları - {selectedAnnouncement?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Başlık</h4>
                  <p className="text-orange-700 dark:text-orange-300">{selectedAnnouncement.title}</p>
                </div>
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Öncelik</h4>
                  {getPriorityBadge(selectedAnnouncement.priority)}
                </div>
                <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Durum</h4>
                  {getStatusBadge(selectedAnnouncement.is_active)}
                </div>
                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Yayın Tarihi</h4>
                  <p className="text-purple-700 dark:text-purple-300">{formatDate(selectedAnnouncement.publish_date)}</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">İçerik</h4>
                <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedAnnouncement.content}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Oluşturma Tarihi</h4>
                  <p className="text-indigo-700 dark:text-indigo-300">{formatDate(selectedAnnouncement.created_at)}</p>
                </div>
                <div className="p-4 bg-pink-50/50 dark:bg-pink-900/20 rounded-xl">
                  <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">Güncelleme Tarihi</h4>
                  <p className="text-pink-700 dark:text-pink-300">
                    {selectedAnnouncement.updated_at ? formatDate(selectedAnnouncement.updated_at) : 'Güncellenmemiş'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Modal */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              {editingAnnouncement ? 'Duyuru Düzenle' : 'Yeni Duyuru Oluştur'}
            </DialogTitle>
          </DialogHeader>
          <AnnouncementForm
            announcement={editingAnnouncement}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}