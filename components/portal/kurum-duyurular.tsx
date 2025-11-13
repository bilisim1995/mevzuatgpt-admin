"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { getKurumDuyurular, createKurumDuyuru, updateKurumDuyuru, deleteKurumDuyuru, getKurumlar, KurumDuyuru, Kurum } from "@/lib/scrapper"
import { Loader2, Edit, Trash2, Plus, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function KurumDuyurular() {
  const [duyurular, setDuyurular] = useState<KurumDuyuru[]>([])
  const [kurumlar, setKurumlar] = useState<Kurum[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingKurumlar, setLoadingKurumlar] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingDuyuru, setEditingDuyuru] = useState<KurumDuyuru | null>(null)
  const [formData, setFormData] = useState({
    kurum_id: "",
    duyuru_linki: ""
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

  // Duyuruları yükle
  const fetchDuyurular = async () => {
    setLoading(true)
    try {
      const result = await getKurumDuyurular(1000, 0)
      if (result.success) {
        setDuyurular(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Duyurular yüklenirken bir hata oluştu"
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
    fetchDuyurular()
  }, [])

  // Duyuru düzenleme dialog'unu aç
  const openEditDialog = (duyuru: KurumDuyuru | null = null) => {
    if (duyuru) {
      setEditingDuyuru(duyuru)
      setFormData({
        kurum_id: duyuru.kurum_id,
        duyuru_linki: duyuru.duyuru_linki
      })
    } else {
      setEditingDuyuru(null)
      setFormData({
        kurum_id: "",
        duyuru_linki: ""
      })
    }
    setEditDialogOpen(true)
  }

  // Duyuru kaydet (oluştur veya güncelle)
  const handleSaveDuyuru = async () => {
    if (!formData.kurum_id.trim()) {
      toast({
        title: "Uyarı",
        description: "Kurum seçimi zorunludur",
        variant: "destructive",
      })
      return
    }

    if (!formData.duyuru_linki.trim()) {
      toast({
        title: "Uyarı",
        description: "Duyuru linki zorunludur",
        variant: "destructive",
      })
      return
    }

    // URL validasyonu
    try {
      new URL(formData.duyuru_linki)
    } catch {
      toast({
        title: "Uyarı",
        description: "Geçerli bir URL girin (http:// veya https:// ile başlamalı)",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingDuyuru) {
        // Güncelle
        await updateKurumDuyuru(editingDuyuru._id, formData)
        toast({
          title: "Başarılı",
          description: "Duyuru başarıyla güncellendi",
        })
      } else {
        // Oluştur
        await createKurumDuyuru(formData)
        toast({
          title: "Başarılı",
          description: "Duyuru başarıyla oluşturuldu",
        })
      }
      setEditDialogOpen(false)
      fetchDuyurular()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Duyuru kaydedilirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Duyuru sil
  const handleDeleteDuyuru = async (id: string) => {
    try {
      await deleteKurumDuyuru(id)
      toast({
        title: "Başarılı",
        description: "Duyuru başarıyla silindi",
      })
      fetchDuyurular()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Duyuru silinirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Kurum adını getir
  const getKurumAdi = (kurumId: string) => {
    const kurum = kurumlar.find(k => k._id === kurumId)
    return kurum?.kurum_adi || kurumId
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kurum Duyurular</CardTitle>
              <CardDescription>
                MongoDB'deki kurum duyurularını yönetin
              </CardDescription>
            </div>
            <Button onClick={() => openEditDialog(null)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Yeni Duyuru Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : duyurular.length === 0 ? (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
              Henüz duyuru eklenmemiş
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="h-[600px] overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[250px] bg-white dark:bg-gray-900">Kurum</TableHead>
                      <TableHead className="bg-white dark:bg-gray-900">Duyuru Linki</TableHead>
                      <TableHead className="w-[100px] text-center bg-white dark:bg-gray-900">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duyurular.map((duyuru) => (
                      <TableRow key={duyuru._id}>
                        <TableCell className="w-[250px] font-medium">{getKurumAdi(duyuru.kurum_id)}</TableCell>
                        <TableCell>
                          <a
                            href={duyuru.duyuru_linki}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {duyuru.duyuru_linki}
                          </a>
                        </TableCell>
                        <TableCell className="w-[100px] text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(duyuru)}
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
                                  <AlertDialogTitle>Duyuru'yu Sil</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bu duyuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>İptal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteDuyuru(duyuru._id)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duyuru Düzenleme Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDuyuru ? "Duyuru Düzenle" : "Yeni Duyuru Ekle"}</DialogTitle>
            <DialogDescription>
              {editingDuyuru ? "Duyuru bilgilerini güncelleyin" : "Yeni bir duyuru ekleyin"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-kurum">Kurum *</Label>
              <Select
                value={formData.kurum_id}
                onValueChange={(value) => setFormData({ ...formData, kurum_id: value })}
                disabled={loadingKurumlar}
              >
                <SelectTrigger id="edit-kurum" className="mt-2">
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
            <div>
              <Label htmlFor="edit-duyuru-linki">Duyuru Linki *</Label>
              <Input
                id="edit-duyuru-linki"
                type="url"
                value={formData.duyuru_linki}
                onChange={(e) => setFormData({ ...formData, duyuru_linki: e.target.value })}
                placeholder="https://www.sgk.gov.tr/duyuru/12345"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                URL http:// veya https:// ile başlamalıdır
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveDuyuru}>
              {editingDuyuru ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

