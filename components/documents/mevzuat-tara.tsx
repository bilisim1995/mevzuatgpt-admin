"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { getMevzuatGPTScan, getKurumlar, processDocument, getMetadataList, MevzuatGPTScanResponse, MevzuatGPTScanSection, MevzuatGPTSectionStats, Kurum } from "@/lib/scrapper"
import { getDocuments } from "@/lib/document"
import { Loader2, ExternalLink, CheckCircle2, XCircle, Search, Check, ChevronsUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type StatusFilter = "all" | "uploaded" | "not-uploaded"

export function MevzuatTaraDataSource() {
  const [selectedInstitution, setSelectedInstitution] = useState<string>("")
  const [queryType, setQueryType] = useState<string>("kaysis")
  const [loading, setLoading] = useState(false)
  const [loadingKurumlar, setLoadingKurumlar] = useState(false)
  const [kurumlar, setKurumlar] = useState<Kurum[]>([])
  const [data, setData] = useState<MevzuatGPTScanResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sectionFilter, setSectionFilter] = useState<string>("all")
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({})
  const [mevzuatGPTDocuments, setMevzuatGPTDocuments] = useState<Set<string>>(new Set())
  const [portalDocuments, setPortalDocuments] = useState<Set<string>>(new Set())
  const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: "" })
  const [ocrEnabled, setOcrEnabled] = useState<Record<string, boolean>>({})
  const [kurumPopoverOpen, setKurumPopoverOpen] = useState(false)
  const { toast } = useToast()

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

  // Başlığı normalize et (karşılaştırma için)
  const normalizeTitle = (title: string): string => {
    if (!title) return ""
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ") // Birden fazla boşluğu tek boşluğa çevir
      .replace(/[^\w\s]/g, "") // Özel karakterleri kaldır (noktalama işaretleri)
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/İ/g, "i")
      .replace(/Ğ/g, "g")
      .replace(/Ü/g, "u")
      .replace(/Ş/g, "s")
      .replace(/Ö/g, "o")
      .replace(/Ç/g, "c")
  }

  const isTruthy = (value: boolean | string | undefined | null) => value === true || value === "true"

  // Mevcut belgeleri yükle ve başlıklara göre eşleştir
  const loadExistingDocuments = async (): Promise<{ mevzuatGPT: Set<string>, portal: Set<string> }> => {
    const mevzuatGPTTitles = new Set<string>()
    const portalTitles = new Set<string>()
    
    try {
      // MevzuatGPT belgelerini çek
      const mevzuatGPTDocs = await getDocuments() // Tüm belgeleri çek
      
      mevzuatGPTDocs.documents.forEach((doc) => {
        // Başlığı normalize et - hem title hem document_title kontrol et
        const title1 = normalizeTitle(doc.title || "")
        const title2 = normalizeTitle(doc.document_title || "")
        
        if (title1) {
          mevzuatGPTTitles.add(title1)
        }
        if (title2 && title2 !== title1) {
          mevzuatGPTTitles.add(title2)
        }
      })
      setMevzuatGPTDocuments(mevzuatGPTTitles)

      // Portal belgelerini çek
      const portalDocs = await getMetadataList(1000, 0)
      if (portalDocs.success && portalDocs.data) {
        portalDocs.data.forEach((doc) => {
          // Başlığı normalize et
          const normalizedTitle = normalizeTitle(doc.pdf_adi || "")
          if (normalizedTitle) {
            portalTitles.add(normalizedTitle)
          }
        })
      }
      setPortalDocuments(portalTitles)
    } catch (err) {
      console.error("Mevcut belgeler yüklenirken hata:", err)
      // Hata olsa bile devam et
    }
    
    return { mevzuatGPT: mevzuatGPTTitles, portal: portalTitles }
  }

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

    setLoading(true)
    setError(null)
    setData(null)
    
    try {
      // Önce mevcut belgeleri yükle ve sonuçları al
      const existingDocs = await loadExistingDocuments()
      
      // Sonra tarama yap
      const result = await getMevzuatGPTScan(selectedInstitution, detsis, queryType)
      
      // Başlıklara göre eşleştirme yap
      if (result.data && result.data.sections) {
        result.data.sections = result.data.sections.map(section => ({
          ...section,
          items: section.items.map(item => {
            const originalTitle = item.baslik || ""
            const normalizedTitle = normalizeTitle(originalTitle)
            
            // MevzuatGPT'de var mı kontrol et
            const isInMevzuatGPT = existingDocs.mevzuatGPT.has(normalizedTitle)
            
            // Portal'da var mı kontrol et
            const isInPortal = existingDocs.portal.has(normalizedTitle)
            
            const updatedItem = {
              ...item,
              mevzuatgpt: isInMevzuatGPT || isTruthy(item.mevzuatgpt),
              portal: isInPortal || isTruthy(item.portal)
            }
            
            return updatedItem
          })
        }))
      }
      
      setData(result)
      toast({
        title: "Başarılı",
        description: result.message || "Tarama işlemi tamamlandı",
        variant: "default",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Tarama sırasında bir hata oluştu"
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

  // Filtrelenmiş item'ları getir
  const getFilteredItems = (section: MevzuatGPTScanSection) => {
    // Önce bölüm filtresini kontrol et
    if (sectionFilter !== "all" && section.section_title !== sectionFilter) {
      return []
    }
    
    // Sonra durum filtresini uygula
    if (statusFilter === "all") return section.items
    if (statusFilter === "uploaded") {
      return section.items.filter(item => isTruthy(item.mevzuatgpt))
    }
    if (statusFilter === "not-uploaded") {
      return section.items.filter(item => !isTruthy(item.mevzuatgpt))
    }
    return section.items
  }
  
  // Mevcut bölümleri al (filtre için)
  const availableSections = data?.data?.sections?.map(s => s.section_title) || []

  // Toplam yüklenen ve yüklenmeyen sayıları hesapla
  const calculateStats = () => {
    if (!data) return { uploaded: 0, notUploaded: 0 }
    
    let uploaded = 0
    let notUploaded = 0
    
    data.data.sections.forEach(section => {
      section.items.forEach(item => {
        if (isTruthy(item.mevzuatgpt)) {
          uploaded++
        } else {
          notUploaded++
        }
      })
    })
    
    return { uploaded, notUploaded }
  }

  const stats = calculateStats()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mevzuat Tara</CardTitle>
          <CardDescription>
            Taranacak kurumu seçin ve MevzuatGPT tarama sonuçlarını görüntüleyin
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
                    className="w-[300px] min-w-[300px] justify-between"
                    disabled={loadingKurumlar}
                  >
                    {loadingKurumlar
                      ? "Yükleniyor..."
                      : selectedInstitution
                      ? kurumlar.find((kurum) => kurum._id === selectedInstitution)?.kurum_adi || "Kurum seçin"
                      : "Kurum seçin"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
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
                                    "mr-2 h-4 w-4",
                                    selectedInstitution === kurum._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {kurum.kurum_adi}
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
                  <span>Taramayı Başlat</span>
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
              <CardHeader className="pb-2">
                <CardDescription>Toplam Bölüm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.data.total_sections}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Toplam Öğe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.data.total_items}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>MevzuatGPT Belgeleri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.data.uploaded_documents_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Yüklü Mevzuat</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.uploaded}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Yüklenmesi Gereken</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.notUploaded}</div>
              </CardContent>
            </Card>
          </div>

          {/* Bölüm İstatistikleri Tablosu */}
          <Card>
            <CardHeader>
              <CardTitle>Bölüm İstatistikleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="bg-white dark:bg-gray-900">Bölüm</TableHead>
                      <TableHead className="text-center bg-white dark:bg-gray-900">Toplam</TableHead>
                      <TableHead className="text-center bg-white dark:bg-gray-900">Yüklenen</TableHead>
                      <TableHead className="text-center bg-white dark:bg-gray-900">Yüklenmeyen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.sections_stats.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{stat.section_title}</TableCell>
                        <TableCell className="text-center">{stat.total}</TableCell>
                        <TableCell className="text-center text-green-600">{stat.uploaded}</TableCell>
                        <TableCell className="text-center text-red-600">{stat.not_uploaded}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Bölümler ve Belgeler Tablosu */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>Bölümler ve Belgeler</CardTitle>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label htmlFor="section-filter" className="text-sm font-medium">
                      Bölüm:
                    </label>
                    <Select value={sectionFilter} onValueChange={setSectionFilter}>
                      <SelectTrigger id="section-filter" className="w-[200px]">
                        <SelectValue placeholder="Tüm Bölümler" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Bölümler</SelectItem>
                        {availableSections.map((sectionTitle) => (
                          <SelectItem key={sectionTitle} value={sectionTitle}>
                            {sectionTitle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="status-filter" className="text-sm font-medium">
                      Durum:
                    </label>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                      <SelectTrigger id="status-filter" className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tümü</SelectItem>
                        <SelectItem value="uploaded">Yüklenen</SelectItem>
                        <SelectItem value="not-uploaded">Yüklenmeyen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-white dark:bg-gray-900">
                    <TableRow>
                      <TableHead className="w-[200px] bg-white dark:bg-gray-900">Bölüm</TableHead>
                      <TableHead className="bg-white dark:bg-gray-900">Başlık</TableHead>
                      <TableHead className="w-[150px] text-center bg-white dark:bg-gray-900">MevzuatGPT</TableHead>
                      <TableHead className="w-[150px] text-center bg-white dark:bg-gray-900">Portal</TableHead>
                      <TableHead className="w-[150px] text-center bg-white dark:bg-gray-900">İşlemler</TableHead>
                      <TableHead className="w-[100px] text-center bg-white dark:bg-gray-900">Link</TableHead>
                      <TableHead className="w-[100px] text-center bg-white dark:bg-gray-900">OCR</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
                <div className="h-[600px] overflow-y-auto overflow-x-auto">
                  <Table>
                    <TableBody>
                    {data.data.sections.map((section) =>
                      getFilteredItems(section).map((item) => (
                        <TableRow key={`${section.section_title}-${item.id}`}>
                          <TableCell className="font-medium">{section.section_title}</TableCell>
                          <TableCell>{item.baslik}</TableCell>
                          <TableCell className="text-center">
                            {isTruthy(item.mevzuatgpt) ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                disabled={loadingItems[`${item.id}-m`] || loadingItems[`${item.id}-t`]}
                                onClick={async () => {
                                  if (!selectedInstitution) {
                                    toast({
                                      title: "Hata",
                                      description: "Lütfen bir kurum seçin",
                                      variant: "destructive",
                                    })
                                    return
                                  }
                                  
                                  const loadingKey = `${item.id}-m`
                                  setLoadingItems(prev => ({ ...prev, [loadingKey]: true }))
                                  
                                  try {
                                    // Seçili kurumun detsis bilgisini al
                                    const selectedKurum = kurumlar.find(k => k._id === selectedInstitution)
                                    const detsis = selectedKurum?.detsis || ""
                                    
                                    await processDocument({
                                      kurum_id: selectedInstitution,
                                      link: item.link,
                                      mode: "m",
                                      category: section.section_title,
                                      document_name: item.baslik,
                                      detsis: detsis,
                                      type: queryType,
                                      use_ocr: ocrEnabled[item.id] || undefined,
                                    })
                                    
                                    // Local state'i güncelle - MevzuatGPT durumunu true yap
                                    setData(prev => {
                                      if (!prev) return prev
                                      const newData = { ...prev }
                                      newData.data.sections = newData.data.sections.map(s => {
                                        if (s.section_title === section.section_title) {
                                          return {
                                            ...s,
                                            items: s.items.map(i => 
                                              i.id === item.id ? { ...i, mevzuatgpt: true } : i
                                            )
                                          }
                                        }
                                        return s
                                      })
                                      return newData
                                    })
                                    
                                    // Local state'i güncelle - MevzuatGPT durumunu true yap
                                    setData(prev => {
                                      if (!prev) return prev
                                      const newData = { ...prev }
                                      newData.data.sections = newData.data.sections.map(s => {
                                        if (s.section_title === section.section_title) {
                                          return {
                                            ...s,
                                            items: s.items.map(i => 
                                              i.id === item.id ? { ...i, mevzuatgpt: true } : i
                                            )
                                          }
                                        }
                                        return s
                                      })
                                      return newData
                                    })
                                    
                                    toast({
                                      title: "Başarılı",
                                      description: "MevzuatGPT'ye yükleme işlemi tamamlandı",
                                    })
                                  } catch (err) {
                                    const errorMessage = err instanceof Error ? err.message : "Yükleme sırasında bir hata oluştu"
                                    setErrorModal({ open: true, message: errorMessage })
                                    toast({
                                      title: "Hata",
                                      description: errorMessage,
                                      variant: "destructive",
                                    })
                                  } finally {
                                    setLoadingItems(prev => ({ ...prev, [loadingKey]: false }))
                                  }
                                }}
                              >
                                {loadingItems[`${item.id}-m`] ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Yükleniyor...
                                  </>
                                ) : (
                                  "Yükle"
                                )}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isTruthy(item.portal) ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                disabled={loadingItems[`${item.id}-p`] || loadingItems[`${item.id}-t`]}
                                onClick={async () => {
                                  if (!selectedInstitution) {
                                    toast({
                                      title: "Hata",
                                      description: "Lütfen bir kurum seçin",
                                      variant: "destructive",
                                    })
                                    return
                                  }
                                  
                                  const loadingKey = `${item.id}-p`
                                  setLoadingItems(prev => ({ ...prev, [loadingKey]: true }))
                                  
                                  try {
                                    // Seçili kurumun detsis bilgisini al
                                    const selectedKurum = kurumlar.find(k => k._id === selectedInstitution)
                                    const detsis = selectedKurum?.detsis || ""
                                    
                                    await processDocument({
                                      kurum_id: selectedInstitution,
                                      link: item.link,
                                      mode: "p",
                                      category: section.section_title,
                                      document_name: item.baslik,
                                      detsis: detsis,
                                      type: queryType,
                                      use_ocr: ocrEnabled[item.id] || undefined,
                                    })
                                    
                                    // Local state'i güncelle - Portal durumunu true yap
                                    setData(prev => {
                                      if (!prev) return prev
                                      const newData = { ...prev }
                                      newData.data.sections = newData.data.sections.map(s => {
                                        if (s.section_title === section.section_title) {
                                          return {
                                            ...s,
                                            items: s.items.map(i => 
                                              i.id === item.id ? { ...i, portal: true } : i
                                            )
                                          }
                                        }
                                        return s
                                      })
                                      return newData
                                    })
                                    
                                    // Local state'i güncelle - Portal durumunu true yap
                                    setData(prev => {
                                      if (!prev) return prev
                                      const newData = { ...prev }
                                      newData.data.sections = newData.data.sections.map(s => {
                                        if (s.section_title === section.section_title) {
                                          return {
                                            ...s,
                                            items: s.items.map(i => 
                                              i.id === item.id ? { ...i, portal: true } : i
                                            )
                                          }
                                        }
                                        return s
                                      })
                                      return newData
                                    })
                                    
                                    toast({
                                      title: "Başarılı",
                                      description: "Portal'a yükleme işlemi tamamlandı",
                                    })
                                  } catch (err) {
                                    const errorMessage = err instanceof Error ? err.message : "Yükleme sırasında bir hata oluştu"
                                    setErrorModal({ open: true, message: errorMessage })
                                    toast({
                                      title: "Hata",
                                      description: errorMessage,
                                      variant: "destructive",
                                    })
                                  } finally {
                                    setLoadingItems(prev => ({ ...prev, [loadingKey]: false }))
                                  }
                                }}
                              >
                                {loadingItems[`${item.id}-p`] ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Yükleniyor...
                                  </>
                                ) : (
                                  "Yükle"
                                )}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {(!isTruthy(item.mevzuatgpt) || !isTruthy(item.portal)) && (
                              <Button
                                size="sm"
                                variant="default"
                                className="text-xs"
                                disabled={loadingItems[`${item.id}-t`]}
                                onClick={async () => {
                                  if (!selectedInstitution) {
                                    toast({
                                      title: "Hata",
                                      description: "Lütfen bir kurum seçin",
                                      variant: "destructive",
                                    })
                                    return
                                  }
                                  
                                  const loadingKey = `${item.id}-t`
                                  setLoadingItems(prev => ({ ...prev, [loadingKey]: true }))
                                  
                                  try {
                                    // Seçili kurumun detsis bilgisini al
                                    const selectedKurum = kurumlar.find(k => k._id === selectedInstitution)
                                    const detsis = selectedKurum?.detsis || ""
                                    
                                    await processDocument({
                                      kurum_id: selectedInstitution,
                                      link: item.link,
                                      mode: "t",
                                      category: section.section_title,
                                      document_name: item.baslik,
                                      detsis: detsis,
                                      type: queryType,
                                      use_ocr: ocrEnabled[item.id] || undefined,
                                    })
                                    
                                    // Local state'i güncelle - Her iki durumu da true yap
                                    setData(prev => {
                                      if (!prev) return prev
                                      const newData = { ...prev }
                                      newData.data.sections = newData.data.sections.map(s => {
                                        if (s.section_title === section.section_title) {
                                          return {
                                            ...s,
                                            items: s.items.map(i => 
                                              i.id === item.id ? { ...i, mevzuatgpt: true, portal: true } : i
                                            )
                                          }
                                        }
                                        return s
                                      })
                                      return newData
                                    })
                                    
                                    // Local state'i güncelle - Her iki durumu da true yap
                                    setData(prev => {
                                      if (!prev) return prev
                                      const newData = { ...prev }
                                      newData.data.sections = newData.data.sections.map(s => {
                                        if (s.section_title === section.section_title) {
                                          return {
                                            ...s,
                                            items: s.items.map(i => 
                                              i.id === item.id ? { ...i, mevzuatgpt: true, portal: true } : i
                                            )
                                          }
                                        }
                                        return s
                                      })
                                      return newData
                                    })
                                    
                                    toast({
                                      title: "Başarılı",
                                      description: "Her iki platforma yükleme işlemi tamamlandı",
                                    })
                                  } catch (err) {
                                    const errorMessage = err instanceof Error ? err.message : "Yükleme sırasında bir hata oluştu"
                                    setErrorModal({ open: true, message: errorMessage })
                                    toast({
                                      title: "Hata",
                                      description: errorMessage,
                                      variant: "destructive",
                                    })
                                  } finally {
                                    setLoadingItems(prev => ({ ...prev, [loadingKey]: false }))
                                  }
                                }}
                              >
                                {loadingItems[`${item.id}-t`] ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Yükleniyor...
                                  </>
                                ) : (
                                  "Hepsini Yükle"
                                )}
                              </Button>
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
                          <TableCell className="text-center">
                            <Checkbox
                              checked={ocrEnabled[item.id] || false}
                              onCheckedChange={(checked) => {
                                setOcrEnabled(prev => ({
                                  ...prev,
                                  [item.id]: checked === true
                                }))
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Hata Modal */}
      <Dialog open={errorModal.open} onOpenChange={(open) => setErrorModal({ open, message: errorModal.message })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">Yükleme Hatası</DialogTitle>
            <DialogDescription>
              Yükleme işlemi sırasında bir hata oluştu. Detaylar aşağıda gösterilmektedir.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap break-words">
                {errorModal.message}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setErrorModal({ open: false, message: "" })}>
              Tamam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

