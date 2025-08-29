export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  publish_date: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string | null;
}

export interface AnnouncementsResponse {
  announcements: Announcement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  filters: {
    priority?: string;
    is_active?: boolean;
  };
}

export interface AnnouncementCreateData {
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  publish_date: string;
  is_active: boolean;
}

export interface AnnouncementUpdateData {
  title?: string;
  content?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  is_active?: boolean;
}

export interface AnnouncementFilters {
  page?: number;
  limit?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  is_active?: boolean;
  search?: string;
}

export interface AnnouncementPriority {
  value: string;
  label: string;
  color: string;
  icon: string;
}