"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Edit, Trash2, RefreshCw, Bot, Eye, RotateCcw, Settings, AlertCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPrompts, deletePrompt, refreshPromptCache, getPromptDetails } from "@/lib/prompts"
import { Prompt, PromptFilters } from "@/types/prompt"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { PromptForm } from "./prompt-form"

export function PromptList() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [providerFilter, setProviderFilter] = useState<PromptFilters['provider'] | ''>('')
  const [typeFilter, setTypeFilter] = useState<PromptFilters['prompt_type'] | ''>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshingCache, setRefreshingCache] = useState(false)

  const handleProviderFilterChange = (value: string) => {
    setProviderFilter(value === 'all-providers' ? '' : value as 'groq' | 'openai' | 'anthropic')
  }

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value === 'all-types' ? '' : value as 'system' | 'user' | 'assistant')
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'all-statuses' ? '' : value)
  }

  const loadPrompts = useCallback(async (pageNum: number = 1, resetList: boolean = true) => {
    try {
      if (resetList) setLoading(true)
      
      const filters: PromptFilters = {
        page: pageNum,
        limit: 20,
        search: searchTerm || undefined,
        provider: providerFilter || undefined,
        prompt_type: typeFilter || undefined,
        is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      }

      const response = await getPrompts(filters)
      
      if (resetList) {
        setPrompts(response.prompts)
      } else {
        setPrompts(prev => [...prev, ...response.prompts])
      }
      
      setTotalCount(response.total_count)
      setHasMore(response.pagination.has_next)
      setPage(pageNum)
    } catch (error) {
      console.error('Promptlar yüklenirken hata:', error)
      toast.error('Promptlar yüklenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
      setPrompts([])
      setTotalCount(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, providerFilter, typeFilter, statusFilter])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPrompts(1, true)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [loadPrompts])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadPrompts(1, true)
    setRefreshing(false)
  }

  const handleRefreshCache = async () => {
    setRefreshingCache(true)
    try {
      await refreshPromptCache()
      toast.success('Cache başarıyla temizlendi', {
        description: 'Prompt cache\'i yenilendi'
      })
      await loadPrompts(1, true)
    } catch (error) {
      toast.error('Cache temizlenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setRefreshingCache(false)
    }
  }

  const handleDeleteClick = (prompt: Prompt) => {
    setPromptToDelete(prompt)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!promptToDelete) return
    
    try {
      await deletePrompt(promptToDelete.id)
      setPrompts(prev => prev.filter(p => p.id !== promptToDelete.id))
      toast.success('Prompt başarıyla silindi', {
        description: `"${promptToDelete.description}" silindi`
      })
      setDeleteModalOpen(false)
      setPromptToDelete(null)
    } catch (error) {
      toast.error('Prompt silinirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    }
  }

  const handleViewDetails = async (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setDetailsModalOpen(true)
  }

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setFormModalOpen(true)
  }

  const handleCreate = () => {
    setEditingPrompt(null)
    setFormModalOpen(true)
  }

  const handleFormSuccess = () => {
    setFormModalOpen(false)
    setEditingPrompt(null)
    loadPrompts(1, true)
  }

  const getProviderBadge = (provider: string) => {
    const config = {
      groq: { label: 'Groq', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      openai: { label: 'OpenAI', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      anthropic: { label: 'Anthropic', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' }
    }
    
    const providerConfig = config[provider as keyof typeof config] || config.groq
    
    return (
      <Badge className={cn('px-2 py-1 text-xs font-medium rounded-full', providerConfig.className)}>
        {providerConfig.label}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const config = {
      system: { label: 'System', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
      user: { label: 'User', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      assistant: { label: 'Assistant', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' }
    }
    
    const typeConfig = config[type as keyof typeof config] || config.system
    
    return (
      <Badge variant="outline" className={cn('px-2 py-1 text-xs font-medium rounded-full', typeConfig.className)}>
        {typeConfig.label}
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={cn(
        'px-2 py-1 text-xs font-medium rounded-full',
        isActive 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      )}>
        {isActive ? 'Aktif' : 'Pasif'}
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Prompt Yönetimi</h2>
                <p className="text-gray-600 dark:text-gray-400">AI modellerinin prompt ayarlarını yönetin</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefreshCache}
                disabled={refreshingCache}
                variant="outline"
                className="h-10 px-4 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl hover:bg-white/70 dark:hover:bg-black/50 transition-all duration-300"
              >
                <Zap className={`w-4 h-4 mr-2 ${refreshingCache ? 'animate-pulse' : ''}`} />
                Cache Temizle
              </Button>
              <Button
                onClick={handleCreate}
                className="h-10 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Prompt
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Prompt ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>
            
            <Select value={providerFilter || 'all-providers'} onValueChange={handleProviderFilterChange}>
              <SelectTrigger className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                <SelectValue placeholder="Tüm Sağlayıcılar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-providers">Tüm Sağlayıcılar</SelectItem>
                <SelectItem value="groq">Groq</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter || 'all-types'} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                <SelectValue placeholder="Tüm Tipler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">Tüm Tipler</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="assistant">Assistant</SelectItem>
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

          {/* Prompts Table */}
          {loading && prompts.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Promptlar Yükleniyor</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen bekleyiniz...</p>
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Henüz prompt bulunmamaktadır</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Açıklama
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sağlayıcı
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tip
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Versiyon
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Durum
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Güncelleme
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prompts.map((prompt) => (
                    <tr key={prompt.id} className="border-b border-gray-200/10 dark:border-gray-700/10 hover:bg-white/5 dark:hover:bg-black/10 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Bot className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {prompt.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {prompt.prompt_content.substring(0, 50)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getProviderBadge(prompt.provider)}
                      </td>
                      <td className="py-4 px-4">
                        {getTypeBadge(prompt.prompt_type)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        v{prompt.version}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(prompt.is_active)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(prompt.updated_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(prompt)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(prompt)}
                            className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                          >
                            <Edit className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(prompt)}
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
                onClick={() => loadPrompts(page + 1, false)}
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
              Prompt Silme Onayı
            </DialogTitle>
            <DialogDescription>
              <strong>"{promptToDelete?.description}"</strong> adlı promptu silmek istediğinizden emin misiniz?
              <br />
              <span className="text-red-500 text-sm mt-2 block">
                Bu işlem geri alınamaz. Prompt kalıcı olarak silinecektir.
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
              <Bot className="w-5 h-5" />
              Prompt Detayları - {selectedPrompt?.description}
            </DialogTitle>
          </DialogHeader>
          {selectedPrompt && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Sağlayıcı</h4>
                  {getProviderBadge(selectedPrompt.provider)}
                </div>
                <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Tip</h4>
                  {getTypeBadge(selectedPrompt.prompt_type)}
                </div>
                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Versiyon</h4>
                  <p className="text-purple-700 dark:text-purple-300">v{selectedPrompt.version}</p>
                </div>
                <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Durum</h4>
                  {getStatusBadge(selectedPrompt.is_active)}
                </div>
              </div>
              
              <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Prompt İçeriği</h4>
                <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedPrompt.prompt_content}
                  </pre>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Oluşturma Tarihi</h4>
                  <p className="text-indigo-700 dark:text-indigo-300">{formatDate(selectedPrompt.created_at)}</p>
                </div>
                <div className="p-4 bg-pink-50/50 dark:bg-pink-900/20 rounded-xl">
                  <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">Güncelleme Tarihi</h4>
                  <p className="text-pink-700 dark:text-pink-300">{formatDate(selectedPrompt.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Modal */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              {editingPrompt ? 'Prompt Düzenle' : 'Yeni Prompt Oluştur'}
            </DialogTitle>
          </DialogHeader>
          <PromptForm
            prompt={editingPrompt}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}