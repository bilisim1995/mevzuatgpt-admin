"use client"

import { useState, useEffect } from "react"
import { Send, User, Clock, MessageSquare, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupportTicketDetails, replyToTicket, updateTicketStatus } from "@/lib/support"
import { SupportTicket, SupportTicketDetail } from "@/types/support"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface SupportTicketDetailsProps {
  ticket: SupportTicket
  onClose: () => void
  onUpdate: () => void
}

export function SupportTicketDetails({ ticket, onClose, onUpdate }: SupportTicketDetailsProps) {
  const [ticketDetails, setTicketDetails] = useState<SupportTicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    loadTicketDetails()
  }, [ticket.id])

  const loadTicketDetails = async () => {
    try {
      setLoading(true)
      const details = await getSupportTicketDetails(ticket.id)
      setTicketDetails(details)
    } catch (error) {
      console.error('Ticket detayları yüklenirken hata:', error)
      toast.error('Ticket detayları yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Lütfen bir mesaj yazınız')
      return
    }

    try {
      setSendingReply(true)
      await replyToTicket(ticket.id, { message: replyMessage })
      toast.success('Yanıt başarıyla gönderildi')
      setReplyMessage('')
      await loadTicketDetails()
      onUpdate()
    } catch (error) {
      toast.error('Yanıt gönderilirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setSendingReply(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdatingStatus(true)
      await updateTicketStatus(ticket.id, { status: newStatus as any })
      toast.success('Ticket durumu başarıyla güncellendi')
      await loadTicketDetails()
      onUpdate()
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Açık', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
      in_progress: { label: 'İşlemde', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      waiting_response: { label: 'Yanıt Bekleniyor', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      resolved: { label: 'Çözüldü', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      closed: { label: 'Kapalı', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
    
    return (
      <Badge className={cn('px-2 py-1 text-xs font-medium rounded-full', config.className)}>
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Düşük', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      medium: { label: 'Orta', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      high: { label: 'Yüksek', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
      urgent: { label: 'Acil', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
    
    return (
      <Badge variant="outline" className={cn('px-2 py-1 text-xs font-medium rounded-full', config.className)}>
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200 mx-auto mb-4"></div>
        <p>Detaylar yükleniyor...</p>
      </div>
    )
  }

  if (!ticketDetails) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
        <p>Ticket detayları yüklenemedi</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Ticket Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Ticket Numarası</h4>
          <p className="text-blue-700 dark:text-blue-300">{ticketDetails.ticket_number}</p>
        </div>
        <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Konu</h4>
          <p className="text-green-700 dark:text-green-300">{ticketDetails.subject}</p>
        </div>
        <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
          <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Kullanıcı</h4>
          <p className="text-purple-700 dark:text-purple-300">{ticketDetails.user_name}</p>
          <p className="text-xs text-purple-600 dark:text-purple-400">{ticketDetails.user_email}</p>
        </div>
        <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
          <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Oluşturma Tarihi</h4>
          <p className="text-orange-700 dark:text-orange-300">{formatDate(ticketDetails.created_at)}</p>
        </div>
      </div>

      {/* Status and Priority */}
      <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Durum:</span>
            {getStatusBadge(ticketDetails.status)}
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Öncelik:</span>
            {getPriorityBadge(ticketDetails.priority)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={ticketDetails.status} 
            onValueChange={handleStatusUpdate}
            disabled={updatingStatus}
          >
            <SelectTrigger className="w-40 h-8 bg-white/50 dark:bg-black/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Açık</SelectItem>
              <SelectItem value="in_progress">İşlemde</SelectItem>
              <SelectItem value="waiting_response">Yanıt Bekleniyor</SelectItem>
              <SelectItem value="resolved">Çözüldü</SelectItem>
              <SelectItem value="closed">Kapalı</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Mesajlar ({ticketDetails.messages.length})
        </h4>
        
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {ticketDetails.messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "p-4 rounded-xl",
                message.is_admin 
                  ? "bg-blue-50/50 dark:bg-blue-900/20 ml-8" 
                  : "bg-gray-50/50 dark:bg-gray-900/20 mr-8"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-sm">
                    {message.sender_name}
                  </span>
                  {message.is_admin && (
                    <Badge variant="outline" className="text-xs">Admin</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatDate(message.created_at)}
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                {message.message}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Reply Form */}
      <div className="space-y-4 p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Admin Yanıtı</h4>
        <Textarea
          placeholder="Yanıtınızı yazınız..."
          value={replyMessage}
          onChange={(e) => setReplyMessage(e.target.value)}
          rows={4}
          className="bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl resize-none"
        />
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-white/50 dark:bg-black/30"
          >
            Kapat
          </Button>
          <Button
            onClick={handleSendReply}
            disabled={sendingReply || !replyMessage.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {sendingReply ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Gönderiliyor...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Yanıt Gönder
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}