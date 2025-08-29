"use client"

import { useState, useEffect } from "react"
import { Bot, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createPrompt, updatePrompt } from "@/lib/prompts"
import { Prompt, PromptCreateData, PromptUpdateData } from "@/types/prompt"
import { toast } from "sonner"

interface PromptFormProps {
  prompt?: Prompt | null
  onSuccess: () => void
  onCancel: () => void
}

export function PromptForm({ prompt, onSuccess, onCancel }: PromptFormProps) {
  const [formData, setFormData] = useState({
    provider: 'groq' as 'groq' | 'openai' | 'anthropic',
    prompt_type: 'system' as 'system' | 'user' | 'assistant',
    prompt_content: '',
    description: '',
    version: '1.0',
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (prompt) {
      setFormData({
        provider: prompt.provider,
        prompt_type: prompt.prompt_type,
        prompt_content: prompt.prompt_content,
        description: prompt.description,
        version: prompt.version,
        is_active: prompt.is_active,
      })
    }
  }, [prompt])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.prompt_content.trim() || !formData.description.trim()) {
      toast.error('Lütfen tüm zorunlu alanları doldurunuz')
      return
    }

    setIsSubmitting(true)

    try {
      if (prompt) {
        // Update existing prompt
        const updateData: PromptUpdateData = {
          prompt_content: formData.prompt_content,
          description: formData.description,
          version: formData.version,
          is_active: formData.is_active,
        }
        
        await updatePrompt(prompt.id, updateData)
        toast.success('Prompt başarıyla güncellendi', {
          description: `"${formData.description}" güncellendi`
        })
      } else {
        // Create new prompt
        const createData: PromptCreateData = {
          provider: formData.provider,
          prompt_type: formData.prompt_type,
          prompt_content: formData.prompt_content,
          description: formData.description,
          version: formData.version,
          is_active: formData.is_active,
        }
        
        await createPrompt(createData)
        toast.success('Prompt başarıyla oluşturuldu', {
          description: `"${formData.description}" oluşturuldu`
        })
      }
      
      onSuccess()
    } catch (error) {
      toast.error(prompt ? 'Prompt güncellenirken hata oluştu' : 'Prompt oluşturulurken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="provider" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sağlayıcı *
          </Label>
          <Select 
            value={formData.provider} 
            onValueChange={(value) => handleInputChange('provider', value)}
            disabled={!!prompt} // Disable when editing
          >
            <SelectTrigger className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
              <SelectValue placeholder="Sağlayıcı seçiniz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="groq">Groq</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt_type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Prompt Tipi *
          </Label>
          <Select 
            value={formData.prompt_type} 
            onValueChange={(value) => handleInputChange('prompt_type', value)}
            disabled={!!prompt} // Disable when editing
          >
            <SelectTrigger className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
              <SelectValue placeholder="Prompt tipi seçiniz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="assistant">Assistant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Açıklama *
        </Label>
        <Input
          id="description"
          type="text"
          placeholder="Prompt açıklamasını giriniz"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          required
          className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt_content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Prompt İçeriği *
        </Label>
        <Textarea
          id="prompt_content"
          placeholder="Prompt içeriğini giriniz..."
          value={formData.prompt_content}
          onChange={(e) => handleInputChange('prompt_content', e.target.value)}
          required
          rows={8}
          className="bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl resize-none font-mono text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="version" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Versiyon *
          </Label>
          <Input
            id="version"
            type="text"
            placeholder="1.0"
            value={formData.version}
            onChange={(e) => handleInputChange('version', e.target.value)}
            required
            className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
          />
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
          className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              {prompt ? 'Güncelleniyor...' : 'Oluşturuluyor...'}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {prompt ? 'Güncelle' : 'Oluştur'}
            </div>
          )}
        </Button>
      </div>
    </form>
  )
}