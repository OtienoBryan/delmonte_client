import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Calendar, MapPin, User, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getWithAuth } from '../utils/fetchWithAuth';

interface SalesRep {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: number;
  route_id_update?: number;
  route_name?: string;
}

interface JourneyPlan {
  id: number;
  date: string;
  time: string;
  userId: number;
  clientId: number;
  status: number;
  checkInTime?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  notes?: string;
  checkoutLatitude?: number;
  checkoutLongitude?: number;
  checkoutTime?: string;
  showUpdateLocation: boolean;
  routeId?: number;
  user_name?: string;
  client_name?: string;
  client_company_name?: string;
  route_name?: string;
}

interface DailyPerformance {
  date: string;
  totalPlans: number;
  completedPlans: number;
  completionRate: number;
  allPlans: JourneyPlan[];
  achievedPlans: JourneyPlan[];
}



const RouteCoveragePage: React.FC = () => {
  const { salesRepId } = useParams<{ salesRepId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [journeyPlans, setJourneyPlans] = useState<JourneyPlan[]>([]);
  const [dailyPerformance, setDailyPerformance] = useState<DailyPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapClients, setMapClients] = useState<JourneyPlan[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filteredDailyPerformance, setFilteredDailyPerformance] = useState<DailyPerformance[]>([]);

  // Function to get current month date range
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  };
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    console.log('[RouteCoverage] Mount/useEffect', { salesRepId, hasState: !!location.state, tokenPresent: !!localStorage.getItem('token') });
    
    // Always fetch fresh data from API to ensure we get ALL records
    // Use location.state only for salesRep info if available, but always fetch journey plans
    if (location.state) {
      const state: any = location.state as any;
      const rep = state?.salesRep || null;
      if (rep) {
        setSalesRep(rep);
      }
    }
    
    // Always fetch all journey plans from API (not limited)
    fetchSalesRepData();
  }, [salesRepId]);

  // Initialize filtered data when dailyPerformance changes
  useEffect(() => {
    setFilteredDailyPerformance(dailyPerformance);
    
    // Set current month as default filter
    if (dailyPerformance.length > 0 && !startDate && !endDate) {
      const currentMonth = getCurrentMonthRange();
      setStartDate(currentMonth.start);
      setEndDate(currentMonth.end);
    }
  }, [dailyPerformance, startDate, endDate]);

  // Auto-apply filter when date range changes
  useEffect(() => {
    if (startDate && endDate && dailyPerformance.length > 0) {
      // Apply filter directly here to avoid infinite loops
      const filtered = dailyPerformance.filter(day => {
        const dayDate = new Date(day.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Set time to start/end of day for accurate comparison
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        return dayDate >= start && dayDate <= end;
      });

      setFilteredDailyPerformance(filtered);
    }
  }, [startDate, endDate, dailyPerformance]);

  const fetchSalesRepData = async () => {
    try {
      // Fetch sales rep data
      console.log('[RouteCoverage] Fetching sales rep:', salesRepId);
      const repResponse = await getWithAuth(`/api/sales-reps/${salesRepId}`);
      console.log('[RouteCoverage] Sales rep response status:', repResponse.status);
      const repData = await repResponse.json();
      console.log('[RouteCoverage] Sales rep data:', repData);
      if (repData.success) {
        setSalesRep(repData.data);
      }

      // Fetch journey plans for this sales rep
      console.log('[RouteCoverage] Fetching journey plans by user...');
      const plansResponse = await getWithAuth(`/api/journey-plans/user/${salesRepId}`);
      console.log('[RouteCoverage] Journey plans response status:', plansResponse.status);
      const plansData = await plansResponse.json();
      console.log('[RouteCoverage] Journey plans raw payload:', plansData);
      const rawPlans = Array.isArray(plansData) ? plansData : (plansData?.data ?? []);
      console.log('[RouteCoverage] Journey plans parsed length:', Array.isArray(rawPlans) ? rawPlans.length : 'not-array');
      if (Array.isArray(rawPlans)) {
        // Already filtered by backend, but keep a defensive filter cast
        const repPlans = rawPlans.filter((plan: JourneyPlan) => Number(plan.userId) === Number(salesRepId));
        console.log('[RouteCoverage] Plans length (server):', rawPlans.length, 'After defensive filter:', repPlans.length);
        setJourneyPlans(repPlans.length ? repPlans : rawPlans);
        processDailyPerformance(repPlans.length ? repPlans : rawPlans);
      } else {
        console.warn('[RouteCoverage] rawPlans was not an array; setting empty journeyPlans');
        setJourneyPlans([]);
        processDailyPerformance([]);
      }
    } catch (error) {
      console.error('[RouteCoverage] Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processDailyPerformance = (plans: JourneyPlan[] | undefined | null) => {
    if (!Array.isArray(plans) || plans.length === 0) {
      console.warn('[RouteCoverage] processDailyPerformance called with no plans or empty array');
      setDailyPerformance([]);
      setSelectedDate('');
      return;
    }
    console.log('[RouteCoverage] Processing plans count:', plans.length);
    const dailyMap = new Map<string, DailyPerformance>();

    plans.forEach(plan => {
      // Normalize the date to ensure consistent grouping
      let date = plan.date;
      
      // Handle different date formats
      if (date.includes('T')) {
        date = date.split('T')[0]; // Get just the date part from ISO string
      } else if (date.includes(' ')) {
        date = date.split(' ')[0]; // Get just the date part from datetime string
      }
      
      // Ensure date is in YYYY-MM-DD format
      const dateObj = new Date(date);
      const normalizedDate = dateObj.toISOString().split('T')[0];
      
      if (!dailyMap.has(normalizedDate)) {
        dailyMap.set(normalizedDate, {
          date: normalizedDate,
          totalPlans: 0,
          completedPlans: 0,
          completionRate: 0,
          allPlans: [],
          achievedPlans: []
        });
      }

      const daily = dailyMap.get(normalizedDate)!;
      daily.totalPlans++;
      daily.allPlans.push(plan);
      
      if (plan.status === 2 || plan.status === 3) { // Completed status (2=completed, 3=completed legacy)
        daily.completedPlans++;
        daily.achievedPlans.push(plan);
      }
    });

    // Calculate completion rates and sort by date
    const dailyArray = Array.from(dailyMap.values()).map(daily => ({
      ...daily,
      completionRate: daily.totalPlans > 0 ? (daily.completedPlans / daily.totalPlans) * 100 : 0
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Debug: Log the unique dates found
    console.log('[RouteCoverage] Unique dates found:', dailyArray.map(d => d.date));
    console.log('[RouteCoverage] Total unique dates:', dailyArray.length);
    console.log('[RouteCoverage] Original plans count:', plans.length);
    
    // Ensure no duplicate dates (extra safety check)
    const uniqueDates = new Set();
    const finalDailyArray = dailyArray.filter(daily => {
      if (uniqueDates.has(daily.date)) {
        console.log('Duplicate date found:', daily.date);
        return false;
      }
      uniqueDates.add(daily.date);
      return true;
    });
    
    console.log('[RouteCoverage] Final unique dates after filtering:', finalDailyArray.map(d => d.date));
    console.log('[RouteCoverage] Final count after filtering:', finalDailyArray.length);

    setDailyPerformance(finalDailyArray);
    
    // Set selected date to most recent
    if (finalDailyArray.length > 0) {
      setSelectedDate(finalDailyArray[0].date);
      console.log('[RouteCoverage] Selected date set to:', finalDailyArray[0].date);
    }
  };



  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    // Add ordinal suffix to day
    const getOrdinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };

  const getStatusBadge = (status: number) => {
    const statusConfig = {
      0: { label: 'Pending', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
      1: { label: 'In Progress', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
      2: { label: 'Completed', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      3: { label: 'Completed', bgColor: 'bg-green-100', textColor: 'text-green-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[0];
    
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  const getOverallStats = () => {
    // Use filtered data if available, otherwise use all data
    const dataToUse = filteredDailyPerformance.length > 0 ? filteredDailyPerformance : dailyPerformance;
    
    const totalPlans = dataToUse.reduce((sum, day) => sum + day.allPlans.length, 0);
    const completedPlans = dataToUse.reduce((sum, day) => sum + day.achievedPlans.length, 0);
    const completionRate = totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0;
    
    return { totalPlans, completedPlans, completionRate };
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openMapModal = (clients: JourneyPlan[]) => {
    setMapClients(clients.filter(client => client.latitude && client.longitude && (client.status === 2 || client.status === 3)));
    setIsMapModalOpen(true);
  };

  const closeMapModal = () => {
    setIsMapModalOpen(false);
    setMapClients([]);
  };

  const filterByDateRange = () => {
    if (!startDate || !endDate) {
      setFilteredDailyPerformance(dailyPerformance);
      return;
    }

    const filtered = dailyPerformance.filter(day => {
      const dayDate = new Date(day.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Set time to start/end of day for accurate comparison
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      return dayDate >= start && dayDate <= end;
    });

    setFilteredDailyPerformance(filtered);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilteredDailyPerformance(dailyPerformance);
  };

  // Initialize map when modal opens
  useEffect(() => {
    if (isMapModalOpen && mapRef.current && mapClients.length > 0) {
      // Initialize map
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true
      }).setView([0, 0], 2);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add zoom control with custom position
      L.control.zoom({
        position: 'topright'
      }).addTo(map);

      // Add scale bar
      L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: true,
        maxWidth: 200
      }).addTo(map);

      // Add markers for each client
      const bounds = L.latLngBounds([]);
      mapClients.forEach((client, index) => {
        if (client.latitude && client.longitude) {
          const marker = L.marker([client.latitude, client.longitude])
            .addTo(map)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold text-sm">${client.client_name || client.client_company_name || `Client ID: ${client.clientId}`}</h3>
                <p class="text-xs text-gray-600">${client.route_name || 'No route'}</p>
                <p class="text-xs text-blue-600">${client.latitude.toFixed(6)}, ${client.longitude.toFixed(6)}</p>
                <div class="mt-2 space-y-1">
                  <p class="text-xs text-gray-600">
                    <span class="font-medium">Check-in:</span> 
                    ${client.checkInTime ? new Date(client.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Not checked in'}
                  </p>
                  <p class="text-xs text-gray-600">
                    <span class="font-medium">Check-out:</span> 
                    ${client.checkoutTime ? new Date(client.checkoutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Not checked out'}
                  </p>
                  ${client.checkInTime && client.checkoutTime ? `
                    <p class="text-xs text-purple-600">
                      <span class="font-medium">Time Spent:</span> 
                      ${calculateTimeSpent(client.checkInTime, client.checkoutTime)}
                    </p>
                  ` : ''}
                </div>
                ${client.status === 3 ? '<span class="text-xs text-green-600">✓ Completed</span>' : ''}
              </div>
            `);
          
          bounds.extend([client.latitude, client.longitude]);
        }
      });

      // Fit map to show all markers
      if (bounds.getNorthEast().lat !== bounds.getSouthWest().lat || bounds.getNorthEast().lng !== bounds.getSouthWest().lng) {
        map.fitBounds(bounds, { padding: [20, 20] });
        
        // Set minimum zoom level to prevent over-zooming
        map.setMinZoom(3);
        map.setMaxZoom(18);
      } else if (mapClients.length === 1) {
        // If only one client, center on it with appropriate zoom
        const client = mapClients[0];
        if (client.latitude && client.longitude) {
          map.setView([client.latitude, client.longitude], 15);
        }
      }

      // Cleanup function
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, [isMapModalOpen, mapClients]);

  const calculateTimeSpent = (checkInTime: string, checkoutTime: string): string => {
    try {
      const checkIn = new Date(checkInTime);
      const checkOut = new Date(checkoutTime);
      const diffMs = checkOut.getTime() - checkIn.getTime();
      
      if (diffMs < 0) return 'Invalid time range';
      
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      return 'Error calculating time';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading route coverage data...</p>
        </div>
      </div>
    );
  }

  if (!salesRep) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Sales representative not found.</p>
        </div>
      </div>
    );
  }

  const overallStats = getOverallStats();
  const selectedDayPerformance = dailyPerformance.find(day => day.date === selectedDate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
                             <button
                 onClick={() => navigate('/dashboard/journey-plans')}
                 className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
               >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Route Coverage</h1>
                  <p className="text-xs text-gray-600">{salesRep.name} • {salesRep.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              <span>{salesRep.route_name || 'No route assigned'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Overall Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Total Plans</p>
                <p className="text-lg font-bold text-gray-900">{overallStats.totalPlans}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Completed</p>
                <p className="text-lg font-bold text-gray-900">{overallStats.completedPlans}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-lg font-bold text-gray-900">
                  {overallStats.totalPlans - overallStats.completedPlans}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Completion Rate</p>
                <p className="text-lg font-bold text-gray-900">{overallStats.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

                                   {/* Daily Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                                <div className="p-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Daily Performance & Achievements</h2>
                <p className="text-xs text-gray-600">Click on dates to view achieved journey plans and overall performance</p>
                
                {/* Date Range Filter */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-gray-700">From:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-gray-700">To:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={filterByDateRange}
                    disabled={!startDate || !endDate}
                    className="px-2.5 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Filter
                  </button>
                  <button
                    onClick={() => {
                      const currentMonth = getCurrentMonthRange();
                      setStartDate(currentMonth.start);
                      setEndDate(currentMonth.end);
                    }}
                    className="px-2.5 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
                  >
                    Current Month
                  </button>
                  {(startDate || endDate) && (
                    <button
                      onClick={clearDateFilter}
                      className="px-2.5 py-1 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>

                     {filteredDailyPerformance.length === 0 ? (
             <div className="p-6 text-center">
               <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-3" />
               <p className="text-xs text-gray-500">
                 {startDate && endDate 
                   ? `No journey plans found for the selected date range (${startDate} to ${endDate})`
                   : 'No journey plans found for this sales representative.'
                 }
               </p>
             </div>
           ) : (
            <div className="p-3">
                                            {/* Date Table */}
                               <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-700">Click on a date to view details</label>
                    {startDate && endDate && (
                      <span className="text-xs text-gray-600">
                        Showing {filteredDailyPerformance.length} of {dailyPerformance.length} dates
                      </span>
                    )}
                  </div>
                 <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                           Date
                         </th>
                         <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                           Day
                         </th>
                         <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                           Total Plans
                         </th>
                         <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                           Achieved
                         </th>
                         <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                           Completion Rate
                         </th>
                         <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                           Actions
                         </th>
                       </tr>
                     </thead>
                                           <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDailyPerformance.map((day, index) => (
                         <tr 
                           key={day.date}
                           className={`hover:bg-gray-50 cursor-pointer ${
                             selectedDate === day.date ? 'bg-blue-50' : ''
                           }`}
                           onClick={() => handleDateSelect(day.date)}
                         >
                           <td className="px-3 py-2 whitespace-nowrap">
                             <div className="text-xs font-semibold text-gray-900">
                               {getFormattedDate(day.date)}
                             </div>
                           </td>
                           <td className="px-3 py-2 whitespace-nowrap">
                             <div className="text-xs text-gray-600">
                               {new Date(day.date).toLocaleDateString('en-US', { 
                                 weekday: 'long' 
                               })}
                             </div>
                           </td>
                           <td className="px-3 py-2 whitespace-nowrap text-center">
                             <div className="text-xs font-medium text-blue-600">
                               {day.totalPlans}
                             </div>
                           </td>
                           <td className="px-3 py-2 whitespace-nowrap text-center">
                             <div className="text-xs font-medium text-green-600">
                               {day.completedPlans}
                             </div>
                           </td>
                           <td className="px-3 py-2 whitespace-nowrap text-center">
                             <div className="text-xs font-medium text-purple-600">
                               {day.completionRate.toFixed(1)}%
                             </div>
                           </td>
                           <td className="px-3 py-2 whitespace-nowrap text-center">
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleDateSelect(day.date);
                               }}
                               className={`inline-flex items-center px-2 py-1 border border-transparent text-xs leading-3 font-medium rounded-md text-white ${
                                 selectedDate === day.date
                                   ? 'bg-blue-600 hover:bg-blue-700'
                                   : 'bg-gray-600 hover:bg-gray-700'
                               } focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 transition-colors`}
                             >
                               {selectedDate === day.date ? 'Selected' : 'Select'}
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>

              
            </div>
          )}
                 </div>
       </div>

               {/* Journey Plans Modal */}
        {isModalOpen && selectedDayPerformance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white w-full h-full flex flex-col overflow-hidden">
             {/* Modal Header */}
             <div className="flex items-center justify-between p-3 border-b border-gray-200">
               <div>
                 <h2 className="text-sm font-semibold text-gray-900">
                   {new Date(selectedDayPerformance.date).toLocaleDateString('en-US', { 
                     weekday: 'long', 
                     year: 'numeric', 
                     month: 'long', 
                     day: 'numeric' 
                   })}
                 </h2>
                 <p className="text-xs text-gray-600 mt-0.5">
                   Journey Plans Overview
                 </p>
               </div>
               <button
                 onClick={closeModal}
                 className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
               >
                 <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             {/* Modal Content */}
             <div className="flex-1 overflow-y-auto p-3">
               {/* Selected Day Performance Summary */}
               <div className="mb-3">
                 <div className="bg-gray-50 rounded-lg p-3">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     <div className="text-center">
                       <p className="text-lg font-bold text-blue-600">{selectedDayPerformance.totalPlans}</p>
                       <p className="text-xs text-gray-600">Total Plans</p>
                     </div>
                     <div className="text-center">
                       <p className="text-lg font-bold text-green-600">{selectedDayPerformance.completedPlans}</p>
                       <p className="text-xs text-gray-600">Completed</p>
                     </div>
                     <div className="text-center">
                       <p className="text-lg font-bold text-purple-600">{selectedDayPerformance.completionRate.toFixed(1)}%</p>
                       <p className="text-xs text-gray-600">Completion Rate</p>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Achieved Plans Section */}
               {selectedDayPerformance.achievedPlans.length > 0 && (
                 <div className="mb-6 hidden">
                   <h3 className="text-lg font-medium text-green-900 mb-4 flex items-center gap-2">
                     <CheckCircle className="h-5 w-5 text-green-600" />
                     Achieved Journey Plans ({selectedDayPerformance.achievedPlans.length})
                   </h3>
                   <div className="space-y-3">
                     {selectedDayPerformance.achievedPlans.map((plan: JourneyPlan) => (
                       <div
                         key={plan.id}
                         className="bg-green-50 rounded-lg p-4 border border-green-200"
                       >
                         <div className="flex items-start justify-between">
                           <div className="flex-1">
                             <div className="flex items-center gap-4 mb-2">
                               <div className="flex items-center gap-2">
                                 <span className="font-medium text-green-900">
                                   {plan.client_name || plan.client_company_name || `Client ID: ${plan.clientId}`}
                                 </span>
                                 <button
                                   onClick={() => navigate(`/dashboard/route-report/${salesRep?.id}`, {
                                     state: { salesRep, clientId: plan.clientId, selectedDate: selectedDate }
                                   })}
                                   className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                                 >
                                   View Reports
                                 </button>
                                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                   ✓ Achieved
                                 </span>
                               </div>
                               <div className="flex items-center gap-2">
                                 <MapPin className="h-4 w-4 text-green-600" />
                                 <span className="text-sm text-green-700">
                                   {plan.route_name || 'No route'}
                                 </span>
                               </div>
                             </div>
                                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                                <div>
                                  <span className="font-medium">Scheduled Time:</span> {plan.time}
                                </div>
                                <div>
                                  <span className="font-medium">Status:</span> {getStatusBadge(plan.status)}
                                </div>
                              </div>
                              
                              {/* Check-in/Check-out Times */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700 mt-3">
                                <div>
                                  <span className="font-medium">Check-in:</span>
                                  {plan.checkInTime ? (
                                    <span className="text-green-600 ml-1">
                                      {new Date(plan.checkInTime).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </span>
                                  ) : (
                                    <span className="text-green-400 ml-1">Not checked in</span>
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium">Check-out:</span>
                                  {plan.checkoutTime ? (
                                    <span className="text-green-600 ml-1">
                                      {new Date(plan.checkoutTime).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </span>
                                  ) : (
                                    <span className="text-green-400 ml-1">Not checked out</span>
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium">Time Spent:</span>
                                  {plan.checkInTime && plan.checkoutTime ? (
                                    <span className="text-green-600 ml-1">
                                      {calculateTimeSpent(plan.checkInTime, plan.checkoutTime)}
                                    </span>
                                  ) : (
                                    <span className="text-green-400 ml-1">N/A</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 text-sm text-green-700 mt-3">
                                <div>
                                  <span className="font-medium">Coordinates:</span>
                                  {plan.latitude && plan.longitude ? (
                                    <span className="text-green-600 ml-1">
                                      {plan.latitude.toFixed(4)}, {plan.longitude.toFixed(4)}
                                    </span>
                                  ) : (
                                    <span className="text-green-400 ml-1">Not available</span>
                                  )}
                                </div>
                              </div>
                             {plan.notes && (
                               <div className="mt-2 text-sm text-green-700">
                                 <span className="font-medium">Notes:</span> {plan.notes}
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

                               {/* All Journey Plans Section */}
                {selectedDayPerformance.allPlans.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        All Journey Plans ({selectedDayPerformance.allPlans.length})
                      </h3>
                      {selectedDayPerformance.allPlans.some(plan => plan.latitude && plan.longitude && (plan.status === 2 || plan.status === 3)) && (
                        <button
                          onClick={() => openMapModal(selectedDayPerformance.allPlans)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          View on Map
                        </button>
                      )}
                    </div>
                    
                                         {/* Journey Plans Table */}
                     <div className="overflow-x-auto max-h-96 overflow-y-auto">
                       <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50 sticky top-0 z-10">
                           <tr>
                             <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                               Client
                             </th>
                             <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                               Scheduled
                             </th>
                             <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                               Status
                             </th>
                             <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                               Check-in
                             </th>
                             <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                               Check-out
                             </th>
                             <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                               Time Spent
                             </th>
                             <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                               Coordinates
                             </th>
                             <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                               Actions
                             </th>
                           </tr>
                         </thead>
                                                   <tbody className="bg-white divide-y divide-gray-200">
                            {selectedDayPerformance.allPlans
                              .sort((a, b) => {
                                // Sort by check-in time if available, otherwise by ID
                                if (a.checkInTime && b.checkInTime) {
                                  return new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
                                } else if (a.checkInTime && !b.checkInTime) {
                                  return -1; // Plans with check-in time come first
                                } else if (!a.checkInTime && b.checkInTime) {
                                  return 1; // Plans without check-in time come last
                                } else {
                                  return a.id - b.id; // Fallback to ID sorting
                                }
                              })
                              .map((plan: JourneyPlan) => (
                             <tr 
                               key={plan.id}
                               className={`${
                                 plan.status === 3 
                                   ? 'bg-green-50' 
                                   : 'hover:bg-gray-50'
                               }`}
                             >
                               {/* Client Name */}
                               <td className="px-2 py-2 whitespace-nowrap">
                                 <div className="flex items-center gap-1.5">
                                   <span className="text-xs font-medium text-gray-900">
                                     {plan.client_name || plan.client_company_name || `Client ID: ${plan.clientId}`}
                                   </span>
                                   {plan.status === 3 && (
                                     <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                                       ✓
                                     </span>
                                   )}
                                 </div>
                               </td>
                               
                               {/* Scheduled Time */}
                               <td className="px-2 py-2 whitespace-nowrap text-center">
                                 <span className="text-xs text-gray-900">{plan.time}</span>
                               </td>
                               
                               {/* Status */}
                               <td className="px-2 py-2 whitespace-nowrap text-center">
                                 {getStatusBadge(plan.status)}
                               </td>
                               
                               {/* Check-in Time */}
                               <td className="px-2 py-2 whitespace-nowrap text-center">
                                 {plan.checkInTime ? (
                                   <span className="text-xs text-blue-600">
                                     {new Date(plan.checkInTime).toLocaleTimeString('en-US', {
                                       hour: '2-digit',
                                       minute: '2-digit',
                                       hour12: true
                                     })}
                                   </span>
                                 ) : (
                                   <span className="text-xs text-gray-400">Not checked in</span>
                                 )}
                               </td>
                               
                               {/* Check-out Time */}
                               <td className="px-2 py-2 whitespace-nowrap text-center">
                                 {plan.checkoutTime ? (
                                   <span className="text-xs text-blue-600">
                                     {new Date(plan.checkoutTime).toLocaleTimeString('en-US', {
                                       hour: '2-digit',
                                       minute: '2-digit',
                                       hour12: true
                                     })}
                                   </span>
                                 ) : (
                                   <span className="text-xs text-gray-400">Not checked out</span>
                                 )}
                               </td>
                               
                               {/* Time Spent */}
                               <td className="px-2 py-2 whitespace-nowrap text-center">
                                 {plan.checkInTime && plan.checkoutTime ? (
                                   <span className="text-xs text-blue-600 font-medium">
                                     {calculateTimeSpent(plan.checkInTime, plan.checkoutTime)}
                                   </span>
                                 ) : (
                                   <span className="text-xs text-gray-400">N/A</span>
                                 )}
                               </td>
                               
                               {/* Coordinates */}
                               <td className="px-2 py-2 whitespace-nowrap text-center">
                                {plan.latitude && plan.longitude && (plan.status === 2 || plan.status === 3) ? (
                                   <button
                                     onClick={() => openMapModal([plan])}
                                     className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                   >
                                     {plan.latitude.toFixed(4)}, {plan.longitude.toFixed(4)}
                                   </button>
                                 ) : plan.latitude && plan.longitude ? (
                                   <span className="text-xs text-gray-500">
                                     {plan.latitude.toFixed(4)}, {plan.longitude.toFixed(4)}
                                   </span>
                                 ) : (
                                   <span className="text-xs text-gray-400">Not available</span>
                                 )}
                               </td>
                               
                               {/* Actions */}
                               <td className="px-2 py-2 whitespace-nowrap text-center">
                                 {plan.status !== 0 && (
                                   <button
                                     onClick={() => navigate(`/dashboard/route-report/${salesRep?.id}`, {
                                       state: { salesRep, clientId: plan.clientId, selectedDate: selectedDate }
                                     })}
                                     className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                   >
                                     View Reports
                                   </button>
                                 )}
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                    
                    {/* Notes Section */}
                    {selectedDayPerformance.allPlans.some(plan => plan.notes) && (
                      <div className="mt-3">
                        <h4 className="text-xs font-medium text-gray-900 mb-2">Notes</h4>
                        <div className="space-y-1.5">
                          {selectedDayPerformance.allPlans
                            .filter(plan => plan.notes)
                            .map((plan: JourneyPlan) => (
                              <div key={plan.id} className="bg-gray-50 rounded p-2">
                                <span className="text-xs font-medium text-gray-700">
                                  {plan.client_name || plan.client_company_name || `Client ID: ${plan.clientId}`}:
                                </span>
                                <span className="text-xs text-gray-600 ml-2">{plan.notes}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
             </div>
           </div>
         </div>
               )}

        {/* Map Modal */}
        {isMapModalOpen && mapClients.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white w-full h-full flex flex-col overflow-hidden">
              {/* Map Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Client Locations Map
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {mapClients.length} client{mapClients.length > 1 ? 's' : ''} with coordinates
                  </p>
                </div>
                <button
                  onClick={closeMapModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Map Content */}
              <div className="flex-1 p-6">
                <div className="w-full h-full rounded-lg border border-gray-200 overflow-hidden">
                  {/* Interactive Map */}
                  <div ref={mapRef} className="w-full h-full" style={{ minHeight: '500px' }}></div>
                </div>
                
                {/* Client List Below Map */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Client Locations ({mapClients.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {mapClients.map((client, index) => (
                        <div key={client.id} className="bg-gray-50 rounded p-3 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 text-sm">
                                {client.client_name || client.client_company_name || `Client ID: ${client.clientId}`}
                              </h5>
                              <p className="text-xs text-gray-600">
                                {client.route_name || 'No route'}
                              </p>
                              <p className="text-xs text-blue-600">
                                {client.latitude?.toFixed(6)}, {client.longitude?.toFixed(6)}
                              </p>
                              {/* Check-in/Check-out Times */}
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Check-in:</span>
                                  {client.checkInTime ? (
                                    <span className="text-xs text-green-600 ml-1">
                                      {new Date(client.checkInTime).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400 ml-1">Not checked in</span>
                                  )}
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Check-out:</span>
                                  {client.checkoutTime ? (
                                    <span className="text-xs text-green-600 ml-1">
                                      {new Date(client.checkoutTime).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400 ml-1">Not checked out</span>
                                  )}
                                </div>
                              </div>
                              {/* Time Spent */}
                              {client.checkInTime && client.checkoutTime && (
                                <div className="mt-1">
                                  <span className="text-xs font-medium text-gray-600">Time Spent:</span>
                                  <span className="text-xs text-purple-600 ml-1">
                                    {calculateTimeSpent(client.checkInTime, client.checkoutTime)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">#{index + 1}</span>
                              {client.status === 3 && (
                                <span className="text-xs text-green-600">✓ Completed</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

export default RouteCoveragePage;
