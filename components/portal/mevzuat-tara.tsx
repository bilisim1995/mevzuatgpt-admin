"use client"

import { useState, useEffect, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { getKurumlar, PortalScanResponse, PortalScanSection, SectionStats, Kurum } from "@/lib/scrapper"
import { Loader2, ExternalLink, CheckCircle2, XCircle, Search, Check, ChevronsUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { STORAGE_KEYS } from "@/constants/api"

type StatusFilter = "all" | "portal" | "not-portal"

export function MevzuatTara() {
  const [selectedInstitution, setSelectedInstitution] = useState<string>("")
  const [queryType, setQueryType] = useState<string>("kaysis")
  const [loading, setLoading] = useState(false)
  const [loadingKurumlar, setLoadingKurumlar] = useState(false)
  const [kurumlar, setKurumlar] = useState<Kurum[]>([])
  const [data, setData] = useState<PortalScanResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [kurumPopoverOpen, setKurumPopoverOpen] = useState(false)
  const { toast } = useToast()
  const eventSourceRef = useRef<EventSource | null>(null)

  // Kurumları yükle
  useEffect(() => {
    const fetchKurumlar = async () => {
      setLoadingKurumlar(true)
      try {
        const result = await getKurumlar(1000, 0)
        if (result.success && result.data) {
          setKurumlar(result.data)
          // İlk kurumu varsayılan olarak seç
          if (result.data.length > 0 && !selectedInstitution) {
            setSelectedInstitution(result.data[0]._id)
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Kurumlar yüklenirken bir hata oluştu"
        toast({
          title: "Hata",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoadingKurumlar(false)
      }
    }

    fetchKurumlar()
  }, [])

  const handleScan = async () => {
    if (!selectedInstitution) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir kurum seçin",
        variant: "destructive",
      })
      return
    }

    // Seçili kurumun detsis bilgisini al
    const selectedKurum = kurumlar.find(k => k._id === selectedInstitution)
    const detsis = selectedKurum?.detsis || ""

    // Eski eventSource bağlantısını kapat
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setLoading(true)
    setError(null)
    setData(null)

    // Mevcut JWT token'ı al
    const token =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null

    if (!token) {
      const errorMessage = "Oturum süresi dolmuş. Lütfen tekrar giriş yapın."
      setError(errorMessage)
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      // Streaming endpoint'e POST isteği at
      const response = await fetch("/api/portal-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          kurumId: selectedInstitution,
          detsis,
          type: queryType,
        }),
      })

      if (!response.body) {
        throw new Error("Sunucudan geçerli bir stream yanıtı alınamadı.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let buffer = ""
      let finalResult: PortalScanResponse | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE formatında event'leri satır satır işle
        const events = buffer.split("\n\n")
        buffer = events.pop() || ""

        for (const rawEvent of events) {
          const lines = rawEvent.split("\n")
          const eventLine = lines.find((line) => line.startsWith("event: "))
          const dataLine = lines.find((line) => line.startsWith("data: "))

          const eventName = eventLine ? eventLine.replace("event: ", "").trim() : ""
          const dataStr = dataLine ? dataLine.replace("data: ", "").trim() : ""

          if (!eventName) continue

          if (eventName === "started") {
            // İstersek burada "tarama başladı" mesajını gösterebiliriz
          } else if (eventName === "keepalive") {
            // Sadece bağlantıyı canlı tutmak için, UI'da göstermek zorunda değiliz
          } else if (eventName === "result") {
            try {
              const parsed: PortalScanResponse = JSON.parse(dataStr)
              finalResult = parsed
              setData(parsed)
              setError(null)
            } catch {
              // Parse hatasında genel hata göster
              const errorMessage = "Sunucudan gelen veri işlenemedi."
              setError(errorMessage)
              toast({
                title: "Hata",
                description: errorMessage,
                variant: "destructive",
              })
            }
          } else if (eventName === "error") {
            let errorPayload: string
            try {
              errorPayload = JSON.parse(dataStr)
            } catch {
              errorPayload = dataStr
            }

            const errorMessage =
              typeof errorPayload === "string"
                ? errorPayload
                : "Tarama sırasında bir hata oluştu."

            setError(errorMessage)
            toast({
              title: "Hata",
              description: errorMessage,
              variant: "destructive",
              duration: 10000,
            })
          } else if (eventName === "done") {
            // İşlem tamamlandı, ek bir şey yapmaya gerek yok
          }
        }
      }

      if (!finalResult) {
        const errorMessage = "Sunucudan beklenen sonuç alınamadı."
        setError(errorMessage)
        toast({
          title: "Hata",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Veri çekilirken bir hata oluştu"
      setError(errorMessage)

      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // 10 saniye göster
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mevzuat Tara</CardTitle>
          <CardDescription>
            Taranacak kurumu seçin ve portal tarama sonuçlarını görüntüleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label htmlFor="institution-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Taranacak Kurum Seç:
              </label>
              <Popover open={kurumPopoverOpen} onOpenChange={setKurumPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={kurumPopoverOpen}
                    className="w-[450px] min-w-[450px] justify-between"
                disabled={loadingKurumlar}
              >
                    <span className="truncate text-left flex-1">
                      {loadingKurumlar
                        ? "Yükleniyor..."
                        : selectedInstitution
                        ? kurumlar.find((kurum) => kurum._id === selectedInstitution)?.kurum_adi || "Kurum seçin"
                        : "Kurum seçin"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0">
                  <Command>
                    <CommandInput placeholder="Kurum ara..." />
                    <CommandList>
                  {loadingKurumlar ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                        <>
                          <CommandEmpty>Kurum bulunamadı.</CommandEmpty>
                          <CommandGroup>
                            {[...kurumlar].reverse().map((kurum) => (
                              <CommandItem
                                key={kurum._id}
                                value={kurum.kurum_adi}
                                onSelect={() => {
                                  setSelectedInstitution(kurum._id)
                                  setKurumPopoverOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 shrink-0",
                                    selectedInstitution === kurum._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="truncate">{kurum.kurum_adi}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                  )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="query-type-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sorgu Tipi:
              </label>
              <Select 
                value={queryType} 
                onValueChange={setQueryType}
                disabled={loading}
              >
                <SelectTrigger id="query-type-select" className="w-[150px] min-w-[150px]">
                  <SelectValue placeholder="Sorgu tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kaysis">kaysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleScan} 
              disabled={loading || !selectedInstitution}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Taranıyor...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Tara</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-500 dark:border-red-400">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Hata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-600 dark:text-red-400 whitespace-pre-line">
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {data && data.success && (
        <>
          {/* Özet İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Bölüm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.data.total_sections}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Öğe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.data.total_items}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Portal Belgeleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.data.portal_documents_count}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Yüklü Mevzuat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {data.data.portal_documents_count}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Yüklenmesi Gereken
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {data.data.total_items - data.data.portal_documents_count}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bölüm İstatistikleri Tablosu */}
          <Card>
            <CardHeader>
              <CardTitle>Bölüm İstatistikleri</CardTitle>
              <CardDescription>
                Her bölüm için portal ve portal olmayan belge sayıları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <TableRow>
                      <TableHead className="w-[300px]">Bölüm Adı</TableHead>
                      <TableHead className="text-center">Toplam</TableHead>
                      <TableHead className="text-center">Portal</TableHead>
                      <TableHead className="text-center">Portal Değil</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.sections_stats.map((stat: SectionStats, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{stat.section_title}</TableCell>
                        <TableCell className="text-center">{stat.total}</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            {stat.portal}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <XCircle className="h-4 w-4" />
                            {stat.not_portal}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Bölümler ve Öğeler Tablosu */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bölümler ve Belgeler</CardTitle>
                  <CardDescription>
                    Tüm bölümler ve içerdikleri belgeler
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Durum Filtresi:
                  </label>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                    <SelectTrigger id="status-filter" className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="portal">Portal</SelectItem>
                      <SelectItem value="not-portal">Portal Değil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[200px] bg-white dark:bg-gray-900">Bölüm</TableHead>
                      <TableHead className="bg-white dark:bg-gray-900">Başlık</TableHead>
                      <TableHead className="w-[100px] text-center bg-white dark:bg-gray-900">Durum</TableHead>
                      <TableHead className="w-[100px] text-center bg-white dark:bg-gray-900">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.sections
                      .map((section: PortalScanSection) =>
                        section.items
                          .filter((item) => {
                            if (statusFilter === "all") return true
                            if (statusFilter === "portal") return item.portal === true
                            if (statusFilter === "not-portal") return item.portal === false
                            return true
                          })
                          .map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{section.section_title}</TableCell>
                              <TableCell>{item.baslik}</TableCell>
                              <TableCell className="text-center">
                                {item.portal ? (
                                  <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Portal
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <XCircle className="h-4 w-4" />
                                    Değil
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Görüntüle
                                </a>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

