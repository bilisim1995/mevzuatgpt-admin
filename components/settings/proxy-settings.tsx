"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { getProxies, getProxy, createProxy, updateProxy, deleteProxy, testProxy, Proxy, ProxyListResponse, ProxyTestResponse } from "@/lib/scrapper"
import { Loader2, Edit, Trash2, Plus, Network, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export function ProxySettings() {
  const [proxies, setProxies] = useState<Proxy[]>([])
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null)
  const [formData, setFormData] = useState({
    host: "",
    port: "",
    username: "",
    password: "",
    is_active: true
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [testResult, setTestResult] = useState<ProxyTestResponse | null>(null)
  const [testingProxyId, setTestingProxyId] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const { toast } = useToast()

  // Proxy'leri yükle
  const fetchProxies = async () => {
    setLoading(true)
    try {
      const result = await getProxies(1000, 0)
      if (result.success) {
        setProxies(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Proxy'ler yüklenirken bir hata oluştu"
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
    fetchProxies()
  }, [])

  // Proxy düzenleme dialog'unu aç
  const openEditDialog = (proxy: Proxy | null = null) => {
    if (proxy) {
      setEditingProxy(proxy)
      setFormData({
        host: proxy.host,
        port: proxy.port,
        username: proxy.username || "",
        password: "", // Güvenlik için şifreyi gösterme
        is_active: proxy.is_active
      })
    } else {
      setEditingProxy(null)
      setFormData({
        host: "",
        port: "",
        username: "",
        password: "",
        is_active: true
      })
    }
    setEditDialogOpen(true)
  }

  // Proxy kaydet (oluştur veya güncelle)
  const handleSaveProxy = async () => {
    if (!formData.host.trim() || !formData.port.trim()) {
      toast({
        title: "Uyarı",
        description: "Host ve Port zorunludur",
        variant: "destructive",
      })
      return
    }

    try {
      const proxyData: any = {
        host: formData.host.trim(),
        port: formData.port.trim(),
        is_active: formData.is_active
      }

      if (formData.username.trim()) {
        proxyData.username = formData.username.trim()
      }

      if (formData.password.trim()) {
        proxyData.password = formData.password.trim()
      }

      if (editingProxy) {
        // Güncelle
        await updateProxy(editingProxy.id, proxyData)
        toast({
          title: "Başarılı",
          description: "Proxy başarıyla güncellendi",
        })
      } else {
        // Oluştur
        await createProxy(proxyData)
        toast({
          title: "Başarılı",
          description: "Proxy başarıyla oluşturuldu",
        })
      }
      setEditDialogOpen(false)
      fetchProxies()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Proxy kaydedilirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Proxy sil
  const handleDeleteProxy = async (id: string) => {
    try {
      await deleteProxy(id)
      toast({
        title: "Başarılı",
        description: "Proxy başarıyla silindi",
      })
      fetchProxies()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Proxy silinirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Proxy test et
  const handleTestProxy = async (id: string) => {
    setTestingProxyId(id)
    setTesting(true)
    setTestResult(null)
    setTestModalOpen(true)
    
    try {
      const result = await testProxy({ id })
      setTestResult(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Proxy test edilirken bir hata oluştu"
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
      setTestResult(null)
    } finally {
      setTesting(false)
      setTestingProxyId(null)
    }
  }

  // Filtrelenmiş proxy'ler
  const filteredProxies = proxies.filter(proxy => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      proxy.host?.toLowerCase().includes(query) ||
      proxy.port?.toLowerCase().includes(query) ||
      proxy.username?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Proxy Yönetimi
              </CardTitle>
              <CardDescription>
                Proxy sunucularını yönetin {proxies.length > 0 && `(${proxies.length} proxy)`}
              </CardDescription>
            </div>
            <Button onClick={() => openEditDialog(null)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Yeni Proxy Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Host, port veya kullanıcı adı ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredProxies.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {proxies.length === 0 ? "Henüz proxy eklenmemiş" : "Arama sonucu bulunamadı"}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Host</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Kullanıcı Adı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Oluşturulma</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProxies.map((proxy) => (
                    <TableRow key={proxy.id}>
                      <TableCell className="font-medium">{proxy.host}</TableCell>
                      <TableCell>{proxy.port}</TableCell>
                      <TableCell>{proxy.username || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={proxy.is_active ? "default" : "secondary"}>
                          {proxy.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {proxy.created_at
                          ? new Date(proxy.created_at).toLocaleDateString("tr-TR", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestProxy(proxy.id)}
                            disabled={testing && testingProxyId === proxy.id}
                            title="Proxy Test Et"
                          >
                            {testing && testingProxyId === proxy.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4 text-blue-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(proxy)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Proxy'yi Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu proxy'yi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                  <br />
                                  <strong>{proxy.host}:{proxy.port}</strong>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProxy(proxy.id)}
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

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProxy ? "Proxy Düzenle" : "Yeni Proxy Ekle"}
            </DialogTitle>
            <DialogDescription>
              {editingProxy
                ? "Proxy bilgilerini güncelleyin. Şifre alanını boş bırakırsanız mevcut şifre korunur."
                : "Yeni bir proxy sunucusu ekleyin."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host *</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="geo.iproyal.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port *</Label>
                <Input
                  id="port"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  placeholder="12321"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Kullanıcı Adı</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="tU23j0va4T4HjIqh"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Şifre {editingProxy && "(Boş bırakırsanız değişmez)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveProxy}>
              {editingProxy ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Result Modal */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Proxy Test Sonucu
            </DialogTitle>
            <DialogDescription>
              Proxy bağlantı testi sonuçları
            </DialogDescription>
          </DialogHeader>
          {testing ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Test ediliyor...</span>
            </div>
          ) : testResult ? (
            <div className="space-y-4 py-4">
              {/* Proxy Bilgileri */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Proxy Bilgileri</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Host:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{testResult.proxy_host}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Port:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{testResult.proxy_port}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Test URL:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white break-all">{testResult.test_url}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">DETSIS:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{testResult.detsis}</span>
                  </div>
                </div>
              </div>

              {/* IP Bilgileri */}
              {testResult.ip_info && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">IP Bilgileri</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">IP Adresi:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{testResult.ip_info.ip}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Ülke:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {testResult.ip_info.country} ({testResult.ip_info.country_code})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Şehir:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{testResult.ip_info.city}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Türkiye:</span>
                      <Badge variant={testResult.ip_info.is_turkey ? "default" : "destructive"} className="ml-2">
                        {testResult.ip_info.is_turkey ? "Evet" : "Hayır"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Bağlantı Durumu */}
              <div className={`rounded-lg p-4 ${
                testResult.connection_status === "success" 
                  ? "bg-green-50 dark:bg-green-900/20" 
                  : "bg-red-50 dark:bg-red-900/20"
              }`}>
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Bağlantı Durumu</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Durum:</span>
                    <Badge variant={testResult.connection_status === "success" ? "default" : "destructive"}>
                      {testResult.connection_status === "success" ? "Başarılı" : "Başarısız"}
                    </Badge>
                  </div>
                  {testResult.http_status && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">HTTP Status:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{testResult.http_status}</span>
                    </div>
                  )}
                  {testResult.response_size !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Yanıt Boyutu:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {testResult.response_size.toLocaleString()} bytes
                      </span>
                    </div>
                  )}
                  {testResult.content_check && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">İçerik Kontrolü:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{testResult.content_check}</span>
                    </div>
                  )}
                  {testResult.error && (
                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-sm text-red-800 dark:text-red-200">
                      <strong>Hata:</strong> {testResult.error}
                    </div>
                  )}
                </div>
              </div>

              {/* Teknik Bilgiler */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Teknik Bilgiler</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">curl_cffi Kullanılabilir:</span>
                    <Badge variant={testResult.curl_cffi_available ? "default" : "secondary"}>
                      {testResult.curl_cffi_available ? "Evet" : "Hayır"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Proxy ID:</span>
                    <span className="font-mono text-xs text-gray-900 dark:text-white">{testResult.proxy_id}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Test sonucu bulunamadı
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestModalOpen(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

