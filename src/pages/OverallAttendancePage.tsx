import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DateTime } from 'luxon';
import { salesService, Country, SalesRep } from '../services/salesService';
import { Calendar, Users, MapPin, TrendingUp, Filter, Download, BarChart3, Activity, Navigation, FileText, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure axios for authentication
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface LoginHistory {
  id: number;
  userId: number;
  sessionStart: string;
  sessionEnd?: string;
}

interface JourneyPlan {
  id: number;
  userId: number;
  clientId: number;
  date: string; // yyyy-mm-dd
  checkInTime?: string;
  checkoutTime?: string;
  time?: string;
  status?: number;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

interface Client {
  id: number;
  name: string;
  checkinTime?: string;
  checkoutTime?: string;
}

interface AttendanceRow {
  date: string;
  clientsVisited: number;
  activeSalesReps: number;
}

interface DashboardStats {
  totalActiveDays: number;
  totalClientsVisited: number;
  totalActiveSalesReps: number;
  averageAttendanceRate: number;
}

const OverallAttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Default to current month (first day to last day)
  const defaultStart = DateTime.now().startOf('month').toISODate();
  const defaultEnd = DateTime.now().endOf('month').toISODate();
  
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [journeyPlans, setJourneyPlans] = useState<JourneyPlan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [totalClients, setTotalClients] = useState<number>(0);
  const [clientsLoading, setClientsLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [pendingCountry, setPendingCountry] = useState('');
  const [defaultCountrySet, setDefaultCountrySet] = useState<boolean>(false);
  const [pendingStartDate, setPendingStartDate] = useState(defaultStart);
  const [pendingEndDate, setPendingEndDate] = useState(defaultEnd);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [salesRepsModalOpen, setSalesRepsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeSalesRepsForDate, setActiveSalesRepsForDate] = useState<(SalesRep & { sessionStart: string; sessionEnd?: string; clientsVisited: number })[]>([]);
  const [modalCountryFilter, setModalCountryFilter] = useState<string>('');
  const [clientsModalOpen, setClientsModalOpen] = useState(false);
  const [clientsForDate, setClientsForDate] = useState<Client[]>([]);
  const [selectedDateForClients, setSelectedDateForClients] = useState<string>('');
  const [clientsModalSalesRepFilter, setClientsModalSalesRepFilter] = useState<string>('');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<{
    client: Client;
    journeyPlan: JourneyPlan;
    salesRep: SalesRep | null;
  } | null>(null);

  // Data fetching
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);
    setError(null); // Reset error state
    
    console.log('OverallAttendancePage: Starting data fetch...');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    // Build sales reps URL with leader_id filter if user is a leader
    const salesRepsParams = new URLSearchParams();
    salesRepsParams.append('status', '1');
    if (user?.role === 'leader' && user?.id) {
      salesRepsParams.append('leader_id', user.id.toString());
    }
    
    // Build journey plans URL with team_leader_id filter if user is a leader
    const journeyPlansParams = new URLSearchParams(params);
    if (user?.role === 'leader' && user?.id) {
      journeyPlansParams.append('team_leader_id', user.id.toString());
    }
    
    Promise.all([
      axios.get(`${API_BASE_URL}/login-history?${params.toString()}`, { headers: getAuthHeaders(), signal }),
      axios.get(`${API_BASE_URL}/journey-plans?${journeyPlansParams.toString()}`, { headers: getAuthHeaders(), signal }),
      axios.get(`${API_BASE_URL}/clients?limit=1`, { headers: getAuthHeaders(), signal }),
      salesService.getCountries(),
      axios.get(`${API_BASE_URL}/sales-reps?${salesRepsParams.toString()}`, { headers: getAuthHeaders(), signal }),
    ])
      .then(([loginRes, journeyRes, clientsRes, countriesRes, salesRepsRes]) => {
                 console.log('OverallAttendancePage: Data fetch successful');
         console.log('Login history count:', loginRes.data?.length || 0);
         console.log('Journey plans count:', journeyRes.data?.length || 0);
        console.log('Clients meta:', clientsRes.data);
         console.log('Countries count:', countriesRes?.length || 0);
         // Handle sales reps response format
         const salesRepsData = salesRepsRes.data?.success && Array.isArray(salesRepsRes.data.data)
           ? salesRepsRes.data.data
           : (Array.isArray(salesRepsRes.data) ? salesRepsRes.data : []);
         console.log('Sales reps count:', salesRepsData?.length || 0);
         
         // Debug: Check sample data structures
         if (loginRes.data?.length > 0) {
           console.log('Sample login history:', loginRes.data[0]);
         }
         if (journeyRes.data?.length > 0) {
           console.log('Sample journey plan:', journeyRes.data[0]);
         }
         if (salesRepsData?.length > 0) {
           console.log('Sample sales rep:', salesRepsData[0]);
         }
        
        console.log('Setting state with data:');
        console.log('loginRes.data type:', typeof loginRes.data, 'isArray:', Array.isArray(loginRes.data));
        console.log('journeyRes.data type:', typeof journeyRes.data, 'isArray:', Array.isArray(journeyRes.data));
        console.log('clientsRes.data type:', typeof clientsRes.data, 'isArray:', Array.isArray(clientsRes.data));
        console.log('salesRepsRes type:', typeof salesRepsData, 'isArray:', Array.isArray(salesRepsData));
        
        setLoginHistory(Array.isArray(loginRes.data) ? loginRes.data : []);
        setJourneyPlans(Array.isArray(journeyRes.data) ? journeyRes.data : []);
        // Only set total clients; defer full list until modal open
        const total = typeof clientsRes.data?.total === 'number'
          ? clientsRes.data.total
          : (Array.isArray(clientsRes.data?.data) ? clientsRes.data.data.length : (Array.isArray(clientsRes.data) ? clientsRes.data.length : 0));
        setTotalClients(total || 0);
        setCountries(Array.isArray(countriesRes) ? countriesRes : []);
        setSalesReps(Array.isArray(salesRepsData) ? salesRepsData : []);
        setLoading(false);
      })
      .catch((error) => {
        if (error?.name === 'CanceledError') return; // ignore cancellations
        console.error('Error fetching overall attendance data:', error);
        setError(`Failed to fetch data: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        setLoading(false);
      });
    return () => controller.abort();
  }, [startDate, endDate, user?.role, user?.id]);

  // Fetch user's country and set default filter
  useEffect(() => {
    const fetchUserCountry = async () => {
      // Only set default once
      if (!user?.id || countries.length === 0 || defaultCountrySet) return;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/staff/${user.id}`, { headers: getAuthHeaders() });
        const staffData = response.data;
        const userCountry = staffData.country || staffData.country_id || staffData.countryId;
        
        // Set default country based on user's country
        // country = 1 means Kenya, country = 2 means Tanzania
        if (userCountry === 1 || userCountry === '1') {
          // Find Kenya in the countries list
          const kenyaCountry = countries.find(c => c.id === 1 || c.name.toLowerCase() === 'kenya');
          if (kenyaCountry) {
            setSelectedCountry(kenyaCountry.name);
            setPendingCountry(kenyaCountry.name);
          } else {
            setSelectedCountry('Kenya');
            setPendingCountry('Kenya');
          }
          setDefaultCountrySet(true);
        } else if (userCountry === 2 || userCountry === '2') {
          // Find Tanzania in the countries list
          const tanzaniaCountry = countries.find(c => c.id === 2 || c.name.toLowerCase() === 'tanzania');
          if (tanzaniaCountry) {
            setSelectedCountry(tanzaniaCountry.name);
            setPendingCountry(tanzaniaCountry.name);
          } else {
            setSelectedCountry('Tanzania');
            setPendingCountry('Tanzania');
          }
          setDefaultCountrySet(true);
        }
      } catch (error) {
        console.error('Failed to fetch user country:', error);
        // Default to Kenya if we can't fetch the user's country
        if (!defaultCountrySet) {
          setSelectedCountry('Kenya');
          setPendingCountry('Kenya');
          setDefaultCountrySet(true);
        }
      }
    };
    
    fetchUserCountry();
  }, [user?.id, countries, defaultCountrySet]);

  // Lazy-load full clients only when needed (clients modal opens)
  useEffect(() => {
    if (clientsModalOpen && clients.length === 0 && !clientsLoading) {
      setClientsLoading(true);
      const controller = new AbortController();
      const { signal } = controller;
      axios.get(`${API_BASE_URL}/clients?limit=10000`, { headers: getAuthHeaders(), signal })
        .then((res) => {
          const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
          console.log('Loaded clients for modal:', list.length);
          setClients(list);
          if (!totalClients) {
            const total = typeof res.data?.total === 'number' ? res.data.total : list.length;
            setTotalClients(total);
          }
        })
        .catch((error) => {
          console.error('Error loading clients:', error);
        })
        .finally(() => setClientsLoading(false));
      return () => controller.abort();
    }
  }, [clientsModalOpen, clients.length, clientsLoading]);

  // Recalculate clients for date when clients are loaded or date changes
  useEffect(() => {
    if (clientsModalOpen && selectedDateForClients && clients.length > 0 && Array.isArray(journeyPlans)) {
      const visitedClientIds = journeyPlans
        .filter(jp => jp.date.slice(0, 10) === selectedDateForClients && jp.checkInTime && (jp.status === 1 || jp.status === 2))
        .map(jp => jp.clientId);
      
      const uniqueClientIds = [...new Set(visitedClientIds)];
      
      const visitedClients = uniqueClientIds
        .map(clientId => clients.find(client => client.id === clientId))
        .filter(client => client !== undefined) as Client[];
      
      console.log('Recalculated clients for date:', {
        date: selectedDateForClients,
        visitedClientIds: uniqueClientIds.length,
        foundClients: visitedClients.length,
        totalClients: clients.length,
        totalJourneyPlans: journeyPlans.length
      });
      
      setClientsForDate(visitedClients);
    }
  }, [clientsModalOpen, selectedDateForClients, clients, journeyPlans]);

  // Build attendance rows
  useEffect(() => {
    // Safety check: ensure all required arrays are properly initialized
    if (!Array.isArray(loginHistory) || !Array.isArray(journeyPlans) || !Array.isArray(salesReps)) {
      console.log('Arrays not ready yet:', {
        loginHistory: Array.isArray(loginHistory),
        journeyPlans: Array.isArray(journeyPlans),
        salesReps: Array.isArray(salesReps)
      });
      return;
    }
    
    const dateMap: Record<string, { salesReps: Set<number>; clients: Set<number> }> = {};

    // Generate all dates in the range (startDate to endDate) and initialize with empty sets
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().slice(0, 10);
        dateMap[dateStr] = { salesReps: new Set(), clients: new Set<number>() };
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Count active sales reps and clients directly from JourneyPlan records
    // Only count JourneyPlan records with status = 1 or 2
    if (Array.isArray(journeyPlans)) {
      journeyPlans.forEach(jp => {
        // Only process JourneyPlan records with status = 1 or 2
        if (jp.status !== 1 && jp.status !== 2) return;
        
        const date = jp.date.slice(0, 10);
        // Initialize if not already in dateMap (in case date is outside range)
        if (!dateMap[date]) dateMap[date] = { salesReps: new Set(), clients: new Set<number>() };
        
        // Count sales rep if they have a JourneyPlan with status = 1 or 2 on this date
        if (jp.userId) {
          dateMap[date].salesReps.add(jp.userId);
        }
        
        // Count clients that have been actually visited (have checkInTime)
        if (jp.checkInTime) {
          dateMap[date].clients.add(jp.clientId);
        }
      });
    } else {
      console.warn('journeyPlans is not an array:', journeyPlans);
    }
    
    console.log('Total journey plans:', journeyPlans.length);
    console.log('Journey plans with status 1 or 2:', journeyPlans.filter(jp => jp.status === 1 || jp.status === 2).length);
    
    const rows: AttendanceRow[] = Object.entries(dateMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, { salesReps, clients }]) => ({
        date,
        clientsVisited: clients.size,
        activeSalesReps: salesReps.size,
      }));
     console.log('Generated attendance rows:', rows.length);
     console.log('Sample attendance row:', rows[0]);
     console.log('Journey plans with checkInTime:', journeyPlans.filter(jp => jp.checkInTime).length);
    setAttendanceRows(rows);
  }, [loginHistory, journeyPlans, salesReps, startDate, endDate]);

  // Filter rows
  const filteredRows = attendanceRows.filter(row => {
    if (startDate && row.date < startDate) return false;
    if (endDate && row.date > endDate) return false;
    if (selectedCountry) {
      // Get sales rep IDs from the selected country
      const countryRepIds = Array.isArray(salesReps) ? salesReps.filter(rep => rep.country === selectedCountry).map(rep => rep.id) : [];
      // Get active sales rep IDs from JourneyPlan (status = 1 or 2)
      const activeRepIds = Array.isArray(journeyPlans) 
        ? [...new Set(journeyPlans.filter(jp => jp.userId && (jp.status === 1 || jp.status === 2)).map(jp => jp.userId as number))]
        : [];
      // Only include reps that are from the selected country AND have active JourneyPlans
      const repIds = countryRepIds.filter(id => activeRepIds.includes(id));
      const loginReps = Array.isArray(loginHistory) ? loginHistory.filter(lh => lh.sessionStart && lh.sessionStart.slice(0, 10) === row.date).map(lh => lh.userId) : [];
      if (!loginReps.some(id => repIds.includes(id))) return false;
    }
    return true;
  });

  // Helper function to calculate time spent
  const calculateTimeSpent = (startTime: string, endTime?: string): string => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    // Extract date from the ISO string without any conversion
    // Format: 2025-09-07T20:08:29.590Z
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthIndex = parseInt(month) - 1;
      const dayIndex = new Date(parseInt(year), monthIndex, parseInt(day)).getDay();
      return `${dayNames[dayIndex]}, ${parseInt(day)} ${monthNames[monthIndex]} ${year}`;
    }
    
    const date = DateTime.fromISO(dateString);
    if (!date.isValid) {
      // Try parsing with native Date as fallback
      const nativeDate = new Date(dateString);
      if (isNaN(nativeDate.getTime())) {
        return 'Invalid Date';
      }
      // Format manually to show the exact time from database
      const year = nativeDate.getUTCFullYear();
      const month = nativeDate.getUTCMonth() + 1;
      const day = nativeDate.getUTCDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayOfWeek = dayNames[nativeDate.getUTCDay()];
      return `${dayOfWeek}, ${day} ${monthNames[month - 1]} ${year}`;
    }
    // Display without timezone conversion
    return date.toFormat('EEE, d MMM yyyy');
  };

  // Helper function to safely format date/time
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    // Extract date and time from the ISO string without any conversion
    // Format: 2025-09-07T20:08:29.590Z
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hours, minutes] = match;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = parseInt(month) - 1;
      return `${parseInt(day)} ${monthNames[monthIndex]} ${year}, ${hours}:${minutes}`;
    }
    
    const date = DateTime.fromISO(dateString);
    if (!date.isValid) {
      const nativeDate = new Date(dateString);
      if (isNaN(nativeDate.getTime())) {
        return 'Invalid Date';
      }
      // Format manually to show the exact time from database
      const year = nativeDate.getUTCFullYear();
      const month = nativeDate.getUTCMonth() + 1;
      const day = nativeDate.getUTCDate();
      const hours = nativeDate.getUTCHours();
      const minutes = nativeDate.getUTCMinutes();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${monthNames[month - 1]} ${year}, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    // Display without timezone conversion
    return date.toFormat('d MMM yyyy, HH:mm');
  };

  // Helper function to get clients for a specific date
  const getClientsForDate = (date: string) => {
    if (!Array.isArray(journeyPlans) || !Array.isArray(clients)) return [];
    
    // Get client IDs that were visited on this date (have checkInTime and JourneyPlan.status = 1 or 2)
    const visitedClientIds = journeyPlans
      .filter(jp => jp.date.slice(0, 10) === date && jp.checkInTime && (jp.status === 1 || jp.status === 2))
      .map(jp => jp.clientId);
    
    // Get unique client IDs
    const uniqueClientIds = [...new Set(visitedClientIds)];
    
    // Get client details
    const visitedClients = uniqueClientIds
      .map(clientId => clients.find(client => client.id === clientId))
      .filter(client => client !== undefined) as Client[];
    
    return visitedClients;
  };

  // Helper function to handle visit row click
  const handleVisitClick = (client: Client, journeyPlan: JourneyPlan) => {
    const salesRep = Array.isArray(salesReps) ? salesReps.find(sr => sr.id === journeyPlan.userId) || null : null;
    
    setSelectedVisit({
      client,
      journeyPlan,
      salesRep: salesRep || null
    });
    setLocationModalOpen(true);
  };

  // Debug: Log modal state
  console.log('Modal state check - salesRepsModalOpen:', salesRepsModalOpen);

  // Memoized filtered sales reps for modal
  const filteredModalReps = useMemo(() => {
    if (!salesRepsModalOpen) return [];
    
    const filteredReps = modalCountryFilter 
      ? activeSalesRepsForDate.filter(rep => rep.country === modalCountryFilter)
      : activeSalesRepsForDate;
    
    return filteredReps;
  }, [modalCountryFilter, activeSalesRepsForDate, salesRepsModalOpen]);

  // Memoized filtered clients for modal
  const filteredClientsForDate = useMemo(() => {
    if (!clientsModalOpen || !Array.isArray(clientsForDate)) return [];
    
    if (!clientsModalSalesRepFilter) return clientsForDate;
    
    // Filter clients by selected sales rep
    const salesRepId = parseInt(clientsModalSalesRepFilter);
    return clientsForDate.filter(client => {
      // Check if this client was visited by the selected sales rep on the selected date
      // AND JourneyPlan.status = 1 or 2
      return Array.isArray(journeyPlans) && journeyPlans.some(jp => 
        jp.clientId === client.id && 
        jp.userId === salesRepId &&
        jp.date.slice(0, 10) === selectedDateForClients &&
        jp.checkInTime &&
        (jp.status === 1 || jp.status === 2)
      );
    });
  }, [clientsModalOpen, clientsForDate, clientsModalSalesRepFilter, journeyPlans, selectedDateForClients]);

  // Helper functions for filter modal
  const openFilterModal = () => {
    setPendingCountry(selectedCountry);
    setPendingStartDate(startDate);
    setPendingEndDate(endDate);
    setFilterModalOpen(true);
  };

  const applyFilters = () => {
    setSelectedCountry(pendingCountry);
    setStartDate(pendingStartDate);
    setEndDate(pendingEndDate);
    setFilterModalOpen(false);
  };

  const clearFilters = () => {
    // Reset to current month
    const currentMonthStart = DateTime.now().startOf('month').toISODate();
    const currentMonthEnd = DateTime.now().endOf('month').toISODate();
    setPendingCountry('');
    setPendingStartDate(currentMonthStart);
    setPendingEndDate(currentMonthEnd);
    setSelectedCountry('');
    setStartDate(currentMonthStart);
    setEndDate(currentMonthEnd);
    setFilterModalOpen(false);
  };

  // Helper function to export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Clients Visited', 'Active Sales Reps'];
    const rows = filteredRows.map(row => [
      row.date,
      row.clientsVisited,
      row.activeSalesReps
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'overall_attendance.csv';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-4 sm:space-y-0">
            <div>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
            <div>
                  <h1 className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Overall Attendance
                  </h1>
                  <p className="mt-1 text-[10px] text-gray-600">
                    Comprehensive sales team performance and client visit tracking
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-2.5 py-1 border border-gray-300 rounded-lg shadow-sm text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Download className="h-3 w-3 mr-1.5" />
                Export CSV
              </button>
              <button
                onClick={openFilterModal}
                className="inline-flex items-center px-2.5 py-1 border border-transparent rounded-lg shadow-sm text-[10px] font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <Filter className="h-3 w-3 mr-1.5" />
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
            <p className="mt-6 text-xs font-medium text-gray-700">Loading attendance data...</p>
            <p className="mt-2 text-[10px] text-gray-500">Please wait while we fetch the latest information</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
              <div className="text-red-600 text-2xl">⚠️</div>
            </div>
            <h3 className="mt-6 text-xs font-medium text-red-900">Error Loading Data</h3>
            <p className="mt-2 text-[10px] text-red-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-2.5 py-1 border border-transparent rounded-lg shadow-sm text-[10px] font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Enhanced Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 hidden">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-lg">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Active Days</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredRows.length}</p>
                      <p className="text-xs text-gray-500 mt-1">Days with activity</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Active Sales Representatives</p>
                      <p className="text-2xl font-bold text-gray-900">{Array.isArray(salesReps) ? salesReps.filter(rep => rep.status === 1).length : 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Active team members</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Clients</p>
                      <p className="text-2xl font-bold text-gray-900">{(totalClients || clients.length).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Registered clients</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Visits</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredRows.reduce((sum, row) => sum + row.clientsVisited, 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Client visits made</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Attendance Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Daily Attendance Overview
                    </h3>
                    <p className="mt-1 text-[10px] text-gray-600">
                      Showing {filteredRows.length} days of attendance data
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-[10px] text-gray-600">Sales Reps</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-[10px] text-gray-600">Client Visits</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="overflow-hidden">
                {filteredRows.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-[10px] text-gray-500">No attendance data found for the selected date range.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                            Clients Visited
                          </th>
                          <th className="px-6 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                            Active Sales Reps
                          </th>
                          <th className="px-6 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                            Activity Level
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 text-xs">
                        {filteredRows.map((row, index) => {
                          const activityLevel = row.clientsVisited > 50 ? 'High' : 
                                               row.clientsVisited > 20 ? 'Medium' : 'Low';
                          const activityColor = activityLevel === 'High' ? 'bg-green-100 text-green-800' :
                                               activityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                               'bg-red-100 text-red-800';
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="ml-3">
                                  <div className="text-[10px] font-medium text-gray-900">
                                      {formatDate(row.date)}
                                    </div>
                                 
                                  </div>
                                </div>
                              </td>
                            <td className="px-6 py-3 whitespace-nowrap text-center">
                                <button
                                  onClick={async () => {
                                    console.log('Clients visited clicked for date:', row.date);
                                    setSelectedDateForClients(row.date);
                                    setClientsModalOpen(true);
                                    
                                    // If clients are not loaded, trigger loading
                                    if (clients.length === 0 && !clientsLoading) {
                                      setClientsLoading(true);
                                      try {
                                        const res = await axios.get(`${API_BASE_URL}/clients?limit=10000`, { headers: getAuthHeaders() });
                                        const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
                                        console.log('Loaded clients on button click:', list.length);
                                        setClients(list);
                                        if (!totalClients) {
                                          const total = typeof res.data?.total === 'number' ? res.data.total : list.length;
                                          setTotalClients(total);
                                        }
                                      } catch (error) {
                                        console.error('Error loading clients:', error);
                                      } finally {
                                        setClientsLoading(false);
                                      }
                                    }
                                  }}
                                className="text-[10px] font-semibold text-green-600 hover:text-green-800 transition-colors duration-150 cursor-pointer"
                                >
                                  {row.clientsVisited.toLocaleString()} Visits
                                </button> 
                              
                              </td>
                            <td className="px-6 py-3 whitespace-nowrap text-center">
                                 <button
                                   onClick={() => {
                                     console.log('Modal button clicked for date:', row.date);
                                     console.log('Current salesRepsModalOpen state:', salesRepsModalOpen);
                                     setSelectedDate(row.date);
                                     
                                      // Build list of active sales reps directly from JourneyPlan records with status = 1 or 2
                                      const activeRepIdsForDate = new Set(
                                        Array.isArray(journeyPlans)
                                          ? journeyPlans
                                              .filter(jp => 
                                                jp.date.slice(0, 10) === row.date &&
                                                (jp.status === 1 || jp.status === 2) &&
                                                jp.userId
                                              )
                                              .map(jp => jp.userId as number)
                                          : []
                                      );
                                      
                                      const repsForDate = Array.from(activeRepIdsForDate)
                                       .map(userId => {
                                          const rep = salesReps.find(sr => sr.id === userId);
                                          if (!rep) return null;
                                          
                                          // Get session info from loginHistory if available
                                          const login = Array.isArray(loginHistory) 
                                            ? loginHistory.find(lh => lh.userId === userId && lh.sessionStart && lh.sessionStart.slice(0, 10) === row.date)
                                            : null;
                                          
                                          // Count clients visited by this rep on this date (only those with checkinTime and status = 1 or 2)
                                           const clientsVisited = Array.isArray(journeyPlans) ? journeyPlans.filter(jp => 
                                             jp.userId === rep.id && 
                                             jp.date.slice(0, 10) === row.date &&
                                             jp.checkInTime &&
                                             (jp.status === 1 || jp.status === 2)
                                           ).length : 0;
                                          
                                          console.log(`Rep ${rep.name} (ID: ${rep.id}):`, {
                                             repId: rep.id,
                                             loginUserId: userId,
                                             journeyPlansForRep: Array.isArray(journeyPlans) ? journeyPlans.filter(jp => jp.userId === rep.id && (jp.status === 1 || jp.status === 2)) : [],
                                             journeyPlansForDate: Array.isArray(journeyPlans) ? journeyPlans.filter(jp => jp.date.slice(0, 10) === row.date && (jp.status === 1 || jp.status === 2)) : [],
                                             journeyPlansWithCheckin: Array.isArray(journeyPlans) ? journeyPlans.filter(jp => 
                                               jp.userId === rep.id && 
                                               jp.date.slice(0, 10) === row.date &&
                                               jp.checkInTime &&
                                               (jp.status === 1 || jp.status === 2)
                                             ) : [],
                                             clientsVisited,
                                             targetDate: row.date,
                                             sampleJourneyPlan: Array.isArray(journeyPlans) ? journeyPlans.find(jp => jp.userId === rep.id && (jp.status === 1 || jp.status === 2)) : null,
                                             allDatesForRep: Array.isArray(journeyPlans) ? [...new Set(journeyPlans.filter(jp => jp.userId === rep.id && (jp.status === 1 || jp.status === 2)).map(jp => jp.date.slice(0, 10)))] : []
                                           });
                                          
                                          return {
                                            ...rep,
                                            sessionStart: login?.sessionStart || '',
                                            sessionEnd: login?.sessionEnd,
                                            clientsVisited
                                          };
                                        })
                                        .filter(rep => rep !== null) as (SalesRep & { sessionStart: string; sessionEnd?: string; clientsVisited: number })[];
                                     
                                     console.log('Setting activeSalesRepsForDate:', repsForDate);
                                     console.log('Setting salesRepsModalOpen to true');
                                     setActiveSalesRepsForDate(repsForDate);
                                     setSalesRepsModalOpen(true);
                                   }}
                                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-150 cursor-pointer"
                                 >
                                   {row.activeSalesReps.toLocaleString()} Reps
                                 </button>
                               </td>
                              <td className="px-6 py-3 whitespace-nowrap text-center">
                                <span className={`inline-flex px-2 py-1 text-[10px] font-semibold rounded-full ${activityColor}`}>
                                  {activityLevel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 hidden">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">Analytics</h4>
                    <p className="text-sm text-gray-500">View detailed performance metrics</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">Team View</h4>
                    <p className="text-sm text-gray-500">Individual sales rep performance</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">Client Map</h4>
                    <p className="text-sm text-gray-500">Geographic visit distribution</p>
                  </div>
                </div>
              </div>
                         </div>
           </>
         )}
       </div>

               {/* Sales Reps Modal - Redesigned */}
        {salesRepsModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="bg-white bg-opacity-20 p-1.5 rounded-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold">Active Sales Representatives</h2>
                      <p className="text-[10px] text-blue-100 mt-0.5">
                        {selectedDate && formatDate(selectedDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Country Filter */}
                    <div className="relative">
                      <select
                        value={modalCountryFilter}
                        onChange={(e) => setModalCountryFilter(e.target.value)}
                        className="bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded-lg px-2 py-1 pr-6 text-[10px] focus:outline-none focus:ring-1 focus:ring-white focus:ring-opacity-50"
                      >
                        <option value="">All Countries</option>
                        {countries.map((country) => (
                          <option key={country.id} value={country.name} className="text-gray-900">
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => setSalesRepsModalOpen(false)}
                      className="text-white hover:text-blue-100 transition-colors p-1.5 rounded-lg hover:bg-white hover:bg-opacity-20"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                {filteredModalReps.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      {modalCountryFilter ? `No Sales Representatives from ${modalCountryFilter}` : 'No Sales Representatives'}
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      {modalCountryFilter ? `No sales representatives found for ${modalCountryFilter} on this date.` : 'No sales representatives found for this date.'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Sales Representative
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Country
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Clients Visited
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Session Start
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Session End
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Time Spent
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredModalReps.map((rep, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-1.5 rounded-full">
                                      <Users className="h-3 w-3 text-white" />
                                    </div>
                                  </div>
                                  <div className="ml-2">
                                    <div className="text-[10px] font-medium text-gray-900">{rep.name}</div>
                                    <div className="text-[10px] text-gray-500">{rep.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {rep.country || 'N/A'}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="text-[10px] font-semibold text-green-600">
                                  {rep.clientsVisited}
                                </div>
                                <div className="text-[10px] text-gray-500">visits</div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="text-[10px] text-gray-900">
                                  {rep.sessionStart ? new Date(rep.sessionStart).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'N/A'}
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="text-[10px] text-gray-900">
                                  {rep.sessionEnd ? new Date(rep.sessionEnd).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'Active'}
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="text-[10px] font-semibold text-blue-600">
                                  {calculateTimeSpent(rep.sessionStart, rep.sessionEnd)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-white border-t border-gray-200 px-4 py-3 rounded-b-xl">
                <div className="flex justify-between items-center">
                  <div className="text-[10px] text-gray-600">
                    Showing {filteredModalReps.length} active sales representatives
                    {modalCountryFilter && ` from ${modalCountryFilter}`}
                  </div>
                  <button
                    onClick={() => setSalesRepsModalOpen(false)}
                    className="inline-flex items-center px-2.5 py-1 border border-transparent rounded-lg shadow-sm text-[10px] font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clients Modal - Full Page */}
        {clientsModalOpen && (
          <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-[9999] overflow-hidden">
            {/* Modern Compact Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <MapPin className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold">
                      Clients Visited
                    </h1>
                    <p className="text-[10px] text-green-100">
                      {selectedDateForClients && formatDate(selectedDateForClients)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Sales Rep Filter */}
                  <div className="relative">
                    <select
                      value={clientsModalSalesRepFilter}
                      onChange={(e) => setClientsModalSalesRepFilter(e.target.value)}
                      className="bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded-lg px-2.5 py-1.5 pr-6 text-[10px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all"
                    >
                      <option value="">All Sales Reps</option>
                      {Array.isArray(salesReps) && salesReps.filter(rep => rep.status === 1).map((rep) => (
                        <option key={rep.id} value={rep.id} className="text-gray-900">
                          {rep.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={() => setClientsModalOpen(false)}
                    className="text-white hover:text-green-100 transition-colors p-1.5 rounded-lg hover:bg-white hover:bg-opacity-20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="h-full overflow-y-auto">
              <div className="max-w-7xl mx-auto px-3 py-3">
                {clientsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
                    <p className="text-[10px] text-gray-600">Loading clients...</p>
                  </div>
                ) : filteredClientsForDate.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center shadow-sm">
                      <MapPin className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xs font-semibold text-gray-900 mb-1.5">
                      {clientsModalSalesRepFilter ? 'No Clients Visited by Selected Sales Rep' : 'No Clients Visited'}
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      {clientsModalSalesRepFilter 
                        ? `No clients were visited by the selected sales representative on this date.`
                        : 'No clients were visited on this date.'
                      }
                    </p>
                    <div className="mt-3 text-[10px] text-gray-400">
                      <p>Debug: Clients loaded: {clients.length}, Journey plans: {journeyPlans.length}, Selected date: {selectedDateForClients}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Client Name
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Sales Rep
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Check-in
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Check-out
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Time Spent
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredClientsForDate.map((client) => {
                            // Get journey plan details for this client on this date
                            const clientJourneyPlans = Array.isArray(journeyPlans) ? journeyPlans.filter(jp => 
                              jp.clientId === client.id && 
                              jp.date.slice(0, 10) === selectedDateForClients &&
                              jp.checkInTime
                            ) : [];
                            
                            return clientJourneyPlans.map((jp, jpIndex) => {
                              const salesRep = Array.isArray(salesReps) ? salesReps.find(sr => sr.id === jp.userId) : null;
                              
                              return (
                                <tr 
                                  key={`${client.id}-${jpIndex}`} 
                                  className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all cursor-pointer"
                                  onClick={() => handleVisitClick(client, jp)}
                                >
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-shrink-0">
                                        <div className="bg-gradient-to-r from-green-500 to-green-600 p-1.5 rounded-lg">
                                          <MapPin className="h-3 w-3 text-white" />
                                        </div>
                                      </div>
                                      <div className="text-[10px] font-semibold text-gray-900 truncate max-w-[200px]">{client.name}</div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-center">
                                    <div className="text-[10px] font-medium text-gray-900">
                                      {salesRep ? salesRep.name : 'Unknown'}
                                    </div>
                                    <div className="text-[10px] text-gray-500 truncate max-w-[150px]">
                                      {salesRep ? salesRep.email : ''}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-center">
                                    <div className="text-[10px] text-gray-900">
                                      {jp.checkInTime ? new Date(jp.checkInTime).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-center">
                                    <div className="text-[10px] text-gray-900">
                                      {jp.checkoutTime ? new Date(jp.checkoutTime).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : 'Still Active'}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-center">
                                    <div className="text-[10px] font-semibold text-blue-600">
                                      {jp.checkInTime ? calculateTimeSpent(jp.checkInTime as string, jp.checkoutTime) : 'N/A'}
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                      {jp.checkoutTime ? 'Completed' : 'In Progress'}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent row click
                                        navigate('/my-reports', {
                                          state: {
                                            clientId: client.id,
                                            clientName: client.name,
                                            salesRepId: jp.userId,
                                            salesRepName: salesRep?.name || 'Unknown',
                                            visitDate: selectedDateForClients
                                          }
                                        });
                                      }}
                                      className="inline-flex items-center px-2 py-1 border border-transparent rounded-lg shadow-sm text-[10px] font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all"
                                    >
                                      <FileText className="h-2.5 w-2.5 mr-1" />
                                      Reports
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Footer */}
            <div className="bg-white border-t border-gray-200 px-3 py-2">
              <div className="flex justify-between items-center">
                <div className="text-[10px] text-gray-600">
                  Showing {filteredClientsForDate.length} clients visited
                  {selectedDateForClients && ` on ${formatDate(selectedDateForClients)}`}
                  {clientsModalSalesRepFilter && ` by ${salesReps.find(rep => rep.id === parseInt(clientsModalSalesRepFilter))?.name || 'Selected Sales Rep'}`}
                </div>
                <button
                  onClick={() => setClientsModalOpen(false)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg shadow-sm text-[10px] font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Modal - Full Page */}
        {locationModalOpen && selectedVisit && (
          <div className="fixed inset-0 bg-white z-[9999] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <Navigation className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">
                      Visit Location
                    </h1>
                    <p className="text-blue-100">
                      {selectedVisit.client.name} - {selectedDateForClients && formatDate(selectedDateForClients)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setLocationModalOpen(false)}
                    className="text-white hover:text-blue-100 transition-colors duration-150 p-2 rounded-lg hover:bg-white hover:bg-opacity-20"
                  >
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="h-full overflow-y-auto bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {selectedVisit.journeyPlan.latitude && selectedVisit.journeyPlan.longitude ? (
                  <div className="space-y-6">
                    {/* Visit Details Card */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Client</label>
                          <p className="text-sm text-gray-900">{selectedVisit.client.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Sales Representative</label>
                          <p className="text-sm text-gray-900">{selectedVisit.salesRep?.name || 'Unknown'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Check-in Time</label>
                          <p className="text-sm text-gray-900">
                            {formatDateTime(selectedVisit.journeyPlan.checkInTime || '')}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Check-out Time</label>
                          <p className="text-sm text-gray-900">
                            {selectedVisit.journeyPlan.checkoutTime ? formatDateTime(selectedVisit.journeyPlan.checkoutTime || '') : 'Still Active'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Time Spent</label>
                          <p className="text-sm text-gray-900">
                            {selectedVisit.journeyPlan.checkInTime ? calculateTimeSpent(selectedVisit.journeyPlan.checkInTime as string, selectedVisit.journeyPlan.checkoutTime) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Notes</label>
                          <p className="text-sm text-gray-900">{selectedVisit.journeyPlan.notes || 'No notes'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Map Container */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Visit Location</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Coordinates: {selectedVisit.journeyPlan.latitude}, {selectedVisit.journeyPlan.longitude}
                        </p>
                      </div>
                      <div className="h-96 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <Navigation className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Interactive Map</h4>
                          <p className="text-gray-600 mb-4">
                            Location: {selectedVisit.journeyPlan.latitude}, {selectedVisit.journeyPlan.longitude}
                          </p>
                          <div className="space-x-4">
                            <a
                              href={`https://www.google.com/maps?q=${selectedVisit.journeyPlan.latitude},${selectedVisit.journeyPlan.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              Open in Google Maps
                            </a>
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${selectedVisit.journeyPlan.latitude}&mlon=${selectedVisit.journeyPlan.longitude}&zoom=15`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            >
                              <Navigation className="h-4 w-4 mr-2" />
                              Open in OpenStreetMap
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="bg-white rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                      <Navigation className="h-16 w-16 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      No Location Data
                    </h3>
                    <p className="text-gray-500">
                      This visit does not have GPS coordinates recorded.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Visit location for {selectedVisit.client.name}
                  {selectedDateForClients && ` on ${formatDate(selectedDateForClients)}`}
                </div>
                <button
                  onClick={() => setLocationModalOpen(false)}
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Modal */}
        {filterModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Filter Options</h3>
                  <button
                    onClick={() => setFilterModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Country Filter */}
                  <div>
                    <label htmlFor="countryFilter" className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      id="countryFilter"
                      value={pendingCountry}
                      onChange={(e) => setPendingCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Countries</option>
                      {countries.map(country => (
                        <option key={country.id} value={country.name}>{country.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        value={pendingStartDate}
                        onChange={(e) => setPendingStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        value={pendingEndDate}
                        onChange={(e) => setPendingEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setFilterModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    Apply Filters
                  </button>
                </div>
        </div>
      </div>
          </div>
        )}
    </div>
  );
};

export default OverallAttendancePage; 