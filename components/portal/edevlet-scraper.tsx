"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getKurumlar, scrapeEdevlet, getLinks, createLink, updateLink, deleteLink, deleteLinksByKurum, Kurum, EdevletScrapeResponse, Link } from "@/lib/scrapper"
import { Loader2, Search, ExternalLink, CheckCircle2, Edit, Trash2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export function EdevletScraper() {
  const [selectedKurum, setSelectedKurum] = useState<string>("")
  const [url, setUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [loadingKurumlar, setLoadingKurumlar] = useState(false)
  const [kurumlar, setKurumlar] = useState<Kurum[]>([])
  const [result, setResult] = useState<EdevletScrapeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Link düzenleme state'leri
  const [links, setLinks] = useState<Link[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [selectedKurumForDelete, setSelectedKurumForDelete] = useState<string>("")
  const [deleteKurumDialogOpen, setDeleteKurumDialogOpen] = useState(false)
  const [filterKurumId, setFilterKurumId] = useState<string>("all")
  const [formData, setFormData] = useState({
    baslik: "",
    aciklama: "",
    url: "",
    kurum_id: ""
  })
  
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
          if (result.data.length > 0 && !selectedKurum) {
            setSelectedKurum(result.data[0]._id)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Linkleri yükle
  const fetchLinks = async () => {
    setLoadingLinks(true)
    try {
      const result = await getLinks(1000, 0)
      if (result.success) {
        setLinks(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Linkler yüklenirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoadingLinks(false)
    }
  }

  // Link düzenleme dialog'unu aç
  const openEditDialog = (link: Link | null = null) => {
    if (link) {
      setEditingLink(link)
      setFormData({
        baslik: link.baslik,
        aciklama: link.aciklama || "",
        url: link.url,
        kurum_id: link.kurum_id
      })
    } else {
      setEditingLink(null)
      setFormData({
        baslik: "",
        aciklama: "",
        url: "",
        kurum_id: selectedKurum || ""
      })
    }
    setEditDialogOpen(true)
  }

  // Link kaydet (oluştur veya güncelle)
  const handleSaveLink = async () => {
    if (!formData.baslik.trim() || !formData.url.trim() || !formData.kurum_id) {
      toast({
        title: "Uyarı",
        description: "Başlık, URL ve Kurum zorunludur",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingLink) {
        // Güncelle
        await updateLink(editingLink._id, formData)
        toast({
          title: "Başarılı",
          description: "Link başarıyla güncellendi",
        })
      } else {
        // Oluştur
        await createLink(formData)
        toast({
          title: "Başarılı",
          description: "Link başarıyla oluşturuldu",
        })
      }
      setEditDialogOpen(false)
      fetchLinks()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Link kaydedilirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Link sil
  const handleDeleteLink = async (id: string) => {
    try {
      await deleteLink(id)
      toast({
        title: "Başarılı",
        description: "Link başarıyla silindi",
      })
      fetchLinks()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Link silinirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Kurumdaki tüm linkleri sil
  const handleDeleteLinksByKurum = async () => {
    if (!selectedKurumForDelete) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir kurum seçin",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await deleteLinksByKurum(selectedKurumForDelete)
      toast({
        title: "Başarılı",
        description: `${result.deleted_count} link başarıyla silindi`,
      })
      setDeleteKurumDialogOpen(false)
      setSelectedKurumForDelete("")
      fetchLinks()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Linkler silinirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleScrape = async () => {
    if (!selectedKurum) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir kurum seçin",
        variant: "destructive",
      })
      return
    }

    if (!url.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir URL girin",
        variant: "destructive",
      })
      return
    }

    // URL validasyonu
    try {
      new URL(url)
    } catch {
      toast({
        title: "Uyarı",
        description: "Geçerli bir URL girin",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await scrapeEdevlet(selectedKurum, url.trim())
      setResult(response)
      toast({
        title: "Başarılı",
        description: `${response.inserted_count} link başarıyla eklendi`,
        variant: "default",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Link toplama sırasında bir hata oluştu"
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>e-Devlet Scraper</CardTitle>
          <CardDescription>
            e-Devlet/Türkiye.gov.tr sayfalarından link toplama
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="new-link" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-gray-200/20 dark:border-gray-800/30 rounded-2xl p-1">
          <TabsTrigger 
            value="new-link" 
            className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white transition-all duration-200"
          >
            Yeni Link Ekle
          </TabsTrigger>
          <TabsTrigger 
            value="edit-links" 
            className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white transition-all duration-200"
            onClick={fetchLinks}
          >
            Link Düzenle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new-link">
          <Card>
            <CardHeader>
              <CardTitle>Yeni Link Ekle</CardTitle>
              <CardDescription>
                Kurum seçin ve taranacak e-Devlet sayfasının URL'ini girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="kurum-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 w-[150px]">
                  Kurum Seç:
                </Label>
                <Select 
                  value={selectedKurum} 
                  onValueChange={setSelectedKurum}
                  disabled={loadingKurumlar}
                >
                  <SelectTrigger id="kurum-select" className="w-[300px] min-w-[300px]">
                    <SelectValue placeholder={loadingKurumlar ? "Yükleniyor..." : "Kurum seçin"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingKurumlar ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      kurumlar.map((kurum) => (
                        <SelectItem key={kurum._id} value={kurum._id}>
                          {kurum.kurum_adi}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="url-input" className="text-sm font-medium text-gray-700 dark:text-gray-300 w-[150px]">
                  URL:
                </Label>
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://www.turkiye.gov.tr/sgk-hizmetleri"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleScrape} 
                  disabled={loading || !selectedKurum || !url.trim()}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Toplanıyor...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>Linkleri Topla</span>
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

          {result && result.success && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Toplama Sonuçları</CardTitle>
                    <CardDescription>
                      {result.inserted_count} link başarıyla eklendi
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Başarılı</span>
                  </div>
                </div>
              </CardHeader>
              {result.data.length > 0 && (
                <CardContent>
                  <div className="h-[600px] overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
                        <TableRow>
                          <TableHead className="w-[200px] bg-white dark:bg-gray-900">Başlık</TableHead>
                          <TableHead className="bg-white dark:bg-gray-900">Açıklama</TableHead>
                          <TableHead className="w-[100px] text-center bg-white dark:bg-gray-900">Link</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.data.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.baslik}</TableCell>
                            <TableCell>{item.aciklama}</TableCell>
                            <TableCell className="text-center">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Görüntüle
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="edit-links">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Link Düzenle</CardTitle>
                  <CardDescription>
                    Mevcut linkleri görüntüleyin, düzenleyin veya silin
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="filter-kurum" className="text-sm font-medium">
                      Kurum Filtresi:
                    </Label>
                    <Select
                      value={filterKurumId}
                      onValueChange={setFilterKurumId}
                    >
                      <SelectTrigger id="filter-kurum" className="w-[250px]">
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
                  <AlertDialog open={deleteKurumDialogOpen} onOpenChange={setDeleteKurumDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="flex items-center gap-2"
                        onClick={() => setSelectedKurumForDelete("")}
                      >
                        <Trash2 className="h-4 w-4" />
                        Kurum Linklerini Toplu Sil
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Kurum Linklerini Toplu Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          Seçtiğiniz kurumdaki tüm linkleri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Label htmlFor="delete-kurum-select" className="text-sm font-medium">
                          Kurum Seç:
                        </Label>
                        <Select
                          value={selectedKurumForDelete}
                          onValueChange={setSelectedKurumForDelete}
                        >
                          <SelectTrigger id="delete-kurum-select" className="mt-2">
                            <SelectValue placeholder="Kurum seçin" />
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
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteLinksByKurum}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={!selectedKurumForDelete}
                        >
                          Tümünü Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button onClick={() => openEditDialog(null)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Yeni Link Ekle
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLinks ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : links.length === 0 ? (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                  Henüz link eklenmemiş
                </div>
              ) : (
                <div className="h-[600px] overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="w-[200px] bg-white dark:bg-gray-900">Başlık</TableHead>
                        <TableHead className="bg-white dark:bg-gray-900">Açıklama</TableHead>
                        <TableHead className="w-[200px] bg-white dark:bg-gray-900">URL</TableHead>
                        <TableHead className="w-[150px] bg-white dark:bg-gray-900">Kurum</TableHead>
                        <TableHead className="w-[100px] text-center bg-white dark:bg-gray-900">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {links
                        .filter(link => filterKurumId === "all" || link.kurum_id === filterKurumId)
                        .map((link) => {
                          const kurum = kurumlar.find(k => k._id === link.kurum_id)
                          return (
                            <TableRow key={link._id}>
                              <TableCell className="font-medium">{link.baslik}</TableCell>
                              <TableCell>{link.aciklama || "-"}</TableCell>
                              <TableCell>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm truncate block max-w-[200px]"
                                >
                                  {link.url}
                                </a>
                              </TableCell>
                              <TableCell>{kurum?.kurum_adi || link.kurum_id}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(link)}
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Link'i Sil</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Bu link'i silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteLink(link._id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Sil
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Link Düzenleme Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLink ? "Link Düzenle" : "Yeni Link Ekle"}</DialogTitle>
            <DialogDescription>
              {editingLink ? "Link bilgilerini güncelleyin" : "Yeni bir link ekleyin"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-baslik">Başlık *</Label>
              <Input
                id="edit-baslik"
                value={formData.baslik}
                onChange={(e) => setFormData({ ...formData, baslik: e.target.value })}
                placeholder="Link başlığı"
              />
            </div>
            <div>
              <Label htmlFor="edit-aciklama">Açıklama</Label>
              <Textarea
                id="edit-aciklama"
                value={formData.aciklama}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                placeholder="Link açıklaması"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-url">URL *</Label>
              <Input
                id="edit-url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://www.turkiye.gov.tr/..."
              />
            </div>
            <div>
              <Label htmlFor="edit-kurum">Kurum *</Label>
              <Select
                value={formData.kurum_id}
                onValueChange={(value) => setFormData({ ...formData, kurum_id: value })}
              >
                <SelectTrigger id="edit-kurum">
                  <SelectValue placeholder="Kurum seçin" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveLink}>
              {editingLink ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

