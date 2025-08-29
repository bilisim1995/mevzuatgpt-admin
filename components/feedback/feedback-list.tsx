"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Eye, Trash2, RefreshCw, MessageSquare, ThumbsUp, ThumbsDown, User, Clock, RotateCcw, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFeedback, deleteFeedback, getUserFeedback } from "@/lib/feedback"
import { getUsers } from "@/lib/users"
import { Feedback, FeedbackFilters, FeedbackResponse } from "@/types/feedback"
import { User as UserType } from "@/types/user"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function FeedbackList() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<FeedbackFilters['feedback_type'] | ''>('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [users, setUsers] = useState<UserType[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value === 'all-types' ? '' : value as 'like' | 'dislike')
  }

  const loadFeedback = useCallback(async (pageNum: number = 1, resetList: boolean = true) => {
    try {
      if (resetList) setLoading(true)
      
      let response: FeedbackResponse
      
      if (selectedUserId) {
        // Belirli kullanıcının feedback'lerini getir
        const filters: FeedbackFilters = {
          page: pageNum,
          limit: 50,
          feedback_type: typeFilter || undefined,
        }
        response = await getUserFeedback(selectedUserId, filters)
      } else {
        // Tüm feedback'leri getir
        const filters: FeedbackFilters = {
          page: pageNum,
          limit: 50,
          feedback_type: typeFilter || undefined,
        }
        response = await getFeedback(filters)
      }
      
      if (resetList) {
        setFeedback(response.feedback_list)
      } else {
        setFeedback(prev => [...prev, ...response.feedback_list])
      }
      
      setTotalCount(response.total_count)
      setHasMore(response.has_more)
      setPage(pageNum)
    } catch (error) {
      console.error('Feedback yüklenirken hata:', error)
      toast.error('Feedback yüklenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
      setFeedback([])
      setTotalCount(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [typeFilter, selectedUserId])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadFeedback(1, true)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [loadFeedback])

  const loadUsers = async (search: string = '') => {
    try {
      setLoadingUsers(true)
      const response = await getUsers({ 
        page: 1, 
        limit: 100, 
        search: search || undefined 
      })
      setUsers(response.users)
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error)
      toast.error('Kullanıcılar yüklenirken hata oluştu')
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId)
    setPage(1)
  }

  const handleClearUserFilter = () => {
    setSelectedUserId('')
    setPage(1)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadFeedback(1, true)
    setRefreshing(false)
  }

  const handleDeleteClick = (feedbackItem: Feedback) => {
    setFeedbackToDelete(feedbackItem)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!feedbackToDelete) return
    
    try {
      await deleteFeedback(feedbackToDelete.id)
      setFeedback(prev => prev.filter(f => f.id !== feedbackToDelete.id))
      toast.success('Feedback başarıyla silindi', {
        description: `Feedback silindi`
      })
      setDeleteModalOpen(false)
      setFeedbackToDelete(null)
    } catch (error) {
      toast.error('Feedback silinirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    }
  }

  const handleViewDetails = (feedbackItem: Feedback) => {
    setSelectedFeedback(feedbackItem)
    setDetailsModalOpen(true)
  }

  const getFeedbackTypeFromComment = (feedbackItem: Feedback): 'like' | 'dislike' => {
    if (feedbackItem.feedback_comment) {
      const comment = feedbackItem.feedback_comment.toLowerCase()
      if (comment.includes('[dislike]')) {
        return 'dislike'
      }
      if (comment.startsWith('[like]')) {
        return 'like'
      }
    }
    // Fallback to original feedback_type
    return feedbackItem.feedback_type
  }
  const getFeedbackTypeBadge = (type: string) => {
    const config = {
      like: { label: 'Beğeni', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: ThumbsUp },
      dislike: { label: 'Beğenmeme', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: ThumbsDown }
    }
    
    const typeConfig = config[type as keyof typeof config] || config.like
    const Icon = typeConfig.icon
    
    return (
      <Badge className={cn('px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1', typeConfig.className)}>
        <Icon className="w-3 h-3" />
        {typeConfig.label}
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

  const filteredFeedback = feedback.filter(item =>
    item.query_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.feedback_comment && item.feedback_comment.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kullanıcı Feedbackleri</h2>
                <p className="text-gray-600 dark:text-gray-400">Kullanıcıların sorulara verdiği geri bildirimleri yönetin</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Feedback ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>
            
            <Select 
              value={selectedUserId || 'all-users'} 
              onValueChange={(value) => value === 'all-users' ? handleClearUserFilter() : handleUserSelect(value)}
            >
              <SelectTrigger className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                <SelectValue placeholder="Tüm Kullanıcılar" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all-users">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Tüm Kullanıcılar
                  </div>
                </SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.full_name}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={typeFilter || 'all-types'} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                <SelectValue placeholder="Tüm Tipler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">Tüm Tipler</SelectItem>
                <SelectItem value="like">Beğeni</SelectItem>
                <SelectItem value="dislike">Beğenmeme</SelectItem>
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

          {/* Feedback Table */}
          {loading && feedback.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-orange-600 dark:border-t-orange-400 mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Feedbackler Yükleniyor</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen bekleyiniz...</p>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Henüz feedback bulunmamaktadır</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Soru & Cevap
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Feedback Tipi
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Yorum
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
                  {filteredFeedback.map((feedbackItem) => (
                    <tr key={feedbackItem.id} className="border-b border-gray-200/10 dark:border-gray-700/10 hover:bg-white/5 dark:hover:bg-black/10 transition-colors">
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                              {feedbackItem.query_text}
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {feedbackItem.answer_text}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getFeedbackTypeBadge(feedbackItem.feedback_type)}
                      </td>
                      <td className="py-4 px-4">
                        {feedbackItem.feedback_comment ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 max-w-xs">
                            {feedbackItem.feedback_comment}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-400">Yorum yok</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(feedbackItem.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(feedbackItem)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(feedbackItem)}
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
                onClick={() => loadFeedback(page + 1, false)}
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
              Feedback Silme Onayı
            </DialogTitle>
            <DialogDescription>
              Bu feedbacki silmek istediğinizden emin misiniz?
              <br />
              <span className="text-red-500 text-sm mt-2 block">
                Bu işlem geri alınamaz. Feedback kalıcı olarak silinecektir.
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
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Feedback Detayları
            </DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Kullanıcı Sorusu
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300">{selectedFeedback.query_text}</p>
                </div>
                
                <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Sistem Cevabı
                  </h4>
                  <p className="text-green-700 dark:text-green-300">{selectedFeedback.answer_text}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Feedback Tipi</h4>
                    {getFeedbackTypeBadge(getFeedbackTypeFromComment(selectedFeedback))}
                  </div>
                  <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Tarih</h4>
                    <p className="text-orange-700 dark:text-orange-300">{formatDate(selectedFeedback.created_at)}</p>
                  </div>
                </div>
                
                {selectedFeedback.feedback_comment && (
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Kullanıcı Yorumu</h4>
                    <p className="text-gray-700 dark:text-gray-300">{selectedFeedback.feedback_comment}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}