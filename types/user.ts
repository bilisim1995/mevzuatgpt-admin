export interface User {
  id: string;
  instance_id?: string;
  aud?: string;
  email: string;
  full_name: string;
  ad: string;
  soyad: string;
  meslek: string;
  calistigi_yer: string;
  role: 'user' | 'admin';
  is_banned: boolean;
  banned_until: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  current_balance: number;
  total_used: number;
  search_count: number;
  email_confirmed_at: string | null;
  invited_at?: string | null;
  confirmation_token?: string;
  confirmation_sent_at?: string | null;
  recovery_token?: string;
  recovery_sent_at?: string | null;
  email_change_token_new?: string;
  email_change?: string;
  email_change_sent_at?: string | null;
  raw_app_meta_data?: any;
  raw_user_meta_data?: any;
  is_super_admin?: boolean | null;
  phone?: string | null;
  phone_confirmed_at?: string | null;
  phone_change?: string;
  phone_change_token?: string;
  phone_change_sent_at?: string | null;
  confirmed_at?: string | null;
  email_change_token_current?: string;
  email_change_confirm_status?: number;
  reauthentication_token?: string;
  reauthentication_sent_at?: string | null;
  is_sso_user?: boolean;
  deleted_at?: string | null;
  is_anonymous?: boolean;
  providers?: string[];
  encrypted_password?: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: number;
    has_previous: number;
  };
}

export interface UserUpdateData {
  email?: string;
  full_name?: string;
  role?: 'user' | 'admin';
  meslek?: string;
  ad?: string;
  soyad?: string;
  calistigi_yer?: string;
}

export interface BanUserData {
  reason: string;
  ban_duration_hours?: number;
}

export interface UpdateCreditsData {
  amount: number;
  reason: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: 'user' | 'admin';
  is_banned?: boolean;
  search?: string;
}