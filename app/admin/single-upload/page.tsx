import { UploadForm } from "@/components/documents/upload-form"

export default function SingleUploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <UploadForm />
      </div>
    </div>
  )
}
