import api from './api';

export interface OutletVisitsRow {
  outlet_id: number;
  outlet_name: string;
  outlet_account_name?: string;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
  total: number;
}

export interface OutletVisitsResponse {
  success: boolean;
  data: OutletVisitsRow[];
  totals: {
    january: number;
    february: number;
    march: number;
    april: number;
    may: number;
    june: number;
    july: number;
    august: number;
    september: number;
    october: number;
    november: number;
    december: number;
    total: number;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const outletVisitsService = {
  async getSummary(
    year?: number,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 25,
    search?: string,
    outletAccountId?: string,
  ): Promise<OutletVisitsResponse> {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (search && search.trim()) params.append('search', search.trim());
    if (outletAccountId) params.append('outletAccountId', outletAccountId);

    const response = await api.get<OutletVisitsResponse>(
      `/sales/outlet-visits-summary?${params.toString()}`,
    );
    return response.data as any;
  },

  async getOutletVisitDetails(
    outletId: number,
    year?: number,
    startDate?: string,
    endDate?: string,
  ): Promise<
    Array<{
      id: number;
      visit_date: string;
      checkInTime: string;
      checkOutTime: string | null;
      sales_rep_name: string | null;
      time_spent_minutes: number;
    }>
  > {
    const params = new URLSearchParams();
    params.append('outletId', String(outletId));
    if (year) params.append('year', String(year));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/sales/outlet-visits-details?${params.toString()}`);
    return (response.data?.data || response.data) as any;
  },
};

