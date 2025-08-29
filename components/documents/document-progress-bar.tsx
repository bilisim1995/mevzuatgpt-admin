"use client"

import { Clock, FileText, CheckCircle, XCircle, Loader2, AlertTriangle, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useDocumentProgress } from "@/hooks/use-document-progress"
import type { DocumentProgress } from "@/hooks/use-document-progress"
import { cn } from "@/lib/utils"

export interface DocumentProgressBarProps {
  taskId: string
  onComplete?: () => void
}

export function DocumentProgressBar({ taskId, onComplete }: DocumentProgressBarProps) {
  const { progress, loading } = useDocumentProgress(taskId)

  if (loading) {
    return (
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/20 dark:border-gray-800/30">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Progress yükleniyor...</span>
        </div>
      </div>
    )
  }

  if (!progress) return null

  // Tamamlandığında callback çağır
  if (progress.status === 'completed' && onComplete) {
    setTimeout(onComplete, 1000)
  }

  const getStatusIcon = (): JSX.Element => {
    switch (progress.status) {
      case 'processing': return <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
      default: return <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const getStatusBadge = () => {
    const config = {
      processing: { label: 'İşleniyor', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      completed: { label: 'Tamamlandı', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      failed: { label: 'Başarısız', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
      pending: { label: 'Bekliyor', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' }
    }
    
    const statusConfig = config[progress.status] || config.processing
    
    return (
      <Badge className={cn('px-2 py-1 text-xs font-medium rounded-full', statusConfig.className)}>
        {statusConfig.label}
      </Badge>
    )
  }

  const getStageText = () => {
    switch (progress.stage) {
      case 'upload': return 'Dosya yükleniyor'
      case 'extract': return 'PDF\'den metin çıkarılıyor'
      case 'chunk': return 'Metin parçalanıyor'
      case 'embed': return 'Vektörler oluşturuluyor'
      case 'storage': return 'Veritabanına kaydediliyor'
      default: return progress.current_step
    }
  }

  const formatRemainingTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} saniye`
    const minutes = Math.ceil(seconds / 60)
    return `${minutes} dakika`
  }

  return (
    <div className={cn(
      "bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30 shadow-lg",
      progress.status === 'failed' && "border-red-300/50 dark:border-red-700/50"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              {progress.document_title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Task ID: {progress.task_id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {progress.progress_percent}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={cn(
        "mb-4",
        progress.status === 'failed' && "opacity-75"
      )}>
        <Progress 
          value={progress.progress_percent} 
          className={cn(
            "h-2 bg-gray-200 dark:bg-gray-700",
            progress.status === 'failed' && "[&>div]:bg-red-500"
          )}
        />
      </div>

      {/* Error Message */}
      {progress.status === 'failed' && progress.error_message && (
        <div className="mb-4 p-3 bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Hata Oluştu</p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                {progress.error_message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {getStageText()}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Adım {progress.completed_steps}/{progress.total_steps}
          </span>
        </div>
        
        {progress.estimated_remaining_seconds && progress.status === 'processing' && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            Kalan süre: {formatRemainingTime(progress.estimated_remaining_seconds)}
          </div>
        )}
        
        {progress.status === 'failed' && (
          <div className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
            <XCircle className="w-3 h-3" />
            {progress.stage} aşamasında başarısız oldu
          </div>
        )}
        
        {progress.status === 'pending' && (
          <div className="flex items-center gap-1 text-xs text-yellow-500 dark:text-yellow-400">
            <Clock className="w-3 h-3" />
            İşlem sıraya alındı, başlatılmayı bekliyor
          </div>
        )}
      </div>
    </div>
  )
}