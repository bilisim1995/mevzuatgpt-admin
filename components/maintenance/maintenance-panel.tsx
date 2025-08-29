"use client"

import { useState, useEffect } from "react"
import { Settings, Power, PowerOff, Clock, AlertTriangle, CheckCircle, Calendar, Save, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { getMaintenanceStatus, updateMaintenanceMode } from "@/lib/maintenance"
import { MaintenanceMode, MaintenanceUpdateData } from "@/types/maintenance"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function MaintenancePanel() {
  const [maintenance, setMaintenance] = useState<MaintenanceMode | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  const [formData, setFormData] = useState({
    is_enabled: false,
    title: '',
    message: '',
    start_time: '',
    end_time: ''
  })

  useEffect(() => {
    loadMaintenanceStatus()
  }, [])

  useEffect(() => {
    if (maintenance) {
      setFormData({
        is_enabled: maintenance.is_enabled,
        title: maintenance.title,
        message: maintenance.message,
        start_time: maintenance.start_time ? new Date(maintenance.start_time).toISOString().slice(0, 16) : '',
        end_time: maintenance.end_time ? new Date(maintenance.end_time).toISOString().slice(0, 16) : ''
      })
    }
  }, [maintenance])

  const loadMaintenanceStatus = async () => {
    try {
      setLoading(true)
      const data = await getMaintenanceStatus()
      setMaintenance(data)
    } catch (error) {
      console.error('Bakım durumu yüklenirken hata:', error)
      toast.error('Bakım durumu yüklenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMaintenanceStatus()
    setRefreshing(false)
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Lütfen başlık ve mesaj alanlarını doldurunuz')
      return
    }

    setUpdating(true)

    try {
      const updateData: MaintenanceUpdateData = {
        is_enabled: formData.is_enabled,
        title: formData.title.trim(),
        message: formData.message.trim(),
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : null,
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null
      }

      const updatedMaintenance = await updateMaintenanceMode(updateData)
      setMaintenance(updatedMaintenance)
      
      toast.success('Bakım modu başarıyla güncellendi', {
        description: formData.is_enabled ? 'Bakım modu aktif edildi' : 'Bakım modu devre dışı bırakıldı'
      })
    } catch (error) {
      toast.error('Bakım modu güncellenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (isEnabled: boolean) => {
    return (
      <Badge className={cn(
        'px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2',
        isEnabled 
          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      )}>
        {isEnabled ? (
          <>
            <AlertTriangle className="w-4 h-4" />
            Bakım Modunda
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            Aktif
          </>
        )}
      </Badge>
    )
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          <div className="text-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Settings className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Bakım Durumu Yükleniyor</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen bekleyiniz...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 flex items-center justify-center">
              <Settings className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bakım Modu Yönetimi</h2>
              <p className="text-gray-600 dark:text-gray-400">Sistem bakım durumunu kontrol edin</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {maintenance && getStatusBadge(maintenance.is_enabled)}
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

        {/* Current Status */}
        {maintenance && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Mevcut Başlık</h4>
              <p className="text-blue-700 dark:text-blue-300">{maintenance.title}</p>
            </div>
            <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Son Güncelleme</h4>
              <p className="text-green-700 dark:text-green-300">{formatDate(maintenance.updated_at)}</p>
            </div>
            {maintenance.start_time && (
              <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Başlangıç Zamanı
                </h4>
                <p className="text-purple-700 dark:text-purple-300">{formatDate(maintenance.start_time)}</p>
              </div>
            )}
            {maintenance.end_time && (
              <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Bitiş Zamanı
                </h4>
                <p className="text-orange-700 dark:text-orange-300">{formatDate(maintenance.end_time)}</p>
              </div>
            )}
          </div>
        )}

        {/* Current Message */}
        {maintenance && (
          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl mb-8">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Mevcut Mesaj</h4>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{maintenance.message}</p>
          </div>
        )}
      </div>

      {/* Update Form */}
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Power className="w-5 h-5" />
          Bakım Modu Ayarları
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Enable/Disable Switch */}
          <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
            <div className="flex items-center gap-3">
              {formData.is_enabled ? (
                <PowerOff className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : (
                <Power className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
              <div>
                <Label htmlFor="is_enabled" className="text-base font-medium text-gray-900 dark:text-white">
                  Bakım Modu
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.is_enabled ? 'Sistem bakım modunda' : 'Sistem normal çalışıyor'}
                </p>
              </div>
            </div>
            <Switch
              id="is_enabled"
              checked={formData.is_enabled}
              onCheckedChange={(checked) => handleInputChange('is_enabled', checked)}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Başlık *
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Bakım modu başlığını giriniz"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              maxLength={200}
              className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formData.title.length}/200 karakter
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mesaj *
            </Label>
            <Textarea
              id="message"
              placeholder="Kullanıcılara gösterilecek mesajı giriniz..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              required
              rows={4}
              className="bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl resize-none"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start_time" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Başlangıç Zamanı
              </Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Bitiş Zamanı
              </Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end pt-6 border-t border-gray-200/20 dark:border-gray-700/20">
            <Button
              type="submit"
              disabled={updating}
              className="h-12 px-8 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {updating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Güncelleniyor...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Kaydet
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}