import { api } from './api';

export interface AuditTrailRecord {
  id: number;
  user_id: number;
  user_name: string;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_method: string | null;
  request_url: string | null;
  request_body: any;
  response_status: number | null;
  success: boolean;
  error_message: string | null;
  session_id: string | null;
  created_at: string;
}

export interface AuditTrailFilters {
  page?: number;
  limit?: number;
  userId?: number;
  userName?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  success?: boolean;
}

export interface AuditTrailResponse {
  success: boolean;
  data: AuditTrailRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditTrailStats {
  total: number;
  byAction: Array<{ action: string; count: number }>;
  byUser: Array<{ user_id: number; user_name: string; user_role: string; count: number }>;
  loginStats: {
    total_logins: number;
    successful_logins: number;
    failed_logins: number;
  };
}

export const auditTrailService = {
  /**
   * Get audit trail records with filtering and pagination
   */
  getAll: async (filters: AuditTrailFilters = {}): Promise<AuditTrailResponse> => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.userId) params.append('userId', filters.userId.toString());
    if (filters.userName) params.append('userName', filters.userName);
    if (filters.action) params.append('action', filters.action);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.success !== undefined) params.append('success', filters.success.toString());

    const response = await api.get<AuditTrailResponse>(`/audit-trail?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a specific audit trail record
   */
  getById: async (id: number): Promise<AuditTrailRecord> => {
    const response = await api.get<{ success: boolean; data: AuditTrailRecord }>(`/audit-trail/${id}`);
    return response.data.data;
  },

  /**
   * Get audit trail statistics
   */
  getStats: async (startDate?: string, endDate?: string): Promise<AuditTrailStats> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<{ success: boolean; data: AuditTrailStats }>(
      `/audit-trail/stats?${params.toString()}`
    );
    return response.data.data;
  }
};
