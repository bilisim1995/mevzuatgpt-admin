import { PurchaseList } from '@/components/purchases/purchase-list'

export default function BillingPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Faturalandırma</h1>
        <p className="text-gray-600 mt-2">
          Tüm satın alımları görüntüleyin ve yönetin
        </p>
      </div>
      
      <PurchaseList />
    </div>
  )
}
