export interface Feedback {
  id: string;
  user_id: string;
  search_log_id: string;
  query_text: string;
  answer_text: string;
  feedback_type: 'like' | 'dislike';
  feedback_comment?: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackResponse {
  feedback_list: Feedback[];
  total_count: number;
  has_more: boolean;
  page: number;
  limit: number;
}

export interface FeedbackFilters {
  page?: number;
  limit?: number;
  feedback_type?: 'like' | 'dislike';
  user_id?: string;
}

export interface FeedbackStats {
  total_feedback: number;
  like_feedback: number;
  dislike_feedback: number;
  like_percentage: number;
  dislike_percentage: number;
}