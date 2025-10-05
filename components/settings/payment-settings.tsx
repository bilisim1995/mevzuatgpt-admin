"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { fetchPaymentSettings, updatePaymentSettings, type PaymentSettings } from '@/lib/payment-settings'

export function PaymentSettingsPanel() {
  const [data, setData] = useState<PaymentSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetchPaymentSettings()
        setData(res)
      } catch (e) {
        toast.error('Ödeme ayarları yüklenemedi', { description: e instanceof Error ? e.message : 'Bilinmeyen hata' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    try {
      const updated = await updatePaymentSettings({
        payment_mode: data.payment_mode,
        is_active: data.is_active,
        description: data.description,
      })
      setData(updated)
      toast.success('Ödeme ayarları güncellendi')
    } catch (e) {
      toast.error('Güncelleme başarısız', { description: e instanceof Error ? e.message : 'Bilinmeyen hata' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Ödeme Ayarları
        </CardTitle>
        <CardDescription>Ödeme altyapısı modlarını yönetin</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Ödeme Modu</Label>
                <Select
                  value={data?.payment_mode}
                  onValueChange={(v: any) => setData(prev => prev ? { ...prev, payment_mode: v } : prev)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Mod seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Aktif</Label>
                <div className="h-12 flex items-center">
                  <Switch
                    checked={!!data?.is_active}
                    onCheckedChange={(v) => setData(prev => prev ? { ...prev, is_active: v } : prev)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Açıklama (opsiyonel)</Label>
              <Textarea
                value={data?.description || ''}
                onChange={(e) => setData(prev => prev ? { ...prev, description: e.target.value } : prev)}
                placeholder="Ödeme sistemi hakkında açıklama"
              />
            </div>

            <div className="pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Kaydet
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}


