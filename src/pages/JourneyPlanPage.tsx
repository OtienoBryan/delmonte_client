import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Users, Calendar, Eye, Globe } from 'lucide-react';
import CreateJourneyPlanModal from '../components/CreateJourneyPlanModal';
import PendingJourneyPlansModal from '../components/PendingJourneyPlansModal';
import SalesRepJourneyPlansModal from '../components/SalesRepJourneyPlansModal';
import { getWithAuth } from '../utils/fetchWithAuth';
import { useAuth } from '../contexts/AuthContext';

// Country flag image mapping
const getCountryFlag = (countryName: string): string | null => {
  const flagMap: { [key: string]: string } = {
    'Kenya': '/kenya_flag.jpeg',
    'Tanzania': '/tz_flag.jpeg',
  };
  
  // Try exact match first
  if (flagMap[countryName]) {
    return flagMap[countryName];
  }
  
  // Try case-insensitive match
  const lowerName = countryName.toLowerCase();
  for (const [key, flag] of Object.entries(flagMap)) {
    if (key.toLowerCase() === lowerName) {
      return flag;
    }
  }
  
  // Return null if no flag image found (will use emoji fallback)
  return null;
};

// Country flag emoji fallback for countries without images
const getCountryFlagEmoji = (countryName: string): string => {
  const flagMap: { [key: string]: string } = {
    'Kenya': '🇰🇪',
    'Tanzania': '🇹🇿',
    'Uganda': '🇺🇬',
    'Rwanda': '🇷🇼',
    'Burundi': '🇧🇮',
    'Ethiopia': '🇪🇹',
    'South Sudan': '🇸🇸',
    'Somalia': '🇸🇴',
    'Djibouti': '🇩🇯',
    'Eritrea': '🇪🇷',
    'Sudan': '🇸🇩',
    'Egypt': '🇪🇬',
    'Libya': '🇱🇾',
    'Tunisia': '🇹🇳',
    'Algeria': '🇩🇿',
    'Morocco': '🇲🇦',
    'Mauritania': '🇲🇷',
    'Mali': '🇲🇱',
    'Niger': '🇳🇪',
    'Chad': '🇹🇩',
    'Nigeria': '🇳🇬',
    'Ghana': '🇬🇭',
    'Senegal': '🇸🇳',
    'Ivory Coast': '🇨🇮',
    'Cameroon': '🇨🇲',
    'Gabon': '🇬🇦',
    'Congo': '🇨🇬',
    'DRC': '🇨🇩',
    'Angola': '🇦🇴',
    'Zambia': '🇿🇲',
    'Zimbabwe': '🇿🇼',
    'Botswana': '🇧🇼',
    'Namibia': '🇳🇦',
    'South Africa': '🇿🇦',
    'Mozambique': '🇲🇿',
    'Malawi': '🇲🇼',
    'Madagascar': '🇲🇬',
    'Mauritius': '🇲🇺',
    'Seychelles': '🇸🇨',
    'Comoros': '🇰🇲',
  };
  
  // Try exact match first
  if (flagMap[countryName]) {
    return flagMap[countryName];
  }
  
  // Try case-insensitive match
  const lowerName = countryName.toLowerCase();
  for (const [key, flag] of Object.entries(flagMap)) {
    if (key.toLowerCase() === lowerName) {
      return flag;
    }
  }
  
  // Default to globe emoji if not found
  return '🌍';
};

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
  route_name?: string;
}

const JourneyPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [journeyPlans, setJourneyPlans] = useState<JourneyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSalesRep, setSelectedSalesRep] = useState<SalesRep | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showSalesRepModal, setShowSalesRepModal] = useState(false);
  const [clickedSalesRep, setClickedSalesRep] = useState<SalesRep | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('Kenya');
  const [countries, setCountries] = useState<{id: number; name: string}[]>([]);

  const fetchCountries = async () => {
    try {
      const response = await getWithAuth('/api/countries');
      const data: any = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCountries(data.data);
      } else if (Array.isArray(data)) {
        setCountries(data);
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  const fetchSalesReps = useCallback(async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('status', '1');
      
      if (selectedCountry && selectedCountry !== '') {
        params.append('country', selectedCountry);
      }
      
      // If user is a leader, filter by leader_id
      if (user?.role === 'leader' && user?.id) {
        params.append('leader_id', user.id.toString());
      }
      
      const url = `/api/sales-reps?${params.toString()}`;
      const response = await getWithAuth(url);
      const data: any = await response.json();
      if (data.success) {
        setSalesReps(data.data);
      } else if (Array.isArray(data)) {
        setSalesReps(data);
      }
    } catch (error) {
      console.error('Failed to fetch sales reps:', error);
    }
  }, [selectedCountry, user?.role, user?.id]);

  const fetchJourneyPlans = useCallback(async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', '50');
      
      if (selectedCountry && selectedCountry !== '') {
        params.append('country', selectedCountry);
      }
      
      // If user is a leader, filter by team_leader_id
      if (user?.role === 'leader' && user?.id) {
        params.append('team_leader_id', user.id.toString());
      }
      
      const url = `/api/journey-plans?${params.toString()}`;
      const response = await getWithAuth(url);
      const data: any = await response.json();
      const rawPlans = Array.isArray(data) ? data : (data?.data ?? []);
      setJourneyPlans(Array.isArray(rawPlans) ? rawPlans : []);
    } catch (error) {
      console.error('Failed to fetch journey plans:', error);
    }
  }, [selectedCountry, user?.role, user?.id]);

  // Load countries in parallel with other data
  useEffect(() => {
    fetchCountries();
  }, []);

  // Parallel data fetching for better performance
  useEffect(() => {
    setIsLoading(true);
    // Fetch both in parallel instead of sequentially
    Promise.all([
      fetchSalesReps(),
      fetchJourneyPlans()
    ]).finally(() => {
      setIsLoading(false);
    });
  }, [selectedCountry, fetchSalesReps, fetchJourneyPlans]);

  const handleCreateJourneyPlan = (salesRep: SalesRep) => {
    setSelectedSalesRep(salesRep);
    setShowCreateModal(true);
  };

  // Memoize filtered journey plans to avoid recalculation
  const journeyPlansByRep = useMemo(() => {
    const map = new Map<number, JourneyPlan[]>();
    journeyPlans.forEach(plan => {
      const userId = Number(plan.userId);
      if (!map.has(userId)) {
        map.set(userId, []);
      }
      map.get(userId)!.push(plan);
    });
    return map;
  }, [journeyPlans]);

  const handleRouteCoverage = useCallback((salesRep: SalesRep) => {
    const repPlans = journeyPlansByRep.get(salesRep.id) || [];
    navigate(`/dashboard/route-coverage/${salesRep.id}`, { 
      state: { 
        salesRep, 
        journeyPlans: repPlans
      } 
    });
  }, [navigate, journeyPlansByRep]);


  const handleCreateSuccess = useCallback(() => {
    fetchJourneyPlans();
    setShowCreateModal(false);
    setSelectedSalesRep(null);
  }, [fetchJourneyPlans]);

  const handleStatusUpdate = (planId: number, newStatus: number) => {
    // Update the local state to reflect the status change
    setJourneyPlans(prevPlans => 
      prevPlans.map(plan => 
        plan.id === planId ? { ...plan, status: newStatus } : plan
      )
    );
  };

  const handleSalesRepClick = (salesRep: SalesRep) => {
    setClickedSalesRep(salesRep);
    setShowSalesRepModal(true);
  };

  // Calculate stats - must be before any conditional returns
  const stats = useMemo(() => {
    const total = journeyPlans.length;
    const pending = journeyPlans.filter(p => p.status === 0).length;
    const inProgress = journeyPlans.filter(p => p.status === 1).length;
    const completed = journeyPlans.filter(p => p.status === 2).length;
    return { total, pending, inProgress, completed };
  }, [journeyPlans]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-3 text-xs text-gray-600">Loading journey plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-4">
        {/* Modern Header */}
        <div className="mb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-gray-900">Journey Plans</h1>
                  <p className="text-[10px] text-gray-500">Manage sales representative route plans</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Country Filter Cards */}
        <div className="mb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-gray-600" />
              <h3 className="text-xs font-semibold text-gray-900">Filter by Country</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* All Countries Card */}
              <button
                onClick={() => setSelectedCountry('')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all shadow-sm ${
                  selectedCountry === ''
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-md'
                }`}
              >
                <span className="text-base">🌍</span>
                <span className="text-[10px] font-medium">All Countries</span>
              </button>
              
              {/* Country Cards */}
              {countries.map((country) => {
                const isSelected = selectedCountry === country.name;
                const flagImage = getCountryFlag(country.name);
                const flagEmoji = getCountryFlagEmoji(country.name);
    return (
          <button
                    key={country.id}
                    onClick={() => setSelectedCountry(country.name)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all shadow-sm ${
                      isSelected
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600 shadow-md'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-md'
                    }`}
                  >
                    {flagImage ? (
                      <img 
                        src={flagImage} 
                        alt={`${country.name} flag`}
                        className="w-5 h-4 object-cover rounded-sm"
                      />
                    ) : (
                      <span className="text-base">{flagEmoji}</span>
                    )}
                    <span className={`text-[10px] font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      {country.name}
                    </span>
          </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4 hidden">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-600">Sales Reps</p>
                <p className="text-sm font-bold text-gray-900">{salesReps.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5 text-yellow-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-600">Pending</p>
                <p className="text-sm font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-600">In Progress</p>
                <p className="text-sm font-bold text-gray-900">{stats.inProgress}</p>
              </div>
        </div>
      </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-3.5 w-3.5 text-green-600" />
             </div>
             <div>
                <p className="text-[10px] text-gray-600">Completed</p>
                <p className="text-sm font-bold text-gray-900">{stats.completed}</p>
              </div>
             </div>
           </div>
         </div>

      {/* Sales Representatives Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
          <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-white" />
                </div>
                <h2 className="text-xs font-semibold text-gray-900">Active Sales Representatives</h2>
                <span className="bg-blue-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                  {salesReps.length}
             </span>
           </div>
           <button
             onClick={() => setShowPendingModal(true)}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-600 text-white text-[10px] rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 transition-all shadow-sm"
           >
                <Eye className="h-3 w-3" />
                Pending Plans
           </button>
            </div>
         </div>

        {salesReps.length === 0 ? (
          <div className="text-center py-6 p-4">
            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No active sales representatives found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                                 {salesReps.map((rep) => (
                   <tr 
                     key={rep.id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all"
                     onClick={() => handleSalesRepClick(rep)}
                   >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-[10px] font-semibold text-gray-900 truncate max-w-[150px]" title={rep.name}>
                        {rep.name}
                      </div>
                     </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-[10px] text-gray-600 truncate max-w-[200px]" title={rep.email}>
                        {rep.email}
                      </div>
                     </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-[10px] text-gray-500 truncate max-w-[120px]" title={rep.phone || '-'}>
                         {rep.phone || '-'}
                       </div>
                     </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <div className="flex flex-row flex-wrap justify-center gap-1">
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleCreateJourneyPlan(rep);
                           }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-red-600 to-red-700 text-white text-[10px] rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all shadow-sm"
                         >
                          <Plus className="h-2.5 w-2.5" />
                          Create Plan
                         </button>
                                      <button
               onClick={(e) => {
                 e.stopPropagation();
                 handleRouteCoverage(rep);
               }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all shadow-sm"
                        >
                          <MapPin className="h-2.5 w-2.5" />
                          Coverage
             </button>
                       </div>
                     </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Journey Plans Section */}
        <div className="bg-white rounded-lg shadow-md p-6 hidden">
                 <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
             <Calendar className="h-6 w-6 text-green-600" />
             <h2 className="text-xl font-semibold text-gray-900">Recent Journey Plans</h2>
             <div className="flex gap-2">
               <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                 {journeyPlans.length} total
               </span>
               <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                 {journeyPlans.filter(plan => plan.status === 0).length} pending
               </span>
               <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                 {journeyPlans.filter(plan => plan.status === 1).length} in progress
               </span>
             </div>
           </div>
         </div>

        {journeyPlans.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No journey plans created yet.</p>
            <p className="text-sm text-gray-400">Create a route plan for a sales representative to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coordinates
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {journeyPlans.slice(0, 10).map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {plan.user_name || salesReps.find(rep => rep.id === plan.userId)?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(plan.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {plan.time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {plan.client_name || `Client ID: ${plan.clientId}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {(plan.latitude && plan.longitude) ? (
                        <div className="text-xs text-blue-600">
                          📍 {plan.latitude.toFixed(6)}, {plan.longitude.toFixed(6)}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No coordinates</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        {plan.route_name ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            🛣️ {plan.route_name}
                          </span>
                        ) : plan.routeId ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ID: {plan.routeId}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No route</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        plan.status === 0 ? 'bg-gray-100 text-gray-800' :
                        plan.status === 1 ? 'bg-yellow-100 text-yellow-800' :
                        plan.status === 2 ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {plan.status === 0 ? 'Pending' :
                         plan.status === 1 ? 'In Progress' :
                         plan.status === 2 ? 'Completed' : 'Cancelled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {plan.checkInTime ? 
                        new Date(plan.checkInTime).toLocaleTimeString() : 
                        '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {plan.checkoutTime ? 
                        new Date(plan.checkoutTime).toLocaleTimeString() : 
                        '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={plan.notes || 'No notes'}>
                        {plan.notes || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

             {/* Create Journey Plan Modal */}
       {showCreateModal && selectedSalesRep && (
         <CreateJourneyPlanModal
           isOpen={showCreateModal}
           onClose={() => {
             setShowCreateModal(false);
             setSelectedSalesRep(null);
           }}
           salesRep={selectedSalesRep}
           onSuccess={handleCreateSuccess}
         />
       )}

               {/* Pending Journey Plans Modal */}
        <PendingJourneyPlansModal
          isOpen={showPendingModal}
          onClose={() => setShowPendingModal(false)}
          journeyPlans={journeyPlans}
          onStatusUpdate={handleStatusUpdate}
        />

        {/* Sales Rep Journey Plans Modal */}
        {showSalesRepModal && clickedSalesRep && (
          <SalesRepJourneyPlansModal
            isOpen={showSalesRepModal}
            onClose={() => {
              setShowSalesRepModal(false);
              setClickedSalesRep(null);
            }}
            salesRep={clickedSalesRep}
            journeyPlans={journeyPlans}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </div>
      </div>
    );
  };

export default JourneyPlanPage;
