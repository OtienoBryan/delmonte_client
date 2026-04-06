import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader, MarkerClusterer } from '@react-google-maps/api';
import axios from 'axios';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES } from '../config/googleMaps';

const containerStyle = {
  width: '100%',
  height: '80vh'
};

const defaultCenter = { lat: -1.286389, lng: 36.817223 }; // Nairobi

const ClientsMapPage: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [regionFilter, setRegionFilter] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [regionOptions, setRegionOptions] = useState<any[]>([]);
  const [routeOptions, setRouteOptions] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    axios.get('/api/sales/regions').then(res => setRegionOptions(res.data));
    axios.get('/api/clients?limit=1000')
      .then(res => {
        const allClients = res.data.data || res.data;
        setClients(allClients);
        const uniqueRoutes = Array.from(new Set(
          allClients.map((c: any) => c.route_name_update).filter((r: string) => r && r.trim() !== '')
        )) as string[];
        setRouteOptions(uniqueRoutes);
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.append('limit', '1000');
    if (regionFilter) params.append('regionId', regionFilter);
    axios.get(`/api/clients?${params.toString()}`)
      .then(res => {
        let filtered = res.data.data || res.data;
        if (routeFilter) {
          filtered = filtered.filter((c: any) => c.route_name_update === routeFilter);
        }
        setClients(filtered);
      });
  }, [regionFilter, routeFilter]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const handleListClick = (client: any) => {
    setSelected(client);
    if (mapRef.current && client.latitude && client.longitude) {
      mapRef.current.panTo({ lat: client.latitude, lng: client.longitude });
      mapRef.current.setZoom(15);
    }
  };

  // Filter and sort clients for the sidebar
  const filteredClients = clients
    .filter((client: any) => {
      const term = search.toLowerCase();
      return (
        client.name?.toLowerCase().includes(term) ||
        client.address?.toLowerCase().includes(term) ||
        client.contact?.toLowerCase().includes(term)
      );
    })
    .sort((a: any, b: any) => {
      if (sortOrder === 'az') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });

  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 flex gap-4">
      {/* Sidebar */}
      <div className="w-72 bg-white border rounded shadow h-[80vh] overflow-y-auto p-2">
        <h2 className="text-lg font-bold mb-2">Clients List</h2>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="border rounded px-2 py-1 w-32"
          />
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'az' | 'za')}
            className="border rounded px-2 py-1"
          >
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
          </select>
          {search && (
            <button
              className="px-2 py-1 border rounded text-sm bg-gray-200"
              onClick={() => setSearch('')}
            >
              Clear
            </button>
          )}
        </div>
        {filteredClients.length === 0 && <div className="text-gray-500">No clients found.</div>}
        <ul>
          {filteredClients.map((client: any) => (
            <li
              key={client.id}
              className={`cursor-pointer px-2 py-1 rounded mb-1 hover:bg-blue-100 ${selected && selected.id === client.id ? 'bg-blue-200 font-bold' : ''}`}
              onClick={() => handleListClick(client)}
            >
              {client.name}
            </li>
          ))}
        </ul>
      </div>
      {/* Map and filters */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-4">
          <label htmlFor="regionFilter" className="text-sm">Region:</label>
          <select id="regionFilter" value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All</option>
            {regionOptions.map((r: any) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <label htmlFor="routeFilter" className="text-sm">Route:</label>
          <select id="routeFilter" value={routeFilter} onChange={e => setRouteFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All</option>
            {routeOptions.map((r: string) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {(regionFilter || routeFilter) && (
            <button
              className="ml-2 px-2 py-1 border rounded text-sm bg-gray-200"
              onClick={() => { setRegionFilter(''); setRouteFilter(''); }}
            >
              Clear Filters
            </button>
          )}
        </div>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={clients.length > 0 && clients[0].latitude && clients[0].longitude
            ? { lat: clients[0].latitude, lng: clients[0].longitude }
            : defaultCenter}
          zoom={6}
          onLoad={map => { mapRef.current = map; }}
        >
          <MarkerClusterer>
            {(clusterer) => (
              <>
                {clients.filter(c => c.latitude && c.longitude).map(client => (
                  <Marker
                    key={client.id}
                    position={{ lat: client.latitude, lng: client.longitude }}
                    clusterer={clusterer}
                    onClick={() => setSelected(client)}
                  />
                ))}
              </>
            )}
          </MarkerClusterer>
          {selected && (
            <InfoWindow
              position={{ lat: selected.latitude, lng: selected.longitude }}
              onCloseClick={() => setSelected(null)}
            >
              <div>
                <strong>{selected.name}</strong>
                {selected.address && <div>{selected.address}</div>}
                {selected.contact && <div>Contact: {selected.contact}</div>}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default ClientsMapPage; 