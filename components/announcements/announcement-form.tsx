"use client"

import { useState, useEffect } from "react"
import { Megaphone, Save, X, Calendar, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createAnnouncement, updateAnnouncement } from "@/lib/announcements"
import { Announcement, AnnouncementCreateData, AnnouncementUpdateData } from "@/types/announcement"
import { toast } from "sonner"

interface AnnouncementFormProps {
  announcement?: Announcement | null
  onSuccess: () => void
  onCancel: () => void
}

export function AnnouncementForm({ announcement, onSuccess, onCancel }: AnnouncementFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    publish_date: '',
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        publish_date: new Date(announcement.publish_date).toISOString().slice(0, 16),
        is_active: announcement.is_active,
      })
    } else {
      // Yeni duyuru için varsayılan tarih (şu an)
      const now = new Date()
      setFormData(prev => ({
        ...prev,
        publish_date: now.toISOString().slice(0, 16)
      }))
    }
  }, [announcement])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Lütfen tüm zorunlu alanları doldurunuz')
      return
    }

    if (!formData.publish_date) {
      toast.error('Lütfen yayın tarihini seçiniz')
      return
    }

    setIsSubmitting(true)

    try {
      if (announcement) {
        // Update existing announcement
        const updateData: AnnouncementUpdateData = {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          is_active: formData.is_active,
        }
        
        await updateAnnouncement(announcement.id, updateData)
        toast.success('Duyuru başarıyla güncellendi', {
          description: `"${formData.title}" güncellendi`
        })
      } else {
        // Create new announcement
        const createData: AnnouncementCreateData = {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          publish_date: new Date(formData.publish_date).toISOString(),
          is_active: formData.is_active,
        }
        
        await createAnnouncement(createData)
        toast.success('Duyuru başarıyla oluşturuldu', {
          description: `"${formData.title}" oluşturuldu`
        })
      }
      
      onSuccess()
    } catch (error) {
      toast.error(announcement ? 'Duyuru güncellenirken hata oluştu' : 'Duyuru oluşturulurken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🚨'
      case 'high': return '⚠️'
      case 'normal': return 'ℹ️'
      case 'low': return '📝'
      default: return 'ℹ️'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Başlık *
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="Duyuru başlığını giriniz"
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

      <div className="space-y-2">
        <Label htmlFor="content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          İçerik *
        </Label>
        <Textarea
          id="content"
          placeholder="Duyuru içeriğini giriniz..."
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
          required
          rows={6}
          className="bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Öncelik *
          </Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => handleInputChange('priority', value)}
          >
            <SelectTrigger className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
              <SelectValue placeholder="Öncelik seçiniz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <span>📝</span>
                  Düşük
                </div>
              </SelectItem>
              <SelectItem value="normal">
                <div className="flex items-center gap-2">
                  <span>ℹ️</span>
                  Normal
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  Yüksek
                </div>
              </SelectItem>
              <SelectItem value="urgent">
                <div className="flex items-center gap-2">
                  <span>🚨</span>
                  Acil
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="publish_date" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Yayın Tarihi *
          </Label>
          <Input
            id="publish_date"
            type="datetime-local"
            value={formData.publish_date}
            onChange={(e) => handleInputChange('publish_date', e.target.value)}
            required
            className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Durum
        </Label>
        <div className="flex items-center space-x-2 h-12">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => handleInputChange('is_active', checked)}
          />
          <Label htmlFor="is_active" className="text-sm text-gray-600 dark:text-gray-400">
            {formData.is_active ? 'Aktif' : 'Pasif'}
          </Label>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-gray-200/30 dark:border-gray-700/30">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <Megaphone className="w-4 h-4" />
          Önizleme
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getPriorityIcon(formData.priority)}</span>
            <h5 className="font-medium text-gray-900 dark:text-white">
              {formData.title || 'Duyuru Başlığı'}
            </h5>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {formData.content || 'Duyuru içeriği buraya gelecek...'}
          </p>
          {formData.publish_date && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              📅 {new Date(formData.publish_date).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200/20 dark:border-gray-700/20">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-12 px-6 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl hover:bg-white/70 dark:hover:bg-black/50 transition-all duration-300"
        >
          <X className="w-4 h-4 mr-2" />
          İptal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 px-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              {announcement ? 'Güncelleniyor...' : 'Oluşturuluyor...'}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {announcement ? 'Güncelle' : 'Oluştur'}
            </div>
          )}
        </Button>
      </div>
    </form>
  )
}