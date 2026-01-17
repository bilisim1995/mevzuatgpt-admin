export const API_CONFIG = {
  BASE_URL: "https://app.mevzuatgpt.org",
  //SCRAPPER_BASE_URL: "https://scrapers.mevzuatgpt.org",
  SCRAPPER_BASE_URL: "http://localhost:8000",
  ENDPOINTS: {
    LOGIN: "/api/auth/login",
    UPLOAD_DOCUMENT: "/api/admin/upload-document",
    DOCUMENTS: "/api/admin/documents",
    USERS: "/api/admin/users",
    SUPPORT_TICKETS: "/api/admin/support/tickets",
    SUPPORT_TICKET_STATS: "/api/admin/support/tickets/stats",
    SUPPORT_TICKET_REPLY: "/api/admin/support/tickets",
    SUPPORT_TICKET_STATUS: "/api/admin/support/tickets",
    SUPPORT_USER_TICKETS: "/api/admin/support/users",
    PROMPTS: "/api/admin/prompts",
    PROMPTS_REFRESH_CACHE: "/api/admin/prompts/refresh-cache",
    FEEDBACK: "/api/admin/feedback",
    FEEDBACK_STATS: "/api/admin/feedback/stats",
    USER_FEEDBACK: "/api/admin/feedback/user",
    CREDIT_TRANSACTIONS: "/api/admin/credits/transactions",
    CREDIT_TRANSACTION_STATS: "/api/admin/credits/transactions/stats",
    CREDIT_USER_TRANSACTIONS: "/api/admin/credits/transactions/user",
    CREDIT_ADD: "/api/admin/credits/add",
    CREDIT_SET: "/api/admin/credits/set",
    SEARCH_LOGS: "/api/admin/search-logs",
    SEARCH_LOG_STATS: "/api/admin/search-logs/stats",
    SEARCH_LOG_USER: "/api/admin/search-logs/user",
    ANNOUNCEMENTS: "/api/admin/announcements",
    PROGRESS_TRACK: "/api/user/progress",
    PROGRESS_DETAIL: "/api/user/progress",
    GROQ_STATUS: "/api/admin/groq/status",
    PAYMENT_SETTINGS: "/api/admin/payment-settings",
    GROQ_SETTINGS: "/api/admin/groq/settings",
    GROQ_MODELS: "/api/admin/groq/models",
    GROQ_CREATIVITY_PRESETS: "/api/admin/groq/creativity-presets",
    GROQ_TEST_SETTINGS: "/api/admin/groq/test-settings",
    GROQ_RESET_SETTINGS: "/api/admin/groq/reset-settings",
    PURCHASES: "/api/admin/purchases"
  }
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user'
} as const;