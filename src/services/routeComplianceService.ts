import api from './api';

export interface RouteComplianceItem {
  salesRepId: number;
  salesRepName: string;
  plannedVisits: number;
  achievedVisits: number;
  compliancePct: number;
}

export async function fetchRouteCompliance(params?: { startDate?: string; endDate?: string; country?: string; }): Promise<RouteComplianceItem[]> {
  const search = new URLSearchParams();
  if (params?.startDate) search.append('startDate', params.startDate);
  if (params?.endDate) search.append('endDate', params.endDate);
  if (params?.country) search.append('country', params.country);
  const url = `/journey-plans/compliance${search.toString() ? `?${search.toString()}` : ''}`;
  const res = await api.get(url);
  const data = res.data?.data ?? res.data;
  return data as RouteComplianceItem[];
}


