"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { getKurumlar, getKurum, createKurum, updateKurum, deleteKurum, Kurum, KurumlarResponse } from "@/lib/scrapper"
import { Loader2, Edit, Trash2, Plus, Image as ImageIcon, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function Kurumlar() {
  const [kurumlar, setKurumlar] = useState<Kurum[]>([])
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingKurum, setEditingKurum] = useState<Kurum | null>(null)
  const [formData, setFormData] = useState({
    kurum_adi: "",
    aciklama: "",
    detsis: "",
    logo: null as File | null
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  // Kurumları yükle
  const fetchKurumlar = async () => {
    setLoading(true)
    try {
      const result = await getKurumlar(1000, 0)
      if (result.success) {
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
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKurumlar()
  }, [])

  // Kurum düzenleme dialog'unu aç
  const openEditDialog = (kurum: Kurum | null = null) => {
    if (kurum) {
      setEditingKurum(kurum)
      setFormData({
        kurum_adi: kurum.kurum_adi,
        aciklama: kurum.aciklama || "",
        detsis: kurum.detsis || "",
        logo: null
      })
      setLogoPreview(kurum.kurum_logo || null)
    } else {
      setEditingKurum(null)
      setFormData({
        kurum_adi: "",
        aciklama: "",
        detsis: "",
        logo: null
      })
      setLogoPreview(null)
    }
    setEditDialogOpen(true)
  }

  // Logo seçildiğinde preview göster
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, logo: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Logo preview'ı temizle
  const clearLogoPreview = () => {
    setFormData({ ...formData, logo: null })
    setLogoPreview(editingKurum?.kurum_logo || null)
    // Input'u sıfırla
    const fileInput = document.getElementById('logo-input') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // Kurum kaydet (oluştur veya güncelle)
  const handleSaveKurum = async () => {
    if (!formData.kurum_adi.trim()) {
      toast({
        title: "Uyarı",
        description: "Kurum adı zorunludur",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingKurum) {
        // Güncelle
        const result = await updateKurum(editingKurum._id, formData)
        toast({
          title: "Başarılı",
          description: result.logo_url ? "Kurum ve logo başarıyla güncellendi" : "Kurum başarıyla güncellendi",
        })
        if (result.logo_url) {
          setLogoPreview(result.logo_url)
        }
      } else {
        // Oluştur
        await createKurum(formData)
        toast({
          title: "Başarılı",
          description: "Kurum başarıyla oluşturuldu",
        })
      }
      setEditDialogOpen(false)
      fetchKurumlar()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Kurum kaydedilirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Kurum sil
  const handleDeleteKurum = async (id: string) => {
    try {
      await deleteKurum(id)
      toast({
        title: "Başarılı",
        description: "Kurum başarıyla silindi",
      })
      fetchKurumlar()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Kurum silinirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Filtrelenmiş kurumlar
  const filteredKurumlar = kurumlar.filter(kurum => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      kurum.kurum_adi?.toLowerCase().includes(query) ||
      kurum.aciklama?.toLowerCase().includes(query) ||
      kurum.detsis?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kurumlar</CardTitle>
              <CardDescription>
                MongoDB'deki kurumları yönetin {kurumlar.length > 0 && `(${kurumlar.length} kurum)`}
              </CardDescription>
            </div>
            <Button onClick={() => openEditDialog(null)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Yeni Kurum Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Kurum adı, açıklama veya detsis ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : kurumlar.length === 0 ? (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
              Henüz kurum eklenmemiş
            </div>
          ) : filteredKurumlar.length === 0 ? (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
              Arama kriterlerine uygun kurum bulunamadı
            </div>
          ) : (
            <div className="h-[600px] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[100px] bg-white dark:bg-gray-900">Logo</TableHead>
                    <TableHead className="w-[250px] bg-white dark:bg-gray-900">Kurum Adı</TableHead>
                    <TableHead className="bg-white dark:bg-gray-900">Açıklama</TableHead>
                    <TableHead className="w-[200px] bg-white dark:bg-gray-900">Detsis</TableHead>
                    <TableHead className="w-[150px] bg-white dark:bg-gray-900">Oluşturulma Tarihi</TableHead>
                    <TableHead className="w-[100px] text-center bg-white dark:bg-gray-900">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKurumlar.map((kurum) => (
                    <TableRow key={kurum._id}>
                      <TableCell>
                        {kurum.kurum_logo ? (
                          <img
                            src={kurum.kurum_logo}
                            alt={kurum.kurum_adi}
                            className="w-16 h-16 object-contain rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{kurum.kurum_adi}</TableCell>
                      <TableCell>{kurum.aciklama || "-"}</TableCell>
                      <TableCell>{kurum.detsis || "-"}</TableCell>
                      <TableCell>
                        {kurum.olusturulma_tarihi
                          ? new Date(kurum.olusturulma_tarihi).toLocaleDateString('tr-TR')
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(kurum)}
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
                                <AlertDialogTitle>Kurum'u Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu kurumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteKurum(kurum._id)}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kurum Düzenleme Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingKurum ? "Kurum Düzenle" : "Yeni Kurum Ekle"}</DialogTitle>
            <DialogDescription>
              {editingKurum ? "Kurum bilgilerini güncelleyin" : "Yeni bir kurum ekleyin"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-kurum-adi">Kurum Adı *</Label>
              <Input
                id="edit-kurum-adi"
                value={formData.kurum_adi}
                onChange={(e) => setFormData({ ...formData, kurum_adi: e.target.value })}
                placeholder="Kurum adı"
              />
            </div>
            <div>
              <Label htmlFor="edit-aciklama">Açıklama</Label>
              <Textarea
                id="edit-aciklama"
                value={formData.aciklama}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                placeholder="Kurum açıklaması"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-detsis">Detsis</Label>
              <Input
                id="edit-detsis"
                value={formData.detsis}
                onChange={(e) => setFormData({ ...formData, detsis: e.target.value })}
                placeholder="Detsis bilgisi"
              />
            </div>
            <div>
              <Label htmlFor="logo-input">Logo</Label>
              <div className="mt-2 space-y-2">
                {logoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-32 h-32 object-contain border rounded"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                      onClick={clearLogoPreview}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Input
                  id="logo-input"
                  type="file"
                  accept="image/png,image/jpg,image/jpeg,image/svg+xml,image/gif,image/webp"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, JPEG, SVG, GIF, WEBP formatları desteklenir
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveKurum}>
              {editingKurum ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

