import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { salesService, SalesRep, Country } from '../services/salesService';
import { saveAs } from 'file-saver';
import { Link } from 'react-router-dom';
import { Calendar, Users, TrendingUp, Filter, Download, BarChart3, Activity, Clock, UserCheck, UserX, FileText, AlarmClock, X } from 'lucide-react';
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
  sessionStart: string; // ISO datetime
  sessionEnd?: string; // ISO datetime, optional
}

interface Leave {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  status: string | number;
}

interface LateDayDetail {
  date: string;         // yyyy-mm-dd
  firstLoginTime: string; // formatted local time string
  minutesLate: number;
}

interface LateDaysModal {
  repName: string;
  days: LateDayDetail[];
}

interface RepStats {
  rep: SalesRep;
  present: number;
  leave: number;
  absent: number;
  attendance: string;
  totalWorkingDays: number;
  lateDays: number;
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const SalesRepWorkingDaysPage: React.FC = () => {
  const { user } = useAuth();
  // Team leaders should only see working-days stats for their assigned reps.
  const teamLeaderUserId =
    user?.role === 'team_leader' || user?.role === 'leader' ? user?.id ?? null : null;
  const isTeamLeaderUser = teamLeaderUserId !== null;
  // Use current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth);

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date(year, month, 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date(year, month, daysInMonth);
    return d.toISOString().slice(0, 10);
  });

  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allowedRepIds, setAllowedRepIds] = useState<Set<number> | null>(null);
  const [restrictingByTeamLeader, setRestrictingByTeamLeader] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('1'); // Default to Active
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [pendingCountry, setPendingCountry] = useState('');
  const [defaultCountrySet, setDefaultCountrySet] = useState<boolean>(false);
  const [pendingRep, setPendingRep] = useState(selectedRep);
  const [pendingStatus, setPendingStatus] = useState(selectedStatus);
  const [pendingStartDate, setPendingStartDate] = useState(startDate);
  const [pendingEndDate, setPendingEndDate] = useState(endDate);
  const [lateDaysModal, setLateDaysModal] = useState<LateDaysModal | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [repsPerPage, setRepsPerPage] = useState(10);
  const recordsPerPageOptions = [10, 20, 50, 100];

  // Data fetching
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    console.log('SalesRepWorkingDaysPage: Starting data fetch...');
    
    Promise.all([
      salesService.getAllSalesReps(),
      axios.get(`${API_BASE_URL}/login-history`, { headers: getAuthHeaders() }),
      axios.get(`${API_BASE_URL}/sales-rep-leaves/sales-rep-leaves`, { headers: getAuthHeaders() }),
      salesService.getCountries(),
    ])
      .then(([repsRes, loginRes, leavesRes, countriesRes]) => {
        console.log('SalesRepWorkingDaysPage: Data fetch successful');
        console.log('Sales reps count:', repsRes?.length || 0);
        console.log('Login history count:', loginRes.data?.length || 0);
        console.log('Leaves count:', leavesRes.data?.length || 0);
        console.log('Countries count:', countriesRes?.length || 0);
        
        setSalesReps(repsRes || []);
        setLoginHistory(loginRes.data || []);
        setLeaves(leavesRes.data || []);
        setCountries(countriesRes || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching sales rep working days data:', error);
        setError(`Failed to fetch data: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        setLoading(false);
      });
  }, []);

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

  // Helper: get all working days in range as string yyyy-mm-dd, excluding Sundays
  // Only include dates up to today to prevent counting future dates as absent
  const getWorkingDaysInRange = () => {
    const days: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today to include today
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Only include dates that are not in the future
      if (d.getDay() !== 0 && d <= today) {
        days.push(d.toISOString().slice(0, 10));
      }
    }
    return days;
  };

  const workingDays = getWorkingDaysInRange();
  const numWorkingDays = workingDays.length;
  const rangeStart = new Date(startDate);
  const rangeEnd = new Date(endDate);

  // If the logged-in user is a team leader, restrict reps to only those assigned to them.
  useEffect(() => {
    let cancelled = false;

    const isTeamLeaderRep = (rep: SalesRep) => {
      const role = (rep.role || '').toLowerCase().trim();
      return role === 'team leader' || role === 'team_leader';
    };

    const run = async () => {
      if (!isTeamLeaderUser || !teamLeaderUserId) {
        setAllowedRepIds(new Set(salesReps.map(r => r.id)));
        return;
      }

      setRestrictingByTeamLeader(true);
      setAllowedRepIds(null);
      try {
        const ids = new Set<number>();
        await Promise.all(
          salesReps.map(async (rep) => {
            // Working days are for sales reps (not other team leaders).
            if (isTeamLeaderRep(rep)) return;

            try {
              const res = await axios.get(
                `/api/sales/sales-reps/${rep.id}/team-leader`,
                { headers: getAuthHeaders() }
              );
              const leaderId = res.data?.id;
              if (leaderId !== undefined && Number(leaderId) === Number(teamLeaderUserId)) {
                ids.add(rep.id);
              }
            } catch {
              // Ignore lookup failures for this rep.
            }
          })
        );

        if (!cancelled) setAllowedRepIds(ids);
      } finally {
        if (!cancelled) setRestrictingByTeamLeader(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isTeamLeaderUser, teamLeaderUserId, salesReps]);

  // If the currently selected rep becomes disallowed, clear the selection.
  useEffect(() => {
    if (!isTeamLeaderUser) return;
    if (!allowedRepIds) return;

    if (selectedRep && !allowedRepIds.has(Number(selectedRep))) {
      setSelectedRep('');
      setPendingRep('');
    }
  }, [isTeamLeaderUser, allowedRepIds, selectedRep]);

  const filteredSalesReps = salesReps.filter(rep => {
    // Filter by country
    if (isTeamLeaderUser && allowedRepIds === null) return false;
    if (isTeamLeaderUser && allowedRepIds && !allowedRepIds.has(rep.id)) return false;

    if (selectedCountry && rep.country !== selectedCountry) return false;
    
    // Filter by status
    if (selectedStatus) {
      const statusValue = parseInt(selectedStatus);
      if (rep.status !== statusValue) return false;
    }
    
    return true;
  });

  // Calculate stats for each sales rep
  const repStats: RepStats[] = useMemo(() => {
    return filteredSalesReps.map(rep => {
    // Days present: unique loginAt dates in range (excluding Sundays)
    const presentDays = new Set(
      loginHistory
        .filter(lh => lh.userId === rep.id &&
          lh.sessionStart &&
          new Date(lh.sessionStart) >= rangeStart && new Date(lh.sessionStart) <= rangeEnd &&
          new Date(lh.sessionStart).getDay() !== 0)
        .map(lh => lh.sessionStart.slice(0, 10))
    );
      
    // Leave days: sum of working days in range covered by approved leaves
    const repLeaves = leaves.filter(lv => String(lv.userId) === String(rep.id) && (lv.status === 1 || lv.status === '1'));
    let leaveDays = 0;
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today to include today
    
    repLeaves.forEach(lv => {
      const leaveStart = new Date(lv.startDate) < rangeStart ? rangeStart : new Date(lv.startDate);
      const leaveEnd = new Date(lv.endDate) > rangeEnd ? rangeEnd : new Date(lv.endDate);
      for (let d = new Date(leaveStart); d <= leaveEnd; d.setDate(d.getDate() + 1)) {
        // Only count leave days that are not in the future
        if (d.getDay() !== 0 && d >= rangeStart && d <= rangeEnd && d <= today) {
          leaveDays++;
        }
      }
    });
      
    // Days absent: total working days - present - leave
    const daysAbsent = numWorkingDays - presentDays.size - leaveDays;
    const denominator = numWorkingDays - leaveDays;
    const attendance = denominator > 0 ? ((presentDays.size / denominator) * 100).toFixed(1) : 'N/A';

    // Late days: days where the first (earliest) login was strictly after 7:00 AM local time
    const LATE_CHECKIN_MINUTES = 7 * 60; // 7:00 AM in total minutes
    let lateDays = 0;
    presentDays.forEach(dayStr => {
      const dayLogins = loginHistory.filter(lh =>
        lh.userId === rep.id &&
        lh.sessionStart &&
        lh.sessionStart.slice(0, 10) === dayStr
      );
      if (dayLogins.length > 0) {
        const earliest = dayLogins.reduce((min, lh) =>
          lh.sessionStart < min.sessionStart ? lh : min
        );
        const loginDate = new Date(earliest.sessionStart);
        const loginMinutes = loginDate.getHours() * 60 + loginDate.getMinutes();
        if (loginMinutes > LATE_CHECKIN_MINUTES) {
          lateDays++;
        }
      }
    });
      
    return {
      rep,
      present: presentDays.size,
      leave: leaveDays,
      absent: daysAbsent < 0 ? 0 : daysAbsent,
      attendance,
      totalWorkingDays: numWorkingDays,
      lateDays
    };
  });
  }, [filteredSalesReps, loginHistory, leaves, numWorkingDays, rangeStart, rangeEnd]);

  const sortedRepStats = [...repStats].sort((a, b) => {
    if (a.attendance === 'N/A' && b.attendance === 'N/A') return 0;
    if (a.attendance === 'N/A') return 1;
    if (b.attendance === 'N/A') return -1;
    return parseFloat(b.attendance) - parseFloat(a.attendance);
  });

  const filteredRepStats = selectedRep
    ? sortedRepStats.filter(stat => String(stat.rep.id) === selectedRep)
    : sortedRepStats;

  const totalPages = Math.ceil(filteredRepStats.length / repsPerPage);
  const paginatedRepStats = useMemo(() => {
    const start = (currentPage - 1) * repsPerPage;
    return filteredRepStats.slice(start, start + repsPerPage);
  }, [filteredRepStats, currentPage, repsPerPage]);

  const listStart =
    filteredRepStats.length === 0 ? 0 : (currentPage - 1) * repsPerPage + 1;
  const listEnd = Math.min(currentPage * repsPerPage, filteredRepStats.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCountry, selectedRep, selectedStatus, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [repsPerPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalReps = filteredRepStats.length;
    const totalPresent = filteredRepStats.reduce((sum, stat) => sum + stat.present, 0);
    const totalAbsent = filteredRepStats.reduce((sum, stat) => sum + stat.absent, 0);
    const totalLeave = filteredRepStats.reduce((sum, stat) => sum + stat.leave, 0);
    const avgAttendance = filteredRepStats
      .filter(stat => stat.attendance !== 'N/A')
      .reduce((sum, stat) => sum + parseFloat(stat.attendance), 0) / 
      filteredRepStats.filter(stat => stat.attendance !== 'N/A').length;

    return {
      totalReps,
      totalPresent,
      totalAbsent,
      totalLeave,
      avgAttendance: isNaN(avgAttendance) ? 0 : avgAttendance.toFixed(1)
    };
  }, [filteredRepStats]);

  const exportToCSV = () => {
    const countryLabel = selectedCountry || 'All Countries';
    const statusLabel = selectedStatus === '1' ? 'Active' : selectedStatus === '0' ? 'Inactive' : 'All Statuses';
    const headers = [
      'Sales Rep',
      'Days Present',
      'Days Absent',
      'Leave Days',
      'Late Days (after 7am)',
      '% Attendance'
    ];
    const rows = filteredRepStats.map(stat => [
      stat.rep.name,
      stat.present,
      stat.absent,
      stat.leave,
      stat.lateDays,
      stat.attendance === 'N/A' ? 'N/A' : `${stat.attendance}%`
    ]);
    const csvContent = [
      ['Sales Rep Working Days Report'],
      [`Date Range: ${startDate} to ${endDate}`],
      [`Country: ${countryLabel}`],
      [`Status: ${statusLabel}`],
      [`Total Working Days: ${numWorkingDays}`],
      [`Total Sales Reps: ${filteredRepStats.length}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      headers,
      ...rows
    ]
      .map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'sales_rep_working_days.csv');
  };

  const openFilterModal = () => {
    setPendingCountry(selectedCountry);
    setPendingRep(selectedRep);
    setPendingStatus(selectedStatus);
    setPendingStartDate(startDate);
    setPendingEndDate(endDate);
    setFilterModalOpen(true);
  };

  const applyFilters = () => {
    setSelectedCountry(pendingCountry);
    setSelectedRep(pendingRep);
    setSelectedStatus(pendingStatus);
    setStartDate(pendingStartDate);
    setEndDate(pendingEndDate);
    setFilterModalOpen(false);
  };

  const clearFilters = () => {
    setPendingCountry('Kenya'); // Reset to Kenya instead of empty
    setPendingRep('');
    setPendingStatus('1'); // Reset to Active instead of empty
    setPendingStartDate(() => {
      const d = new Date(year, month, 1);
      return d.toISOString().slice(0, 10);
    });
    setPendingEndDate(() => {
      const d = new Date(year, month, daysInMonth);
      return d.toISOString().slice(0, 10);
    });
  };

  // Build late day details for a given rep
  const buildLateDayDetails = (repId: number): LateDayDetail[] => {
    const LATE_CHECKIN_MINUTES = 7 * 60;
    const presentDays = new Set(
      loginHistory
        .filter(lh => lh.userId === repId &&
          lh.sessionStart &&
          new Date(lh.sessionStart) >= rangeStart && new Date(lh.sessionStart) <= rangeEnd &&
          new Date(lh.sessionStart).getDay() !== 0)
        .map(lh => lh.sessionStart.slice(0, 10))
    );

    const details: LateDayDetail[] = [];
    presentDays.forEach(dayStr => {
      const dayLogins = loginHistory.filter(lh =>
        lh.userId === repId &&
        lh.sessionStart &&
        lh.sessionStart.slice(0, 10) === dayStr
      );
      if (dayLogins.length > 0) {
        const earliest = dayLogins.reduce((min, lh) =>
          lh.sessionStart < min.sessionStart ? lh : min
        );
        const loginDate = new Date(earliest.sessionStart);
        const loginMinutes = loginDate.getHours() * 60 + loginDate.getMinutes();
        if (loginMinutes > LATE_CHECKIN_MINUTES) {
          details.push({
            date: dayStr,
            firstLoginTime: loginDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            minutesLate: loginMinutes - LATE_CHECKIN_MINUTES,
          });
        }
      }
    });

    return details.sort((a, b) => a.date.localeCompare(b.date));
  };

  const openLateDaysModal = (repId: number, repName: string) => {
    setLateDaysModal({ repName, days: buildLateDayDetails(repId) });
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-4 sm:space-y-0">
            <div>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Sales Rep Working Days
                  </h1>
                  <p className="mt-1 text-xs text-gray-600">
                    Track attendance, leaves, and performance metrics
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
        <Link
          to="/sales-rep-attendance"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
                <Activity className="h-3 w-3 mr-1.5" />
                Attendance View
        </Link>
        <button
          onClick={exportToCSV}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
                <Download className="h-3 w-3 mr-1.5" />
                Export CSV
        </button>
        <button
          onClick={openFilterModal}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg shadow-sm text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
                <Filter className="h-3 w-3 mr-1.5" />
          Filter
        </button>
      </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {loading || restrictingByTeamLeader ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
            <p className="mt-6 text-sm font-medium text-gray-700">Loading working days data...</p>
            <p className="mt-2 text-xs text-gray-500">Please wait while we fetch the latest information</p>
          </div>
      ) : error ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
              <div className="text-red-600 text-2xl">⚠️</div>
            </div>
            <h3 className="mt-6 text-sm font-medium text-red-900">Error Loading Data</h3>
            <p className="mt-2 text-xs text-red-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Date Range Info */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Date Range: {formatDate(startDate)} - {formatDate(endDate)}
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    {numWorkingDays} working days (excluding Sundays)
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(startDate).split(',')[1]} - {formatDate(endDate).split(',')[1]}
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 hidden">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Sales Reps</p>
                      <p className="text-2xl font-bold text-gray-900">{overallStats.totalReps}</p>
                      <p className="text-xs text-gray-500 mt-1">Active team members</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-lg">
                        <UserCheck className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Present Days</p>
                      <p className="text-2xl font-bold text-gray-900">{overallStats.totalPresent.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Days worked</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Leave Days</p>
                      <p className="text-2xl font-bold text-gray-900">{overallStats.totalLeave.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Approved leaves</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                      <p className="text-2xl font-bold text-gray-900">{overallStats.avgAttendance}%</p>
                      <p className="text-xs text-gray-500 mt-1">Team average</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Working Days Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Sales Representative Performance
                    </h3>
                    <p className="mt-1 text-xs text-gray-600">
                      {filteredRepStats.length === 0
                        ? 'No sales representatives match the filters'
                        : totalPages > 1
                          ? `Showing ${listStart}–${listEnd} of ${filteredRepStats.length} sales representatives`
                          : `Showing ${filteredRepStats.length} sales representative${filteredRepStats.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4">
                    {filteredRepStats.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <label htmlFor="working-days-per-page" className="text-[10px] font-medium text-gray-700 whitespace-nowrap">
                          Show:
                        </label>
                        <select
                          id="working-days-per-page"
                          className="border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          value={repsPerPage}
                          onChange={e => setRepsPerPage(Number(e.target.value))}
                        >
                          {recordsPerPageOptions.map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                                     <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                     <div className="flex items-center space-x-1">
                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                       <span className="text-xs text-gray-600">Present</span>
                     </div>
                     <div className="flex items-center space-x-1">
                       <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                       <span className="text-xs text-gray-600">Leave</span>
                     </div>
                     <div className="flex items-center space-x-1">
                       <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                       <span className="text-xs text-gray-600">Absent</span>
                     </div>
                     <div className="flex items-center space-x-1">
                       <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                       <span className="text-xs text-gray-600">Late</span>
                     </div>
                     <div className="flex items-center space-x-1">
                       <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                       <span className="text-xs text-gray-600">Active</span>
                     </div>
                     <div className="flex items-center space-x-1">
                       <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                       <span className="text-xs text-gray-600">Inactive</span>
                     </div>
                   </div>
                  </div>
                </div>
              </div>
              
              <div className="overflow-hidden">
                {filteredRepStats.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">📊</div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-xs text-gray-500">No sales representatives found for the selected filters.</p>
                  </div>
      ) : (
        <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                                                 <tr>
                           <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                             Sales Representative
                           </th>
                           <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                             Days Present
                           </th>
                           <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                             Days Absent
                           </th>
                           <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                             Leave Days
                           </th>
                           <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                             Late Days
                           </th>
                           <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                             Attendance %
                           </th>
                           <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                             Performance
                           </th>
              </tr>
            </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedRepStats.map((stat) => {
                          const attendance = parseFloat(stat.attendance);
                          const performanceLevel = stat.attendance === 'N/A' ? 'N/A' : 
                            attendance >= 90 ? 'Excellent' : 
                            attendance >= 75 ? 'Good' : 
                            attendance >= 60 ? 'Fair' : 'Poor';
                          
                          const performanceColor = performanceLevel === 'Excellent' ? 'bg-green-100 text-green-800' :
                            performanceLevel === 'Good' ? 'bg-blue-100 text-blue-800' :
                            performanceLevel === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                            performanceLevel === 'Poor' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800';

                          const attendanceColor = stat.attendance === 'N/A' ? 'text-gray-500' :
                            attendance >= 90 ? 'text-green-600' :
                            attendance >= 75 ? 'text-blue-600' :
                            attendance >= 60 ? 'text-yellow-600' : 'text-red-600';

                return (
                            <tr key={stat.rep.id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                   
                                  <div className="ml-2">
                                    <div className="text-xs font-medium text-gray-900">{stat.rep.name}</div>
                                  </div>
                                </div>
                              </td>
                               <td className="px-3 py-2 whitespace-nowrap text-center">
                                 <div className="text-xs font-semibold text-green-600">
                                   {stat.present}
                                 </div>
                                 <div className="text-[10px] text-gray-500">days</div>
                               </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="text-xs font-semibold text-red-600">
                                  {stat.absent}
                                </div>
                                <div className="text-[10px] text-gray-500">days</div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="text-xs font-semibold text-orange-600">
                                  {stat.leave}
                                </div>
                                <div className="text-[10px] text-gray-500">days</div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <button
                                  onClick={() => stat.lateDays > 0 && openLateDaysModal(stat.rep.id, stat.rep.name)}
                                  className={`group flex flex-col items-center w-full ${stat.lateDays > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                                  title={stat.lateDays > 0 ? `Click to see late days for ${stat.rep.name}` : undefined}
                                >
                                  <div className={`text-xs font-semibold ${stat.lateDays > 0 ? 'text-amber-600 group-hover:underline' : 'text-gray-400'}`}>
                                    {stat.lateDays}
                                  </div>
                                  <div className="text-[10px] text-gray-500">after 7am</div>
                                </button>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className={`text-xs font-semibold ${attendanceColor}`}>
                                  {stat.attendance === 'N/A' ? 'N/A' : `${stat.attendance}%`}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  of {stat.totalWorkingDays - stat.leave} days
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${performanceColor}`}>
                                  {performanceLevel}
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

              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/80">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-[10px] text-gray-700">
                      Showing {listStart} to {listEnd} of {filteredRepStats.length} results
                      <span className="ml-2 text-gray-500">
                        (Page {currentPage} of {totalPages})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-2 py-1 text-[10px] font-medium rounded-lg transition-colors ${
                                pageNum === currentPage
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          
          </>
        )}
      </div>

      {/* Enhanced Filter Modal */}
      {/* Late Days Detail Modal */}
      {lateDaysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <AlarmClock className="h-5 w-5 text-white" />
                <div>
                  <h2 className="text-base font-bold text-white">Late Check-ins</h2>
                  <p className="text-xs text-amber-100">{lateDaysModal.repName}</p>
                </div>
              </div>
              <button
                onClick={() => setLateDaysModal(null)}
                className="text-white hover:text-amber-200 transition-colors duration-150"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-header */}
            <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center justify-between flex-shrink-0">
              <p className="text-xs text-amber-700">
                Check-in threshold: <span className="font-semibold">7:00 AM</span> &nbsp;·&nbsp;
                <span className="font-semibold">{lateDaysModal.days.length}</span> late {lateDaysModal.days.length === 1 ? 'day' : 'days'} in selected range
              </p>
              <p className="text-[11px] text-amber-600 italic">
                {startDate} – {endDate}
              </p>
            </div>

            {/* Days List */}
            <div className="overflow-y-auto flex-1">
              {lateDaysModal.days.length === 0 ? (
                <div className="text-center py-16 text-xs text-gray-500">No late days found in this range.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-5 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">First Login</th>
                      <th className="px-5 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Time Late</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {lateDaysModal.days.map((day, idx) => {
                      const dateObj = new Date(day.date + 'T00:00:00');
                      const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                      const lateHrs = Math.floor(day.minutesLate / 60);
                      const lateMins = day.minutesLate % 60;
                      const lateLabel = lateHrs > 0 ? `${lateHrs}h ${lateMins}m` : `${lateMins}m`;
                      const severity = day.minutesLate > 120 ? 'bg-red-100 text-red-700' :
                        day.minutesLate > 60 ? 'bg-orange-100 text-orange-700' :
                        'bg-amber-100 text-amber-700';
                      return (
                        <tr key={day.date} className="hover:bg-amber-50 transition-colors duration-100">
                          <td className="px-5 py-3 text-xs text-gray-400">{idx + 1}</td>
                          <td className="px-5 py-3 text-xs text-gray-800 font-medium whitespace-nowrap">{dayLabel}</td>
                          <td className="px-5 py-3 text-center text-xs font-semibold text-amber-600 whitespace-nowrap">{day.firstLoginTime}</td>
                          <td className="px-5 py-3 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${severity}`}>
                              +{lateLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => {
                  const headers = ['#', 'Date', 'Day', 'First Login Time', 'Minutes Late', 'Time Late'];
                  const rows = lateDaysModal.days.map((day, idx) => {
                    const dateObj = new Date(day.date + 'T00:00:00');
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                    const lateHrs = Math.floor(day.minutesLate / 60);
                    const lateMins = day.minutesLate % 60;
                    const lateLabel = lateHrs > 0 ? `${lateHrs}h ${lateMins}m` : `${lateMins}m`;
                    return [idx + 1, day.date, dayName, day.firstLoginTime, day.minutesLate, lateLabel];
                  });
                  const csvContent = [
                    [`Late Check-ins Report – ${lateDaysModal.repName}`],
                    [`Date Range: ${startDate} to ${endDate}`],
                    [`Check-in Threshold: 7:00 AM`],
                    [],
                    headers,
                    ...rows,
                  ]
                    .map(row => row.map(f => '"' + String(f).replace(/"/g, '""') + '"').join(','))
                    .join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  saveAs(blob, `late_checkins_${lateDaysModal.repName.replace(/\s+/g, '_')}.csv`);
                }}
                className="inline-flex items-center px-3 py-1.5 border border-amber-300 rounded-lg text-xs font-medium text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 transition-colors duration-200"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export CSV
              </button>
              <button
                onClick={() => setLateDaysModal(null)}
                className="px-4 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filter Modal */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Filter Working Days</h2>
              <button
                onClick={() => setFilterModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
                         <div className="space-y-4">
              <div>
                 <label htmlFor="countryFilter" className="block text-xs font-medium text-gray-700 mb-1.5">
                   Country
                 </label>
                <select
                  id="countryFilter"
                   className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={pendingCountry}
                  onChange={e => setPendingCountry(e.target.value)}
                >
                  <option value="">All Countries</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
               
               <div>
                 <label htmlFor="statusFilter" className="block text-xs font-medium text-gray-700 mb-1.5">
                   Status
                 </label>
                 <select
                   id="statusFilter"
                   className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                   value={pendingStatus}
                   onChange={e => setPendingStatus(e.target.value)}
                 >
                   <option value="">All Statuses</option>
                   <option value="1">Active</option>
                   <option value="0">Inactive</option>
                 </select>
               </div>
               
              <div>
                 <label htmlFor="repFilter" className="block text-xs font-medium text-gray-700 mb-1.5">
                   Sales Representative
                 </label>
                <select
                  id="repFilter"
                   className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={pendingRep}
                  onChange={e => setPendingRep(e.target.value)}
                >
                  <option value="">All Sales Reps</option>
                  {filteredSalesReps.map(rep => (
                    <option key={rep.id} value={String(rep.id)}>{rep.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={pendingStartDate}
                  onChange={e => setPendingStartDate(e.target.value)}
                  max={pendingEndDate}
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-xs font-medium text-gray-700 mb-1.5">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={pendingEndDate}
                  onChange={e => setPendingEndDate(e.target.value)}
                  min={pendingStartDate}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                onClick={clearFilters}
              >
                Clear
              </button>
              <button
                className="px-3 py-1.5 border border-transparent rounded-lg shadow-sm text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                onClick={applyFilters}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesRepWorkingDaysPage; 