import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, User, Building, Calendar, Filter, Search } from 'lucide-react';
import { patchWithAuth } from '../utils/fetchWithAuth';

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

interface PendingJourneyPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  journeyPlans: JourneyPlan[];
  onStatusUpdate?: (planId: number, newStatus: number) => void;
}

const PendingJourneyPlansModal: React.FC<PendingJourneyPlansModalProps> = ({
  isOpen,
  onClose,
  journeyPlans,
  onStatusUpdate
}) => {
  const [filteredPlans, setFilteredPlans] = useState<JourneyPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | 'all'>(0); // Default to pending (0)
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Force filter to pending (0) when modal opens
      setStatusFilter(0);
    }
  }, [isOpen]);

  const filterPlans = useCallback(() => {
    let filtered = journeyPlans.filter(plan => {
      // Status filter
      if (statusFilter !== 'all' && plan.status !== statusFilter) {
        return false;
      }

      // Date filter
      if (dateFilter && !plan.date.includes(dateFilter)) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matches = (
          (plan.user_name && plan.user_name.toLowerCase().includes(searchLower)) ||
          (plan.client_name && plan.client_name.toLowerCase().includes(searchLower)) ||
          plan.id.toString().includes(searchTerm)
        );
        return matches;
      }

      return true;
    });

    // Sort by date and time
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredPlans(filtered);
  }, [journeyPlans, searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    if (isOpen) {
      filterPlans();
    }
  }, [isOpen, filterPlans]);

  // Group plans by sales representative
  const getGroupedPlans = () => {
    const grouped: { [key: string]: JourneyPlan[] } = {};
    
    filteredPlans.forEach(plan => {
      const salesRepName = plan.user_name || `Sales Rep ID: ${plan.userId}`;
      if (!grouped[salesRepName]) {
        grouped[salesRepName] = [];
      }
      grouped[salesRepName].push(plan);
    });

    // Sort sales reps by name
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  const getStatusBadge = (status: number) => {
    const statusConfig = {
      0: { label: 'Pending', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
      1: { label: 'In Progress', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
      2: { label: 'Completed', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      3: { label: 'Cancelled', bgColor: 'bg-red-100', textColor: 'text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[0];
    
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  const handleStatusChange = async (planId: number, newStatus: number) => {
    try {
      const response = await patchWithAuth(`/api/journey-plans/${planId}`, {
        status: newStatus
      });

      if (response.ok) {
        if (onStatusUpdate) {
          onStatusUpdate(planId, newStatus);
        }
        // Refresh filtered plans
        filterPlans();
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getPendingPlansCount = () => {
    return journeyPlans.filter(plan => plan.status === 0).length;
  };

  const getInProgressPlansCount = () => {
    return journeyPlans.filter(plan => plan.status === 1).length;
  };

  if (!isOpen) return null;

  const groupedPlans = getGroupedPlans();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full flex flex-col overflow-hidden">
        {/* Modern Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <Clock className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Pending Journey Plans</h2>
              <p className="text-[10px] text-gray-600">
                {groupedPlans.length} rep{groupedPlans.length !== 1 ? 's' : ''} • {getPendingPlansCount()} pending • {getInProgressPlansCount()} in progress
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Compact Filters */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="flex-1 min-w-48">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by rep or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-[10px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3 w-3 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-2 py-1.5 text-[10px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value={0}>Pending</option>
                <option value={1}>In Progress</option>
                <option value={2}>Completed</option>
                <option value={3}>Cancelled</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-gray-500" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2 py-1.5 text-[10px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-xs">No journey plans found</p>
              <p className="text-gray-400 text-[10px]">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedPlans.map(([salesRepName, plans]) => (
                <div key={salesRepName} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  {/* Sales Rep Header */}
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                    <div className="w-5 h-5 bg-blue-600 rounded-lg flex items-center justify-center">
                      <User className="h-2.5 w-2.5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-900">{salesRepName}</h3>
                      <p className="text-[10px] text-gray-600">
                        {plans.length} plan{plans.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Journey Plans for this Sales Rep */}
                  <div className="space-y-2">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="bg-white border border-gray-200 rounded-lg p-2.5 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3 text-green-600" />
                                <span className="font-medium text-[10px] text-gray-900 truncate">
                                  {plan.client_name || `Client ID: ${plan.clientId}`}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 text-[10px] text-gray-600 mb-1.5">
                              <div>
                                <span className="font-medium">Date:</span> {new Date(plan.date).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">Time:</span> {plan.time}
                              </div>
                              <div>
                                <span className="font-medium">Status:</span> {getStatusBadge(plan.status)}
                              </div>
                            </div>

                            {plan.notes && (
                              <div className="mt-1.5 p-1.5 bg-gray-50 rounded-md">
                                <span className="font-medium text-[10px] text-gray-700">Notes:</span>
                                <p className="text-[10px] text-gray-600 mt-0.5">{plan.notes}</p>
                              </div>
                            )}

                            {(plan.latitude && plan.longitude) && (
                              <div className="mt-1.5 text-[10px] text-blue-600">
                                📍 {plan.latitude.toFixed(6)}, {plan.longitude.toFixed(6)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compact Footer */}
        <div className="p-2.5 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-600">
              Showing {filteredPlans.length} of {journeyPlans.length} plans
            </p>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-[10px] rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingJourneyPlansModal;
