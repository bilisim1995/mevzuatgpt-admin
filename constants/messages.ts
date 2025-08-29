export const MESSAGES = {
  // Auth Messages
  AUTH: {
    LOGIN_TITLE: 'Yönetici Paneli',
    LOGIN_SUBTITLE: 'Panele erişmek için giriş bilgilerinizi giriniz',
    EMAIL_LABEL: 'E-posta Adresi',
    EMAIL_PLACEHOLDER: 'admin@mevzuatgpt.org',
    PASSWORD_LABEL: 'Şifre',
    PASSWORD_PLACEHOLDER: 'Şifrenizi giriniz',
    LOGIN_BUTTON: 'Giriş Yap',
    LOGGING_IN: 'Giriş yapılıyor...',
    SECURE_ACCESS: 'Güvenli yönetici erişimi',
    LOGOUT: 'Çıkış Yap',
    LOGIN_FAILED: 'Giriş başarısız',
    INVALID_CREDENTIALS: 'Geçersiz giriş bilgileri',
    UNAUTHORIZED_ROLE: 'Bu panele erişim yetkiniz bulunmamaktadır. Sadece admin kullanıcıları giriş yapabilir.',
    ACCESS_DENIED: 'Erişim Reddedildi'
  },
  
  // Dashboard Messages
  DASHBOARD: {
    TITLE: 'Yönetici Paneli',
    WELCOME_BACK: 'Tekrar Hoş Geldiniz',
    WELCOME_MESSAGE: 'Yönetici olarak giriş yaptınız. Tüm sistem özelliklerine erişiminiz bulunmaktadır.',
    LOADING: 'Panel yükleniyor...',
    TOTAL_USERS: 'Toplam Kullanıcı',
    ANALYTICS: 'Analitik',
    SYSTEM_HEALTH: 'Sistem Sağlığı',
    DASHBOARD_CONTENT: 'Panel İçeriği',
    CONTENT_DESCRIPTION: 'Buraya ana panel içeriğiniz gelecek. Grafikler, tablolar ve diğer yönetim araçlarını buraya ekleyebilirsiniz.'
  },

  // Common Messages
  COMMON: {
    COPYRIGHT: '© 2025 MevzuatGPT Yönetici Paneli',
    THEME_TOGGLE: 'Tema Değiştir',
    LOADING: 'Yükleniyor...',
    SUCCESS: 'Başarılı',
    ERROR: 'Hata',
    CONFIRM: 'Onayla',
    CANCEL: 'İptal'
  },

  // Sidebar Messages
  SIDEBAR: {
    HOME: 'Ana Sayfa',
    DATA_SOURCE_MANAGEMENT: 'Veri Kaynağı',
    USERS_MANAGEMENT: 'Üyeler',
    AI_SETTINGS: 'AI Ayarları'
  },

  // Document Management Messages
  DOCUMENTS: {
    UPLOAD_TAB: 'PDF Yükle',
    MANAGEMENT_TAB: 'PDF Yönetimi',
    UPLOAD_TITLE: 'Doküman Yükle',
    UPLOAD_DESCRIPTION: 'Sisteme yeni PDF dokümanı yükleyin',
    
    // Form Fields
    TITLE_LABEL: 'Başlık',
    TITLE_PLACEHOLDER: 'Doküman başlığını giriniz',
    CATEGORY_LABEL: 'Kategori',
    CATEGORY_PLACEHOLDER: 'Kategori seçiniz',
    DOC_DESCRIPTION_LABEL: 'Açıklama',
    DOC_DESCRIPTION_PLACEHOLDER: 'Doküman açıklamasını giriniz',
    KEYWORDS_LABEL: 'Anahtar Kelimeler',
    KEYWORDS_PLACEHOLDER: 'Anahtar kelimeleri virgülle ayırarak giriniz',
    SOURCE_INSTITUTION_LABEL: 'Kaynak Kurum',
    SOURCE_INSTITUTION_PLACEHOLDER: 'Kaynak kurumu giriniz',
    FILE_LABEL: 'PDF Dosyası',
    FILE_PLACEHOLDER: 'PDF dosyası seçiniz',
    
    // Status Messages
    STATUS_PROCESSING: 'İşleniyor',
    STATUS_COMPLETED: 'Tamamlandı',
    STATUS_FAILED: 'Başarısız',
    
    // Success/Error Messages
    UPLOAD_SUCCESS: 'Doküman başarıyla yüklendi',
    UPLOAD_ERROR: 'Doküman yüklenirken hata oluştu',
    DELETE_ERROR: 'Doküman silinirken hata oluştu',
    
    // Buttons
    UPLOAD_BUTTON: 'Yükle',
    UPLOADING: 'Yükleniyor...',
    SELECT_FILE: 'Dosya Seç',
    
    // Categories
    CATEGORY_MEVZUAT: 'Mevzuat',
    CATEGORY_YONETMELIK: 'Yönetmelik',
    CATEGORY_GENELGE: 'Genelge',
    CATEGORY_TEBLIG: 'Tebliğ',
    
    // Management
    MANAGEMENT_TITLE: 'Doküman Yönetimi',
    MANAGEMENT_DESCRIPTION: 'Yüklenen dokümanları görüntüleyin ve yönetin',
    SEARCH_PLACEHOLDER: 'Doküman ara...',
    NO_DOCUMENTS: 'Henüz doküman bulunmamaktadır',
    
    // Table Headers
    DOCUMENT_TITLE: 'Başlık',
    CATEGORY: 'Kategori',
    STATUS: 'Durum',
    CREATED_DATE: 'Oluşturma Tarihi',
    FILE_SIZE: 'Dosya Boyutu',
    DOC_ACTIONS: 'İşlemler'
  },

  // Support Messages
  SUPPORT: {
    STATS_TITLE: 'Destek İstatistikleri',
    LIST_TITLE: 'Ticket Listesi',
    
    // Filters
    SEARCH_PLACEHOLDER: 'Ticket ara...',
    ALL_STATUSES: 'Tüm Durumlar',
    ALL_CATEGORIES: 'Tüm Kategoriler',
    ALL_PRIORITIES: 'Tüm Öncelikler',
    
    // Table Headers
    TICKET: 'Ticket',
    USER: 'Kullanıcı',
    CATEGORY: 'Kategori',
    PRIORITY: 'Öncelik',
    STATUS: 'Durum',
    LAST_REPLY: 'Son Yanıt',
    ACTIONS: 'İşlemler',
    
    // Status Labels
    STATUS_OPEN: 'Açık',
    STATUS_IN_PROGRESS: 'İşlemde',
    STATUS_WAITING_RESPONSE: 'Yanıt Bekleniyor',
    STATUS_RESOLVED: 'Çözüldü',
    STATUS_CLOSED: 'Kapalı',
    
    // Priority Labels
    PRIORITY_LOW: 'Düşük',
    PRIORITY_MEDIUM: 'Orta',
    PRIORITY_HIGH: 'Yüksek',
    PRIORITY_URGENT: 'Acil',
    
    // Category Labels
    CATEGORY_TECHNICAL: 'Teknik',
    CATEGORY_BILLING: 'Faturalandırma',
    CATEGORY_GENERAL: 'Genel',
    CATEGORY_FEATURE_REQUEST: 'Özellik Talebi',
    CATEGORY_BUG_REPORT: 'Hata Bildirimi',
    CATEGORY_ACCOUNT: 'Hesap',
    
    // Messages
    NO_TICKETS: 'Henüz ticket bulunmamaktadır',
    LOADING_TICKETS: 'Ticketlar Yükleniyor',
    DELETE_CONFIRM: 'Bu ticketi silmek istediğinizden emin misiniz?',
    DELETE_SUCCESS: 'Ticket başarıyla silindi',
    DELETE_ERROR: 'Ticket silinirken hata oluştu',
    REPLY_SUCCESS: 'Yanıt başarıyla gönderildi',
    REPLY_ERROR: 'Yanıt gönderilirken hata oluştu',
    STATUS_UPDATE_SUCCESS: 'Ticket durumu başarıyla güncellendi',
    STATUS_UPDATE_ERROR: 'Durum güncellenirken hata oluştu'
  },

  // Feedback Messages
  FEEDBACK: {
    TITLE: 'Kullanıcı Feedback\'leri',
    DESCRIPTION: 'Kullanıcıların sorulara verdiği geri bildirimleri yönetin',
    STATS_TITLE: 'Feedback İstatistikleri',
    LIST_TITLE: 'Feedback Listesi',
    
    // Filters
    SEARCH_PLACEHOLDER: 'Feedback ara...',
    ALL_TYPES: 'Tüm Tipler',
    LIKE: 'Beğeni',
    DISLIKE: 'Beğenmeme',
    
    // Table Headers
    QUESTION_ANSWER: 'Soru & Cevap',
    FEEDBACK_TYPE: 'Feedback Tipi',
    COMMENT: 'Yorum',
    DATE: 'Tarih',
    ACTIONS: 'İşlemler',
    
    // Status Labels
    TYPE_LIKE: 'Beğeni',
    TYPE_DISLIKE: 'Beğenmeme',
    
    // Messages
    NO_FEEDBACK: 'Henüz feedback bulunmamaktadır',
    LOADING_FEEDBACK: 'Feedback\'ler Yükleniyor',
    DELETE_CONFIRM: 'Bu feedback\'i silmek istediğinizden emin misiniz?',
    DELETE_SUCCESS: 'Feedback başarıyla silindi',
    DELETE_ERROR: 'Feedback silinirken hata oluştu',
    NO_COMMENT: 'Yorum yok'
  },

  // Credit Messages
  CREDIT: {
    TITLE: 'Kredi Hareketleri',
    CREDIT_DESCRIPTION: 'Tüm kredi işlemlerini takip edin',
    STATS_TITLE: 'Kredi İstatistikleri',
    LIST_TITLE: 'İşlem Listesi',
    
    // Filters
    SEARCH_PLACEHOLDER: 'Kullanıcı veya açıklama ara...',
    ALL_TYPES: 'Tüm Tipler',
    PURCHASE: 'Satın Alma',
    USAGE: 'Kullanım',
    REFUND: 'İade',
    BONUS: 'Bonus',
    
    // Table Headers
    USER: 'Kullanıcı',
    TRANSACTION_TYPE: 'İşlem Tipi',
    AMOUNT: 'Miktar',
    TRANSACTION_DESCRIPTION: 'Açıklama',
    DATE: 'Tarih',
    ACTIONS: 'İşlemler',
    
    // Transaction Types
    TYPE_PURCHASE: 'Satın Alma',
    TYPE_USAGE: 'Kullanım',
    TYPE_REFUND: 'İade',
    TYPE_BONUS: 'Bonus',
    
    // Messages
    NO_TRANSACTIONS: 'Henüz kredi işlemi bulunmamaktadır',
    LOADING_TRANSACTIONS: 'Kredi İşlemleri Yükleniyor',
    TRANSACTION_DETAILS: 'Kredi İşlem Detayları',
    
    // Stats
    TOTAL_TRANSACTIONS: 'Toplam İşlem',
    TOTAL_PURCHASED: 'Satın Alınan',
    TOTAL_USED: 'Kullanılan',
    TOTAL_BONUS: 'Bonus Verilen',
    TRANSACTION_TYPES: 'İşlem Tipleri',
    CREDIT_FLOW: 'Kredi Akışı',
    TOTAL_INCOMING: 'Toplam Gelen',
    TOTAL_OUTGOING: 'Toplam Giden',
    NET_CHANGE: 'Net Değişim'
  },

  // Search Logs Messages
  SEARCH_LOGS: {
    TITLE: 'Sorgu Kayıtları',
    SEARCH_DESCRIPTION: 'Kullanıcı sorularını ve sistem performansını takip edin',
    STATS_TITLE: 'Arama İstatistikleri',
    LIST_TITLE: 'Arama Kayıtları',
    
    // Filters
    SEARCH_PLACEHOLDER: 'Soru, kullanıcı veya cevap ara...',
    
    // Table Headers
    QUERY_USER: 'Soru & Kullanıcı',
    RESULT: 'Sonuç',
    PERFORMANCE: 'Performans',
    SEARCH_RELIABILITY: 'Güvenilirlik',
    DATE: 'Tarih',
    ACTIONS: 'İşlemler',
    
    // Status Labels
    NO_RESULTS: 'Sonuç Yok',
    RESULTS_COUNT: 'Sonuç',
    HIGH_RELIABILITY: 'Yüksek',
    MEDIUM_RELIABILITY: 'Orta',
    LOW_RELIABILITY: 'Düşük',
    
    // Messages
    NO_LOGS: 'Henüz arama kaydı bulunmamaktadır',
    LOADING_LOGS: 'Arama Kayıtları Yükleniyor',
    SEARCH_DETAILS: 'Arama Detayları',
    
    // Stats
    TOTAL_SEARCHES: 'Toplam Arama',
    ACTIVE_USERS: 'Aktif Kullanıcı',
    TODAY_SEARCHES: 'Bugün Arama',
    SUCCESS_RATE: 'Başarı Oranı',
    AVG_TIME: 'Ortalama Süre',
    AVG_RESULTS: 'Ortalama Sonuç',
    AVG_CREDITS: 'Ortalama Kredi',
    RELIABILITY: 'Güvenilirlik',
    PERFORMANCE_METRICS: 'Performans Metrikleri',
    POPULAR_QUERIES: 'Popüler Sorular',
    SUCCESS_ANALYSIS: 'Başarı Analizi',
    SUCCESSFUL_SEARCHES: 'Başarılı Aramalar',
    FAILED_SEARCHES: 'Başarısız Aramalar',
    SYSTEM_BENEFITS: 'Sistem Faydaları',
    
    // Benefits
    PERFORMANCE_MONITORING: 'Performans İzleme',
    POPULAR_TOPICS: 'Popüler Konular',
    SUCCESS_TRACKING: 'Başarı Oranı',
    USER_ANALYSIS: 'Kullanıcı Analizi',
    RELIABILITY_TRACKING: 'Güvenilirlik',
    CREDIT_TRACKING: 'Kredi Takibi'
  }
} as const;