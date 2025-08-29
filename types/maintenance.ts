export interface MaintenanceMode {
  id: string;
  is_enabled: boolean;
  title: string;
  message: string;
  start_time: string | null;
  end_time: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceResponse {
  success: boolean;
  timestamp: string;
  data: MaintenanceMode;
}

export interface MaintenanceUpdateData {
  is_enabled: boolean;
  title: string;
  message: string;
  start_time: string | null;
  end_time: string | null;
}