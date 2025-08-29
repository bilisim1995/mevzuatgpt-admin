'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Loader2, Settings, TestTube, RotateCcw, Activity } from "lucide-react"
import { toast } from "sonner"
import {
  GroqSettings,
  GroqModel,
  GroqCreativityPreset,
  GroqStatus,
} from '@/types/groq'
import {
  getGroqSettings,
  updateGroqSettings,
  getGroqModels,
  getGroqCreativityPresets,
  getGroqStatus,
  testGroqSettings,
  resetGroqSettings,
  applyGroqPreset
} from '@/lib/groq'

export function GroqSettingsPanel() {
  const [settings, setSettings] = useState<GroqSettings>({
    default_model: 'llama3-8b-8192',
    temperature: 0.7,
    max_tokens: 1024,
    top_p: 0.95,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    available_models: [],
    creativity_mode: 'balanced',
    response_style: 'conversational'
  })
  const [models, setModels] = useState<GroqModel[]>([])
  const [presets, setPresets] = useState<Record<string, GroqCreativityPreset>>({})
  const [status, setStatus] = useState<GroqStatus | null>(null)
  const [currentDefault, setCurrentDefault] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    loadSettings()
    loadModels()
    loadPresets()
    // Load status when component mounts and every 30 seconds
    loadStatus()
    const statusInterval = setInterval(loadStatus, 30000)
    
    return () => clearInterval(statusInterval)
  }, [])

  const loadSettings = async () => {
    try {
      const data = await getGroqSettings()
      setSettings(data)
    } catch (error) {
      toast.error('Groq ayarları yüklenemedi', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    }
  }

  const loadModels = async () => {
    try {
      const data = await getGroqModels()
      setModels(data.models || [])
      setCurrentDefault(data.current_default || '')
    } catch (error) {
      toast.error('Groq modelleri yüklenemedi', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    }
  }

  const loadPresets = async () => {
    try {
      const data = await getGroqCreativityPresets()
      setPresets(data)
    } catch (error) {
      toast.error('Yaratıcılık preset\'leri yüklenemedi', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    }
  }

  const loadStatus = async () => {
    try {
      const data = await getGroqStatus()
      setStatus(data.data)
    } catch (error) {
      toast.error('Groq durumu kontrol edilemedi', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      const updatedSettings = await updateGroqSettings(settings)
      toast.success('Groq ayarları güncellendi')
      setSettings(updatedSettings)
    } catch (error) {
      toast.error('Ayarlar kaydedilirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setLoading(false)
    }
  }

  const testSettings = async () => {
    setTesting(true)
    try {
      const testResult = await testGroqSettings("Test sorusu: Merhaba, nasılsın?")
      toast.success(`Test başarılı! Yanıt süresi: ${testResult.data.performance_metrics.response_time_ms}ms`, {
        description: `Model: ${testResult.data.performance_metrics.model_used}, Token: ${testResult.data.performance_metrics.tokens_used}`
      })
    } catch (error) {
      toast.error('Test sırasında hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setTesting(false)
    }
  }

  const resetSettings = async () => {
    setLoading(true)
    try {
      const resetData = await resetGroqSettings()
      toast.success('Ayarlar varsayılana sıfırlandı')
      setSettings(resetData)
    } catch (error) {
      toast.error('Ayarlar sıfırlanırken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setLoading(false)
    }
  }

  const applyPreset = async (presetName: string) => {
    setLoading(true)
    try {
      const updatedSettings = await applyGroqPreset(presetName)
      toast.success(`${presets[presetName]?.label} preset'i uygulandı`)
      setSettings(updatedSettings)
    } catch (error) {
      toast.error('Preset uygulanırken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Groq Servis Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="flex items-center gap-4">
              <Badge className={`${getStatusColor(status.service_status)} text-white`}>
                {status.service_status === 'healthy' ? 'SAĞLIKLI' : 
                 status.service_status === 'warning' ? 'UYARI' : 
                 status.service_status === 'error' ? 'HATA' : 
                 (status.service_status as string).toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-600">
                Yanıt Süresi: {status.response_time_ms}ms
              </span>
              <span className="text-sm text-gray-600">
                Aktif Model: {status?.current_settings?.default_model || 'Bilinmiyor'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Durum kontrol ediliyor...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Groq Ayarları
          </CardTitle>
          <CardDescription>
            Groq AI modelinin davranışını ve performansını yapılandırın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Selection */}

          {/* Model Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="default_model">AI Model</Label>
              <Select
                value={status?.current_model || settings.default_model}
                onValueChange={(value) => setSettings({ ...settings, default_model: value })}
              >
                <SelectTrigger className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                  <SelectValue placeholder="Model seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {/* Available models from API */}
                  {status?.available_models?.map((modelName) => (
                    <SelectItem key={modelName} value={modelName}>
                      <div className="flex flex-col">
                        <span className="font-medium">{modelName}</span>
                        <span className="text-xs text-gray-500">
                          {status?.current_model === modelName ? 'Mevcut aktif model' : 'Groq AI Model'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  {/* Fallback models if available_models is empty */}
                  {(!status?.available_models || status.available_models.length === 0) && models.map((model) => (
                    <SelectItem key={model.model_name} value={model.model_name}>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.model_name}</span>
                        {model.description && (
                          <span className="text-xs text-gray-500">{model.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Kullanılacak AI modelini seçin. Farklı modeller farklı performans ve hız sunar.
              </p>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <Label>Sıcaklık: {settings.temperature}</Label>
              <Slider
                value={[settings.temperature]}
                onValueChange={(value) => setSettings({ ...settings, temperature: value[0] })}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Düşük değerler daha tutarlı, yüksek değerler daha yaratıcı yanıtlar üretir
              </p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <Label htmlFor="max_tokens">Maksimum Token</Label>
              <Input
                id="max_tokens"
                type="number"
                value={settings.max_tokens}
                onChange={(e) => setSettings({ ...settings, max_tokens: parseInt(e.target.value) })}
                min={1}
                max={4096}
                className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Yanıtın maksimum uzunluğunu belirler. Yüksek değerler daha uzun yanıtlar üretir.
              </p>
            </div>

            {/* Top P */}
            <div className="space-y-2">
              <Label>Top P: {settings.top_p}</Label>
              <Slider
                value={[settings.top_p]}
                onValueChange={(value) => setSettings({ ...settings, top_p: value[0] })}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Kelime seçiminde çeşitliliği kontrol eder. Düşük değerler daha odaklı yanıtlar verir.
              </p>
            </div>

            {/* Frequency Penalty */}
            <div className="space-y-2">
              <Label>Frekans Cezası: {settings.frequency_penalty}</Label>
              <Slider
                value={[settings.frequency_penalty]}
                onValueChange={(value) => setSettings({ ...settings, frequency_penalty: value[0] })}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tekrarlayan kelimeleri azaltır. Yüksek değerler daha çeşitli kelime kullanımı sağlar.
              </p>
            </div>

            {/* Presence Penalty */}
            <div className="space-y-2">
              <Label>Varlık Cezası: {settings.presence_penalty}</Label>
              <Slider
                value={[settings.presence_penalty]}
                onValueChange={(value) => setSettings({ ...settings, presence_penalty: value[0] })}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Yeni konulara geçişi teşvik eder. Yüksek değerler daha çeşitli konu kapsamı sağlar.
              </p>
            </div>

            {/* Creativity Mode */}
            <div className="space-y-2">
              <Label htmlFor="creativity_mode">Yaratıcılık Modu</Label>
              <Select
                value={settings.creativity_mode}
                onValueChange={(value: any) => setSettings({ ...settings, creativity_mode: value })}
              >
                <SelectTrigger className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Muhafazakar</SelectItem>
                  <SelectItem value="balanced">Dengeli</SelectItem>
                  <SelectItem value="creative">Yaratıcı</SelectItem>
                  <SelectItem value="highly_creative">Çok Yaratıcı</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                AI'nın yaratıcılık seviyesini belirler. Muhafazakar daha güvenli, yaratıcı daha özgün yanıtlar verir.
              </p>
            </div>

            {/* Response Style */}
            <div className="space-y-2">
              <Label htmlFor="response_style">Yanıt Stili</Label>
              <Select
                value={settings.response_style}
                onValueChange={(value: any) => setSettings({ ...settings, response_style: value })}
              >
                <SelectTrigger className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Özlü</SelectItem>
                  <SelectItem value="detailed">Detaylı</SelectItem>
                  <SelectItem value="analytical">Analitik</SelectItem>
                  <SelectItem value="conversational">Konuşma Tarzı</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Yanıtların sunuluş tarzını belirler. Özlü kısa, detaylı kapsamlı yanıtlar verir.
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <Label>Hızlı Preset'ler</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(presets || {}).map(([key, preset]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(key)}
                  disabled={loading}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={saveSettings} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ayarları Kaydet
            </Button>
            <Button variant="outline" onClick={resetSettings} disabled={loading}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Sıfırla
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}