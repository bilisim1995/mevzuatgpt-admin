"use client"

import { useState, useRef } from "react"
import { Upload, FileText, Loader2, X, Search, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { bulkUploadDocuments, BulkUploadRequest } from "@/lib/bulk-upload"
import { getInstitutions } from "@/lib/institutions"
import { DocumentCategory } from "@/types/document"
import { MESSAGES } from "@/constants/messages"
import { cn } from "@/lib/utils"

const categories: DocumentCategory[] = [
  { value: 'mevzuat', label: MESSAGES.DOCUMENTS.CATEGORY_MEVZUAT },
  { value: 'yonetmelik', label: MESSAGES.DOCUMENTS.CATEGORY_YONETMELIK },
  { value: 'genelge', label: MESSAGES.DOCUMENTS.CATEGORY_GENELGE },
  { value: 'teblig', label: MESSAGES.DOCUMENTS.CATEGORY_TEBLIG },
  { value: 'kanun', label: MESSAGES.DOCUMENTS.CATEGORY_KANUN },
  { value: 'mulga', label: MESSAGES.DOCUMENTS.CATEGORY_MULGA },
  { value: 'karar', label: MESSAGES.DOCUMENTS.CATEGORY_KARAR },
  { value: 'kararname', label: MESSAGES.DOCUMENTS.CATEGORY_KARARNAME },
  { value: 'tuzuk', label: MESSAGES.DOCUMENTS.CATEGORY_TUZUK },
  { value: 'yonerge', label: MESSAGES.DOCUMENTS.CATEGORY_YONERGE },
  { value: 'talimat', label: MESSAGES.DOCUMENTS.CATEGORY_TALIMAT },
  { value: 'sirkuler', label: MESSAGES.DOCUMENTS.CATEGORY_SIRKULER },
  { value: 'emir', label: MESSAGES.DOCUMENTS.CATEGORY_EMIR },
  { value: 'tebligname', label: MESSAGES.DOCUMENTS.CATEGORY_TEBLIGNAME },
  { value: 'mahkeme', label: MESSAGES.DOCUMENTS.CATEGORY_MAHKEME },
  { value: 'anayasa', label: MESSAGES.DOCUMENTS.CATEGORY_ANAYASA },
  { value: 'anayasa_mahkemesi', label: MESSAGES.DOCUMENTS.CATEGORY_ANAYASA_MAHKEMESI },
  { value: 'danistay', label: MESSAGES.DOCUMENTS.CATEGORY_DANISTAY },
  { value: 'sayistay', label: MESSAGES.DOCUMENTS.CATEGORY_SAYISTAY },
  { value: 'uluslararasi', label: MESSAGES.DOCUMENTS.CATEGORY_ULUSLARARASI },
  { value: 'avrupa_birligi', label: MESSAGES.DOCUMENTS.CATEGORY_AVRUPA_BIRLIGI },
  { value: 'mevzuat_duzenlemesi', label: MESSAGES.DOCUMENTS.CATEGORY_MEVZUAT_DUZENLEMESI },
  { value: 'cumhurbaskanligi_kararnamesi', label: MESSAGES.DOCUMENTS.CATEGORY_CUMHURBASKANLIGI_KARARNAMESI },
  { value: 'yargitay_karari', label: MESSAGES.DOCUMENTS.CATEGORY_YARGITAY_KARARI },
  { value: 'rapor', label: MESSAGES.DOCUMENTS.CATEGORY_RAPOR },
  { value: 'tutanak', label: MESSAGES.DOCUMENTS.CATEGORY_TUTANAK },
  { value: 'antlasma', label: MESSAGES.DOCUMENTS.CATEGORY_ANTLASMA },
  { value: 'sozlesme', label: MESSAGES.DOCUMENTS.CATEGORY_SOZLESME },
  { value: 'ab_direktifi', label: MESSAGES.DOCUMENTS.CATEGORY_AB_DIREKTIFI },
  { value: 'ab_tuzugu', label: MESSAGES.DOCUMENTS.CATEGORY_AB_TUZUGU },
  { value: 'uluslararasi_karar', label: MESSAGES.DOCUMENTS.CATEGORY_ULUSLARARASI_KARAR },
]

export function BulkUploadForm() {
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    category: '',
    institution: '',
    belge_adi: '',
    metadata: '',
  })
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Institution selector states
  const [institutionModalOpen, setInstitutionModalOpen] = useState(false)
  const [institutions, setInstitutions] = useState<string[]>([])
  const [institutionSearch, setInstitutionSearch] = useState('')
  const [loadingInstitutions, setLoadingInstitutions] = useState(false)
  
  // Progress tracking states - removed as progress is shown in PDF management
  const [taskId, setTaskId] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
    setSuccess('')
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return
    
    const pdfFiles = Array.from(selectedFiles).filter(file => file.type === 'application/pdf')
    setFiles(prev => [...prev, ...pdfFiles])
    setError('')
  }

  const handleFileRemove = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const loadInstitutions = async () => {
    setLoadingInstitutions(true)
    try {
      const response = await getInstitutions()
      setInstitutions(response.data.institutions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kurumlar yüklenirken hata oluştu')
    } finally {
      setLoadingInstitutions(false)
    }
  }

  const handleInstitutionSelect = (institution: string) => {
    setFormData(prev => ({ ...prev, institution }))
    setInstitutionModalOpen(false)
    setInstitutionSearch('')
  }

  const openInstitutionModal = () => {
    setInstitutionModalOpen(true)
    if (institutions.length === 0) {
      loadInstitutions()
    }
  }

  const validateJsonMetadata = () => {
    if (!formData.metadata.trim()) {
      return { isValid: true, error: null }
    }

    try {
      const metadata = JSON.parse(formData.metadata)
      
      // JSON'da output_filename array'i var mı kontrol et
      if (!metadata.pdf_sections || !Array.isArray(metadata.pdf_sections)) {
        return { 
          isValid: false, 
          error: 'JSON metadata\'da "pdf_sections" array\'i bulunamadı' 
        }
      }

      const jsonFileCount = metadata.pdf_sections.length
      const uploadedFileCount = files.length

      // Sadece dosya sayısı kontrolü
      if (jsonFileCount !== uploadedFileCount) {
        return { 
          isValid: false, 
          error: `JSON'daki dosya sayısı (${jsonFileCount}) ile yüklenen dosya sayısı (${uploadedFileCount}) eşleşmiyor` 
        }
      }

      return { isValid: true, error: null }
    } catch (error) {
      return { 
        isValid: false, 
        error: 'JSON metadata geçersiz format. Lütfen geçerli bir JSON giriniz' 
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (files.length === 0) {
      setError('Lütfen en az bir PDF dosyası seçiniz')
      return
    }

    if (!formData.category || !formData.institution || !formData.belge_adi) {
      setError('Lütfen tüm zorunlu alanları doldurunuz')
      return
    }

    // JSON metadata validation
    const validation = validateJsonMetadata()
    if (!validation.isValid) {
      setError(validation.error!)
      return
    }

    setIsUploading(true)
    setError('')

    try {
      console.log('Form data before submit:', formData);
      console.log('Files:', files);
      
      const request: BulkUploadRequest = {
        files,
        metadata: formData.metadata,
        category: formData.category,
        institution: formData.institution,
        belge_adi: formData.belge_adi,
      }
      
      console.log('Request object:', request);
      
      const result = await bulkUploadDocuments(request)
      setTaskId(result.data.batch_id)
      setSuccess(`Toplu yükleme başlatıldı: ${result.data.total_files} dosya. PDF Yönetimi sayfasından ilerlemeyi takip edebilirsiniz.`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toplu yükleme sırasında hata oluştu')
    } finally {
      setIsUploading(false)
    }
  }


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/20 dark:border-gray-800/30 shadow-2xl">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              PDF Dosyaları *
            </Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
                isDragOver 
                  ? "border-blue-400 bg-blue-50/50 dark:bg-blue-900/20" 
                  : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                PDF dosyalarını buraya sürükleyin veya
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mb-4"
              >
                <FileText className="w-4 h-4 mr-2" />
                Dosya Seç
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Birden fazla PDF dosyası seçebilirsiniz
              </p>
            </div>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Seçilen Dosyalar ({files.length})
              </Label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFileRemove(index)}
                      className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Kategori *
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl">
                  <SelectValue placeholder="Kategori seçiniz" />
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

            <div className="space-y-2">
              <Label htmlFor="institution" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Kaynak Kurum *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="institution"
                  type="text"
                  placeholder="Kaynak kurumu giriniz"
                  value={formData.institution}
                  onChange={(e) => handleInputChange('institution', e.target.value)}
                  className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={openInstitutionModal}
                  className="h-12 px-4 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl hover:bg-white/70 dark:hover:bg-black/50 transition-all duration-300"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Seç
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="belge_adi" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Belge Adı *
            </Label>
            <Input
              id="belge_adi"
              type="text"
              placeholder="Belge adını giriniz"
              value={formData.belge_adi}
              onChange={(e) => handleInputChange('belge_adi', e.target.value)}
              className="h-12 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              JSON Metadata
            </Label>
            <Textarea
              id="metadata"
              placeholder='{"pdf_sections": [{"output_filename": "dosya1.pdf"}, {"output_filename": "dosya2.pdf"}]}'
              value={formData.metadata}
              onChange={(e) => handleInputChange('metadata', e.target.value)}
              rows={4}
              className="bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              JSON'daki pdf_sections array uzunluğu yüklenen dosya sayısı ile eşleşmelidir
            </p>
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
            className="w-full h-12 bg-gradient-to-r from-blue-800 to-purple-600 hover:from-blue-900 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Yükleniyor...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Toplu Yükleme Başlat
              </div>
            )}
          </Button>
        </form>
      </div>

      {/* Institution Selector Modal */}
      <Dialog open={institutionModalOpen} onOpenChange={setInstitutionModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Kurum Seç
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="institution-search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Kurum Ara
              </Label>
              <Input
                id="institution-search"
                type="text"
                placeholder="Kurum adını yazın..."
                value={institutionSearch}
                onChange={(e) => setInstitutionSearch(e.target.value)}
                className="h-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm border-gray-300/30 dark:border-gray-700/30 rounded-xl"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {loadingInstitutions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Kurumlar yükleniyor...</span>
                </div>
              ) : (
                <>
                  {institutions
                    .filter(institution => 
                      institution.toLowerCase().includes(institutionSearch.toLowerCase())
                    )
                    .map((institution, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 rounded-xl hover:bg-white/70 dark:hover:bg-black/50 transition-all duration-200 cursor-pointer"
                        onClick={() => handleInstitutionSelect(institution)}
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {institution}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                        >
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                      </div>
                    ))}
                  
                  {institutions.filter(institution => 
                    institution.toLowerCase().includes(institutionSearch.toLowerCase())
                  ).length === 0 && !loadingInstitutions && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        {institutionSearch ? 'Arama kriterinize uygun kurum bulunamadı' : 'Henüz kurum bulunmamaktadır'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
