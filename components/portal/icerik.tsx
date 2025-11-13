"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMetadataList, getMetadata, updateMetadata, getContentByMetadata, updateContentByMetadata, getKurumlar, Metadata, Content, Kurum } from "@/lib/scrapper"
import { Loader2, Edit, FileText, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function Icerik() {
  const [metadataList, setMetadataList] = useState<Metadata[]>([])
  const [kurumlar, setKurumlar] = useState<Kurum[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingKurumlar, setLoadingKurumlar] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingMetadata, setEditingMetadata] = useState<Metadata | null>(null)
  const [content, setContent] = useState<Content | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const [formData, setFormData] = useState<Partial<Metadata>>({})
  const [contentText, setContentText] = useState("")
  const [filterKurumId, setFilterKurumId] = useState<string>("all")
  const [filterBelgeTuru, setFilterBelgeTuru] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const { toast } = useToast()

  // Kurumları yükle
  useEffect(() => {
    const fetchKurumlar = async () => {
      setLoadingKurumlar(true)
      try {
        const result = await getKurumlar(1000, 0)
        if (result.success && result.data) {
          setKurumlar(result.data)
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

  // Metadata listesini yükle
  const fetchMetadataList = async () => {
    setLoading(true)
    try {
      const result = await getMetadataList(1000, 0)
      if (result.success) {
        setMetadataList(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Metadata listesi yüklenirken bir hata oluştu"
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
    fetchMetadataList()
  }, [])

  // Metadata düzenleme dialog'unu aç
  const openEditDialog = (metadata: Metadata) => {
    setEditingMetadata(metadata)
    setFormData({
      pdf_adi: metadata.pdf_adi || "",
      kurum_id: metadata.kurum_id || "",
      belge_turu: metadata.belge_turu || "",
      belge_durumu: metadata.belge_durumu || "",
      belge_yayin_tarihi: metadata.belge_yayin_tarihi || "",
      yururluluk_tarihi: metadata.yururluluk_tarihi || "",
      etiketler: metadata.etiketler || "",
      anahtar_kelimeler: metadata.anahtar_kelimeler || "",
      aciklama: metadata.aciklama || "",
      url_slug: metadata.url_slug || "",
      status: metadata.status || "",
      sayfa_sayisi: metadata.sayfa_sayisi,
      dosya_boyutu_mb: metadata.dosya_boyutu_mb,
    })
    
    // Content'i sıfırla
    setContent(null)
    setContentText("")
    
    setEditDialogOpen(true)
  }

  // Content'i yükle
  const handleLoadContent = async () => {
    if (!editingMetadata) return

    setLoadingContent(true)
    try {
      const contentResult = await getContentByMetadata(editingMetadata._id)
      if (contentResult.success && contentResult.data) {
        setContent(contentResult.data)
        setContentText(contentResult.data.icerik || "")
      } else {
        setContent(null)
        setContentText("")
        toast({
          title: "Bilgi",
          description: "Bu metadata için içerik bulunamadı",
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "İçerik yüklenirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
      setContent(null)
      setContentText("")
    } finally {
      setLoadingContent(false)
    }
  }

  // Metadata kaydet
  const handleSaveMetadata = async () => {
    if (!editingMetadata) return

    try {
      // Null değerleri temizle
      const cleanData: Partial<Metadata> = {}
      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof Metadata]
        if (value !== null && value !== undefined && value !== "") {
          cleanData[key as keyof Metadata] = value
        }
      })

      await updateMetadata(editingMetadata._id, cleanData)
      toast({
        title: "Başarılı",
        description: "Metadata başarıyla güncellendi",
      })
      fetchMetadataList()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Metadata güncellenirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Content kaydet
  const handleSaveContent = async () => {
    if (!editingMetadata) return

    if (!contentText.trim()) {
      toast({
        title: "Uyarı",
        description: "İçerik boş olamaz",
        variant: "destructive",
      })
      return
    }

    try {
      await updateContentByMetadata(editingMetadata._id, contentText)
      toast({
        title: "Başarılı",
        description: "İçerik başarıyla güncellendi",
      })
      // Content'i yeniden yükle
      const contentResult = await getContentByMetadata(editingMetadata._id)
      if (contentResult.success && contentResult.data) {
        setContent(contentResult.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "İçerik güncellenirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Kurum adını getir
  const getKurumAdi = (kurumId?: string) => {
    if (!kurumId) return "-"
    const kurum = kurumlar.find(k => k._id === kurumId)
    return kurum?.kurum_adi || kurumId
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>İçerik Yönetimi</CardTitle>
              <CardDescription>
                Metadata ve içerikleri görüntüleyin ve düzenleyin
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-kurum" className="text-sm font-medium">
                Kurum:
              </Label>
              <Select
                value={filterKurumId}
                onValueChange={setFilterKurumId}
              >
                <SelectTrigger id="filter-kurum" className="w-[200px]">
                  <SelectValue placeholder="Tüm Kurumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kurumlar</SelectItem>
                  {kurumlar.map((kurum) => (
                    <SelectItem key={kurum._id} value={kurum._id}>
                      {kurum.kurum_adi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-belge-turu" className="text-sm font-medium">
                Belge Türü:
              </Label>
              <Select
                value={filterBelgeTuru}
                onValueChange={setFilterBelgeTuru}
              >
                <SelectTrigger id="filter-belge-turu" className="w-[200px]">
                  <SelectValue placeholder="Tüm Belge Türleri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Belge Türleri</SelectItem>
                  {Array.from(new Set(metadataList.map(m => m.belge_turu).filter(Boolean))).map((belgeTuru) => (
                    <SelectItem key={belgeTuru} value={belgeTuru!}>
                      {belgeTuru}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-status" className="text-sm font-medium">
                Durum:
              </Label>
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger id="filter-status" className="w-[150px]">
                  <SelectValue placeholder="Tüm Durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="pasif">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : metadataList.length === 0 ? (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
              Henüz metadata eklenmemiş
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="h-[600px] overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[300px] bg-white dark:bg-gray-900">PDF Adı</TableHead>
                      <TableHead className="w-[200px] bg-white dark:bg-gray-900">Kurum</TableHead>
                      <TableHead className="w-[150px] bg-white dark:bg-gray-900">Belge Türü</TableHead>
                      <TableHead className="w-[150px] bg-white dark:bg-gray-900">Durum</TableHead>
                      <TableHead className="w-[100px] text-center bg-white dark:bg-gray-900">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                    <TableBody>
                      {metadataList
                        .filter(metadata => {
                          if (filterKurumId !== "all" && metadata.kurum_id !== filterKurumId) return false
                          if (filterBelgeTuru !== "all" && metadata.belge_turu !== filterBelgeTuru) return false
                          if (filterStatus !== "all" && metadata.status !== filterStatus) return false
                          return true
                        })
                        .map((metadata) => (
                        <TableRow key={metadata._id}>
                        <TableCell className="w-[300px] font-medium">
                          {metadata.pdf_adi || "-"}
                        </TableCell>
                        <TableCell className="w-[200px]">
                          {getKurumAdi(metadata.kurum_id)}
                        </TableCell>
                        <TableCell className="w-[150px]">
                          {metadata.belge_turu || "-"}
                        </TableCell>
                        <TableCell className="w-[150px]">
                          <span className={`px-2 py-1 rounded text-xs ${
                            metadata.status === "aktif" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }`}>
                            {metadata.status || metadata.belge_durumu || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="w-[100px] text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(metadata)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata ve Content Düzenleme Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Metadata ve İçerik Düzenle</DialogTitle>
            <DialogDescription>
              Metadata bilgilerini ve içeriği güncelleyin
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="metadata" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="content">İçerik</TabsTrigger>
            </TabsList>

            <TabsContent value="metadata" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pdf_adi">PDF Adı</Label>
                  <Input
                    id="pdf_adi"
                    value={formData.pdf_adi || ""}
                    onChange={(e) => setFormData({ ...formData, pdf_adi: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="kurum_id">Kurum</Label>
                  <Select
                    value={formData.kurum_id || ""}
                    onValueChange={(value) => setFormData({ ...formData, kurum_id: value })}
                    disabled={loadingKurumlar}
                  >
                    <SelectTrigger id="kurum_id" className="mt-2">
                      <SelectValue placeholder={loadingKurumlar ? "Yükleniyor..." : "Kurum seçin"} />
                    </SelectTrigger>
                    <SelectContent>
                      {kurumlar.map((kurum) => (
                        <SelectItem key={kurum._id} value={kurum._id}>
                          {kurum.kurum_adi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="belge_turu">Belge Türü</Label>
                  <Input
                    id="belge_turu"
                    value={formData.belge_turu || ""}
                    onChange={(e) => setFormData({ ...formData, belge_turu: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="belge_durumu">Belge Durumu</Label>
                  <Input
                    id="belge_durumu"
                    value={formData.belge_durumu || ""}
                    onChange={(e) => setFormData({ ...formData, belge_durumu: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="belge_yayin_tarihi">Belge Yayın Tarihi</Label>
                  <Input
                    id="belge_yayin_tarihi"
                    type="date"
                    value={formData.belge_yayin_tarihi || ""}
                    onChange={(e) => setFormData({ ...formData, belge_yayin_tarihi: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="yururluluk_tarihi">Yürürlülük Tarihi</Label>
                  <Input
                    id="yururluluk_tarihi"
                    type="date"
                    value={formData.yururluluk_tarihi || ""}
                    onChange={(e) => setFormData({ ...formData, yururluluk_tarihi: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="etiketler">Etiketler</Label>
                  <Input
                    id="etiketler"
                    value={formData.etiketler || ""}
                    onChange={(e) => setFormData({ ...formData, etiketler: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Durum</Label>
                  <Select
                    value={formData.status || ""}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status" className="mt-2">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="pasif">Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="anahtar_kelimeler">Anahtar Kelimeler</Label>
                  <Input
                    id="anahtar_kelimeler"
                    value={formData.anahtar_kelimeler || ""}
                    onChange={(e) => setFormData({ ...formData, anahtar_kelimeler: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="url_slug">URL Slug</Label>
                  <Input
                    id="url_slug"
                    value={formData.url_slug || ""}
                    onChange={(e) => setFormData({ ...formData, url_slug: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="aciklama">Açıklama</Label>
                  <Textarea
                    id="aciklama"
                    value={formData.aciklama || ""}
                    onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="sayfa_sayisi">Sayfa Sayısı</Label>
                  <Input
                    id="sayfa_sayisi"
                    type="number"
                    value={formData.sayfa_sayisi || ""}
                    onChange={(e) => setFormData({ ...formData, sayfa_sayisi: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="dosya_boyutu_mb">Dosya Boyutu (MB)</Label>
                  <Input
                    id="dosya_boyutu_mb"
                    type="number"
                    step="0.01"
                    value={formData.dosya_boyutu_mb || ""}
                    onChange={(e) => setFormData({ ...formData, dosya_boyutu_mb: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="mt-2"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleSaveMetadata}>
                  Metadata Güncelle
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-4">
              {!content && !loadingContent ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <p className="text-gray-500 dark:text-gray-400">
                    İçeriği görüntülemek veya düzenlemek için yükleyin
                  </p>
                  <Button onClick={handleLoadContent} className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    İçeriği Yükle
                  </Button>
                </div>
              ) : loadingContent ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="icerik">İçerik (Markdown)</Label>
                    <Textarea
                      id="icerik"
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
                      className="mt-2 font-mono text-sm"
                      rows={20}
                      placeholder="Markdown formatında içerik girin..."
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      İçerik Markdown formatındadır
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleSaveContent}>
                      İçerik Güncelle
                    </Button>
                  </DialogFooter>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

