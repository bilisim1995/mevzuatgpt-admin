"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { getKurumlar, getMetadataList, MevzuatGPTScanResponse, MevzuatGPTScanSection, MevzuatGPTSectionStats, Kurum, ProcessDocumentResponse, yargitayUpload } from "@/lib/scrapper"
import { getDocuments } from "@/lib/document"
import { getElasticsearchStatus } from "@/lib/elasticsearch"
import { Loader2, ExternalLink, CheckCircle2, XCircle, Search, Check, ChevronsUpDown, RefreshCw, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { API_CONFIG, STORAGE_KEYS } from "@/constants/api"

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
  const [errorButtons, setErrorButtons] = useState<Set<string>>(new Set()) // Hata alan butonları takip et
  const [loadingEmbeddings, setLoadingEmbeddings] = useState<boolean>(false) // Embeddings yükleme durumu
  const [totalChunkCount, setTotalChunkCount] = useState<number>(0) // Toplam chunk sayısı
  const [processStatusCount, setProcessStatusCount] = useState<number>(0) // Supabase'de durumu "process" olan döküman sayısı
  const [jsonModalOpen, setJsonModalOpen] = useState(false) // JSON modal durumu
  const [jsonData, setJsonData] = useState<any>(null) // JSON response data
  const [loadingJson, setLoadingJson] = useState(false) // JSON oluşturma yükleme durumu
  const [loadingScrapeWithData, setLoadingScrapeWithData] = useState(false) // Tara-JSON İle yükleme durumu
  const [scrapeWithDataModalOpen, setScrapeWithDataModalOpen] = useState(false) // Tara-JSON İle modal durumu
  const [jsonInputText, setJsonInputText] = useState("") // Modal içindeki JSON input
  const [yargitayPage, setYargitayPage] = useState("1")
  const [loadingYargitayUpload, setLoadingYargitayUpload] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set()) // Toplu yükleme seçimi
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false) // Toplu yükleme modal durumu
  const [bulkUploadPayload, setBulkUploadPayload] = useState<any>(null) // Toplu yükleme JSON çıktısı
  const [bulkUploadResponse, setBulkUploadResponse] = useState<any>(null) // Toplu yükleme modalı yanıt çıktısı
  const [queueStatusModalOpen, setQueueStatusModalOpen] = useState(false) // Kuyruk durumu modalı
  const [queueStatusResponse, setQueueStatusResponse] = useState<any>(null) // Kuyruk durumu çıktısı
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

  const isTruthy = (value: boolean | string | number | undefined | null) => {
    if (value === true || value === "true" || value === 1 || value === "1") {
      return true
    }
    // Boolean kontrolü
    if (typeof value === "boolean") {
      return value
    }
    return false
  }

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
      // Önce mevcut belgeleri yükle ve sonuçları al
      const existingDocs = await loadExistingDocuments()
      
      // Streaming endpoint'e POST isteği at
      const response = await fetch("/api/mevzuatgpt-scan", {
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
      let finalResult: MevzuatGPTScanResponse | null = null
      let hasReceivedResult = false
      let hasReceivedError = false

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
              const parsed: MevzuatGPTScanResponse = JSON.parse(dataStr)
              finalResult = parsed
              hasReceivedResult = true
              
              // Başlıklara göre eşleştirme yap
              if (parsed.data && parsed.data.sections) {
                parsed.data.sections = parsed.data.sections.map(section => ({
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
              
              setData(parsed)
              setError(null)
            } catch {
              // Parse hatasında genel hata göster
              const errorMessage = "Sunucudan gelen veri işlenemedi."
              setError(errorMessage)
              hasReceivedError = true
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
            hasReceivedError = true
            toast({
              title: "Hata",
              description: errorMessage,
              variant: "destructive",
            })
          } else if (eventName === "done") {
            // İşlem tamamlandı
            if (finalResult) {
              toast({
                title: "Başarılı",
                description: finalResult.message || "Tarama işlemi tamamlandı",
                variant: "default",
              })
            }
          }
        }
      }

      // Stream tamamlandıktan sonra, eğer result eventi gelmediyse kısa bir süre bekle
      // Çünkü bazen stream tamamlanır ama son event henüz işlenmemiş olabilir
      // Özellikle uzun süren işlemlerde result eventi geç gelebilir
      // result eventi geldiğinde setData çağrılıyor, bu yüzden hasReceivedResult true ise sorun yok
      if (!hasReceivedResult && !hasReceivedError) {
        // 15 saniye boyunca her 1 saniyede bir kontrol et
        let waitCount = 0
        const maxWaitTime = 15 // 15 saniye
        
        while (waitCount < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          waitCount++
          
          // Eğer result eventi gelmişse (finalResult set edilmiş demektir) döngüden çık
          // Bu durumda setData zaten çağrılmış olacak
          if (finalResult) {
            break
          }
        }
        
        // Eğer hala result gelmediyse hata göster
        // Ama eğer finalResult varsa, setData zaten çağrılmış demektir, hata gösterme
        if (!finalResult && !hasReceivedError) {
          const errorMessage = "Sunucudan beklenen sonuç alınamadı. İşlem uzun sürebilir, lütfen sayfayı yenileyip tekrar deneyin."
          setError(errorMessage)
          toast({
            title: "Hata",
            description: errorMessage,
            variant: "destructive",
          })
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Tarama sırasında bir hata oluştu"
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

  const handleYargitayUpload = async () => {
    if (!selectedInstitution) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir kurum seçin",
        variant: "destructive",
      })
      return
    }

    const pageNumber = Number(yargitayPage)
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      toast({
        title: "Uyarı",
        description: "Lütfen geçerli bir page değeri girin",
        variant: "destructive",
      })
      return
    }

    setLoadingYargitayUpload(true)
    try {
      const result = await yargitayUpload({
        page: pageNumber,
        kurum_id: selectedInstitution,
      })
      toast({
        title: "Başarılı",
        description: result?.message || "Yargıtay yükleme isteği gönderildi",
        variant: "default",
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Yargıtay yükleme isteği gönderilirken hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoadingYargitayUpload(false)
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

  // JSON oluştur fonksiyonu
  const handleGenerateJson = async () => {
    if (!selectedInstitution) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir kurum seçin",
        variant: "destructive",
      })
      return
    }

    setLoadingJson(true)
    
    // Mevcut JWT token'ı al
    const token =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null

    if (!token) {
      const errorMessage = "Oturum süresi dolmuş. Lütfen tekrar giriş yapın."
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
      setLoadingJson(false)
      return
    }

    try {
      // Sadece id ve type gönder
      const requestData = {
        id: selectedInstitution,
        type: queryType,
      }

      const response = await fetch("/api/mevzuatgpt/generate-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Bir hata oluştu" }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      setJsonData(result)
      setJsonModalOpen(true)
      
      toast({
        title: "Başarılı",
        description: result.message || "JSON başarıyla oluşturuldu",
        variant: "default",
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "JSON oluşturulurken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoadingJson(false)
    }
  }

  // JSON'u kopyala fonksiyonu
  const handleCopyJson = async () => {
    if (!jsonData) return
    
    try {
      const jsonString = JSON.stringify(jsonData, null, 2)
      await navigator.clipboard.writeText(jsonString)
      toast({
        title: "Başarılı",
        description: "JSON panoya kopyalandı",
        variant: "default",
      })
    } catch (err) {
      toast({
        title: "Hata",
        description: "JSON kopyalanırken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  // Tara-JSON İle modal açma fonksiyonu
  const handleScrapeWithData = () => {
    setScrapeWithDataModalOpen(true)
  }

  // Tara-JSON İle gönderme fonksiyonu
  const handleSubmitScrapeWithData = async () => {
    if (!jsonInputText.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen JSON verisi girin",
        variant: "destructive",
      })
      return
    }

    if (!selectedInstitution) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir kurum seçin",
        variant: "destructive",
      })
      return
    }

    setLoadingScrapeWithData(true)
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
      setLoadingScrapeWithData(false)
      return
    }

    try {
      // JSON'u parse et
      let requestData
      try {
        requestData = JSON.parse(jsonInputText)
      } catch (parseError) {
        throw new Error("Geçersiz JSON formatı. Lütfen geçerli bir JSON girin.")
      }

      // Seçili kurum ID'sini ve type'ı otomatik ekle (eğer JSON'da yoksa)
      if (!requestData.id) {
        requestData.id = selectedInstitution
      }
      if (!requestData.type) {
        requestData.type = queryType
      }

      // Önce mevcut belgeleri yükle ve sonuçları al
      const existingDocs = await loadExistingDocuments()

      const response = await fetch("/api/mevzuatgpt/scrape-with-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Bir hata oluştu" }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      
      // Response'u MevzuatGPTScanResponse formatına dönüştür
      if (result.success && result.data) {
        const scanResponse: MevzuatGPTScanResponse = {
          success: result.success,
          message: result.message || "Tarama işlemi tamamlandı",
          data: {
            total_sections: result.data.stats?.total_sections || result.data.sections?.length || 0,
            total_items: result.data.stats?.total_items || result.data.sections?.reduce((acc: number, section: any) => acc + (section.items?.length || 0), 0) || 0,
            uploaded_documents_count: 0, // Bu bilgi response'da yoksa 0
            sections: result.data.sections?.map((section: any) => ({
              section_title: section.section_title,
              items_count: section.items?.length || 0,
              items: section.items?.map((item: any, index: number) => ({
                id: typeof item.id === 'number' ? item.id : (index + 1),
                baslik: item.baslik,
                link: item.link,
                // Response'dan gelen değerleri kullan, yoksa false
                mevzuatgpt: item.mevzuatgpt === true || item.mevzuatgpt === "true" || item.mevzuatgpt === 1,
                portal: item.portal === true || item.portal === "true" || item.portal === 1,
              })) || []
            })) || [],
            sections_stats: result.data.stats?.sections_stats || result.data.sections?.map((section: any) => ({
              section_title: section.section_title,
              total: section.items?.length || 0,
              uploaded: 0, // Başlangıçta 0, sonra hesaplanacak
              not_uploaded: section.items?.length || 0
            })) || []
          }
        }

        // Başlıklara göre eşleştirme yap (handleScan'deki gibi)
        if (scanResponse.data && scanResponse.data.sections) {
          scanResponse.data.sections = scanResponse.data.sections.map(section => ({
            ...section,
            items: section.items.map(item => {
              const originalTitle = item.baslik || ""
              const normalizedTitle = normalizeTitle(originalTitle)
              
              // MevzuatGPT'de var mı kontrol et
              const isInMevzuatGPT = existingDocs.mevzuatGPT.has(normalizedTitle)
              
              // Portal'da var mı kontrol et
              const isInPortal = existingDocs.portal.has(normalizedTitle)
              
              // Response'dan gelen değerleri öncelikli kullan, yoksa mevcut belgelerden kontrol et
              const updatedItem = {
                ...item,
                mevzuatgpt: item.mevzuatgpt === true || isInMevzuatGPT || isTruthy(item.mevzuatgpt),
                portal: item.portal === true || isInPortal || isTruthy(item.portal)
              }
              
              return updatedItem
            })
          }))

          // sections_stats'i güncelle
          scanResponse.data.sections_stats = scanResponse.data.sections.map(section => {
            let uploaded = 0
            let notUploaded = 0
            
            section.items.forEach(item => {
              if (isTruthy(item.mevzuatgpt)) {
                uploaded++
              } else {
                notUploaded++
              }
            })
            
            return {
              section_title: section.section_title,
              total: section.items.length,
              uploaded,
              not_uploaded: notUploaded
            }
          })

          // uploaded_documents_count'u hesapla
          let totalUploaded = 0
          scanResponse.data.sections.forEach(section => {
            section.items.forEach(item => {
              if (isTruthy(item.mevzuatgpt)) {
                totalUploaded++
              }
            })
          })
          scanResponse.data.uploaded_documents_count = totalUploaded
        }

        setData(scanResponse)
        setError(null)
        
        // Modal'ı kapat ve input'u temizle (başarılı durumda)
        setScrapeWithDataModalOpen(false)
        setJsonInputText("")
        
        toast({
          title: "Başarılı",
          description: result.message || "Tarama işlemi başarıyla tamamlandı",
          variant: "default",
        })
      } else {
        throw new Error(result.message || "Beklenmeyen response formatı")
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Tarama işlemi sırasında bir hata oluştu"
      setError(errorMessage)
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoadingScrapeWithData(false)
    }
  }

  const handleFetchDocumentCounts = async (options?: { showAlert?: boolean }) => {
    setLoadingEmbeddings(true)
    
    try {
      // Elasticsearch sayısını al
      const result = await getElasticsearchStatus()
      let elasticsearchCount = 0
      
      if (result && result.index_info) {
        // index_info.total_docs kullan (ayarlar sayfasındaki Index Detayları bölümündeki gibi)
        const count = result.index_info.total_docs || 0
        
        if (!isNaN(count) && count >= 0) {
          elasticsearchCount = count
          setTotalChunkCount(count)
        } else {
          setTotalChunkCount(0)
        }
      } else {
        setTotalChunkCount(0)
      }
      
      // Supabase'de durumu "processing" olan döküman sayısını al
      try {
        const processingDocs = await getDocuments(1, 1, undefined, "processing")
        const processingCount = processingDocs.total_count || 0
        setProcessStatusCount(processingCount)
        
        const message = `Elasticsearch: ${elasticsearchCount.toLocaleString()}, Processing durumunda: ${processingCount.toLocaleString()} döküman bulundu.`
        toast({
          title: "Başarılı",
          description: message,
          variant: "default",
        })
        if (options?.showAlert) {
          alert(message)
        }
      } catch (processErr) {
        // Processing sayısı alınamazsa sadece Elasticsearch sayısını göster
        setProcessStatusCount(0)
        if (elasticsearchCount > 0) {
          const message = `Toplam ${elasticsearchCount.toLocaleString()} döküman bulundu.`
          toast({
            title: "Başarılı",
            description: message,
            variant: "default",
          })
          if (options?.showAlert) {
            alert(message)
          }
        } else {
          const message = "Processing durumundaki döküman sayısı alınamadı."
          toast({
            title: "Uyarı",
            description: message,
            variant: "destructive",
          })
          if (options?.showAlert) {
            alert(message)
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Toplam döküman sayısı alınırken hata oluştu"
      setTotalChunkCount(0)
      setProcessStatusCount(0)
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
      if (options?.showAlert) {
        alert(errorMessage)
      }
    } finally {
      setLoadingEmbeddings(false)
    }
  }

  // Streaming processDocument helper fonksiyonu
  const processDocumentStream = async (data: {
    kurum_id: string;
    link: string;
    mode: "m" | "p" | "t";
    category?: string;
    document_name?: string;
    detsis?: string;
    type?: string;
    use_ocr?: boolean | null;
  }): Promise<ProcessDocumentResponse> => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null

    if (!token) {
      throw new Error("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.")
    }

    const response = await fetch("/api/process-document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.body) {
      throw new Error("Sunucudan geçerli bir stream yanıtı alınamadı.")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder("utf-8")
    let buffer = ""
    let finalResult: ProcessDocumentResponse | null = null

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

        if (eventName === "result") {
          try {
            const parsed: ProcessDocumentResponse = JSON.parse(dataStr)
            finalResult = parsed
          } catch {
            throw new Error("Sunucudan gelen veri işlenemedi.")
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
              : "Belge işleme sırasında bir hata oluştu."

          throw new Error(errorMessage)
        }
      }
    }

    if (!finalResult) {
      throw new Error("Sunucudan beklenen sonuç alınamadı.")
    }

    return finalResult
  }

  const handleToggleSelectedItem = (itemKey: string, checked: boolean) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (checked) {
        next.add(itemKey)
      } else {
        next.delete(itemKey)
      }
      return next
    })
  }

  const handleBulkUpload = () => {
    if (!data?.data?.sections?.length) {
      toast({
        title: "Uyarı",
        description: "Listede veri bulunamadı",
        variant: "destructive",
      })
      return
    }

    if (selectedItems.size === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen en az bir kayıt seçin",
        variant: "destructive",
      })
      return
    }

    const selectedKurum = kurumlar.find(k => k._id === selectedInstitution)
    const detsis = selectedKurum?.detsis || ""

    const items = data.data.sections.flatMap(section =>
      section.items
        .filter(item => selectedItems.has(`${section.section_title}-${item.id}`))
        .map(item => ({
          kurum_id: selectedInstitution,
          detsis,
          type: queryType,
          link: item.link,
          mode: "t",
          category: section.section_title,
          document_name: item.baslik,
          use_ocr: false,
        }))
    )

    const payload = { items }
    setBulkUploadPayload(payload)
    setBulkUploadResponse(null)
    setBulkUploadModalOpen(true)
  }

  const getAuthToken = () => {
    return typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null
  }

  const handleBulkUploadStart = async () => {
    if (!bulkUploadPayload?.items?.length) {
      toast({
        title: "Uyarı",
        description: "Gönderilecek veri bulunamadı",
        variant: "destructive",
      })
      return
    }

    const token = getAuthToken()
    if (!token) {
      const errorMessage = "Oturum süresi dolmuş. Lütfen tekrar giriş yapın."
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${API_CONFIG.SCRAPPER_BASE_URL}/api/kurum/process/queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bulkUploadPayload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Bir hata oluştu" }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      setBulkUploadResponse(result)
      toast({
        title: "Başarılı",
        description: result.message || "İstekler kuyruğa alındı",
        variant: "default",
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Kuyruğa ekleme sırasında bir hata oluştu"
      setBulkUploadResponse({ success: false, message: errorMessage })
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleBulkUploadStatus = async () => {
    const token = getAuthToken()
    if (!token) {
      const errorMessage = "Oturum süresi dolmuş. Lütfen tekrar giriş yapın."
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${API_CONFIG.SCRAPPER_BASE_URL}/api/kurum/process/queue/status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Bir hata oluştu" }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      setBulkUploadResponse(result)
      toast({
        title: "Başarılı",
        description: "Kuyruk durumu alındı",
        variant: "default",
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Kuyruk durumu alınırken bir hata oluştu"
      setBulkUploadResponse({ success: false, message: errorMessage })
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleQueueStatusFetch = async () => {
    const token = getAuthToken()
    if (!token) {
      const errorMessage = "Oturum süresi dolmuş. Lütfen tekrar giriş yapın."
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${API_CONFIG.SCRAPPER_BASE_URL}/api/kurum/process/queue/status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Bir hata oluştu" }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      setQueueStatusResponse(result)
      setQueueStatusModalOpen(true)
      toast({
        title: "Başarılı",
        description: "Kuyruk durumu alındı",
        variant: "default",
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Kuyruk durumu alınırken bir hata oluştu"
      setQueueStatusResponse({ success: false, message: errorMessage })
      setQueueStatusModalOpen(true)
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleBulkUploadClear = async () => {
    const confirmed = typeof window !== "undefined" ? window.confirm("Kuyruğu boşaltmak istediğinizden emin misiniz?") : false
    if (!confirmed) return

    const token = getAuthToken()
    if (!token) {
      const errorMessage = "Oturum süresi dolmuş. Lütfen tekrar giriş yapın."
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${API_CONFIG.SCRAPPER_BASE_URL}/api/kurum/process/queue/clear`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Bir hata oluştu" }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      setBulkUploadResponse(result)
      toast({
        title: "Başarılı",
        description: "Kuyruk temizlendi",
        variant: "default",
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Kuyruk temizlenirken bir hata oluştu"
      setBulkUploadResponse({ success: false, message: errorMessage })
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

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
            <div className="flex items-center gap-2">
              <label htmlFor="yargitay-page-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Page:
              </label>
              <Input
                id="yargitay-page-input"
                type="number"
                min={1}
                value={yargitayPage}
                onChange={(event) => setYargitayPage(event.target.value)}
                className="w-[120px] min-w-[120px]"
              />
            </div>
            <Button
              onClick={handleYargitayUpload}
              disabled={loadingYargitayUpload || !selectedInstitution}
              variant="outline"
              className="flex items-center gap-2"
            >
              {loadingYargitayUpload ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Yükleniyor...</span>
                </>
              ) : (
                <span>Yargıtay Yüklemesi</span>
              )}
            </Button>
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
            <Button 
              onClick={handleGenerateJson} 
              disabled={loadingJson || !selectedInstitution}
              variant="outline"
              className="flex items-center gap-2"
            >
              {loadingJson ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <span>JSON Oluştur</span>
                </>
              )}
            </Button>
            <Button 
              onClick={handleScrapeWithData} 
              disabled={loadingScrapeWithData || !selectedInstitution}
              variant="outline"
              className="flex items-center gap-2"
            >
              <span>Tara-JSON İle</span>
            </Button>
            <Button 
              onClick={handleQueueStatusFetch}
              variant="outline"
              className="flex items-center gap-2"
            >
              <span>Mevcut Kuyruk Durumu</span>
            </Button>
            <Button 
              onClick={handleBulkUploadClear}
              variant="outline"
              className="flex items-center gap-2"
            >
              <span>Kuyruğu Boşalt</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              disabled={loadingEmbeddings}
              onClick={() => handleFetchDocumentCounts({ showAlert: true })}
            >
              {loadingEmbeddings ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="ml-1">Döküman Sayısı (Elasticsearch)</span>
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
                <div className="flex items-center gap-2">
                  <CardTitle>Bölümler ve Belgeler</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    disabled={loadingEmbeddings}
                    onClick={() => handleFetchDocumentCounts()}
                  >
                    {loadingEmbeddings ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    <span className="ml-1">Döküman Sayısı (Elasticsearch)</span>
                  </Button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isNaN(totalChunkCount) ? 0 : totalChunkCount.toLocaleString()} - {processStatusCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={handleBulkUpload}
                    disabled={selectedItems.size === 0}
                  >
                    Toplu Yükle
                  </Button>
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
                      <TableHead className="w-[60px] text-center bg-white dark:bg-gray-900">Seç</TableHead>
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
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedItems.has(`${section.section_title}-${item.id}`)}
                              onCheckedChange={(checked) => {
                                handleToggleSelectedItem(
                                  `${section.section_title}-${item.id}`,
                                  checked === true
                                )
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{section.section_title}</TableCell>
                          <TableCell>{item.baslik}</TableCell>
                          <TableCell className="text-center">
                            {item.mevzuatgpt === true || isTruthy(item.mevzuatgpt) ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <Button
                                size="sm"
                                variant={errorButtons.has(`${item.id}-m`) ? "destructive" : "outline"}
                                className={cn(
                                  "text-xs",
                                  errorButtons.has(`${item.id}-m`) && "bg-red-500 hover:bg-red-600 text-white"
                                )}
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
                                  // Hata durumunu temizle (yeniden deneme için)
                                  setErrorButtons(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(loadingKey)
                                    return newSet
                                  })
                                  
                                  try {
                                    // Seçili kurumun detsis bilgisini al
                                    const selectedKurum = kurumlar.find(k => k._id === selectedInstitution)
                                    const detsis = selectedKurum?.detsis || ""
                                    
                                    await processDocumentStream({
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
                                    let errorMessage = err instanceof Error ? err.message : "Yükleme sırasında bir hata oluştu"
                                    
                                    // Hata alan butonu işaretle
                                    setErrorButtons(prev => new Set(prev).add(loadingKey))
                                    
                                    // Bağlantı ve timeout hatalarını daha açıklayıcı hale getir
                                    const errorLower = errorMessage.toLowerCase()
                                    if (errorLower.includes("bağlanılamıyor") || errorLower.includes("bağlantı") || errorLower.includes("connection")) {
                                      errorMessage = "Yükleme işlemi uzun sürebilir. Bağlantı hatası alındı ancak işlem arka planda devam ediyor olabilir. Lütfen birkaç dakika bekleyip tekrar deneyin."
                                    } else if (errorLower.includes("zaman aşımı") || errorLower.includes("timeout") || errorLower.includes("zamanaşımı")) {
                                      errorMessage = "PDF işleme işlemi zaman aşımına uğradı. Bu durum büyük PDF dosyalarında normal olabilir. İşlem 2 saate kadar sürebilir. Lütfen işlemi tekrar deneyin."
                                    }
                                    
                                    setErrorModal({ open: true, message: errorMessage })
                                    toast({
                                      title: "Hata",
                                      description: errorMessage,
                                      variant: "destructive",
                                      duration: 15000, // 15 saniye göster - daha uzun mesajlar için
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
                                variant={errorButtons.has(`${item.id}-p`) ? "destructive" : "outline"}
                                className={cn(
                                  "text-xs",
                                  errorButtons.has(`${item.id}-p`) && "bg-red-500 hover:bg-red-600 text-white"
                                )}
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
                                  // Hata durumunu temizle (yeniden deneme için)
                                  setErrorButtons(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(loadingKey)
                                    return newSet
                                  })
                                  
                                  try {
                                    // Seçili kurumun detsis bilgisini al
                                    const selectedKurum = kurumlar.find(k => k._id === selectedInstitution)
                                    const detsis = selectedKurum?.detsis || ""
                                    
                                    await processDocumentStream({
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
                                    let errorMessage = err instanceof Error ? err.message : "Yükleme sırasında bir hata oluştu"
                                    
                                    // Hata alan butonu işaretle
                                    setErrorButtons(prev => new Set(prev).add(loadingKey))
                                    
                                    // Bağlantı ve timeout hatalarını daha açıklayıcı hale getir
                                    const errorLower = errorMessage.toLowerCase()
                                    if (errorLower.includes("bağlanılamıyor") || errorLower.includes("bağlantı") || errorLower.includes("connection")) {
                                      errorMessage = "Portal yükleme işlemi uzun sürebilir. Bağlantı hatası alındı ancak işlem arka planda devam ediyor olabilir. Lütfen birkaç dakika bekleyip tekrar deneyin."
                                    } else if (errorLower.includes("zaman aşımı") || errorLower.includes("timeout") || errorLower.includes("zamanaşımı")) {
                                      errorMessage = "PDF işleme işlemi zaman aşımına uğradı. Bu durum büyük PDF dosyalarında normal olabilir. Portal yükleme işlemi 2 saate kadar sürebilir. Lütfen işlemi tekrar deneyin."
                                    }
                                    
                                    setErrorModal({ open: true, message: errorMessage })
                                    toast({
                                      title: "Hata",
                                      description: errorMessage,
                                      variant: "destructive",
                                      duration: 15000, // 15 saniye göster - daha uzun mesajlar için
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
                                variant={errorButtons.has(`${item.id}-t`) ? "destructive" : "default"}
                                className={cn(
                                  "text-xs",
                                  errorButtons.has(`${item.id}-t`) && "bg-red-500 hover:bg-red-600 text-white"
                                )}
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
                                  // Hata durumunu temizle (yeniden deneme için)
                                  setErrorButtons(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(loadingKey)
                                    return newSet
                                  })
                                  
                                  try {
                                    // Seçili kurumun detsis bilgisini al
                                    const selectedKurum = kurumlar.find(k => k._id === selectedInstitution)
                                    const detsis = selectedKurum?.detsis || ""
                                    
                                    await processDocumentStream({
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
                                    let errorMessage = err instanceof Error ? err.message : "Yükleme sırasında bir hata oluştu"
                                    
                                    // Hata alan butonu işaretle
                                    setErrorButtons(prev => new Set(prev).add(loadingKey))
                                    
                                    // Bağlantı ve timeout hatalarını daha açıklayıcı hale getir
                                    const errorLower = errorMessage.toLowerCase()
                                    if (errorLower.includes("bağlanılamıyor") || errorLower.includes("bağlantı") || errorLower.includes("connection")) {
                                      errorMessage = "Yükleme işlemi uzun sürebilir. Bağlantı hatası alındı ancak işlem arka planda devam ediyor olabilir. Lütfen birkaç dakika bekleyip tekrar deneyin."
                                    } else if (errorLower.includes("zaman aşımı") || errorLower.includes("timeout") || errorLower.includes("zamanaşımı")) {
                                      errorMessage = "PDF işleme işlemi zaman aşımına uğradı. Bu durum büyük PDF dosyalarında normal olabilir. Portal yükleme işlemi 2 saate kadar sürebilir. Lütfen işlemi tekrar deneyin."
                                    }
                                    
                                    setErrorModal({ open: true, message: errorMessage })
                                    toast({
                                      title: "Hata",
                                      description: errorMessage,
                                      variant: "destructive",
                                      duration: 15000, // 15 saniye göster - daha uzun mesajlar için
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

      {/* JSON Modal */}
      <Dialog open={jsonModalOpen} onOpenChange={setJsonModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>JSON Sonuç</DialogTitle>
            <DialogDescription>
              Oluşturulan JSON verisi. Kopyalamak için butona tıklayın.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="flex justify-end">
              <Button
                onClick={handleCopyJson}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Kopyala
              </Button>
            </div>
            <div className="flex-1 overflow-auto border rounded-lg bg-gray-50 dark:bg-gray-900 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {jsonData ? JSON.stringify(jsonData, null, 2) : ""}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setJsonModalOpen(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tara-JSON İle Modal */}
      <Dialog open={scrapeWithDataModalOpen} onOpenChange={setScrapeWithDataModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Tara-JSON İle</DialogTitle>
            <DialogDescription>
              JSON verisini yapıştırın ve endpoint'e gönderin.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="flex-1 overflow-auto">
              <Textarea
                value={jsonInputText}
                onChange={(e) => setJsonInputText(e.target.value)}
                placeholder={`JSON verisini buraya yapıştırın...

Örnek:
{
  "id": "68bbf6df8ef4e8023c19641d",
  "detsis": "60521689",
  "type": "kaysis",
  "sections": [...],
  "stats": {...}
}`}
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setScrapeWithDataModalOpen(false)
                setJsonInputText("")
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmitScrapeWithData}
              disabled={loadingScrapeWithData || !jsonInputText.trim()}
            >
              {loadingScrapeWithData ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                "Gönder"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toplu Yükle Modal */}
      <Dialog open={bulkUploadModalOpen} onOpenChange={setBulkUploadModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Toplu Yükleme JSON</DialogTitle>
            <DialogDescription>
              Seçili kayıtlar için oluşturulan JSON verisi.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="flex-1 overflow-auto border rounded-lg bg-gray-50 dark:bg-gray-900 p-4 max-h-[400px]">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {bulkUploadPayload ? JSON.stringify(bulkUploadPayload, null, 2) : ""}
              </pre>
            </div>
            <div className="flex-1 overflow-auto border rounded-lg bg-gray-50 dark:bg-gray-900 p-4 max-h-[240px]">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {bulkUploadResponse ? JSON.stringify(bulkUploadResponse, null, 2) : ""}
              </pre>
            </div>
          </div>
          <DialogFooter className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBulkUploadStatus}>
              Mevcut Durum
            </Button>
            <Button variant="outline" onClick={handleBulkUploadClear}>
              Kuyruğu Boşalt
            </Button>
            <Button onClick={handleBulkUploadStart}>
              Yüklemeleri Başlat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mevcut Kuyruk Durumu Modal */}
      <Dialog open={queueStatusModalOpen} onOpenChange={setQueueStatusModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Mevcut Kuyruk Durumu</DialogTitle>
            <DialogDescription>
              Kuyruk durumu ve bekleyen kayıtlar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="flex-1 overflow-auto border rounded-lg bg-gray-50 dark:bg-gray-900 p-4 max-h-[400px]">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {queueStatusResponse ? JSON.stringify(queueStatusResponse, null, 2) : ""}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setQueueStatusModalOpen(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

