"use client"

import { FileText, Loader2 } from "lucide-react"
import { useActiveTasks } from "@/hooks/use-document-progress"
import { DocumentProgressBar } from "./document-progress-bar"

interface ActiveTasksProps {
  onTaskComplete?: () => void
}

export function ActiveTasks({ onTaskComplete }: ActiveTasksProps) {
  const { activeTasks, loading } = useActiveTasks()

  if (loading) {
    return (
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Aktif işlemler kontrol ediliyor...</span>
        </div>
      </div>
    )
  }

  if (activeTasks.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aktif İşlemler ({activeTasks.length})
        </h3>
      </div>
      
      <div className="space-y-4">
        {activeTasks.map(task => (
          <DocumentProgressBar 
            key={task.task_id} 
            taskId={task.task_id}
            onComplete={onTaskComplete}
          />
        ))}
      </div>
    </div>
  )
}