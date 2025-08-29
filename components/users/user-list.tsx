"use client"

import { useState, useEffect } from "react"
import { Search, Eye, Edit, Trash2, RefreshCw, Users, Ban, UserCheck, CreditCard, AlertCircle, Shield, Mail, Briefcase, Building, Calendar, Activity, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getUsers, getUserDetails, updateUser, banUser, unbanUser, updateUserCredits, deleteUser } from "@/lib/users"
import { User, UserUpdateData, BanUserData, UpdateCreditsData } from "@/types/user"
import { cn } from "@/lib/utils"
import { getStoredToken } from "@/lib/auth"
import { toast } from "sonner"

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Modal states
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [creditsModalOpen, setCreditsModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userDetails, setUserDetails] = useState<User | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Form states
  const [editForm, setEditForm] = useState<UserUpdateData>({})
  const [banForm, setBanForm] = useState<BanUserData>({ reason: '' })
  const [banDuration, setBanDuration] = useState<string>('permanent')
  const [creditsForm, setCreditsForm] = useState<UpdateCreditsData>({ amount: 0, reason: '' })

  const loadUsers = async (pageNum: number = 1, search: string = '', role: string = '', status: string = '') => {
    try {
      setLoading(true)
      
      // Check if user is authenticated before making API call
      const token = getStoredToken()
      if (!token) {
        setUsers([])
        setTotalPages(0)
        setHasMore(false)
        setLoading(false)
        return
      }
      
      const filters: any = {
        page: pageNum,
        limit: 20
      }
      
      if (search) filters.search = search
      if (role && role !== 'all') filters.role = role
      if (status && status !== 'all') filters.is_banned = status === 'banned'
      
      const response = await getUsers(filters)
      
      if (pageNum === 1) {
        setUsers(response.users)
      } else {
        setUsers(prev => [...prev, ...response.users])
      }
      
      setTotalPages(response.pagination.pages)
      setHasMore(response.pagination.has_next > 0)
      setPage(pageNum)
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error)
      setUsers([])
      setTotalPages(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSearch = () => {
    loadUsers(1, searchTerm, roleFilter, statusFilter)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadUsers(1, searchTerm, roleFilter, statusFilter)
    setRefreshing(false)
  }

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user)
    setLoadingDetails(true)
    setDetailsModalOpen(true)
    
    try {
      const details = await getUserDetails(user.id)
      setUserDetails(details)
    } catch (error) {
      console.error('Kullanıcı detayları alınırken hata:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      email: user.email,
      full_name: user.full_name,
      ad: user.ad,
      soyad: user.soyad,
      meslek: user.meslek,
      calistigi_yer: user.calistigi_yer,
      role: user.role
    })
    setEditModalOpen(true)
  }

  const handleBan = (user: User) => {
    setSelectedUser(user)
    setBanForm({ reason: '' })
    setBanDuration('permanent')
    setBanModalOpen(true)
  }

  const handleCredits = (user: User) => {
    setSelectedUser(user)
    setCreditsForm({ amount: 0, reason: '' })
    setCreditsModalOpen(true)
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setDeleteModalOpen(true)
  }

  const submitEdit = async () => {
    if (!selectedUser) return
    
    try {
      await updateUser(selectedUser.id, editForm)
      toast.success("Kullanıcı başarıyla güncellendi", {
        description: `${selectedUser.full_name} kullanıcısının bilgileri güncellendi.`
      })
      setEditModalOpen(false)
      handleRefresh()
    } catch (error) {
      console.error('Kullanıcı güncellenirken hata:', error)
      toast.error("Kullanıcı güncellenirken hata oluştu", {
        description: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu"
      })
    }
  }

  const submitBan = async () => {
    if (!selectedUser) return
    
    try {
      if (!selectedUser.is_banned) {
        const banData = {
          ...banForm,
          ...(banDuration !== 'permanent' && banDuration !== '' ? { ban_duration_hours: parseInt(banDuration) } : {})
        }
        await banUser(selectedUser.id, banData)
        toast.success("Kullanıcı başarıyla banlandı", {
          description: `${selectedUser.full_name} kullanıcısı banlandı.`
        })
      } else {
        await unbanUser(selectedUser.id)
        toast.success("Ban başarıyla kaldırıldı", {
          description: `${selectedUser.full_name} kullanıcısının banı kaldırıldı.`
        })
      }
      setBanModalOpen(false)
      handleRefresh()
    } catch (error) {
      console.error('Ban işlemi sırasında hata:', error)
      toast.error("Ban işlemi sırasında hata oluştu", {
        description: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu"
      })
    }
  }

  const submitCredits = async () => {
    if (!selectedUser) return
    
    try {
      await updateUserCredits(selectedUser.id, creditsForm)
      toast.success("Kredi başarıyla güncellendi", {
        description: `${selectedUser.full_name} kullanıcısının kredisi güncellendi.`
      })
      setCreditsModalOpen(false)
      handleRefresh()
    } catch (error) {
      console.error('Kredi güncellenirken hata:', error)
      toast.error("Kredi güncellenirken hata oluştu", {
        description: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu"
      })
    }
  }

  const submitDelete = async () => {
    if (!selectedUser) return
    
    try {
      await deleteUser(selectedUser.id)
      toast.success("Kullanıcı başarıyla silindi", {
        description: `${selectedUser.full_name} kullanıcısı sistemden silindi.`
      })
      setDeleteModalOpen(false)
      handleRefresh()
    } catch (error) {
      console.error('Kullanıcı silinirken hata:', error)
      toast.error("Kullanıcı silinirken hata oluştu", {
        description: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu"
      })
    }
  }

  const getStatusBadge = (isBanned: boolean) => {
    return (
      <Badge className={cn(
        'px-2 py-1 text-xs font-medium rounded-full',
        !isBanned 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      )}>
        {!isBanned ? 'Aktif' : 'Banlı'}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    return (
      <Badge className={cn(
        'px-2 py-1 text-xs font-medium rounded-full',
        role === 'admin'
          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      )}>
        {role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
      </Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Hiç giriş yapmamış'
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100/20 to-gray-300/20 dark:from-gray-700/20 dark:to-gray-900/20 backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/20 mb-4">
              <Users className="w-8 h-8 text-gray-800 dark:text-gray-200" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Üye Yönetimi
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Sistem üyelerini görüntüleyin ve yönetin
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Kullanıcı ara (ad, email)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Roller</SelectItem>
                <SelectItem value="user">Kullanıcı</SelectItem>
                <SelectItem value="admin">Yönetici</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="banned">Banlı</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleSearch}
              className="h-12 px-6 bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-800 dark:from-white dark:to-gray-200 dark:hover:from-gray-100 dark:hover:to-gray-300 text-white dark:text-black rounded-xl"
            >
              Ara
            </Button>
            
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="h-12 px-4 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl hover:bg-white/70 dark:hover:bg-black/50 transition-all duration-300"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Users Table */}
          {loading && users.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-gray-800 dark:border-t-gray-200 mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Kullanıcılar Yükleniyor</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen bekleyiniz...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Kullanıcı bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Kullanıcı</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Rol</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Durum</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Kredi</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Son Giriş</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200/10 dark:border-gray-700/10 hover:bg-white/5 dark:hover:bg-black/10 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black dark:from-white dark:to-gray-200 flex items-center justify-center">
                            <span className="text-white dark:text-black font-semibold text-sm">
                              {user.full_name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {user.full_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(user.is_banned)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.current_balance} kredi
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.total_used} kullanılmış
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(user.last_sign_in_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(user)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(user)}
                            className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                          >
                            <Edit className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleBan(user)}
                            className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                          >
                            {!user.is_banned ? (
                              <Ban className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCredits(user)}
                            className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                          >
                            <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(user)}
                            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <Button
                onClick={() => loadUsers(page + 1, searchTerm, roleFilter, statusFilter)}
                disabled={loading}
                variant="outline"
                className="bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl hover:bg-white/70 dark:hover:bg-black/50 transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-gray-800 dark:border-t-gray-200"></div>
                    Yükleniyor...
                  </div>
                ) : (
                  'Daha Fazla Yükle'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Kullanıcı Detayları - {selectedUser?.full_name}
            </DialogTitle>
          </DialogHeader>
          {loadingDetails ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200 mx-auto mb-4"></div>
              <p>Detaylar yükleniyor...</p>
            </div>
          ) : userDetails ? (
            <Tabs defaultValue="general" className="w-full max-h-[80vh] overflow-y-auto">
              <TabsList className="grid w-full grid-cols-5 mb-6 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-gray-200/20 dark:border-gray-800/30 rounded-2xl p-1">
                <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30">
                  <Users className="w-4 h-4 mr-2" />
                  Genel
                </TabsTrigger>
                <TabsTrigger value="activity" className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30">
                  <Activity className="w-4 h-4 mr-2" />
                  Aktivite
                </TabsTrigger>
                <TabsTrigger value="credits" className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Krediler
                </TabsTrigger>
                <TabsTrigger value="auth" className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30">
                  <Shield className="w-4 h-4 mr-2" />
                  Kimlik Doğrulama
                </TabsTrigger>
                <TabsTrigger value="system" className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30">
                  <Settings className="w-4 h-4 mr-2" />
                  Sistem
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      E-posta
                    </h4>
                    <p className="text-blue-700 dark:text-blue-300">{userDetails.email}</p>
                  </div>
                  <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Rol
                    </h4>
                    {getRoleBadge(userDetails.role)}
                  </div>
                  <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Meslek
                    </h4>
                    <p className="text-purple-700 dark:text-purple-300">{userDetails.meslek || 'Belirtilmemiş'}</p>
                  </div>
                  <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Çalıştığı Yer
                    </h4>
                    <p className="text-orange-700 dark:text-orange-300">{userDetails.calistigi_yer || 'Belirtilmemiş'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Kayıt Tarihi
                    </h4>
                    <p className="text-indigo-700 dark:text-indigo-300">{formatDate(userDetails.created_at)}</p>
                  </div>
                  <div className="p-4 bg-pink-50/50 dark:bg-pink-900/20 rounded-xl">
                    <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Son Giriş
                    </h4>
                    <p className="text-pink-700 dark:text-pink-300">{formatDate(userDetails.last_sign_in_at)}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl text-center">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">E-posta Onayı</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {userDetails.email_confirmed_at ? 'Onaylandı' : 'Onaylanmadı'}
                    </p>
                    {userDetails.email_confirmed_at && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {formatDate(userDetails.email_confirmed_at)}
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl text-center">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Arama Sayısı</h4>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{userDetails.search_count}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Hesap Durumu</h4>
                  {getStatusBadge(userDetails.is_banned)}
                </div>
              </TabsContent>
              
              <TabsContent value="credits" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl text-center">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Mevcut Kredi</h4>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{userDetails.current_balance}</p>
                  </div>
                  <div className="p-4 bg-red-50/50 dark:bg-red-900/20 rounded-xl text-center">
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Kullanılan Kredi</h4>
                    <p className="text-3xl font-bold text-red-700 dark:text-red-300">{userDetails.total_used}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Kredi Kullanım Oranı</h4>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${userDetails.current_balance > 0 ? (userDetails.total_used / (userDetails.current_balance + userDetails.total_used)) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                    {userDetails.current_balance > 0 ? 
                      `${Math.round((userDetails.total_used / (userDetails.current_balance + userDetails.total_used)) * 100)}% kullanılmış` : 
                      'Henüz kredi kullanılmamış'
                    }
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="auth" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Kimlik Doğrulama Durumu
                    </h4>
                    <p className="text-blue-700 dark:text-blue-300">{userDetails.aud || 'Belirtilmemiş'}</p>
                  </div>
                  <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      Sistem Rolü
                    </h4>
                    <p className="text-green-700 dark:text-green-300">{userDetails.role || 'authenticated'}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Kimlik Doğrulama Sağlayıcıları
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {userDetails.providers?.map((provider: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-purple-700 dark:text-purple-300">
                        {provider}
                      </Badge>
                    )) || <span className="text-purple-700 dark:text-purple-300">Belirtilmemiş</span>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                      E-posta Doğrulandı
                    </h4>
                    <Badge variant={userDetails.raw_user_meta_data?.email_verified ? "default" : "secondary"}>
                      {userDetails.raw_user_meta_data?.email_verified ? "Evet" : "Hayır"}
                    </Badge>
                  </div>
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                      Telefon Doğrulandı
                    </h4>
                    <Badge variant={userDetails.raw_user_meta_data?.phone_verified ? "default" : "secondary"}>
                      {userDetails.raw_user_meta_data?.phone_verified ? "Evet" : "Hayır"}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-pink-50/50 dark:bg-pink-900/20 rounded-xl">
                    <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">
                      Onay Tarihi
                    </h4>
                    <p className="text-pink-700 dark:text-pink-300">{userDetails.confirmed_at ? formatDate(userDetails.confirmed_at) : 'Onaylanmamış'}</p>
                  </div>
                  <div className="p-4 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl">
                    <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">
                      Davet Tarihi
                    </h4>
                    <p className="text-teal-700 dark:text-teal-300">{userDetails.invited_at ? formatDate(userDetails.invited_at) : 'Davet edilmemiş'}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="system" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Instance ID
                    </h4>
                    <p className="text-xs font-mono text-blue-700 dark:text-blue-300 break-all">{userDetails.instance_id}</p>
                  </div>
                  <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      Kullanıcı ID
                    </h4>
                    <p className="text-xs font-mono text-green-700 dark:text-green-300 break-all">{userDetails.id}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Şifre Durumu
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={userDetails.encrypted_password ? "default" : "secondary"}>
                      {userDetails.encrypted_password ? "Şifrelenmiş" : "Şifre Yok"}
                    </Badge>
                    {userDetails.encrypted_password && (
                      <span className="text-xs text-purple-600 dark:text-purple-400">
                        (Güvenli şekilde saklanıyor)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                      Telefon
                    </h4>
                    <p className="text-orange-700 dark:text-orange-300">{userDetails.phone || 'Belirtilmemiş'}</p>
                    {userDetails.phone_confirmed_at && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Onaylandı: {formatDate(userDetails.phone_confirmed_at)}
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                      SSO Kullanıcısı
                    </h4>
                    <Badge variant={userDetails.is_sso_user ? "default" : "secondary"}>
                      {userDetails.is_sso_user ? "Evet" : "Hayır"}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-pink-50/50 dark:bg-pink-900/20 rounded-xl">
                    <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">
                      Süper Admin
                    </h4>
                    <Badge variant={userDetails.is_super_admin ? "default" : "secondary"}>
                      {userDetails.is_super_admin ? "Evet" : "Hayır"}
                    </Badge>
                  </div>
                  <div className="p-4 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl">
                    <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">
                      Anonim Kullanıcı
                    </h4>
                    <Badge variant={userDetails.is_anonymous ? "secondary" : "default"}>
                      {userDetails.is_anonymous ? "Evet" : "Hayır"}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Token Durumları
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Onay Token: </span>
                      <Badge variant={userDetails.confirmation_token ? "default" : "secondary"} className="text-xs">
                        {userDetails.confirmation_token ? "Var" : "Yok"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Kurtarma Token: </span>
                      <Badge variant={userDetails.recovery_token ? "default" : "secondary"} className="text-xs">
                        {userDetails.recovery_token ? "Var" : "Yok"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">E-posta Değişim Token: </span>
                      <Badge variant={userDetails.email_change_token_new ? "default" : "secondary"} className="text-xs">
                        {userDetails.email_change_token_new ? "Var" : "Yok"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Yeniden Kimlik Doğrulama: </span>
                      <Badge variant={userDetails.reauthentication_token ? "default" : "secondary"} className="text-xs">
                        {userDetails.reauthentication_token ? "Var" : "Yok"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Hesap Durumu
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-red-600 dark:text-red-400">Silinme Tarihi: </span>
                      <span className="text-red-700 dark:text-red-300">
                        {userDetails.deleted_at ? formatDate(userDetails.deleted_at) : 'Silinmemiş'}
                      </span>
                    </div>
                    <div>
                      <span className="text-red-600 dark:text-red-400">Ban Bitiş Tarihi: </span>
                      <span className="text-red-700 dark:text-red-300">
                        {userDetails.banned_until ? formatDate(userDetails.banned_until) : 'Banlı değil'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-xl">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    Meta Veriler
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">App Meta Data:</span>
                      <pre className="text-xs bg-yellow-100/50 dark:bg-yellow-800/20 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(userDetails.raw_app_meta_data, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">User Meta Data:</span>
                      <pre className="text-xs bg-yellow-100/50 dark:bg-yellow-800/20 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(userDetails.raw_user_meta_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kullanıcı Düzenle - {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-ad">Ad</Label>
                <Input
                  id="edit-ad"
                  value={editForm.ad || ''}
                  onChange={(e) => setEditForm({...editForm, ad: e.target.value})}
                  className="bg-white/50 dark:bg-black/30"
                />
              </div>
              <div>
                <Label htmlFor="edit-soyad">Soyad</Label>
                <Input
                  id="edit-soyad"
                  value={editForm.soyad || ''}
                  onChange={(e) => setEditForm({...editForm, soyad: e.target.value})}
                  className="bg-white/50 dark:bg-black/30"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-full-name">Tam Ad</Label>
              <Input
                id="edit-full-name"
                value={editForm.full_name || ''}
                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                className="bg-white/50 dark:bg-black/30"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-email">E-posta</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                className="bg-white/50 dark:bg-black/30"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-meslek">Meslek</Label>
              <Input
                id="edit-meslek"
                value={editForm.meslek || ''}
                onChange={(e) => setEditForm({...editForm, meslek: e.target.value})}
                className="bg-white/50 dark:bg-black/30"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-calistigi-yer">Çalıştığı Yer</Label>
              <Input
                id="edit-calistigi-yer"
                value={editForm.calistigi_yer || ''}
                onChange={(e) => setEditForm({...editForm, calistigi_yer: e.target.value})}
                className="bg-white/50 dark:bg-black/30"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-role">Rol</Label>
              <Select value={editForm.role} onValueChange={(value: 'user' | 'admin') => setEditForm({...editForm, role: value})}>
                <SelectTrigger className="bg-white/50 dark:bg-black/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Kullanıcı</SelectItem>
                  <SelectItem value="admin">Yönetici</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={submitEdit}>
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban/Unban Modal */}
      <Dialog open={banModalOpen} onOpenChange={setBanModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-orange-600 dark:text-orange-400">
              {!selectedUser?.is_banned ? 'Kullanıcıyı Banla' : 'Ban Kaldır'}
            </DialogTitle>
            <DialogDescription>
              <strong>"{selectedUser?.full_name}"</strong> kullanıcısı için {!selectedUser?.is_banned ? 'ban' : 'ban kaldırma'} işlemi yapılacak.
              {selectedUser?.banned_until && (
                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <span className="text-sm text-orange-700 dark:text-orange-300">
                    Mevcut ban bitiş tarihi: {formatDate(selectedUser.banned_until)}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {!selectedUser?.is_banned && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ban-duration">Ban Süresi</Label>
                <Select value={banDuration} onValueChange={setBanDuration}>
                  <SelectTrigger className="bg-white/50 dark:bg-black/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Kalıcı Ban</SelectItem>
                    <SelectItem value="1">1 Saat</SelectItem>
                    <SelectItem value="6">6 Saat</SelectItem>
                    <SelectItem value="24">1 Gün</SelectItem>
                    <SelectItem value="168">1 Hafta</SelectItem>
                    <SelectItem value="720">1 Ay</SelectItem>
                    <SelectItem value="custom">Özel Süre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {banDuration === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-duration">Özel Süre (Saat)</Label>
                  <Input
                    id="custom-duration"
                    type="number"
                    placeholder="Saat cinsinden süre giriniz"
                    value={banDuration === 'custom' ? '' : banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="bg-white/50 dark:bg-black/30"
                    min="1"
                  />
                </div>
              )}
              
              <div className="space-y-2">
              <Label htmlFor="ban-reason">Ban Sebebi</Label>
              <Textarea
                id="ban-reason"
                placeholder="Ban sebebini açıklayınız..."
                value={banForm.reason}
                onChange={(e) => setBanForm({...banForm, reason: e.target.value})}
                className="bg-white/50 dark:bg-black/30"
                rows={3}
              />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanModalOpen(false)}>
              İptal
            </Button>
            <Button 
              variant={!selectedUser?.is_banned ? "destructive" : "default"}
              onClick={submitBan}
            >
              {!selectedUser?.is_banned ? 'Banla' : 'Ban Kaldır'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credits Modal */}
      <Dialog open={creditsModalOpen} onOpenChange={setCreditsModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-purple-600 dark:text-purple-400">
              Kredi Güncelle - {selectedUser?.full_name}
            </DialogTitle>
            <DialogDescription>
              Mevcut kredi: <strong>{selectedUser?.current_balance}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="credits-amount">Kredi Miktarı</Label>
              <Input
                id="credits-amount"
                type="number"
                placeholder="Pozitif veya negatif değer giriniz"
                value={creditsForm.amount}
                onChange={(e) => setCreditsForm({...creditsForm, amount: parseInt(e.target.value) || 0})}
                className="bg-white/50 dark:bg-black/30"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pozitif değer kredi ekler, negatif değer kredi düşer
              </p>
            </div>
            
            <div>
              <Label htmlFor="credits-reason">Sebep</Label>
              <Textarea
                id="credits-reason"
                placeholder="Kredi değişikliği sebebini açıklayınız..."
                value={creditsForm.reason}
                onChange={(e) => setCreditsForm({...creditsForm, reason: e.target.value})}
                className="bg-white/50 dark:bg-black/30"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={submitCredits}>
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">
              Kullanıcı Silme Onayı
            </DialogTitle>
            <DialogDescription>
              <strong>"{selectedUser?.full_name}"</strong> kullanıcısını silmek istediğinizden emin misiniz?
              <br />
              <span className="text-red-500 text-sm mt-2 block">
                Bu işlem geri alınamaz. Kullanıcı ve tüm ilişkili veriler kalıcı olarak silinecektir.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={submitDelete}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}