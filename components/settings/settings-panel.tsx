"use client"

import { Settings, Database, CreditCard } from "lucide-react"
import { Bot } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RedisManagement } from "./redis-management"
import { ElasticsearchManagement } from "./elasticsearch-management"
import { PromptList } from "@/components/prompts/prompt-list"
import { GroqSettingsPanel } from "./groq-settings"

export function SettingsPanel() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-700/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sistem Ayarları</h2>
            <p className="text-gray-600 dark:text-gray-400">Sistem bileşenlerini yönetin ve yapılandırın</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="redis" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-5 mb-8 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-gray-200/20 dark:border-gray-800/30 rounded-2xl p-1">
            <TabsTrigger 
              value="redis" 
              className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white transition-all duration-200"
            >
              <Database className="w-4 h-4 mr-2" />
              Redis Yönetimi
            </TabsTrigger>
            <TabsTrigger 
              value="elasticsearch" 
              className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white transition-all duration-200"
            >
              <Database className="w-4 h-4 mr-2" />
              Elasticsearch
            </TabsTrigger>
            <TabsTrigger 
              value="ai-settings" 
              className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white transition-all duration-200"
            >
              <Bot className="w-4 h-4 mr-2" />
              AI Ayarları
            </TabsTrigger>
            <TabsTrigger 
              value="groq-settings" 
              className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white transition-all duration-200"
            >
              <Bot className="w-4 h-4 mr-2" />
              Groq Ayarları
            </TabsTrigger>
            <TabsTrigger 
              value="payment-settings" 
              className="rounded-xl data-[state=active]:bg-white/20 dark:data-[state=active]:bg-black/30 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white transition-all duration-200"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Ödeme Ayarları
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="redis">
            <RedisManagement />
          </TabsContent>
          
          <TabsContent value="elasticsearch">
            <ElasticsearchManagement />
          </TabsContent>
          
          <TabsContent value="ai-settings">
            <PromptList />
          </TabsContent>
          
          <TabsContent value="groq-settings">
            <GroqSettingsPanel />
          </TabsContent>

          <TabsContent value="payment-settings">
            {/* Lazy import avoided for simplicity */}
            {/**/}
            {/* @ts-expect-error - file is client component */}
            {require('./payment-settings').PaymentSettingsPanel()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}