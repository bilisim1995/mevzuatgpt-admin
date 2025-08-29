"use client"

import { useState, useEffect } from "react"
import { Activity, Database, Server, RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock, Users, HardDrive, AlertCircle, Zap, Mail, Bot, Cloud, BarChart3, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getSystemHealth } from "@/lib/system-health"
import { SystemHealthData } from "@/types/system-health"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function SystemHealthPanel() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [elasticsearchModalOpen, setElasticsearchModalOpen] = useState(false)

  useEffect(() => {
    loadSystemHealth()
  }, [])

  const loadSystemHealth = async () => {
    try {
      if (!healthData) setLoading(true)
      const response = await getSystemHealth()
      setHealthData(response.data)
    } catch (error) {
      console.error('Sistem sağlığı yüklenirken hata:', error)
      toast.error('Sistem sağlığı yüklenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSystemHealth()
    setRefreshing(false)
    toast.success('Sistem sağlığı güncellendi')
  }

  const getOverallHealthBadge = (status: string) => {
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
      degraded: { 
        label: 'Bozulmuş', 
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
        icon: AlertTriangle
      },
      critical: { 
        label: 'Kritik', 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        icon: XCircle
      }
    }
    
    const healthConfig = config[status as keyof typeof config] || config.critical
    const Icon = healthConfig.icon
    
    return (
      <Badge className={cn('px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2', healthConfig.className)}>
        <Icon className="w-4 h-4" />
        {healthConfig.label}
      </Badge>
    )
  }

  const getComponentStatusBadge = (status: string) => {
    const config = {
      healthy: { label: 'Sağlıklı', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
      warning: { label: 'Uyarı', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: AlertTriangle },
      error: { label: 'Hata', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: XCircle },
      not_configured: { label: 'Yapılandırılmamış', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: Settings }
    }
    
    const statusConfig = config[status as keyof typeof config] || config.error
    const Icon = statusConfig.icon
    
    return (
      <Badge className={cn('px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1', statusConfig.className)}>
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </Badge>
    )
  }

  const getClusterStatusBadge = (status?: string) => {
    if (!status) return null
    
    const config = {
      green: { label: 'Yeşil', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      yellow: { label: 'Sarı', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      red: { label: 'Kırmızı', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
    }
    
    const statusConfig = config[status as keyof typeof config] || config.red
    
    return (
      <Badge variant="outline" className={cn('px-2 py-1 text-xs font-medium rounded-full', statusConfig.className)}>
        {statusConfig.label}
      </Badge>
    )
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

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    return `${days}g ${hours}s`
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          <div className="text-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-green-600 dark:border-t-green-400 mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Sistem Sağlığı Kontrol Ediliyor</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen bekleyiniz...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!healthData) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Sistem sağlığı verileri yüklenemedi</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-600/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sistem Sağlığı</h2>
              <p className="text-gray-600 dark:text-gray-400">Tüm sistem bileşenlerinin durumunu izleyin</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {getOverallHealthBadge(healthData.overall_status)}
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="h-10 px-4 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl hover:bg-white/70 dark:hover:bg-black/50 transition-all duration-300"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Son Kontrol</h4>
            </div>
            <p className="text-blue-700 dark:text-blue-300">{formatDate(healthData.timestamp)}</p>
          </div>
          <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="font-semibold text-purple-900 dark:text-purple-100">Yanıt Süresi</h4>
            </div>
            <p className="text-purple-700 dark:text-purple-300">{healthData.response_time_ms.toFixed(1)}ms</p>
          </div>
          <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-green-900 dark:text-green-100">Genel Durum</h4>
            </div>
            {getOverallHealthBadge(healthData.overall_status)}
          </div>
        </div>
      </div>

      {/* Component Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Database */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Database</h3>
            </div>
            {getComponentStatusBadge(healthData.components.database.status)}
          </div>

          {healthData.components.database.status === 'healthy' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Bağlantı</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.database.connection_time_ms?.toFixed(1)}ms
                  </p>
                </div>
                <div className="p-2 bg-green-50/50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400">Sağlayıcı</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.database.provider}
                  </p>
                </div>
                <div className="p-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs text-purple-600 dark:text-purple-400">Dokümanlar</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.database.total_documents?.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-xs text-orange-600 dark:text-orange-400">Kullanıcılar</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.database.total_users?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {healthData.components.database.error || 'Bağlantı hatası'}
              </p>
            </div>
          )}
        </div>

        {/* Redis */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-600/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Redis</h3>
            </div>
            {getComponentStatusBadge(healthData.components.redis.status)}
          </div>

          {healthData.components.redis.status === 'healthy' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-xs text-red-600 dark:text-red-400">Ping</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.redis.ping_time_ms?.toFixed(1)}ms
                  </p>
                </div>
                <div className="p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Bellek</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.redis.memory_usage_mb?.toFixed(1)}MB
                  </p>
                </div>
                <div className="p-2 bg-green-50/50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400">Bağlantılar</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.redis.connected_clients}
                  </p>
                </div>
                <div className="p-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs text-purple-600 dark:text-purple-400">Uptime</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.redis.uptime_seconds ? formatUptime(healthData.components.redis.uptime_seconds) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {healthData.components.redis.error || 'Bağlantı hatası'}
              </p>
            </div>
          )}
        </div>

        {/* Elasticsearch */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-600/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Elasticsearch</h3>
            </div>
            <div className="flex items-center gap-2">
              {getComponentStatusBadge(healthData.components.elasticsearch.status)}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setElasticsearchModalOpen(true)}
                className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
              >
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </Button>
            </div>
          </div>

          {healthData.components.elasticsearch.status === 'healthy' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Cluster</p>
                  {getClusterStatusBadge(healthData.components.elasticsearch.cluster_status)}
                </div>
                <div className="p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Dokümanlar</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.elasticsearch.document_count?.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-green-50/50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400">Vector Boyutu</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.elasticsearch.vector_dimensions}
                  </p>
                </div>
                <div className="p-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs text-purple-600 dark:text-purple-400">Cluster Adı</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {healthData.components.elasticsearch.cluster_name}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {healthData.components.elasticsearch.error || 'Cluster hatası'}
              </p>
            </div>
          )}
        </div>

        {/* Celery */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-teal-600/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Celery</h3>
            </div>
            {getComponentStatusBadge(healthData.components.celery.status)}
          </div>

          {healthData.components.celery.status === 'healthy' || healthData.components.celery.status === 'warning' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-green-50/50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400">Aktif Worker</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.celery.active_workers}
                  </p>
                </div>
                <div className="p-2 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Bekleyen</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.celery.pending_tasks}
                  </p>
                </div>
                {healthData.components.celery.completed_tasks_today !== undefined && (
                  <div className="p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Tamamlanan</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {healthData.components.celery.completed_tasks_today}
                    </p>
                  </div>
                )}
                {healthData.components.celery.failed_tasks_today !== undefined && (
                  <div className="p-2 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-xs text-red-600 dark:text-red-400">Başarısız</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {healthData.components.celery.failed_tasks_today}
                    </p>
                  </div>
                )}
              </div>
              {healthData.components.celery.error && (
                <div className="p-3 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {healthData.components.celery.error}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {healthData.components.celery.error || 'Worker hatası'}
              </p>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-600/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email</h3>
            </div>
            {getComponentStatusBadge(healthData.components.email.status)}
          </div>

          {healthData.components.email.status === 'healthy' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-2 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">Sağlayıcı</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.email.provider}
                  </p>
                </div>
                <div className="p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">API Yanıt Süresi</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.email.api_response_time_ms?.toFixed(1)}ms
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {healthData.components.email.error || 'Email servisi hatası'}
              </p>
            </div>
          )}
        </div>

        {/* AI Services */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Services</h3>
            </div>
          </div>

          <div className="space-y-3">
            {/* OpenAI */}
            <div className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">OpenAI</h4>
                {getComponentStatusBadge(healthData.components.ai_services.openai.status)}
              </div>
              {healthData.components.ai_services.openai.status === 'healthy' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Model</p>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {healthData.components.ai_services.openai.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Yanıt Süresi</p>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {healthData.components.ai_services.openai.api_response_time_ms?.toFixed(1)}ms
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-red-700 dark:text-red-300">
                  {healthData.components.ai_services.openai.error || 'Servis kullanılamıyor'}
                </p>
              )}
            </div>

            {/* Groq */}
            <div className="p-3 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100">Groq</h4>
                {getComponentStatusBadge(healthData.components.ai_services.groq.status)}
              </div>
              {healthData.components.ai_services.groq.status === 'healthy' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-orange-600 dark:text-orange-400">Model</p>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {healthData.components.ai_services.groq.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-orange-600 dark:text-orange-400">Yanıt Süresi</p>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {healthData.components.ai_services.groq.api_response_time_ms?.toFixed(1)}ms
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-red-700 dark:text-red-300">
                  {healthData.components.ai_services.groq.error || 'Servis kullanılamıyor'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Storage</h3>
            </div>
            {getComponentStatusBadge(healthData.components.storage.status)}
          </div>

          {healthData.components.storage.status === 'healthy' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-cyan-50/50 dark:bg-cyan-900/20 rounded-lg">
                  <p className="text-xs text-cyan-600 dark:text-cyan-400">Sağlayıcı</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.storage.provider}
                  </p>
                </div>
                <div className="p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Dosyalar</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.storage.total_files?.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-green-50/50 dark:bg-green-900/20 rounded-lg col-span-2">
                  <p className="text-xs text-green-600 dark:text-green-400">Kullanılan Alan</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.storage.storage_used_gb?.toFixed(1)} GB
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {healthData.components.storage.error || 'Storage hatası'}
              </p>
            </div>
          )}
        </div>

        {/* API */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API</h3>
            </div>
            {getComponentStatusBadge(healthData.components.api.status)}
          </div>

          {healthData.components.api.status === 'healthy' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Ortalama Yanıt</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.api.avg_response_time_ms?.toFixed(1)}ms
                  </p>
                </div>
                <div className="p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Son 1 Saat</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.api.requests_last_hour} istek
                  </p>
                </div>
                <div className="p-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs text-purple-600 dark:text-purple-400">Güvenilirlik</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    %{healthData.components.api.avg_reliability_score?.toFixed(1)}
                  </p>
                </div>
                <div className="p-2 bg-green-50/50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400">Uptime</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {healthData.components.api.uptime_status}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {healthData.components.api.error || 'API hatası'}
              </p>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Elasticsearch Details Modal */}
      <Dialog open={elasticsearchModalOpen} onOpenChange={setElasticsearchModalOpen}>
      <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            Elasticsearch Cluster Detayları
          </DialogTitle>
        </DialogHeader>
        {healthData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-xl">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Cluster Durumu</h4>
                <div className="space-y-2">
                  {healthData.components.elasticsearch.status === 'healthy' ? (
                    <div>
                      {getClusterStatusBadge(healthData.components.elasticsearch.cluster_status)}
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                        {healthData.components.elasticsearch.cluster_status === 'green' ? 
                          '🟢 Tüm shardlar aktif ve çalışıyor' : 
                          healthData.components.elasticsearch.cluster_status === 'yellow' ? 
                          '🟡 Replica shardlar eksik, veri güvenliği risk altında' : 
                          '🔴 Primary shardlar eksik, veri kaybı riski var'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        ❌ {healthData.components.elasticsearch.error || 'Cluster bağlantı hatası'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Cluster Bilgileri</h4>
                {healthData.components.elasticsearch.status === 'healthy' ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Cluster Adı</p>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {healthData.components.elasticsearch.cluster_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Son Kontrol</p>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {formatDate(healthData.components.elasticsearch.last_check)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Bilgi alınamıyor</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Doküman İstatistikleri</h4>
                {healthData.components.elasticsearch.status === 'healthy' ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400">Toplam Doküman</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {healthData.components.elasticsearch.document_count?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400">Vector Boyutu</p>
                      <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                        {healthData.components.elasticsearch.vector_dimensions} dim
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Veri alınamıyor</p>
                )}
              </div>
              <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Sistem Durumu</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Genel Durum</p>
                    {getComponentStatusBadge(healthData.components.elasticsearch.status)}
                  </div>
                  {healthData.components.elasticsearch.status === 'healthy' && (
                    <div className="mt-3 p-2 bg-green-100/50 dark:bg-green-900/30 rounded-lg">
                      <p className="text-xs text-green-700 dark:text-green-300">
                        ✅ Elasticsearch cluster normal çalışıyor
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Cluster Durumu Açıklamaları</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Yeşil:</strong> Tüm primary ve replica shardlar aktif
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Sarı:</strong> Tüm primary shardlar aktif, bazı replica shardlar eksik
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Kırmızı:</strong> Bazı primary shardlar eksik, veri kaybı riski
                  </span>
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