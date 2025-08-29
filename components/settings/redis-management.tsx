"use client"

import { useState, useEffect } from "react"
import { Database, RefreshCw, Trash2, AlertTriangle, CheckCircle, Clock, Users, HardDrive, Activity, Zap, BarChart3, XCircle, Server, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getSystemStatus, clearTasks, clearAllRedis, purgeCeleryQueue, clearActiveTasks, getRedisConnections, restartCeleryWorker } from "@/lib/redis"
import { RedisSystemStatus } from "@/types/redis"
import { RedisConnectionInfo } from "@/types/redis"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function RedisManagement() {
  const [systemStatus, setSystemStatus] = useState<RedisSystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [clearTasksModalOpen, setClearTasksModalOpen] = useState(false)
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false)
  const [purgeQueueModalOpen, setPurgeQueueModalOpen] = useState(false)
  const [clearActiveModalOpen, setClearActiveModalOpen] = useState(false)
  const [restartWorkerModalOpen, setRestartWorkerModalOpen] = useState(false)
  const [operationLoading, setOperationLoading] = useState(false)
  const [connectionModalOpen, setConnectionModalOpen] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState<RedisConnectionInfo | null>(null)

  useEffect(() => {
    loadSystemStatus()
  }, [])

  const loadSystemStatus = async () => {
    try {
      if (!systemStatus) setLoading(true)
      const data = await getSystemStatus()
      setSystemStatus(data)
    } catch (error) {
      console.error('Sistem durumu yüklenirken hata:', error)
      toast.error('Sistem durumu yüklenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSystemStatus()
    setRefreshing(false)
    toast.success('Sistem durumu güncellendi')
  }

  const handleClearTasks = async () => {
    setOperationLoading(true)
    try {
      const result = await clearTasks()
      toast.success('Task\'lar başarıyla temizlendi', {
        description: `${result.total_deleted} adet key silindi (Progress: ${result.progress_deleted}, Celery: ${result.celery_deleted}, Kombu: ${result.kombu_deleted})`
      })
      setClearTasksModalOpen(false)
      await loadSystemStatus()
    } catch (error) {
      toast.error('Task\'lar temizlenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setOperationLoading(false)
    }
  }

  const handleClearAll = async () => {
    setOperationLoading(true)
    try {
      const result = await clearAllRedis()
      toast.success('Redis tamamen temizlendi', {
        description: `${result.cleared_count} adet key silindi (Önceki: ${result.keys_before}, Sonraki: ${result.keys_after})`
      })
      setClearAllModalOpen(false)
      await loadSystemStatus()
    } catch (error) {
      toast.error('Redis temizlenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setOperationLoading(false)
    }
  }

  const handlePurgeQueue = async () => {
    setOperationLoading(true)
    try {
      const result = await purgeCeleryQueue()
      toast.success('Celery queue temizlendi', {
        description: `${result.cleared_count} adet task silindi`
      })
      setPurgeQueueModalOpen(false)
      await loadSystemStatus()
    } catch (error) {
      toast.error('Queue temizlenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setOperationLoading(false)
    }
  }

  const handleClearActive = async () => {
    setOperationLoading(true)
    try {
      const result = await clearActiveTasks()
      toast.success('Aktif task\'lar temizlendi', {
        description: `${result.revoked_count} task iptal edildi, ${result.worker_count} worker etkilendi`
      })
      setClearActiveModalOpen(false)
      await loadSystemStatus()
    } catch (error) {
      toast.error('Aktif task\'lar temizlenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setOperationLoading(false)
    }
  }

  const handleRestartWorker = async () => {
    setOperationLoading(true)
    try {
      const result = await restartCeleryWorker()
      toast.success('Celery worker yeniden başlatıldı', {
        description: `Worker durumu: ${result.worker_status}, Önceki: ${result.workers_before}, Sonraki: ${result.workers_after}`
      })
      setRestartWorkerModalOpen(false)
      await loadSystemStatus()
    } catch (error) {
      toast.error('Worker yeniden başlatılırken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setOperationLoading(false)
    }
  }

  const handleShowConnectionDetails = async () => {
    try {
      setConnectionModalOpen(true)
      const data = await getRedisConnections()
      setConnectionInfo(data)
    } catch (error) {
      toast.error('Redis bağlantı bilgileri alınırken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      healthy: { 
        label: 'Sağlıklı', 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        icon: CheckCircle
      },
      warning: { 
        label: 'Uyarı', 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        icon: AlertTriangle
      },
      error: { 
        label: 'Hata', 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        icon: AlertTriangle
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

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}g ${hours}s ${minutes}d`
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-red-600 dark:border-t-red-400 mx-auto mb-6"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Database className="w-6 h-6 text-gray-400" />
          </div>
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Sistem Durumu Kontrol Ediliyor</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen bekleyiniz...</p>
      </div>
    )
  }

  if (!systemStatus) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Sistem durumu yüklenemedi</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Redis & Celery Yönetimi</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Son güncelleme: {formatDate(systemStatus.timestamp)}
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
            <Button
              onClick={handleShowConnectionDetails}
              variant="outline"
              size="sm"
              className="bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
            >
              <Database className="w-4 h-4 mr-2" />
              Detaylı Bilgi
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Redis Status */}
          <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/10 dark:border-gray-800/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-red-600 dark:text-red-400" />
                Redis Durumu
              </h4>
              {getStatusBadge(systemStatus.redis.status)}
            </div>

            {systemStatus.redis.status === 'healthy' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
                  <p className="text-xs text-red-600 dark:text-red-400">Toplam Key</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {systemStatus.redis.total_keys || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Bellek Kullanımı</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {systemStatus.redis.memory_usage_mb.toFixed(1)}MB
                  </p>
                </div>
                <div className="p-3 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-xs text-green-600 dark:text-green-400">Bağlı İstemciler</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {systemStatus.redis.connected_clients}
                  </p>
                </div>
                <div className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                  <p className="text-xs text-purple-600 dark:text-purple-400">Uptime</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatUptime(systemStatus.redis.uptime_seconds)}
                  </p>
                </div>
                <div className="p-3 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                  <p className="text-xs text-orange-600 dark:text-orange-400">Task Progress</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {systemStatus.redis.active_task_progress || 0}
                  </p>
                </div>
                <div className="p-3 bg-pink-50/50 dark:bg-pink-900/20 rounded-xl">
                  <p className="text-xs text-pink-600 dark:text-pink-400">User Histories</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {systemStatus.redis.user_histories || 0}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {systemStatus.redis.error || 'Redis bağlantı hatası'}
                </p>
              </div>
            )}
          </div>

          {/* Celery Status */}
          <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/10 dark:border-gray-800/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                Celery Durumu
              </h4>
              <div className="flex items-center gap-2">
                {getStatusBadge(systemStatus.celery.status)}
                <Button
                  onClick={() => setRestartWorkerModalOpen(true)}
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-lg hover:bg-white/70 dark:hover:bg-black/50 transition-all duration-300"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Restart
                </Button>
              </div>
            </div>

            {systemStatus.celery.status === 'healthy' || systemStatus.celery.status === 'warning' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-xl">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 break-words">Zamanlanmış</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {systemStatus.celery.pending_tasks || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                  <div className="flex items-center gap-1 mb-1">
                    <Activity className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <p className="text-xs text-green-600 dark:text-green-400">Worker</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {systemStatus.celery.active_workers}
                  </p>
                </div>
                <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-xs text-blue-600 dark:text-blue-400 break-words">Aktif Task</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {systemStatus.celery.active_tasks || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                  <p className="text-xs text-purple-600 dark:text-purple-400 break-words">Worker Adları</p>
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    {systemStatus.celery.worker_names && systemStatus.celery.worker_names.length > 0 ? (
                      <div className="space-y-1">
                        {systemStatus.celery.worker_names.map((worker, index) => (
                          <div key={index} className="bg-purple-100/50 dark:bg-purple-800/30 px-2 py-1 rounded">
                            {worker}
                          </div>
                        ))}
                      </div>
                    ) : (
                      'Worker yok'
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50/50 dark:bg-red-900/20 rounded-xl border border-red-200/50 dark:border-red-800/30">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">Celery Bağlantı Hatası</h5>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {systemStatus.celery.error || 'Celery worker hatası'}
                </p>
                    <div className="mt-3 p-2 bg-red-100/50 dark:bg-red-800/20 rounded-lg">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        💡 <strong>Çözüm önerileri:</strong>
                      </p>
                      <ul className="text-xs text-red-600 dark:text-red-400 mt-1 space-y-1">
                        <li>• Celery worker'ların çalıştığından emin olun</li>
                        <li>• Redis bağlantısını kontrol edin</li>
                        <li>• Worker'ları yeniden başlatmayı deneyin</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/10 dark:border-gray-800/20">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Temizleme İşlemleri
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-xl">
              <h5 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">🧹 Task Temizleme</h5>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                Sadece task progress key'lerini ve Celery meta data'larını temizler. Kullanıcı verileri korunur.
              </p>
              <Button
                onClick={() => setClearTasksModalOpen(true)}
                variant="outline"
                className="w-full bg-yellow-100/50 dark:bg-yellow-900/30 border-yellow-300/50 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200/50 dark:hover:bg-yellow-800/30"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Task'ları Temizle
              </Button>
            </div>

            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
              <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🗂️ Queue Temizleme</h5>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Bekleyen tüm Celery task'larını siler. Queue'ları boşaltır ve işlem yapılmayan task'ları temizler.
              </p>
              <Button
                onClick={() => setPurgeQueueModalOpen(true)}
                variant="outline"
                className="w-full bg-blue-100/50 dark:bg-blue-900/30 border-blue-300/50 dark:border-blue-700/50 text-blue-800 dark:text-blue-200 hover:bg-blue-200/50 dark:hover:bg-blue-800/30"
              >
                <Activity className="w-4 h-4 mr-2" />
                Queue'yu Temizle
              </Button>
            </div>

            <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
              <h5 className="font-medium text-orange-900 dark:text-orange-100 mb-2">⚡ Aktif Task Temizleme</h5>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                Şu anda çalışan aktif task'ları iptal eder. Worker'ları yeniden başlatır.
              </p>
              <Button
                onClick={() => setClearActiveModalOpen(true)}
                variant="outline"
                className="w-full bg-orange-100/50 dark:bg-orange-900/30 border-orange-300/50 dark:border-orange-700/50 text-orange-800 dark:text-orange-200 hover:bg-orange-200/50 dark:hover:bg-orange-800/30"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Aktif Task'ları İptal Et
              </Button>
            </div>
            <div className="p-4 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
              <h5 className="font-medium text-red-900 dark:text-red-100 mb-2">🔥 Tam Sıfırlama</h5>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                <strong>DİKKAT:</strong> TÜM Redis verilerini siler. Kullanıcı geçmişleri dahil herşey silinir.
              </p>
              <Button
                onClick={() => setClearAllModalOpen(true)}
                variant="destructive"
                className="w-full"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Redis'i Sıfırla
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Tasks Modal */}
      <Dialog open={clearTasksModalOpen} onOpenChange={setClearTasksModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-yellow-600 dark:text-yellow-400">
              Task Temizleme Onayı
            </DialogTitle>
            <DialogDescription>
              Sadece task progress key'lerini ve Celery meta data'larını temizlemek istediğinizden emin misiniz?
              <br />
              <span className="text-green-600 text-sm mt-2 block">
                ✅ Kullanıcı verileri korunacak
              </span>
              <span className="text-yellow-600 text-sm">
                🧹 Progress tracking verileri silinecek
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClearTasksModalOpen(false)}
              disabled={operationLoading}
            >
              İptal
            </Button>
            <Button
              onClick={handleClearTasks}
              disabled={operationLoading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {operationLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Temizleniyor...
                </div>
              ) : (
                'Task\'ları Temizle'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Modal */}
      <Dialog open={clearAllModalOpen} onOpenChange={setClearAllModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">
              ⚠️ KRİTİK İŞLEM - Redis Tam Sıfırlama
            </DialogTitle>
            <DialogDescription>
              <strong>TÜM Redis verilerini</strong> silmek istediğinizden emin misiniz?
              <br />
              <span className="text-red-500 text-sm mt-2 block">
                ❌ Kullanıcı geçmişleri dahil HERŞEY silinecek
              </span>
              <span className="text-red-500 text-sm">
                ❌ Cache'ler ve session'lar tamamen temizlenecek
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
                'Redis\'i Tamamen Sıfırla'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purge Queue Modal */}
      <Dialog open={purgeQueueModalOpen} onOpenChange={setPurgeQueueModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-blue-600 dark:text-blue-400">
              Celery Queue Temizleme Onayı
            </DialogTitle>
            <DialogDescription>
              Bekleyen tüm Celery task'larını silmek istediğinizden emin misiniz?
              <br />
              <span className="text-blue-600 text-sm mt-2 block">
                🗂️ Queue'lar boşaltılacak
              </span>
              <span className="text-blue-600 text-sm">
                🔄 İşlem yapılmayan task'lar temizlenecek
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPurgeQueueModalOpen(false)}
              disabled={operationLoading}
            >
              İptal
            </Button>
            <Button
              onClick={handlePurgeQueue}
              disabled={operationLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {operationLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Temizleniyor...
                </div>
              ) : (
                'Queue\'yu Temizle'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Active Tasks Modal */}
      <Dialog open={clearActiveModalOpen} onOpenChange={setClearActiveModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-orange-600 dark:text-orange-400">
              Aktif Task Temizleme Onayı
            </DialogTitle>
            <DialogDescription>
              Şu anda çalışan aktif task'ları iptal etmek istediğinizden emin misiniz?
              <br />
              <span className="text-orange-600 text-sm mt-2 block">
                ⚡ Aktif task'lar iptal edilecek
              </span>
              <span className="text-orange-600 text-sm">
                🔄 Worker'lar yeniden başlatılacak
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClearActiveModalOpen(false)}
              disabled={operationLoading}
            >
              İptal
            </Button>
            <Button
              onClick={handleClearActive}
              disabled={operationLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {operationLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  İptal Ediliyor...
                </div>
              ) : (
                'Aktif Task\'ları İptal Et'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redis Connection Details Modal */}
      <Dialog open={connectionModalOpen} onOpenChange={setConnectionModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-red-600 dark:text-red-400" />
              Redis Detaylı Bağlantı Bilgileri
            </DialogTitle>
          </DialogHeader>
          {connectionInfo ? (
            <div className="space-y-6">
              {/* Server Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Redis Versiyonu
                  </h4>
                  <p className="text-red-700 dark:text-red-300">{connectionInfo.server_info?.redis_version || 'N/A'}</p>
                </div>
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Uptime (Gün)
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300">{connectionInfo.server_info?.uptime_days || 0} gün</p>
                </div>
                <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Uptime (Saniye)
                  </h4>
                  <p className="text-green-700 dark:text-green-300">
                    {connectionInfo.server_info?.uptime_seconds?.toLocaleString() || '0'}s
                  </p>
                </div>
              </div>

              {/* Memory Info */}
              <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/10 dark:border-gray-800/20">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Bellek Kullanımı
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                    <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Kullanılan Bellek</h5>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {connectionInfo.memory_info?.used_memory_human || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                    <h5 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Peak Bellek</h5>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {connectionInfo.memory_info?.used_memory_peak_human || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-pink-50/50 dark:bg-pink-900/20 rounded-xl">
                    <h5 className="font-medium text-pink-900 dark:text-pink-100 mb-2">RSS Bellek</h5>
                    <p className="text-2xl font-bold text-pink-700 dark:text-pink-300">
                      {connectionInfo.memory_info?.used_memory_rss_human || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Max Bellek</h5>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {connectionInfo.memory_info?.maxmemory_human || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Connection Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/10 dark:border-gray-800/20">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Bağlantı Detayları
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                      <p className="text-xs text-blue-600 dark:text-blue-400">Bağlı Client</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {connectionInfo.connection_info?.connected_clients || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
                      <p className="text-xs text-red-600 dark:text-red-400">Bloklanmış Client</p>
                      <p className="text-lg font-bold text-red-700 dark:text-red-300">
                        {connectionInfo.connection_info?.blocked_clients || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                      <p className="text-xs text-green-600 dark:text-green-400">Input Buffer</p>
                      <p className="text-sm font-bold text-green-700 dark:text-green-300">
                        {connectionInfo.connection_info?.client_recent_max_input_buffer || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                      <p className="text-xs text-purple-600 dark:text-purple-400">Output Buffer</p>
                      <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                        {connectionInfo.connection_info?.client_recent_max_output_buffer || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/10 dark:border-gray-800/20">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Network İstatistikleri
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                      <span className="text-sm text-blue-900 dark:text-blue-100">Toplam Bağlantı</span>
                      <span className="font-bold text-blue-700 dark:text-blue-300">
                        {connectionInfo.network_info?.total_connections_received?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                      <span className="text-sm text-green-900 dark:text-green-100">İşlenen Komut</span>
                      <span className="font-bold text-green-700 dark:text-green-300">
                        {connectionInfo.network_info?.total_commands_processed?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
                      <span className="text-sm text-red-900 dark:text-red-100">Reddedilen Bağlantı</span>
                      <span className="font-bold text-red-700 dark:text-red-300">
                        {connectionInfo.network_info?.rejected_connections?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Keyspace and Performance Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/10 dark:border-gray-800/20">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Keyspace Bilgileri
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-900 dark:text-blue-100">Toplam Key</span>
                        <span className="font-bold text-blue-700 dark:text-blue-300">
                          {connectionInfo.keyspace_info?.total_keys?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-yellow-900 dark:text-yellow-100">Task Progress</span>
                        <span className="font-bold text-yellow-700 dark:text-yellow-300">
                          {connectionInfo.keyspace_info?.active_task_progress?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-900 dark:text-green-100">User Histories</span>
                        <span className="font-bold text-green-700 dark:text-green-300">
                          {connectionInfo.keyspace_info?.user_histories?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-purple-900 dark:text-purple-100">Cache Keys</span>
                        <span className="font-bold text-purple-700 dark:text-purple-300">
                          {connectionInfo.keyspace_info?.cache_keys?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/10 dark:border-gray-800/20">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Performans Bilgileri
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                      <span className="text-sm text-blue-900 dark:text-blue-100">Keyspace Hits</span>
                      <span className="font-bold text-blue-700 dark:text-blue-300">
                        {connectionInfo.performance_info?.keyspace_hits?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
                      <span className="text-sm text-red-900 dark:text-red-100">Keyspace Misses</span>
                      <span className="font-bold text-red-700 dark:text-red-300">
                        {connectionInfo.performance_info?.keyspace_misses?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                      <span className="text-sm text-green-900 dark:text-green-100">Hit Rate</span>
                      <span className="font-bold text-green-700 dark:text-green-300">
                        %{connectionInfo.performance_info?.hit_rate?.toFixed(1) || '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                      <span className="text-sm text-purple-900 dark:text-purple-100">Ops/Sec</span>
                      <span className="font-bold text-purple-700 dark:text-purple-300">
                        {connectionInfo.performance_info?.ops_per_sec?.toFixed(1) || '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200 mx-auto mb-4"></div>
              <p>Bağlantı bilgileri yükleniyor...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restart Worker Modal */}
      <Dialog open={restartWorkerModalOpen} onOpenChange={setRestartWorkerModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-green-600 dark:text-green-400">
              Celery Worker Yeniden Başlatma
            </DialogTitle>
            <DialogDescription>
              Celery worker'ları yeniden başlatmak istediğinizden emin misiniz?
              <br />
              <span className="text-green-600 text-sm mt-2 block">
                🔄 Worker'lar yeniden başlatılacak
              </span>
              <span className="text-blue-600 text-sm">
                ⚡ Aktif task'lar güvenli şekilde tamamlanacak
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestartWorkerModalOpen(false)}
              disabled={operationLoading}
            >
              İptal
            </Button>
            <Button
              onClick={handleRestartWorker}
              disabled={operationLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {operationLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Yeniden Başlatılıyor...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Worker'ları Yeniden Başlat
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}