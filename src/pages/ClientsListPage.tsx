import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { clientService, Client as ApiClient } from '../services/clientService';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES } from '../config/googleMaps';
import {
  Search,
  Plus,
  Route,
  DollarSign,
  Edit,
  Trash2,
  X,
  ChevronDown,
  Users,
  Map,
  Activity,
  Eye,
  ChevronUp,
  ArrowUpDown,
  Building2,
  Filter,
  MapPin,
  Lock,
  Unlock
} from 'lucide-react';

interface Client {
  id: number;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  balance?: number;
  email: string;
  region_id: number;
  region: string;
  region_name?: string;
  route_id?: number;
  route_name?: string;
  route_id_update?: number;
  route_name_update?: string;
  contact: string;
  tax_pin?: string;
  location?: string;
  status: number;
  client_type?: number;
  outlet_account?: number;
  countryId: number;
  added_by?: number;
  created_at?: string;
  client_type_name?: string;
  outlet_account_name?: string;
  salesRepAssignment?: ClientAssignment | null;
  credit_limit?: number;
  payment_terms?: string;
  location_locked?: number;
}

interface Country { id: number; name: string; }
interface Region { id: number; name: string; }
interface Route { id: number; name: string; }
interface SalesRep { id: number; name: string; email: string; phone: string; }
interface ClientAssignment { id: number; outletId: number; salesRepId: number; assignedAt: string; status: string; sales_rep_name: string; }

// Map Modal Component
const MapModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}> = ({ isOpen, onClose, client }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
  const [showInfoWindow, setShowInfoWindow] = useState(true);
  const mapRef = React.useRef<google.maps.Map | null>(null);

  // Parse coordinates as numbers (they might come as strings from the database)
  const lat = client?.latitude ? parseFloat(String(client.latitude)) : null;
  const lng = client?.longitude ? parseFloat(String(client.longitude)) : null;
  
  // Validate coordinates are within valid ranges
  const isValidLat = lat !== null && !isNaN(lat) && lat >= -90 && lat <= 90;
  const isValidLng = lng !== null && !isNaN(lng) && lng >= -180 && lng <= 180;
  const hasLocation = isValidLat && isValidLng;
  
  const center = hasLocation 
    ? { lat: lat!, lng: lng! }
    : { lat: -1.286389, lng: 36.817223 }; // Default to Nairobi

  useEffect(() => {
    if (loadError) {
      console.error('Google Maps load error:', loadError);
    }
    if (isLoaded) {
      console.log('Google Maps loaded successfully');
    }
  }, [isLoaded, loadError]);

  // Debug logging
  useEffect(() => {
    if (isOpen && client) {
      console.log('=== MAP MODAL DEBUG ===');
      console.log('Client:', client.name);
      console.log('Raw coordinates:', { 
        latitude: client.latitude, 
        longitude: client.longitude,
        latType: typeof client.latitude,
        lngType: typeof client.longitude
      });
      console.log('Parsed coordinates:', { lat, lng });
      console.log('Validation:', { isValidLat, isValidLng, hasLocation });
      console.log('Center position:', center);
      console.log('Map loaded:', isLoaded);
      console.log('=====================');
    }
  }, [isOpen, client, lat, lng, isValidLat, isValidLng, hasLocation, center, isLoaded]);

  if (!isOpen || !client) return null;

  if (loadError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Location Map</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="text-red-600">
            <p className="font-medium mb-2">Error loading map</p>
            <p className="text-sm">{loadError.message || 'Please check your Google Maps API key and try again.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const mapContainerStyle = {
    width: '100%',
    height: '600px',
    minHeight: '600px'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Location Map</h2>
            <p className="text-sm text-gray-600 mt-1">{client.name}</p>
            {hasLocation && (
              <p className="text-xs text-gray-500 mt-1">
                Coordinates: {lat?.toFixed(6)}, {lng?.toFixed(6)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="w-full" style={{ height: '600px', position: 'relative' }}>
          {!isLoaded ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          ) : hasLocation && isLoaded ? (
            <div style={{ width: '100%', height: '100%' }}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={19}
                onLoad={(map) => {
                  mapRef.current = map;
                  console.log('Map loaded, centering on:', { lat, lng, hasLocation });
                  // Ensure the map is centered exactly on the marker with high zoom
                  if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                    const exactPosition = { lat: Number(lat), lng: Number(lng) };
                    console.log('Setting map center to:', exactPosition);
                    // Set center and zoom immediately
                    map.setCenter(exactPosition);
                    map.setZoom(19); // Very high zoom level (19 = building level) for exact location
                    // Small delay to ensure map is fully loaded before final pan
                    setTimeout(() => {
                      map.panTo(exactPosition);
                      map.setZoom(19);
                      console.log('Map centered and zoomed to exact position:', exactPosition);
                    }, 300);
                  } else {
                    console.error('Invalid coordinates:', { lat, lng });
                  }
                }}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: true,
                  mapTypeControl: true,
                  fullscreenControl: true,
                  mapTypeId: google.maps.MapTypeId.ROADMAP,
                }}
              >
                {lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && (
                  <>
                    <Marker
                      key={`marker-${client.id}-${lat}-${lng}`}
                      position={{ lat: Number(lat), lng: Number(lng) }}
                      title={client.name}
                      animation={google.maps.Animation.DROP}
                      draggable={false}
                      onClick={() => {
                        console.log('Marker clicked at:', { lat: Number(lat), lng: Number(lng) });
                        setShowInfoWindow(true);
                        if (mapRef.current) {
                          const exactPosition = { lat: Number(lat), lng: Number(lng) };
                          mapRef.current.setCenter(exactPosition);
                          mapRef.current.setZoom(19); // Zoom in even closer when clicked
                        }
                      }}
                    />
                    {showInfoWindow && (
                      <InfoWindow
                        position={{ lat: Number(lat), lng: Number(lng) }}
                        onCloseClick={() => setShowInfoWindow(false)}
                      >
                        <div>
                          <strong>{client.name}</strong>
                          {client.address && <div className="text-sm text-gray-600 mt-1">{client.address}</div>}
                          {client.contact && <div className="text-sm text-gray-600">Contact: {client.contact}</div>}
                          <div className="text-xs text-gray-500 mt-1">
                            Lat: {lat?.toFixed(6)}, Lng: {lng?.toFixed(6)}
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                  </>
                )}
              </GoogleMap>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No location data available</p>
                <p className="text-sm text-gray-500 mt-1">This client doesn't have latitude and longitude coordinates.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AddClientModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Client, 'id' | 'created_at'>) => void;
  loading: boolean;
  countries: Country[];
  regions: Region[];
  routes: Route[];
  outletAccounts: { id: number; name: string }[];
  clientTypes: { id: number; name: string }[];
  onCountryChange: (country: string) => void;
}> = ({ isOpen, onClose, onSubmit, loading, countries, regions, routes, outletAccounts, clientTypes, onCountryChange }) => {
  const [form, setForm] = useState<Omit<Client, 'id' | 'created_at'>>({
    name: '',
    email: '',
    contact: '',
    address: '',
    region_id: 0,
    region: '',
    route_id: undefined,
    route_name: '',
    route_id_update: undefined,
    route_name_update: '',
    latitude: undefined,
    longitude: undefined,
    balance: undefined,
    tax_pin: '',
    location: '',
    status: 0,
    client_type: undefined,
    outlet_account: undefined,
    countryId: 0,
    added_by: undefined,
    credit_limit: undefined,
    payment_terms: '',
  });

  useEffect(() => {
    if (!isOpen) {
      setForm({ name: '', email: '', contact: '', address: '', region_id: 0, region: '', route_id: undefined, route_name: '', route_id_update: undefined, route_name_update: '', latitude: undefined, longitude: undefined, balance: undefined, tax_pin: '', location: '', status: 0, client_type: undefined, outlet_account: undefined, countryId: 0, added_by: undefined, credit_limit: undefined, payment_terms: '' });
    } else if (isOpen && countries.length > 0) {
      // Set Kenya as default country
      const kenya = countries.find(c => c.name.toLowerCase() === 'kenya');
      if (kenya) {
        setForm(f => {
          if (f.countryId === 0 || f.countryId === undefined) {
            // Trigger country change to load regions/routes
            setTimeout(() => onCountryChange(kenya.id.toString()), 0);
            return { ...f, countryId: kenya.id };
          }
          return f;
        });
      }
    }
  }, [isOpen, countries]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Add New Client</h2>
          <p className="text-sm text-gray-600 mt-1">Enter client information below</p>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder="Enter client name"
            />
          </div>

          <div hidden>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder="Enter email address (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <select
                value={form.region_id}
                onChange={e => setForm(f => ({ ...f, region_id: parseInt(e.target.value, 10) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                disabled={!form.countryId}
              >
                <option value="">{form.countryId ? 'Select region' : 'Select country first'}</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
              <select
                value={form.route_id}
                onChange={e => setForm(f => ({ ...f, route_id: parseInt(e.target.value, 10) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                disabled={!form.countryId}
              >
                <option value="">{form.countryId ? 'Select route' : 'Select country first'}</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
              <select
                value={form.client_type || 0}
                onChange={e => setForm(f => ({ ...f, client_type: parseInt(e.target.value, 10) || undefined }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value={0}>Not assigned</option>
                {clientTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Account</label>
              <select
                value={form.outlet_account || 0}
                onChange={e => setForm(f => ({ ...f, outlet_account: parseInt(e.target.value, 10) || undefined }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value={0}>Not assigned</option>
                {outletAccounts.map(account => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? 'Saving...' : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Client
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Filter Modal Component
const FilterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  filterRegion: string;
  filterRoute: string;
  filterType: string;
  filterOutletAccount: string;
  regions: Region[];
  routes: Route[];
  clientTypes: { id: number; name: string }[];
  outletAccounts: { id: number; name: string }[];
  onRegionChange: (region: string) => void;
  onRouteChange: (route: string) => void;
  onTypeChange: (type: string) => void;
  onOutletAccountChange: (outlet: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}> = ({
  isOpen,
  onClose,
  filterRegion,
  filterRoute,
  filterType,
  filterOutletAccount,
  regions,
  routes,
  clientTypes,
  outletAccounts,
  onRegionChange,
  onRouteChange,
  onTypeChange,
  onOutletAccountChange,
  onApplyFilters,
  onResetFilters
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm leading-6 font-medium text-gray-900">
                Filter Clients
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="filter-region" className="block text-xs font-medium text-gray-700 mb-2">
                  Region
                </label>
                <select
                  id="filter-region"
                  value={filterRegion}
                  onChange={(e) => onRegionChange(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Regions</option>
                  {regions.map(region => (
                    <option key={region.id} value={region.id.toString()}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-route" className="block text-xs font-medium text-gray-700 mb-2">
                  Route
                </label>
                <select
                  id="filter-route"
                  value={filterRoute}
                  onChange={(e) => onRouteChange(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Routes</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id.toString()}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-type" className="block text-xs font-medium text-gray-700 mb-2">
                  Client Type
                </label>
                <select
                  id="filter-type"
                  value={filterType}
                  onChange={(e) => onTypeChange(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Types</option>
                  {clientTypes.map(type => (
                    <option key={type.id} value={type.id.toString()}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-outlet" className="block text-xs font-medium text-gray-700 mb-2">
                  Outlet Account
                </label>
                <select
                  id="filter-outlet"
                  value={filterOutletAccount}
                  onChange={(e) => onOutletAccountChange(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Outlet Accounts</option>
                  {outletAccounts.map(account => (
                    <option key={account.id} value={account.id.toString()}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={() => {
                onApplyFilters();
                onClose();
              }}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-xs font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => {
                onResetFilters();
                onClose();
              }}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [outletAccounts, setOutletAccounts] = useState<{ id: number; name: string }[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [clientTypes, setClientTypes] = useState<{ id: number; name: string }[]>([]);
  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterRoute, setFilterRoute] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOutletAccount, setFilterOutletAccount] = useState<string>('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [allRegions, setAllRegions] = useState<Region[]>([]);
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedClientForMap, setSelectedClientForMap] = useState<Client | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<number>>(new Set());
  const [bulkLockLoading, setBulkLockLoading] = useState(false);


  // Fetch countries when modal opens
  useEffect(() => {
    if (modalOpen || editModalOpen) {
      // Note: This endpoint might need to be added to clientService
      axios.get('/api/sales/countries')
        .then(res => setCountries(res.data))
        .catch(err => console.error('Failed to fetch countries:', err));
    }
  }, [modalOpen, editModalOpen]);

  // Fetch regions and routes when selectedCountry changes
  useEffect(() => {
    if (selectedCountry) {
      const countryId = parseInt(selectedCountry);
      if (countryId) {
        axios.get(`/api/sales/regions?country_id=${countryId}`)
          .then(res => setRegions(res.data))
          .catch(err => console.error('Failed to fetch regions:', err));
        axios.get(`/api/routes?country_id=${countryId}&limit=1000`)
          .then(res => {
            const data = res.data;
            if (data.success && data.data) {
              setRoutes(data.data);
            } else {
              setRoutes([]);
            }
          })
          .catch(err => console.error('Failed to fetch routes:', err));
      } else {
        setRegions([]);
        setRoutes([]);
      }
    } else {
      setRegions([]);
      setRoutes([]);
    }
  }, [selectedCountry, countries]);

  // Fetch client types and outlet accounts in parallel on mount
  useEffect(() => {
    Promise.all([
      axios.get('/api/clients/types'),
      axios.get('/api/outlet-accounts'),
      axios.get('/api/sales/regions'),
      axios.get('/api/routes?limit=10000')
    ])
      .then(([typesRes, accountsRes, regionsRes, routesRes]) => {
        setClientTypes(typesRes.data);
        // API returns { success: true, data: [...] }
        setOutletAccounts(accountsRes.data.success ? accountsRes.data.data : []);
        setAllRegions(regionsRes.data || []);
        const routesData = routesRes.data;
        setAllRoutes(routesData.success && routesData.data ? routesData.data : []);
      })
      .catch(err => console.error('Failed to fetch initial data:', err));
  }, []);

  const fetchClients = async (pageNum = page, pageLimit = limit, searchTerm = search, sortFieldParam = sortField, sortOrderParam = sortOrder) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: pageNum,
        limit: pageLimit,
      };
      if (searchTerm) params.search = searchTerm;
      if (sortFieldParam) {
        params.sortField = sortFieldParam;
        params.sortOrder = sortOrderParam;
      }
      if (filterRegion !== 'all') params.regionId = filterRegion;
      if (filterRoute !== 'all') params.routeId = filterRoute;
      if (filterType !== 'all') params.clientType = filterType;
      if (filterOutletAccount !== 'all') params.outletAccount = filterOutletAccount;
      const res = await axios.get('/api/clients', { params });
      const data = res.data;

      // Transform clients data - assignment info is now included in the main query
      const clientsWithAssignments = data.data.map((client: any) => {
        // If there's an assignment, structure it properly
        const salesRepAssignment = client.assignment_id ? {
          id: client.assignment_id,
          salesRepId: client.assignment_salesRepId,
          assignedAt: client.assignment_assignedAt,
          sales_rep_name: client.sales_rep_name,
          sales_rep_email: client.sales_rep_email,
          sales_rep_phone: client.sales_rep_phone
        } : null;

        // Remove the flattened assignment fields from the client object
        const { assignment_id, assignment_salesRepId, assignment_assignedAt, sales_rep_name, sales_rep_email, sales_rep_phone, ...clientData } = client;

        return {
          ...clientData,
          salesRepAssignment
        };
      });

      setClients(clientsWithAssignments);
      setPage(data.page);
      setLimit(data.limit);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clients');
    }
    setLoading(false);
  };

  useEffect(() => { 
    fetchClients(page, limit, search, sortField, sortOrder);
    // Clear selections when filters or page change
    setSelectedClientIds(new Set());
  }, [page, limit, search, sortField, sortOrder, filterRegion, filterRoute, filterType, filterOutletAccount]);

  const handlePrevPage = () => { if (page > 1) setPage(page - 1); };
  const handleNextPage = () => { if (page < totalPages) setPage(page + 1); };
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value);
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };
  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilterRegion('all');
    setFilterRoute('all');
    setFilterType('all');
    setFilterOutletAccount('all');
    setPage(1);
  };

  const handleApplyFilters = () => {
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleAdd = async (data: Omit<Client, 'id' | 'created_at'>) => {
    setSubmitting(true);
    try {
      const payload: any = {
        name: data.name,
        email: data.email,
        address: data.address,
        contact: data.contact,
        tax_pin: data.tax_pin,
        credit_limit: data.credit_limit !== undefined ? String(data.credit_limit) : undefined,
        payment_terms: data.payment_terms,
        countryId: data.countryId,
        region_id: data.region_id,
        route_id: data.route_id,
        route_id_update: data.route_id_update,
        status: data.status,
        client_type: data.client_type,
        outlet_account: data.outlet_account,
      };

      await clientService.createClient(payload);
      setModalOpen(false);
      await fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to add client');
    }
    setSubmitting(false);
  };

  const handleEditClick = (client: Client) => {
    // Ensure Kenya is set as default country if not already set
    const kenya = countries.find(c => c.name.toLowerCase() === 'kenya');
    if (kenya && (!client.countryId || client.countryId === 0)) {
      client.countryId = kenya.id;
      setSelectedCountry(kenya.id.toString());
    } else if (client.countryId) {
      setSelectedCountry(client.countryId.toString());
    }
    setEditClient(client);
    setEditModalOpen(true);
    setEditError(null);
  };

  const handleEditSave = async (updated: Client) => {
    setEditLoading(true);
    setEditError(null);
    try {
      await axios.put(`/api/clients/${updated.id}`, updated);
      setEditModalOpen(false);
      setEditClient(null);
      await fetchClients();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update client');
    }
    setEditLoading(false);
  };

  const handleDeleteClient = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await axios.delete(`/api/clients/${id}`);
      await fetchClients();
    } catch (err: any) {
      setError(err.message || 'Failed to delete client');
    }
  };

  const handleToggleLocationLock = async (client: Client) => {
    // Only allow locking if coordinates exist
    if (!client.latitude || !client.longitude || client.latitude === 0 || client.longitude === 0) {
      setError('Cannot lock location: Client does not have valid coordinates. Please set latitude and longitude first.');
      return;
    }
    
    const isLocked = client.location_locked === 1;
    const action = isLocked ? 'unlock' : 'lock';
    
    if (!window.confirm(`Are you sure you want to ${action} the location for ${client.name}?`)) return;
    
    try {
      await axios.patch(`/api/clients/${client.id}/location-lock`, { locked: !isLocked });
      await fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || `Failed to ${action} location`);
    }
  };

  const handleSelectClient = (clientId: number) => {
    setSelectedClientIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const clientsWithLocation = clients.filter(c => c.latitude && c.longitude && c.latitude !== 0 && c.longitude !== 0);
    const allSelected = clientsWithLocation.every(c => selectedClientIds.has(c.id));
    
    if (allSelected) {
      // Deselect all
      setSelectedClientIds(new Set());
    } else {
      // Select all clients with valid locations
      setSelectedClientIds(new Set(clientsWithLocation.map(c => c.id)));
    }
  };

  const handleBulkToggleLocationLock = async (lock: boolean) => {
    if (selectedClientIds.size === 0) {
      setError('Please select at least one client to lock/unlock.');
      return;
    }

    const selectedClients = clients.filter(c => selectedClientIds.has(c.id));
    const clientsWithValidLocation = selectedClients.filter(
      c => c.latitude && c.longitude && c.latitude !== 0 && c.longitude !== 0
    );

    if (lock && clientsWithValidLocation.length !== selectedClients.length) {
      const invalidClients = selectedClients.filter(
        c => !c.latitude || !c.longitude || c.latitude === 0 || c.longitude === 0
      );
      if (!window.confirm(
        `${invalidClients.length} selected client(s) do not have valid coordinates and will be skipped. ` +
        `Continue with locking ${clientsWithValidLocation.length} client(s)?`
      )) {
        return;
      }
    } else {
      const action = lock ? 'lock' : 'unlock';
      if (!window.confirm(`Are you sure you want to ${action} locations for ${clientsWithValidLocation.length} selected client(s)?`)) {
        return;
      }
    }

    setBulkLockLoading(true);
    setError(null);

    try {
      const promises = clientsWithValidLocation.map(client =>
        axios.patch(`/api/clients/${client.id}/location-lock`, { locked: lock })
      );

      await Promise.all(promises);
      setSelectedClientIds(new Set());
      await fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || `Failed to ${lock ? 'lock' : 'unlock'} locations`);
    } finally {
      setBulkLockLoading(false);
    }
  };




  return (
    <div className="w-full py-4 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Clients</h1>
            <p className="text-xs text-gray-600 mt-0.5">Manage your client relationships and information</p>
          </div>

          <div className="flex items-center gap-2">
            {selectedClientIds.size > 0 && (
              <>
                <button
                  onClick={() => handleBulkToggleLocationLock(true)}
                  disabled={bulkLockLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Lock ({selectedClientIds.size})
                </button>
                <button
                  onClick={() => handleBulkToggleLocationLock(false)}
                  disabled={bulkLockLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Unlock ({selectedClientIds.size})
                </button>
              </>
            )}

            <Link
              to="/outlet-accounts"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Building2 className="h-3.5 w-3.5" />
              Outlet Accounts
            </Link>

            <button
              onClick={() => window.open('/clients-map', '_blank')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Map className="h-3.5 w-3.5" />
              Map View
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Client
            </button>
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="mb-4">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex gap-2 flex-1 max-w-md">
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  placeholder="Search clients by name, email, or contact..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </form>
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {(filterRegion !== 'all' || filterRoute !== 'all' || filterType !== 'all' || filterOutletAccount !== 'all') && (
                <span className="ml-1 px-1.5 py-0.5 bg-green-600 text-white rounded-full text-[10px]">
                  {[filterRegion !== 'all', filterRoute !== 'all', filterType !== 'all', filterOutletAccount !== 'all'].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-green-600" />
              <span>{total} total clients</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-green-600" />
              <span>Page {page} of {totalPages}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">{error}</div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      {(() => {
                        const clientsWithValidLocation = clients.filter(c => c.latitude && c.longitude && c.latitude !== 0 && c.longitude !== 0);
                        const allSelected = clientsWithValidLocation.length > 0 && clientsWithValidLocation.every(c => selectedClientIds.has(c.id));
                        return (
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            title="Select all clients with valid locations"
                            disabled={clientsWithValidLocation.length === 0}
                          />
                        );
                      })()}
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Region</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Route</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Outlet Account</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Geo-Location</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map(client => {
                    const hasValidLocation = client.latitude && client.longitude && client.latitude !== 0 && client.longitude !== 0;
                    const isSelected = selectedClientIds.has(client.id);
                    
                    return (
                    <tr key={client.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-green-50' : ''}`}>
                      <td className="px-4 py-2">
                        {hasValidLocation ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectClient(client.id)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-xs font-medium text-gray-900 font-mono">
                          CUS{client.id.toString().padStart(6, '0')}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-xs font-medium text-gray-900">{client.name}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-xs text-gray-900">{client.region_name || client.region || 'No region'}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-xs text-gray-900">{client.route_name || client.route_name_update || 'No route'}</div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs text-gray-900">{client.client_type_name || 'Not assigned'}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs text-gray-900">{client.outlet_account_name || 'Not assigned'}</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {client.latitude && client.longitude ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedClientForMap(client);
                                  setMapModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                                title="View location on map"
                              >
                                <MapPin className="h-3.5 w-3.5" />
                                <span>View Map</span>
                              </button>
                              <button
                                onClick={() => handleToggleLocationLock(client)}
                                className={`p-1.5 rounded transition-colors ${
                                  client.location_locked === 1
                                    ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                }`}
                                title={client.location_locked === 1 ? 'Location is locked - Click to unlock' : 'Location is unlocked - Click to lock'}
                              >
                                {client.location_locked === 1 ? (
                                  <Lock className="h-3.5 w-3.5" />
                                ) : (
                                  <Unlock className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">No location</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(client)}
                            className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Edit client"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete client"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {clients.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center">
                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-base font-medium text-gray-900 mb-1">No clients found</h3>
                        <p className="text-xs text-gray-600">Get started by adding your first client.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <span>Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={limit}
                  onChange={handlePageSizeChange}
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size} per page</option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                  </button>

                  <span className="px-2.5 py-1.5 text-xs text-gray-700">
                    Page {page} of {totalPages}
                  </span>


                  <button
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                    className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddClientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
        loading={submitting}
        countries={countries}
        regions={regions}
        routes={routes}
        outletAccounts={outletAccounts}
        clientTypes={clientTypes}
        onCountryChange={setSelectedCountry}
      />

      {editModalOpen && editClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Edit Client</h2>
              <p className="text-sm text-gray-600 mt-1">Update client information</p>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleEditSave(editClient);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={editClient.name}
                  onChange={e => setEditClient({ ...editClient, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select
                    value={editClient.region_id}
                    onChange={e => {
                      const regionId = parseInt(e.target.value);
                      const region = regions.find(r => r.id === regionId);
                      setEditClient({
                        ...editClient,
                        region_id: regionId,
                        region: region?.name || ''
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <option value="">Select region</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                  <select
                    value={editClient.route_id || ''}
                    onChange={e => {
                      const routeId = e.target.value ? parseInt(e.target.value) : undefined;
                      const route = routes.find(r => r.id === routeId);
                      setEditClient({
                        ...editClient,
                        route_id: routeId,
                        route_name: route?.name || '',
                        route_id_update: routeId,
                        route_name_update: route?.name || ''
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <option value="">Select route</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
                  <select
                    value={editClient?.client_type ?? 0}
                    onChange={e => setEditClient(ec => ec ? { ...ec, client_type: Number(e.target.value) } : ec)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <option value={0}>Not assigned</option>
                    {clientTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Account</label>
                  <select
                    value={editClient?.outlet_account ?? 0}
                    onChange={e => setEditClient(ec => ec ? { ...ec, outlet_account: Number(e.target.value) } : ec)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <option value={0}>Not assigned</option>
                    {outletAccounts.map(account => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{editError}</div>}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setEditClient(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filterRegion={filterRegion}
        filterRoute={filterRoute}
        filterType={filterType}
        filterOutletAccount={filterOutletAccount}
        regions={allRegions}
        routes={allRoutes}
        clientTypes={clientTypes}
        outletAccounts={outletAccounts}
        onRegionChange={setFilterRegion}
        onRouteChange={setFilterRoute}
        onTypeChange={setFilterType}
        onOutletAccountChange={setFilterOutletAccount}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Map Modal */}
      <MapModal
        isOpen={mapModalOpen}
        onClose={() => {
          setMapModalOpen(false);
          setSelectedClientForMap(null);
        }}
        client={selectedClientForMap}
      />
    </div>
  );
};

export default ClientsListPage; 