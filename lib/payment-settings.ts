import { API_CONFIG, STORAGE_KEYS } from '@/constants/api'

export type PaymentMode = 'sandbox' | 'production'

export interface PaymentSettings {
  success?: boolean
  payment_mode: PaymentMode
  is_active: boolean
  description?: string
}

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null
  if (!token) throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export async function fetchPaymentSettings(): Promise<PaymentSettings> {
  const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT_SETTINGS}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
        window.location.href = '/admin/login'
      }
      throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.')
    }
    throw new Error(`Ödeme ayarları alınamadı: ${res.status}`)
  }
  return await res.json()
}

export async function updatePaymentSettings(payload: Partial<PaymentSettings>): Promise<PaymentSettings> {
  // validation (client-side)
  if (payload.payment_mode && !['sandbox', 'production'].includes(payload.payment_mode)) {
    throw new Error('payment_mode sadece "sandbox" veya "production" olabilir')
  }
  const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT_SETTINGS}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
        window.location.href = '/admin/login'
      }
      throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.')
    }
    const err = await res.json().catch(() => ({ message: 'Ödeme ayarları güncellenemedi' }))
    throw new Error(err.message || 'Ödeme ayarları güncellenemedi')
  }
  return await res.json()
}


