"use client"

import { useState } from "react"
import { Home, Database, Users, ChevronRight, Bot, MessageSquare, CreditCard, Search, Settings, Activity, Megaphone, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"
import { MESSAGES } from "@/constants/messages"

interface SidebarProps {
  activeItem: string
  onItemClick: (item: string) => void
}

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['data-source'])

  const toggleExpanded = (item: string) => {
    setExpandedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    )
  }

  const menuItems = [
    {
      id: 'home',
      label: MESSAGES.SIDEBAR.HOME,
      icon: Home,
      hasChildren: false
    },
    {
      id: 'data-source',
      label: MESSAGES.SIDEBAR.DATA_SOURCE_MANAGEMENT,
      icon: Database,
      hasChildren: true,
      children: [
        { id: 'single-upload', label: 'Tekli PDF Yükleme' },
        { id: 'bulk-upload', label: 'Çoklu PDF Yükleme' },
        { id: 'pdf-management', label: 'PDF Yönetimi' }
      ]
    },
    {
      id: 'users',
      label: MESSAGES.SIDEBAR.USERS_MANAGEMENT,
      icon: Users,
      hasChildren: false
    },
    {
      id: 'announcements',
      label: 'Duyurular',
      icon: Megaphone,
      hasChildren: false
    },
    {
      id: 'support',
      label: 'Destek Talepleri',
      icon: MessageSquare,
      hasChildren: false
    },
    {
      id: 'feedback',
      label: 'Feedback',
      icon: MessageSquare,
      hasChildren: false
    },
    {
      id: 'credit',
      label: 'Kredi Hareketleri',
      icon: CreditCard,
      hasChildren: false
    },
    {
      id: 'billing',
      label: 'Faturalandırma',
      icon: Receipt,
      hasChildren: false
    },
    {
      id: 'search-logs',
      label: 'Sorgu Kayıtları',
      icon: Search,
      hasChildren: false
    },
    {
      id: 'maintenance',
      label: 'Bakım Modu',
      icon: Settings,
      hasChildren: false
    },
    {
      id: 'system-health',
      label: 'Sistem Sağlığı',
      icon: Activity,
      hasChildren: false
    },
    {
      id: 'settings',
      label: 'Ayarlar',
      icon: Settings,
      hasChildren: false
    }
  ]

  return (
    <div className="w-64 bg-white/10 dark:bg-black/20 backdrop-blur-xl border-r border-gray-200/20 dark:border-gray-800/30 h-full">
      <div className="p-6">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.hasChildren) {
                    toggleExpanded(item.id)
                  }
                  onItemClick(item.id)
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200",
                  "hover:bg-white/20 dark:hover:bg-black/30",
                  activeItem === item.id && "bg-white/20 dark:bg-black/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {item.label}
                  </span>
                </div>
                {item.hasChildren && (
                  <ChevronRight 
                    className={cn(
                      "w-4 h-4 text-gray-500 transition-transform duration-200",
                      expandedItems.includes(item.id) && "rotate-90"
                    )}
                  />
                )}
              </button>
              
              {/* Children menu items */}
              {item.hasChildren && item.children && expandedItems.includes(item.id) && (
                <div className="ml-4 mt-2 space-y-1">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => onItemClick(child.id)}
                      className={cn(
                        "w-full flex items-center px-4 py-2 rounded-lg transition-all duration-200 text-sm",
                        "hover:bg-white/10 dark:hover:bg-black/20",
                        activeItem === child.id && "bg-white/20 dark:bg-black/30"
                      )}
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {child.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Separator line */}
              {item.id !== menuItems[menuItems.length - 1].id && (
                <div className="mx-4 my-2 h-px bg-gray-200/30 dark:bg-gray-700/30" />
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}