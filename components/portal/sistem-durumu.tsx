"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getHealth, HealthResponse } from "@/lib/scrapper"
import { Loader2, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SistemDurumu() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getHealth()
      setHealth(result)
      toast({
        title: "Başarılı",
        description: "Sistem durumu başarıyla alındı",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sistem durumu alınırken bir hata oluştu"
      setError(errorMessage)
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sistem Durumu</CardTitle>
              <CardDescription>
                Scrapper API servis durumunu kontrol edin
              </CardDescription>
            </div>
            <Button 
              onClick={fetchHealth} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Kontrol Ediliyor...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Yenile</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !health ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="space-y-4">
              <Card className="border-red-500 dark:border-red-400">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <CardTitle className="text-red-600 dark:text-red-400">Bağlantı Hatası</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </CardContent>
              </Card>
            </div>
          ) : health ? (
            <div className="space-y-4">
              <Card className="border-green-500 dark:border-green-400">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <CardTitle className="text-green-600 dark:text-green-400">Sistem Sağlıklı</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Durum</p>
                      <p className="text-lg font-semibold mt-1">
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {health.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Servis</p>
                      <p className="text-lg font-semibold mt-1">{health.service}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
