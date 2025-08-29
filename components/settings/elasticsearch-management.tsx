"use client"

import { useState, useEffect } from "react"
import { Database, RefreshCw, Trash2, AlertTriangle, CheckCircle, Clock, HardDrive, BarChart3, Building, FileText, XCircle, Target, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getElasticsearchStatus, clearAllElasticsearch, clearElasticsearchDocument, clearElasticsearchDocuments } from "@/lib/elasticsearch"
import { ElasticsearchStatus } from "@/types/elasticsearch"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function ElasticsearchManagement() {
  const [elasticsearchStatus, setElasticsearchStatus] = useState<ElasticsearchStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false)
  const [clearDocumentModalOpen, setClearDocumentModalOpen] = useState(false)
  const [clearMultipleModalOpen, setClearMultipleModalOpen] = useState(false)
  const [operationLoading, setOperationLoading] = useState(false)
  const [documentIdToClear, setDocumentIdToClear] = useState('')
  const [documentIdsToClear, setDocumentIdsToClear] = useState('')

  useEffect(() => {
    loadElasticsearchStatus()
  }, [])

  const loadElasticsearchStatus = async () => {
    try {
      if (!elasticsearchStatus) setLoading(true)
      const data = await getElasticsearchStatus()
      setElasticsearchStatus(data)
    } catch (error) {
      console.error('Elasticsearch durumu yüklenirken hata:', error)
      toast.error('Elasticsearch durumu yüklenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadElasticsearchStatus()
    setRefreshing(false)
    toast.success('Elasticsearch durumu güncellendi')
  }

  const handleClearAll = async () => {
    setOperationLoading(true)
    try {
      const result = await clearAllElasticsearch()
      toast.success('Elasticsearch tamamen temizlendi', {
        description: `${result.docs_deleted} doküman silindi (Önceki: ${result.docs_before}, Sonraki: ${result.docs_after})`
      })
      setClearAllModalOpen(false)
      await loadElasticsearchStatus()
    } catch (error) {
      toast.error('Elasticsearch temizlenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setOperationLoading(false)
    }
  }

  const handleClearDocument = async () => {
    if (!documentIdToClear.trim()) {
      toast.error('Lütfen doküman ID\'sini giriniz')
      return
    }

    setOperationLoading(true)
    try {
      const result = await clearElasticsearchDocument(documentIdToClear.trim())
      toast.success('Doküman başarıyla silindi', {
        description: `${result.vectors_deleted} vektör silindi (${result.chunks_before} chunk)`
      })
      setClearDocumentModalOpen(false)
      setDocumentIdToClear('')
      await loadElasticsearchStatus()
    } catch (error) {
      toast.error('Doküman silinirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setOperationLoading(false)
    }
  }

  const handleClearMultiple = async () => {
    if (!documentIdsToClear.trim()) {
      toast.error('Lütfen doküman ID\'lerini giriniz')
      return
    }

    const documentIds = documentIdsToClear
      .split('\n')
      .map(id => id.trim())
      .filter(id => id.length > 0)

    if (documentIds.length === 0) {
      toast.error('Geçerli doküman ID\'si bulunamadı')
      return
    }

    setOperationLoading(true)
    try {
      const result = await clearElasticsearchDocuments(documentIds)
      toast.success('Çoklu doküman silme tamamlandı', {
        description: `${result.total_documents} doküman işlendi, ${result.total_vectors_deleted} vektör silindi`
      })
      setClearMultipleModalOpen(false)
      setDocumentIdsToClear('')
      await loadElasticsearchStatus()
    } catch (error) {
      toast.error('Dokümanlar silinirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setOperationLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      healthy: { 
        label: 'Sağlıklı', 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        icon: CheckCircle
      },
      error: { 
        label: 'Hata', 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        icon: XCircle
      }
    }
    
    const statusConfig = config[status as keyof typeof config] || config.error
    const Icon = statusConfig.icon
    
    return (
      <Badge className={cn('px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2', statusConfig.className)}>
        <Icon className="w-4 h-4" />
        {statusConfig.label}
      </Badge>
    )
  }

  const getClusterStatusBadge = (status: string) => {
    const config = {
      green: { label: 'Yeşil', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      yellow: { label: 'Sarı', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      red: { label: 'Kırmızı', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
    }
    
    const statusConfig = config[status as keyof typeof config] || config.red
    
    return (
      <Badge className={cn('px-2 py-1 text-xs font-medium rounded-full', statusConfig.className)}>
        {statusConfig.label}
      </Badge>
    )
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-yellow-600 dark:border-t-yellow-400 mx-auto mb-6"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Database className="w-6 h-6 text-gray-400" />
          </div>
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Elasticsearch Durumu Kontrol Ediliyor</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen bekleyiniz...</p>
      </div>
    )
  }

  if (!elasticsearchStatus) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Elasticsearch durumu yüklenemedi</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Elasticsearch Yönetimi</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Son güncelleme: {formatDate(elasticsearchStatus.timestamp)}
            </span>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cluster Health */}
          <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/10 dark:border-gray-800/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                Cluster Sağlığı
              </h4>
              {getStatusBadge(elasticsearchStatus.connection)}
            </div>

            {elasticsearchStatus.connection === 'healthy' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-xl">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Cluster Durumu</p>
                  {getClusterStatusBadge(elasticsearchStatus.cluster_health.cluster_status)}
                </div>
                <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Cluster Adı</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {elasticsearchStatus.cluster_health.cluster_name}
                  </p>
                </div>
                <div className="p-3 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-xs text-green-600 dark:text-green-400">Vector Boyutu</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {elasticsearchStatus.cluster_health.vector_dimensions}
                  </p>
                </div>
                <div className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                  <p className="text-xs text-purple-600 dark:text-purple-400">Doküman Sayısı</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {elasticsearchStatus.cluster_health.document_count.toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Elasticsearch bağlantı hatası
                </p>
              </div>
            )}
          </div>

          {/* Cluster Info */}
          <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/10 dark:border-gray-800/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Cluster Bilgileri
              </h4>
            </div>

            {elasticsearchStatus.connection === 'healthy' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Toplam Node</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {elasticsearchStatus.cluster_info.total_nodes}
                  </p>
                </div>
                <div className="p-3 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-xs text-green-600 dark:text-green-400">Data Node</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {elasticsearchStatus.cluster_info.data_nodes}
                  </p>
                </div>
                <div className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                  <p className="text-xs text-purple-600 dark:text-purple-400">Index Sayısı</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {elasticsearchStatus.cluster_info.indices_count}
                  </p>
                </div>
                <div className="p-3 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                  <p className="text-xs text-orange-600 dark:text-orange-400">Toplam Shard</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {elasticsearchStatus.cluster_info.total_shards}
                  </p>
                </div>
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">Toplam Doküman</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {elasticsearchStatus.cluster_info.docs_count.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-pink-50/50 dark:bg-pink-900/20 rounded-xl">
                  <p className="text-xs text-pink-600 dark:text-pink-400">Depolama Boyutu</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatBytes(elasticsearchStatus.cluster_info.store_size)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Cluster bilgileri alınamıyor
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Index Information */}
        {elasticsearchStatus.connection === 'healthy' && (
          <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/10 dark:border-gray-800/20">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Index Detayları
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl">
                <h5 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">Index Adı</h5>
                <p className="text-indigo-700 dark:text-indigo-300 font-mono text-sm">
                  {elasticsearchStatus.index_info.index_name}
                </p>
              </div>
              <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">Toplam Doküman</h5>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {elasticsearchStatus.index_info.total_docs.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
                <h5 className="font-medium text-red-900 dark:text-red-100 mb-2">Silinen Doküman</h5>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {elasticsearchStatus.index_info.deleted_docs.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Index Boyutu</h5>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {elasticsearchStatus.index_info.store_size_human}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Document Breakdown */}
        {elasticsearchStatus.connection === 'healthy' && (
          <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/10 dark:border-gray-800/20">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-green-600 dark:text-green-400" />
              Doküman Dağılımı
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Summary */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl text-center">
                    <FileText className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {elasticsearchStatus.document_breakdown.unique_documents}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">Benzersiz Doküman</p>
                  </div>
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl text-center">
                    <Layers className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {elasticsearchStatus.document_breakdown.total_chunks.toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Toplam Chunk</p>
                  </div>
                </div>
              </div>

              {/* Institution Breakdown */}
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">Kurumlara Göre Dağılım</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {elasticsearchStatus.document_breakdown.institutions.map((institution, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{institution.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {institution.chunk_count.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">chunk</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/10 dark:border-gray-800/20">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Temizleme İşlemleri
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
              <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📄 Tek Doküman Sil</h5>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Belirli bir dokümanın tüm vektörlerini ve chunk'larını siler.
              </p>
              <Button
                onClick={() => setClearDocumentModalOpen(true)}
                variant="outline"
                className="w-full bg-blue-100/50 dark:bg-blue-900/30 border-blue-300/50 dark:border-blue-700/50 text-blue-800 dark:text-blue-200 hover:bg-blue-200/50 dark:hover:bg-blue-800/30"
              >
                <FileText className="w-4 h-4 mr-2" />
                Doküman Sil
              </Button>
            </div>

            <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
              <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2">📚 Çoklu Doküman Sil</h5>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                Birden fazla dokümanı toplu olarak siler. ID listesi gerekir.
              </p>
              <Button
                onClick={() => setClearMultipleModalOpen(true)}
                variant="outline"
                className="w-full bg-purple-100/50 dark:bg-purple-900/30 border-purple-300/50 dark:border-purple-700/50 text-purple-800 dark:text-purple-200 hover:bg-purple-200/50 dark:hover:bg-purple-800/30"
              >
                <Layers className="w-4 h-4 mr-2" />
                Çoklu Sil
              </Button>
            </div>

            <div className="p-4 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
              <h5 className="font-medium text-red-900 dark:text-red-100 mb-2">🔥 Tam Sıfırlama</h5>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                <strong>DİKKAT:</strong> TÜM vektör verilerini siler. Geri alınamaz.
              </p>
              <Button
                onClick={() => setClearAllModalOpen(true)}
                variant="destructive"
                className="w-full"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Elasticsearch Sıfırla
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Clear All Modal */}
      <Dialog open={clearAllModalOpen} onOpenChange={setClearAllModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">
              ⚠️ KRİTİK İŞLEM - Elasticsearch Tam Sıfırlama
            </DialogTitle>
            <DialogDescription>
              <strong>TÜM Elasticsearch verilerini</strong> silmek istediğinizden emin misiniz?
              <br />
              <span className="text-red-500 text-sm mt-2 block">
                ❌ Tüm vektörler ve chunk'lar silinecek
              </span>
              <span className="text-red-500 text-sm">
                ❌ Arama işlevselliği tamamen durur
              </span>
              <span className="text-red-500 text-sm">
                ❌ Bu işlem GERİ ALINAMAZ
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClearAllModalOpen(false)}
              disabled={operationLoading}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              disabled={operationLoading}
            >
              {operationLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sıfırlanıyor...
                </div>
              ) : (
                'Elasticsearch\'i Tamamen Sıfırla'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Document Modal */}
      <Dialog open={clearDocumentModalOpen} onOpenChange={setClearDocumentModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-blue-600 dark:text-blue-400">
              Tek Doküman Silme
            </DialogTitle>
            <DialogDescription>
              Belirli bir dokümanın Elasticsearch'teki tüm vektörlerini ve chunk'larını siler.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-id">Doküman ID</Label>
              <Input
                id="document-id"
                placeholder="Doküman ID'sini giriniz"
                value={documentIdToClear}
                onChange={(e) => setDocumentIdToClear(e.target.value)}
                className="bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClearDocumentModalOpen(false)}
              disabled={operationLoading}
            >
              İptal
            </Button>
            <Button
              onClick={handleClearDocument}
              disabled={operationLoading || !documentIdToClear.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {operationLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Siliniyor...
                </div>
              ) : (
                'Dokümanı Sil'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Multiple Documents Modal */}
      <Dialog open={clearMultipleModalOpen} onOpenChange={setClearMultipleModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-purple-600 dark:text-purple-400">
              Çoklu Doküman Silme
            </DialogTitle>
            <DialogDescription>
              Birden fazla dokümanı toplu olarak siler. Her satıra bir doküman ID'si yazınız.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-ids">Doküman ID'leri (Her satıra bir ID)</Label>
              <Textarea
                id="document-ids"
                placeholder={`doc_id_1\ndoc_id_2\ndoc_id_3`}
                value={documentIdsToClear}
                onChange={(e) => setDocumentIdsToClear(e.target.value)}
                rows={6}
                className="bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {documentIdsToClear.split('\n').filter(id => id.trim().length > 0).length} doküman ID'si girildi
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClearMultipleModalOpen(false)}
              disabled={operationLoading}
            >
              İptal
            </Button>
            <Button
              onClick={handleClearMultiple}
              disabled={operationLoading || !documentIdsToClear.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {operationLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Siliniyor...
                </div>
              ) : (
                'Dokümanları Sil'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}