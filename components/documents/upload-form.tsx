"use client"

import { useState } from "react"
import { Upload, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadDocument } from "@/lib/document"
import { DocumentUpload, DocumentCategory } from "@/types/document"
import { MESSAGES } from "@/constants/messages"
import { cn } from "@/lib/utils"
import { DocumentProgressBar } from "./document-progress-bar"

const categories: DocumentCategory[] = [
  { value: 'mevzuat', label: MESSAGES.DOCUMENTS.CATEGORY_MEVZUAT },
  { value: 'yonetmelik', label: MESSAGES.DOCUMENTS.CATEGORY_YONETMELIK },
  { value: 'genelge', label: MESSAGES.DOCUMENTS.CATEGORY_GENELGE },
  { value: 'teblig', label: MESSAGES.DOCUMENTS.CATEGORY_TEBLIG },
]

export function UploadForm() {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    keywords: '',
    source_institution: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
    setSuccess('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError('')
    } else {
      setError('Lütfen geçerli bir PDF dosyası seçiniz')
      setFile(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('Lütfen bir PDF dosyası seçiniz')
      return
    }

    if (!formData.title || !formData.category || !formData.description) {
      setError('Lütfen tüm zorunlu alanları doldurunuz')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const uploadData: DocumentUpload = {
        ...formData,
        file
      }
      
      const result = await uploadDocument(uploadData)
      
      setSuccess('Dosya yüklendi, işleme başlandı. PDF Yönetimi sekmesinden durumu takip edebilirsiniz.')
      
      // Reset form
      setFormData({
        title: '',
        category: '',
        description: '',
        keywords: '',
        source_institution: '',
      })
      setFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
    } catch (err) {
      setError(err instanceof Error ? err.message : MESSAGES.DOCUMENTS.UPLOAD_ERROR)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100/20 to-gray-300/20 dark:from-gray-700/20 dark:to-gray-900/20 backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/20 mb-4">
            <Upload className="w-8 h-8 text-gray-800 dark:text-gray-200" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {MESSAGES.DOCUMENTS.UPLOAD_TITLE}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {MESSAGES.DOCUMENTS.UPLOAD_DESCRIPTION}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {MESSAGES.DOCUMENTS.TITLE_LABEL} *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder={MESSAGES.DOCUMENTS.TITLE_PLACEHOLDER}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {MESSAGES.DOCUMENTS.CATEGORY_LABEL} *
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                  <SelectValue placeholder={MESSAGES.DOCUMENTS.CATEGORY_PLACEHOLDER} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {MESSAGES.DOCUMENTS.DOC_DESCRIPTION_LABEL} *
            </Label>
            <Textarea
              id="description"
              placeholder={MESSAGES.DOCUMENTS.DOC_DESCRIPTION_PLACEHOLDER}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
              rows={3}
              className="bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="keywords" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {MESSAGES.DOCUMENTS.KEYWORDS_LABEL}
              </Label>
              <Input
                id="keywords"
                type="text"
                placeholder={MESSAGES.DOCUMENTS.KEYWORDS_PLACEHOLDER}
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
                className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_institution" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {MESSAGES.DOCUMENTS.SOURCE_INSTITUTION_LABEL}
              </Label>
              <Input
                id="source_institution"
                type="text"
                placeholder={MESSAGES.DOCUMENTS.SOURCE_INSTITUTION_PLACEHOLDER}
                value={formData.source_institution}
                onChange={(e) => handleInputChange('source_institution', e.target.value)}
                className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {MESSAGES.DOCUMENTS.FILE_LABEL} *
            </Label>
            <div className="relative">
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-input')?.click()}
                className="w-full h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl hover:bg-white/70 dark:hover:bg-black/50 transition-all duration-300"
              >
                <FileText className="w-4 h-4 mr-2" />
                {file ? file.name : MESSAGES.DOCUMENTS.SELECT_FILE}
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 backdrop-blur-sm">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-green-50/50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/30 backdrop-blur-sm">
              <p className="text-sm text-green-600 dark:text-green-400 text-center">
                {success}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isUploading}
            className="w-full h-12 bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-800 dark:from-white dark:to-gray-200 dark:hover:from-gray-100 dark:hover:to-gray-300 text-white dark:text-black rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {MESSAGES.DOCUMENTS.UPLOADING}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {MESSAGES.DOCUMENTS.UPLOAD_BUTTON}
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}