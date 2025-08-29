"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Eye, Trash2, FileText, Info, Database, BarChart3, Settings, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { getDocuments, deleteDocument, getDocumentDetails } from "@/lib/document"
import { Document } from "@/types/document"
import { MESSAGES } from "@/constants/messages"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useActiveTasks, DocumentProgress } from "@/hooks/use-document-progress"

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [institutionFilter, setInstitutionFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [documentDetails, setDocumentDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  
  // Use the existing hook for active tasks - otomatik 2 saniyede bir yenilenir
  const { activeTasks } = useActiveTasks()

  const fetchDocuments = useCallback(async (pageNum: number = 1, resetList: boolean = true) => {
    try {
      if (resetList) setLoading(true)
      
      const response = await getDocuments(
        pageNum, 
        20, 
        categoryFilter || undefined, 
        statusFilter || undefined
      )
      
      if (resetList) {
        setDocuments(response.documents)
      } else {
        setDocuments(prev => [...prev, ...response.documents])
      }
      
      setTotalCount(response.total_count)
      setHasMore(response.has_more)
      setPage(pageNum)
    } catch (error) {
      console.error('Dokümanlar yüklenirken hata:', error)
      toast.error('Dokümanlar yüklenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
      setDocuments([])
      setTotalCount(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, statusFilter])

  // Track completed tasks to refresh document list
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set())
  const [lastActiveTaskCount, setLastActiveTaskCount] = useState(0)

  // When a task completes, refresh the document list
  useEffect(() => {
    activeTasks.forEach((task) => {
      if ((task.status === 'completed' || task.status === 'failed') && !completedTaskIds.has(task.task_id)) {
        // Mark this task as processed
        setCompletedTaskIds(prev => new Set(Array.from(prev).concat(task.task_id)))
        
        // Refresh document list after a short delay
        setTimeout(() => {
          fetchDocuments(1, true)
        }, 1000)
      }
    })
  }, [activeTasks, completedTaskIds, fetchDocuments])

  // Track when active task count goes from > 0 to 0 (all tasks completed)
  useEffect(() => {
    if (lastActiveTaskCount > 0 && activeTasks.length === 0) {
      // All tasks just completed, force refresh after delay
      setTimeout(() => {
        fetchDocuments(1, true)
      }, 3000) // Longer delay to ensure backend has updated
    }
    setLastActiveTaskCount(activeTasks.length)
  }, [activeTasks.length, lastActiveTaskCount, fetchDocuments])

  // Clean up completed task IDs when active tasks change
  useEffect(() => {
    const activeTaskIds = new Set(activeTasks.map(task => task.task_id))
    setCompletedTaskIds(prev => {
      const filtered = new Set(Array.from(prev).filter(id => activeTaskIds.has(id)))
      return filtered
    })
  }, [activeTasks])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDocuments(1, true)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, fetchDocuments])

  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return
    
    try {
      await deleteDocument(documentToDelete.id)
      setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id))
      toast.success('Doküman başarıyla silindi')
      setDeleteModalOpen(false)
      setDocumentToDelete(null)
    } catch (error) {
      console.error('Doküman silinirken hata:', error)
      toast.error('Doküman silinirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    }
  }

  const handleViewDetails = async (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId)
    setSelectedDocument(document || null)
    setLoadingDetails(true)
    setDetailsModalOpen(true)
    
    try {
      const details = await getDocumentDetails(documentId)
      setDocumentDetails(details)
    } catch (error) {
      console.error('Doküman detayları alınırken hata:', error)
      toast.error('Doküman detayları alınırken hata oluştu')
    } finally {
      setLoadingDetails(false)
    }
  }

  const getStatusBadgeWithProgress = (document: Document) => {
    // İlk önce aktif task'lardan bu doküman için progress bilgisi ara
    const taskProgress = activeTasks.find(task => 
      task.document_title === document.title || 
      task.document_title === document.filename ||
      document.title.includes(task.document_title) ||
      task.document_title.includes(document.title)
    )
    
    // Eğer aktif task varsa, onun durumunu kullan
    if (taskProgress) {
      if (taskProgress.status === 'completed') {
        // Task completed, but document might not be updated yet
        // Force a refresh after a delay
        setTimeout(() => {
          fetchDocuments(1, true)
        }, 3000)
        
        return (
          <Badge className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Tamamlandı
          </Badge>
        )
      }
      
      if (taskProgress.status === 'failed') {
        return (
          <Badge className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Başarısız
          </Badge>
        )
      }
      
      if (taskProgress.status === 'processing') {
        return (
          <div className="flex flex-col gap-2 min-w-[180px]">
            <div className="w-full">
              <Progress 
                value={taskProgress.progress_percent} 
                className="h-2 bg-gray-200 dark:bg-gray-700"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getStageText(taskProgress.stage)}
            </p>
          </div>
        )
      }
      
      if (taskProgress.status === 'pending') {
        return (
          <div className="flex flex-col gap-2 min-w-[180px]">
            <div className="w-full">
              <Progress 
                value={5} 
                className="h-2 bg-gray-200 dark:bg-gray-700"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              İşlem sıraya alındı, başlatılmayı bekliyor...
            </p>
          </div>
        )
      }
    }
    
    // Aktif task yoksa, document'ın kendi durumunu kullan
    if (document.processing_status === 'completed') {
      return (
        <Badge className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Tamamlandı
        </Badge>
      )
    }
    
    if (document.processing_status === 'failed') {
      return (
        <Badge className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Başarısız
        </Badge>
      )
    }


    // Varsayılan olarak normal badge göster
    return getStatusBadge(document.processing_status)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      processing: { 
        label: MESSAGES.DOCUMENTS.STATUS_PROCESSING, 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        icon: Clock
      },
      completed: { 
        label: MESSAGES.DOCUMENTS.STATUS_COMPLETED, 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        icon: CheckCircle
      },
      failed: { 
        label: MESSAGES.DOCUMENTS.STATUS_FAILED, 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        icon: XCircle
      }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing
    const Icon = config.icon
    
    return (
      <Badge className={cn('px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1', config.className)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getStageText = (stage: string) => {
    switch (stage) {
      case 'upload': return 'Dosya yükleniyor'
      case 'download': return 'PDF indiriliyor'
      case 'extract': return 'PDF\'den metin çıkarılıyor'
      case 'chunk': return 'Metin parçalanıyor'
      case 'embed': return 'Vektörler oluşturuluyor'
      case 'storage': return 'Elasticsearch\'e kaydediliyor'
      default: return 'İşleniyor...'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.institution && doc.institution.toLowerCase().includes(searchTerm.toLowerCase()))
  ).filter(doc => 
    !categoryFilter || doc.category === categoryFilter
  ).filter(doc => 
    !statusFilter || doc.processing_status === statusFilter
  ).filter(doc => 
    !institutionFilter || (doc.institution && doc.institution.toLowerCase().includes(institutionFilter.toLowerCase()))
  )

  // Get unique institutions for filter
  const uniqueInstitutions = Array.from(new Set(
    documents
      .map(doc => doc.institution)
      .filter(Boolean)
      .filter(institution => institution!.trim() !== '')
  )).sort()

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div> 
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{MESSAGES.DOCUMENTS.MANAGEMENT_TITLE}</h2>
              <p className="text-gray-600 dark:text-gray-400">{MESSAGES.DOCUMENTS.MANAGEMENT_DESCRIPTION}</p>
            </div>
          </div>
          {/* Aktif task sayısını göster */}
          {activeTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {activeTasks.length} aktif işlem
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={MESSAGES.DOCUMENTS.SEARCH_PLACEHOLDER}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
            />
          </div>
          
          <Select value={categoryFilter || 'all-categories'} onValueChange={(value) => setCategoryFilter(value === 'all-categories' ? '' : value)}>
            <SelectTrigger className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
              <SelectValue placeholder="Tüm Kategoriler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-categories">Tüm Kategoriler</SelectItem>
              <SelectItem value="mevzuat">Mevzuat</SelectItem>
              <SelectItem value="yonetmelik">Yönetmelik</SelectItem>
              <SelectItem value="genelge">Genelge</SelectItem>
              <SelectItem value="teblig">Tebliğ</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter || 'all-statuses'} onValueChange={(value) => setStatusFilter(value === 'all-statuses' ? '' : value)}>
            <SelectTrigger className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
              <SelectValue placeholder="Tüm Durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-statuses">Tüm Durumlar</SelectItem>
              <SelectItem value="processing">İşleniyor</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="failed">Başarısız</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={institutionFilter || 'all-institutions'} onValueChange={(value) => setInstitutionFilter(value === 'all-institutions' ? '' : value)}>
            <SelectTrigger className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
              <SelectValue placeholder="Tüm Kurumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-institutions">Tüm Kurumlar</SelectItem>
              {uniqueInstitutions.map((institution) => (
                <SelectItem key={institution} value={institution!}>
                  {institution}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Documents Table */}
        {loading && documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Dokümanlar Yükleniyor</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen bekleyiniz...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{MESSAGES.DOCUMENTS.NO_DOCUMENTS}</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-200/10 dark:border-gray-700/10 rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {MESSAGES.DOCUMENTS.DOCUMENT_TITLE}
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {MESSAGES.DOCUMENTS.CATEGORY}
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kurum
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {MESSAGES.DOCUMENTS.STATUS}
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {MESSAGES.DOCUMENTS.FILE_SIZE}
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {MESSAGES.DOCUMENTS.CREATED_DATE}
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {MESSAGES.DOCUMENTS.DOC_ACTIONS}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((document) => (
                  <tr key={document.id} className="border-b border-gray-200/10 dark:border-gray-700/10 hover:bg-white/5 dark:hover:bg-black/10 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {document.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {document.filename}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="text-xs capitalize">
                        {document.category}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {document.institution || document.keywords || 'Belirtilmemiş'}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadgeWithProgress(document)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(document.file_size)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(document.created_at)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(document.id)}
                          className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                        >
                          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(document)}
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
              onClick={() => fetchDocuments(page + 1, false)}
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">
              Doküman Silme Onayı
            </DialogTitle>
            <DialogDescription>
              <strong>"{documentToDelete?.title}"</strong> adlı dokümanı silmek istediğinizden emin misiniz?
              <br />
              <span className="text-red-500 text-sm mt-2 block">
                Bu işlem geri alınamaz. Doküman ve tüm ilişkili veriler kalıcı olarak silinecektir.
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

      {/* Document Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Doküman Detayları - {selectedDocument?.title}
            </DialogTitle>
          </DialogHeader>
          {loadingDetails ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200 mx-auto mb-4"></div>
              <p>Detaylar yükleniyor...</p>
            </div>
          ) : documentDetails ? (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-gray-200/20 dark:border-gray-800/30 rounded-2xl p-1">
                <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30">
                  <FileText className="w-4 h-4 mr-2" />
                  Genel
                </TabsTrigger>
                <TabsTrigger value="storage" className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30">
                  <Database className="w-4 h-4 mr-2" />
                  Depolama
                </TabsTrigger>
                <TabsTrigger value="vectors" className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Vector Analytics
                </TabsTrigger>
                <TabsTrigger value="metadata" className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30">
                  <Settings className="w-4 h-4 mr-2" />
                  Metadata
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Başlık</h4>
                    <p className="text-blue-700 dark:text-blue-300">{documentDetails.document_info?.title || selectedDocument?.title}</p>
                  </div>
                  <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Dosya Adı</h4>
                    <p className="text-green-700 dark:text-green-300">{documentDetails.document_info?.filename || selectedDocument?.filename}</p>
                  </div>
                  <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Kategori</h4>
                    <Badge variant="outline" className="text-purple-700 dark:text-purple-300">
                      {documentDetails.document_info?.category || selectedDocument?.category}
                    </Badge>
                  </div>
                  <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">İşlem Durumu</h4>
                    {getStatusBadge(documentDetails.document_info?.processing_status || selectedDocument?.processing_status || 'processing')}
                  </div>
                </div>
                
                {(documentDetails.document_info?.description || selectedDocument?.description) && (
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Açıklama</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {documentDetails.document_info?.description || selectedDocument?.description}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Oluşturma Tarihi</h4>
                    <p className="text-indigo-700 dark:text-indigo-300">
                      {formatDate(documentDetails.document_info?.created_at || selectedDocument?.created_at || new Date().toISOString())}
                    </p>
                  </div>
                  <div className="p-4 bg-pink-50/50 dark:bg-pink-900/20 rounded-xl">
                    <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">Güncelleme Tarihi</h4>
                    <p className="text-pink-700 dark:text-pink-300">
                      {formatDate(documentDetails.document_info?.updated_at || selectedDocument?.updated_at || new Date().toISOString())}
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="storage" className="space-y-4">
                {documentDetails.storage_info ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Dosya Boyutu (MB)</h4>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{documentDetails.storage_info.file_size_mb}</p>
                      </div>
                      <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Dosya Boyutu (Bytes)</h4>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{documentDetails.storage_info.file_size_bytes?.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {documentDetails.storage_info.bunny_url && (
                      <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">CDN URL</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-purple-700 dark:text-purple-300 truncate flex-1">{documentDetails.storage_info.bunny_url}</p>
                          <Button
                            size="sm"
                            onClick={() => window.open(documentDetails.storage_info.bunny_url, '_blank')}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Database className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Depolama bilgileri mevcut değil</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="vectors" className="space-y-4">
                {documentDetails.vector_analytics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl text-center">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Toplam Vector</h4>
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                          {documentDetails.processing_metrics?.embeddings_created || documentDetails.vector_analytics.total_vectors || 0}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl text-center">
                        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Chunk Sayısı</h4>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                          {documentDetails.processing_metrics?.embeddings_created || documentDetails.vector_analytics.chunk_count || 0}
                        </p>
                      </div>
                    </div>
                    
                    {documentDetails.vector_analytics.elasticsearch_index && (
                      <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Elasticsearch Index</h4>
                        <Badge variant="outline" className="text-gray-700 dark:text-gray-300">
                          {documentDetails.vector_analytics.elasticsearch_index}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Processing Metrics Info */}
                    {documentDetails.processing_metrics && (
                      <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">İşlem Detayları</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2 bg-purple-100/50 dark:bg-purple-800/30 rounded-lg">
                            <p className="text-xs text-purple-600 dark:text-purple-400">Oluşturulan Embedding</p>
                            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                              {documentDetails.processing_metrics.embeddings_created}
                            </p>
                          </div>
                          <div className="p-2 bg-purple-100/50 dark:bg-purple-800/30 rounded-lg">
                            <p className="text-xs text-purple-600 dark:text-purple-400">Vectorization Durumu</p>
                            <Badge variant={documentDetails.processing_metrics.vectorization_complete ? "default" : "secondary"}>
                              {documentDetails.processing_metrics.vectorization_complete ? "Tamamlandı" : "Devam Ediyor"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Vector analytics mevcut değil</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="metadata" className="space-y-4">
                {documentDetails.metadata ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Doküman ID</h4>
                        <p className="text-xs font-mono text-blue-700 dark:text-blue-300 break-all">{documentDetails.metadata.document_id}</p>
                      </div>
                      <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Yükleyen Kullanıcı</h4>
                        <p className="text-xs font-mono text-green-700 dark:text-green-300 break-all">{documentDetails.metadata.uploaded_by}</p>
                      </div>
                    </div>
                    
                    {documentDetails.metadata.content_preview && (
                      <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">İçerik Önizlemesi</h4>
                        <p className="text-purple-700 dark:text-purple-300">{documentDetails.metadata.content_preview}</p>
                      </div>
                    )}
                    
                    {documentDetails.metadata.processing_notes && (
                      <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                        <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">İşlem Notları</h4>
                        <p className="text-orange-700 dark:text-orange-300">{documentDetails.metadata.processing_notes}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl">
                        <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Yükleme Tarihi</h4>
                        <p className="text-indigo-700 dark:text-indigo-300">
                          {formatDate(documentDetails.metadata.upload_date || selectedDocument?.created_at || new Date().toISOString())}
                        </p>
                      </div>
                      <div className="p-4 bg-pink-50/50 dark:bg-pink-900/20 rounded-xl">
                        <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">Son Güncelleme</h4>
                        <p className="text-pink-700 dark:text-pink-300">
                          {formatDate(documentDetails.metadata.last_updated || selectedDocument?.updated_at || new Date().toISOString())}
                        </p>
                      </div>
                    </div>
                    
                    {documentDetails.processing_metrics && (
                      <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Processing Metrics</h4>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Embeddings Oluşturuldu: </span>
                            <span className="font-semibold">{documentDetails.processing_metrics.embeddings_created}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Vector Var mı: </span>
                            <Badge variant={documentDetails.processing_metrics.has_vectors ? "default" : "secondary"}>
                              {documentDetails.processing_metrics.has_vectors ? "Evet" : "Hayır"}
                            </Badge>
                          </div>
                          <div className="col-span-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Vectorization Tamamlandı: </span>
                            <Badge variant={documentDetails.processing_metrics.vectorization_complete ? "default" : "secondary"}>
                              {documentDetails.processing_metrics.vectorization_complete ? "Evet" : "Hayır"}  
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </> 
                ) : (
                  <div className="text-center py-8">
                    <Settings className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Metadata mevcut değil</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
              <p>Doküman detayları yüklenemedi</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}