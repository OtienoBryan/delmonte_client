import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { getWithAuth, postWithAuth } from '../utils/fetchWithAuth';

interface SalesRep {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: number;
  route_id_update?: number;
}

interface Client {
  id: number;
  name: string;
  company_name?: string;
  email: string;
  address?: string;
  contact?: string;
  latitude?: number;
  longitude?: number;
  location_locked?: number;
}

interface CreateJourneyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesRep: SalesRep;
  onSuccess: () => void;
}

interface JourneyPlanItem {
  id: string;
  date: string;
  time: string;
  clientId: number;
  clientName?: string;
  clientCompanyName?: string;
  notes: string;
  latitude?: number;
  longitude?: number;
  routeId?: number | null;
  location_locked?: number;
}

const CreateJourneyPlanModal: React.FC<CreateJourneyPlanModalProps> = ({
  isOpen,
  onClose,
  salesRep,
  onSuccess,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [journeyPlanItems, setJourneyPlanItems] = useState<JourneyPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchCacheRef = useRef<Map<string, Client[]>>(new Map());

  // Optimized search function with caching
  const fetchClients = useCallback(async (search: string = '') => {
    // Only fetch if search query is provided (at least 2 characters)
    if (!search.trim() || search.trim().length < 2) {
      setClients([]);
      setFilteredClients([]);
      setIsLoadingClients(false);
      return;
    }

    const searchKey = search.trim().toLowerCase();
    
    // Check cache first
    if (searchCacheRef.current.has(searchKey)) {
      console.log('[CreateJourneyPlanModal] Using cached results for:', searchKey);
      const cachedResults = searchCacheRef.current.get(searchKey)!;
      setClients(cachedResults);
      setFilteredClients(cachedResults);
      setIsLoadingClients(false);
      return;
    }

    // Set loading state - but don't block input
    setIsLoadingClients(true);
    try {
      // Optimized query parameters
      const params = new URLSearchParams();
      params.append('search', searchKey);
      params.append('lightweight', 'true'); // Minimal fields, no JOINs
      params.append('limit', '50'); // Reduced from 100 for faster queries
      params.append('page', '1');
      
      // Fetch all clients regardless of route
      
      const url = `/api/clients?${params.toString()}`;
      const startTime = performance.now();
      
      const response = await getWithAuth(url);
      const data = await response.json();
      
      const endTime = performance.now();
      console.log(`[CreateJourneyPlanModal] Client fetch completed in ${(endTime - startTime).toFixed(2)}ms`);
      
      const results = data.data || [];
      
      // Cache the results
      searchCacheRef.current.set(searchKey, results);
      
      // Limit cache size to prevent memory issues
      if (searchCacheRef.current.size > 20) {
        const firstKey = searchCacheRef.current.keys().next().value;
        if (firstKey) {
          searchCacheRef.current.delete(firstKey);
        }
      }
      
      setClients(results);
      setFilteredClients(results);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      setError('Failed to load clients. Please try again.');
      setClients([]);
      setFilteredClients([]);
    } finally {
      setIsLoadingClients(false);
    }
  }, [salesRep.route_id_update]);

  // Initialize modal - NO CLIENTS LOADED ON OPEN (lazy loading)
  // Clients are only fetched when user types in search box (minimum 2 characters)
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setClients([]);
      setFilteredClients([]);
      setSearchQuery(''); // Clear search query
      setIsLoadingClients(false); // Ensure loading state is false
      console.log('SalesRep data:', salesRep);
      console.log('SalesRep route_id_update:', salesRep.route_id_update);
      // NOTE: No fetchClients() call here - clients load only when user searches
    }
  }, [isOpen, salesRep]);

  // Debounced search effect - only search when user types
  useEffect(() => {
    // Clear previous timer
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
      searchDebounceTimerRef.current = null;
    }

    // If search is empty or too short, clear results
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setClients([]);
      setFilteredClients([]);
      setIsLoadingClients(false);
      return;
    }

    // Set new timer for debounced search
    searchDebounceTimerRef.current = setTimeout(() => {
      fetchClients(searchQuery);
    }, 400); // 400ms debounce delay - reduced API calls while typing

    // Cleanup
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = null;
      }
    };
  }, [searchQuery, fetchClients]);

  const resetForm = () => {
    setJourneyPlanItems([]);
    setSearchQuery('');
    setError(null);
    // Clear clients when modal closes to free memory
    if (!isOpen) {
      setClients([]);
      setFilteredClients([]);
    }
  };

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClients([]);
      setFilteredClients([]);
      setSearchQuery('');
      // Clear any pending debounce timer
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = null;
      }
      // Clear cache when modal closes to free memory
      searchCacheRef.current.clear();
    }
  }, [isOpen]);

  // Lock page scroll + close on Escape while open
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const addClientToJourneyPlan = (client: Client) => {
    // Check if client is already added
    if (journeyPlanItems.some(item => item.clientId === client.id)) {
      setError('This client is already added to the journey plan');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newItem: JourneyPlanItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      clientId: client.id,
      clientName: client.name,
      clientCompanyName: client.company_name,
      notes: '',
      latitude: client.latitude || undefined,
      longitude: client.longitude || undefined,
      routeId: salesRep.route_id_update || null,
      location_locked: client.location_locked || 0,
    };

    setJourneyPlanItems(prev => [...prev, newItem]);
    
    // Clear search to show success
    setSearchQuery('');
    setClients([]);
    setFilteredClients([]);
  };

  const updateJourneyPlanItem = (id: string, field: keyof JourneyPlanItem, value: string | number) => {
    setJourneyPlanItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeJourneyPlanItem = (id: string) => {
    setJourneyPlanItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (journeyPlanItems.length === 0) {
      setError('Please add at least one journey plan item');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create journey plans for each item
      const promises = journeyPlanItems.map(item => {
        const requestBody = {
          date: item.date,
          time: item.time,
          userId: salesRep.id,
          clientId: item.clientId,
          status: 0,
          notes: item.notes,
          showUpdateLocation: true,
          latitude: item.latitude,
          longitude: item.longitude,
          routeId: item.routeId || null,
          location_locked: item.location_locked || 0,
        };
        
        console.log('Creating journey plan with data:', requestBody);
        console.log('Item routeId:', item.routeId);
        console.log('SalesRep route_id_update:', salesRep.route_id_update);
        
        return postWithAuth('/api/journey-plans', requestBody);
      });

      await Promise.all(promises);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create journey plans');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const overlayPad =
    'pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 backdrop-blur-sm sm:p-3 lg:items-center lg:justify-center lg:p-6 ${overlayPad}`}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-route-plan-title"
        className="bg-white flex h-full min-h-0 w-full max-h-[100dvh] flex-col overflow-hidden rounded-none shadow-none sm:max-h-[calc(100dvh-1.5rem)] sm:rounded-xl sm:shadow-2xl lg:h-[min(56rem,calc(100dvh-2rem))] lg:max-h-[min(56rem,calc(100dvh-2rem))] lg:max-w-6xl lg:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b bg-gradient-to-r from-red-50 to-orange-50 px-4 py-3 shadow-sm sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 id="create-route-plan-title" className="truncate text-base font-bold text-gray-900 sm:text-lg">
                Create Route Plan
              </h3>
              <p className="truncate text-xs text-gray-600">for {salesRep.name}</p>
              {salesRep.route_id_update && (
                <p className="mt-0.5 truncate text-xs font-medium text-purple-600">
                  Route ID: {salesRep.route_id_update}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-white/50 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-5 lg:p-6"
        >
          {error && (
            <div className="mb-3 flex-shrink-0 rounded-r-lg border-l-4 border-red-500 bg-red-50 p-3 shadow-sm sm:mb-4">
              <div className="flex items-start gap-2 text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span className="text-xs font-medium leading-snug">{error}</span>
              </div>
            </div>
          )}

          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 sm:gap-4 md:gap-6 [grid-template-columns:minmax(0,1fr)_minmax(0,1fr)] [grid-template-rows:minmax(0,1fr)]">
            {/* Client Selection Section */}
            <div className="flex h-full max-h-full min-h-0 min-w-0 flex-col rounded-lg border border-gray-200 bg-gray-50 p-2 sm:rounded-xl sm:p-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-900 sm:mb-3 sm:gap-2 sm:text-sm lg:mb-4">
                <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                Search & Add Clients
              </h4>
              
              <div className="mb-2 sm:mb-4 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  {isLoadingClients && (
                    <Loader2 className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 animate-spin" />
                  )}
                  <input
                    type="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-8 pr-8 text-xs shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 sm:pl-10 sm:pr-10 sm:py-2.5 sm:text-sm"
                  />
                </div>
                {searchQuery.trim().length >= 2 && !isLoadingClients && filteredClients.length > 0 && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    {filteredClients.length} result{filteredClients.length !== 1 ? 's' : ''} 
                    {filteredClients.length === 50 && ' (showing max)'}
                  </p>
                )}
                {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    Type at least 2 characters to search
                  </p>
                )}
              </div>

              <div className="min-h-[10rem] flex-1 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white shadow-inner sm:min-h-[12rem] touch-pan-y">
                {isLoadingClients ? (
                  <div className="p-3 sm:p-6 text-center">
                    <Loader2 className="h-6 w-6 text-red-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-600">Searching clients...</p>
                  </div>
                ) : !searchQuery.trim() || searchQuery.trim().length < 2 ? (
                  <div className="p-3 sm:p-6 text-center">
                    <Search className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2 sm:mb-3" />
                    <p className="text-xs text-gray-600 font-medium mb-1">Start typing to search for clients</p>
                    <p className="text-xs text-gray-500">Enter at least 2 characters to search</p>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="p-3 sm:p-6 text-center">
                    <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2 sm:mb-3" />
                    <p className="text-xs text-gray-600 font-medium mb-1">No clients found</p>
                    <p className="text-xs text-gray-500">Try a different search term</p>
                  </div>
                ) : (
                  filteredClients.map((client) => {
                    const isAlreadyAdded = journeyPlanItems.some(item => item.clientId === client.id);
                    return (
                      <div
                        key={client.id}
                        role="button"
                        tabIndex={isAlreadyAdded ? -1 : 0}
                        onKeyDown={(e) => {
                          if (!isAlreadyAdded && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            addClientToJourneyPlan(client);
                          }
                        }}
                        className={`border-b border-gray-100 p-2.5 transition-colors sm:p-2.5 ${
                          isAlreadyAdded
                            ? 'cursor-not-allowed bg-gray-100 opacity-60'
                            : 'cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 active:bg-blue-50/80'
                        }`}
                        onClick={() => !isAlreadyAdded && addClientToJourneyPlan(client)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs text-gray-900 truncate flex items-center gap-1.5">
                              {client.name || client.company_name || 'Unnamed Client'}
                              {isAlreadyAdded && (
                                <span className="text-xs text-green-600 font-semibold">✓ Added</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {client.email || 'No email'}
                            </div>
                            {client.address && (
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                {client.address}
                              </div>
                            )}
                            {(client.latitude && client.longitude) && (
                              <div className="text-xs text-blue-600 mt-0.5">
                                📍 {client.latitude.toFixed(4)}, {client.longitude.toFixed(4)}
                              </div>
                            )}
                          </div>
                          {!isAlreadyAdded && (
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                +
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex h-full max-h-full min-h-0 min-w-0 flex-col rounded-lg border border-gray-200 bg-gray-50 p-2 sm:rounded-xl sm:p-4">
              <h4 className="mb-2 flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-gray-900 sm:mb-3 sm:gap-2 sm:text-sm lg:mb-4">
                <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                Journey Plan Items
              </h4>
              
              {journeyPlanItems.length === 0 ? (
                <div className="text-center py-4 sm:py-6 px-1 border-2 border-dashed border-gray-300 rounded-lg flex-1 min-h-0 flex items-center justify-center bg-white">
                  <div>
                    <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-1 sm:mb-2" />
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight">No items yet</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1 leading-tight">Add clients from the left</p>
                  </div>
                </div>
              ) : (
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain touch-pan-y">
                  {journeyPlanItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-shadow sm:p-3 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <h5 className="font-semibold text-xs text-gray-900 flex items-center gap-2">
                          <span className="w-5 h-5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          Visit {index + 1}
                        </h5>
                        <button
                          type="button"
                          onClick={() => removeJourneyPlanItem(item.id)}
                          className="rounded-md p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          aria-label={`Remove visit ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => updateJourneyPlanItem(item.id, 'date', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="mt-2.5">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={item.notes}
                          onChange={(e) => updateJourneyPlanItem(item.id, 'notes', e.target.value)}
                          rows={2}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white resize-none"
                          placeholder="Add notes for this visit..."
                        />
                      </div>
                      
                      <div className="mt-2.5 p-2 bg-gray-50 rounded-md border border-gray-100">
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">Client:</span>{' '}
                          <span className="text-gray-900">
                            {item.clientName || item.clientCompanyName || `Client ID: ${item.clientId}`}
                          </span>
                        </div>
                        {(item.latitude && item.longitude) && (
                          <div className="mt-1 text-xs text-blue-600">
                            📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                          </div>
                        )}
                        {item.routeId && (
                          <div className="mt-1 text-xs text-purple-600 font-medium">
                            🛣️ Route ID: {item.routeId}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-shrink-0 flex-col-reverse gap-2 border-t bg-gradient-to-r from-gray-50 to-gray-100 pt-3 sm:mt-4 sm:flex-row sm:justify-end sm:gap-3 sm:pt-4 -mx-3 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50 sm:w-auto sm:py-2 sm:text-xs"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || journeyPlanItems.length === 0}
              className="w-full rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:shadow-none sm:w-auto sm:py-2 sm:text-xs"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Save className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  Create ({journeyPlanItems.length})
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJourneyPlanModal;
