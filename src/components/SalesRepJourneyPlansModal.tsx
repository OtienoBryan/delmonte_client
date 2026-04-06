import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, User, Building, Calendar, Filter, Search } from 'lucide-react';

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

interface SalesRep {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: number;
  route_id_update?: number;
  route_name?: string;
}

interface SalesRepJourneyPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesRep: SalesRep;
  journeyPlans: JourneyPlan[];
  onStatusUpdate?: (planId: number, newStatus: number) => void;
}

const SalesRepJourneyPlansModal: React.FC<SalesRepJourneyPlansModalProps> = ({
  isOpen,
  onClose,
  salesRep,
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

  useEffect(() => {
    if (isOpen) {
      filterPlans();
    }
  }, [isOpen, journeyPlans, searchTerm, statusFilter, dateFilter]);

  const filterPlans = () => {
    // Filter plans for this specific sales rep
    let filtered = journeyPlans.filter(plan => plan.userId === salesRep.id);

    // Apply additional filters
    filtered = filtered.filter(plan => {
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
        return (
          (plan.client_name && plan.client_name.toLowerCase().includes(searchLower)) ||
          (plan.route_name && plan.route_name.toLowerCase().includes(searchLower)) ||
          plan.id.toString().includes(searchTerm)
        );
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  const handleStatusChange = async (planId: number, newStatus: number) => {
    try {
      const response = await fetch(`/api/journey-plans/${planId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        if (onStatusUpdate) {
          onStatusUpdate(planId, newStatus);
        }
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusCounts = () => {
    const repPlans = journeyPlans.filter(plan => plan.userId === salesRep.id);
    return {
      total: repPlans.length,
      pending: repPlans.filter(plan => plan.status === 0).length,
      inProgress: repPlans.filter(plan => plan.status === 1).length,
      completed: repPlans.filter(plan => plan.status === 2).length,
      cancelled: repPlans.filter(plan => plan.status === 3).length
    };
  };

  if (!isOpen) return null;

  const statusCounts = getStatusCounts();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{salesRep.name}</h2>
              <p className="text-sm text-gray-600">
                {salesRep.email} • {salesRep.phone || 'No phone'}
              </p>
              <p className="text-sm text-gray-500">
                Route: {salesRep.route_name || `ID: ${salesRep.route_id_update}` || 'No route assigned'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Status Summary */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-3">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              Total: {statusCounts.total}
            </span>
            <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
              Pending: {statusCounts.pending}
            </span>
            <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
              In Progress: {statusCounts.inProgress}
            </span>
            <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
              Completed: {statusCounts.completed}
            </span>
            <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
              Cancelled: {statusCounts.cancelled}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by client, route, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value={0}>Pending</option>
                <option value={1}>In Progress</option>
                <option value={2}>Completed</option>
                <option value={3}>Cancelled</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No journey plans found for {salesRep.name}</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters or create a new route plan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-gray-900">
                            {plan.client_name || `Client ID: ${plan.clientId}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-purple-500" />
                          <span className="text-gray-700">
                            {plan.route_name || `Route ID: ${plan.routeId}` || 'No route'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
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
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <span className="font-medium text-gray-700">Notes:</span>
                          <p className="text-gray-600 mt-1">{plan.notes}</p>
                        </div>
                      )}

                      {(plan.latitude && plan.longitude) && (
                        <div className="mt-3 text-sm text-blue-600">
                          📍 Coordinates: {plan.latitude.toFixed(6)}, {plan.longitude.toFixed(6)}
                        </div>
                      )}
                    </div>

                    {/* Status Update Actions */}
                    <div className="ml-4 flex flex-col gap-2">
                      {plan.status === 0 && (
                        <>
                          <button
                            onClick={() => handleStatusChange(plan.id, 1)}
                            className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md hover:bg-yellow-200 transition-colors"
                          >
                            Start Journey
                          </button>
                          <button
                            onClick={() => handleStatusChange(plan.id, 3)}
                            className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-md hover:bg-red-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {plan.status === 1 && (
                        <button
                          onClick={() => handleStatusChange(plan.id, 2)}
                          className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-md hover:bg-green-200 transition-colors"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredPlans.length} of {statusCounts.total} journey plans for {salesRep.name}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesRepJourneyPlansModal;
