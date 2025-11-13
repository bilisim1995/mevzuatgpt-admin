"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Sidebar } from "@/components/layout/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ProfileDropdown } from "@/components/layout/profile-dropdown"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UploadForm } from "@/components/documents/upload-form"
import { BulkUploadForm } from "@/components/documents/bulk-upload-form"
import { DocumentList } from "@/components/documents/document-list"
import { UserList } from "@/components/users/user-list"
import { PromptList } from "@/components/prompts/prompt-list"
import { SupportStats } from "@/components/support/support-stats"
import { SupportList } from "@/components/support/support-list"
import { FeedbackStatsComponent } from "@/components/feedback/feedback-stats"
import { FeedbackList } from "@/components/feedback/feedback-list"
import { CreditStats } from "@/components/credit/credit-stats"
import { CreditList } from "@/components/credit/credit-list"
import { SearchLogsStats } from "@/components/search-logs/search-logs-stats"
import { SearchLogsList } from "@/components/search-logs/search-logs-list"
import { MaintenancePanel } from "@/components/maintenance/maintenance-panel"
import { SystemHealthPanel } from "@/components/system-health/system-health-panel"
import { DashboardStatsComponent } from "@/components/dashboard/dashboard-stats"
import { AnnouncementList } from "@/components/announcements/announcement-list"
import { SettingsPanel } from "@/components/settings/settings-panel"
import { PurchaseList } from "@/components/purchases/purchase-list"
import { MevzuatTara } from "@/components/portal/mevzuat-tara"
import { EdevletScraper } from "@/components/portal/edevlet-scraper"
import { Kurumlar } from "@/components/portal/kurumlar"
import { KurumDuyurular } from "@/components/portal/kurum-duyurular"
import { Icerik } from "@/components/portal/icerik"
import { SistemDurumu } from "@/components/portal/sistem-durumu"
import { MevzuatTaraDataSource } from "@/components/documents/mevzuat-tara"
import { MESSAGES } from "@/constants/messages"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [activeMenuItem, setActiveMenuItem] = useState('home')

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user && user.role !== 'admin'))) {
      router.push("/admin/login")
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-800 dark:border-gray-200"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{MESSAGES.DASHBOARD.LOADING}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const renderContent = () => {
    switch (activeMenuItem) {
      case 'home':
        return (
          <DashboardStatsComponent />
        )
      case 'data-source':
        return (
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-gray-200/20 dark:border-gray-800/30 rounded-2xl p-1">
              <TabsTrigger 
                value="upload" 
                className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white transition-all duration-200"
              >
                {MESSAGES.DOCUMENTS.UPLOAD_TAB}
              </TabsTrigger>
              <TabsTrigger 
                value="management"
                className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white transition-all duration-200"
              >
                {MESSAGES.DOCUMENTS.MANAGEMENT_TAB}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <UploadForm />
            </TabsContent>
            <TabsContent value="management">
              <DocumentList />
            </TabsContent>
          </Tabs>
        )
      case 'single-upload':
        return <UploadForm />
      case 'bulk-upload':
        return <BulkUploadForm />
      case 'pdf-management':
        return <DocumentList />
      case 'mevzuat-tara-datasource':
        return <MevzuatTaraDataSource />
      case 'users':
        return <UserList />
      case 'announcements':
        return <AnnouncementList />
      case 'support':
        return (
          <div className="space-y-8">
            <SupportStats />
            <SupportList />
          </div>
        )
      case 'feedback':
        return (
          <div className="space-y-8">
            <FeedbackStatsComponent />
            <FeedbackList />
          </div>
        )
      case 'credit':
        return (
          <div className="space-y-8">
            <CreditStats />
            <CreditList />
          </div>
        )
      case 'search-logs':
        return (
          <div className="space-y-8">
            <SearchLogsStats />
            <SearchLogsList />
          </div>
        )
      case 'maintenance':
        return <MaintenancePanel />
      case 'system-health':
        return <SystemHealthPanel />
      case 'settings':
        return <SettingsPanel />
      case 'billing':
        return <PurchaseList />
      case 'mevzuat-tara':
        return <MevzuatTara />
      case 'edevlet-scraper':
        return <EdevletScraper />
      case 'kurumlar':
        return <Kurumlar />
      case 'kurum-duyurular':
        return <KurumDuyurular />
      case 'icerik':
        return <Icerik />
      case 'sistem-durumu':
        return <SistemDurumu />
      default:
        return null
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800 flex">
      {/* Sidebar */}
      <Sidebar 
        activeItem={activeMenuItem} 
        onItemClick={setActiveMenuItem} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-800/30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {MESSAGES.DASHBOARD.TITLE}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <ProfileDropdown />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 w-full max-w-full overflow-x-hidden">
          <div className="w-full max-w-full overflow-x-hidden">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}