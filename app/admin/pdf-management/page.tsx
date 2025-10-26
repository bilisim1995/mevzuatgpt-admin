import { DocumentList } from "@/components/documents/document-list"

export default function PDFManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <DocumentList />
      </div>
    </div>
  )
}
