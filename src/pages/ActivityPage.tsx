import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader, MarkerClusterer } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES } from '../config/googleMaps';

interface ActivityRow {
  id: number;
  date: string;
  time?: string;
  userId: number;
  clientId: number;
  status: number;
  checkInTime?: string | null;
  checkoutTime?: string | null;
  user_name?: string | null;
  client_name?: string | null;
  route_name?: string | null;
  region_name?: string | null;
  user_role?: string | null;
  sales_rep_country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
}

const ActivityPage: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);

  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [status, setStatus] = useState('1'); // In Progress by default
  const [region, setRegion] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [mapOpen, setMapOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<ActivityRow | null>(null);

  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (status) params.status = status;
      if (region) params.region = region;
      // keep payload reasonable; UI can filter client-side
      params.limit = 1000;

      const res = await axios.get('/api/journey-plans', { params });
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, status, region]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const regionTrimmed = region.trim().toLowerCase();
    const routeTrimmed = routeFilter.trim().toLowerCase();
    const role = roleFilter;

    let base = rows;
    if (regionTrimmed) {
      base = base.filter(r => (r.region_name || '').toLowerCase().includes(regionTrimmed));
    }
    if (routeTrimmed) {
      base = base.filter(r => (r.route_name || '').toLowerCase().includes(routeTrimmed));
    }
    if (role === 'leader') {
      base = base.filter(r => (r.user_role || '').toLowerCase() === 'team leader');
    } else if (role === 'fmr') {
      base = base.filter(r => (r.user_role || '').toLowerCase() === 'sales rep');
    }

    if (!q) return base;
    return base.filter(r => {
      const user = (r.user_name || '').toLowerCase();
      const client = (r.client_name || '').toLowerCase();
      const route = (r.route_name || '').toLowerCase();
      return user.includes(q) || client.includes(q) || route.includes(q) || String(r.id).includes(q);
    });
  }, [rows, search, region, routeFilter, roleFilter]);

  const statusLabel = (s: number) => {
    if (s === 2) return 'Completed';
    if (s === 1) return 'In Progress';
    if (s === 0) return 'Planned';
    return `Status ${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Activity</h1>
            <p className="text-xs text-gray-600 mt-1">JourneyPlan activity (check-ins, visits, and status).</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={filtered.filter(r => r.latitude && r.longitude).length === 0}
            >
              Map
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Start date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">End date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="border rounded px-3 py-2 text-xs"
              >
                <option value="">All</option>
                <option value="0">Planned</option>
                <option value="1">In Progress</option>
                <option value="2">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Roles</label>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="border rounded px-3 py-2 text-xs"
              >
                <option value="">All</option>
                <option value="fmr">FMR</option>
                <option value="leader">Team Leader</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Region</label>
              <input
                type="text"
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="border rounded px-3 py-2 text-xs"
                placeholder="Filter by region..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Route</label>
              <input
                type="text"
                value={routeFilter}
                onChange={e => setRouteFilter(e.target.value)}
                className="border rounded px-3 py-2 text-xs"
                placeholder="Filter by route..."
              />
            </div>
            <form
              className="flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchInput);
              }}
            >
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Search</label>
              <div className="flex gap-2">
                <input value={searchInput} onChange={e => setSearchInput(e.target.value)} className="flex-1 border rounded px-3 py-2 text-xs" placeholder="User, client, route, or ID..." />
                <button type="submit" className="px-3 py-2 text-xs rounded bg-blue-600 text-white hover:bg-blue-700">Search</button>
                {search && (
                  <button type="button" className="px-3 py-2 text-xs rounded bg-gray-200 hover:bg-gray-300" onClick={() => { setSearch(''); setSearchInput(''); }}>
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-600">Loading activity...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 text-xs text-gray-600 border-b">
              Showing {filtered.length} records
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">FMR</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Region</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Route</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Check-In Image</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Check-In</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Check-Out</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-xs text-gray-700 whitespace-nowrap">{String(r.date).slice(0, 10)}</td>
                      <td className="px-4 py-2 text-xs text-gray-700">{r.user_name || `User ${r.userId}`}</td>
                      <td className="px-4 py-2 text-xs text-gray-700">{r.region_name || '-'}</td>
                      <td className="px-4 py-2 text-xs text-gray-700">{r.client_name || (r.clientId ? `Client ${r.clientId}` : '-')}</td>
                      <td className="px-4 py-2 text-xs text-gray-700">{r.route_name || '-'}</td>
                      <td className="px-4 py-2 text-xs text-gray-700">{statusLabel(Number(r.status))}</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        {r.imageUrl ? (
                          <a href={r.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                            <img
                              src={r.imageUrl}
                              alt="Check-in"
                              className="h-10 w-10 rounded object-cover border border-gray-200"
                              loading="lazy"
                            />
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-700 whitespace-nowrap">{r.checkInTime ? String(r.checkInTime).replace('T', ' ').slice(0, 16) : '-'}</td>
                      <td className="px-4 py-2 text-xs text-gray-700 whitespace-nowrap">{r.checkoutTime ? String(r.checkoutTime).replace('T', ' ').slice(0, 16) : '-'}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500">No activity found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Map modal */}
      {mapOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4"
          onClick={() => { setMapOpen(false); setSelectedPoint(null); }}
        >
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="text-white">
                <h3 className="text-sm font-bold">FMR Activity Map</h3>
                <p className="text-[10px] text-blue-100">Showing records in current filters</p>
              </div>
              <button
                onClick={() => { setMapOpen(false); setSelectedPoint(null); }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <span className="text-white text-lg">&times;</span>
              </button>
            </div>
            <div className="p-3 sm:p-4">
              {mapLoadError ? (
                <div className="text-red-600 text-sm">Error loading map</div>
              ) : !isMapLoaded ? (
                <div className="py-10 text-center text-gray-500">Loading map...</div>
              ) : (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '82vh' }}
                  center={(() => {
                    const first = filtered.find(r => r.latitude && r.longitude);
                    return first ? { lat: Number(first.latitude), lng: Number(first.longitude) } : { lat: -1.286389, lng: 36.817223 };
                  })()}
                  zoom={6}
                >
                  <MarkerClusterer>
                    {(clusterer) => (
                      <>
                        {filtered
                          .filter(r => r.latitude && r.longitude)
                          .map(r => (
                            <Marker
                              key={r.id}
                              position={{ lat: Number(r.latitude), lng: Number(r.longitude) }}
                              clusterer={clusterer}
                              onClick={() => setSelectedPoint(r)}
                            />
                          ))}
                      </>
                    )}
                  </MarkerClusterer>

                  {selectedPoint && selectedPoint.latitude && selectedPoint.longitude && (
                    <InfoWindow
                      position={{ lat: Number(selectedPoint.latitude), lng: Number(selectedPoint.longitude) }}
                      onCloseClick={() => setSelectedPoint(null)}
                    >
                      <div>
                        <div className="font-semibold">{selectedPoint.user_name || `User ${selectedPoint.userId}`}</div>
                        {selectedPoint.client_name && <div>Client: {selectedPoint.client_name}</div>}
                        {selectedPoint.route_name && <div>Route: {selectedPoint.route_name}</div>}
                        {selectedPoint.checkInTime && (
                          <div>Check-in: {String(selectedPoint.checkInTime).replace('T', ' ').slice(0, 16)}</div>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;

