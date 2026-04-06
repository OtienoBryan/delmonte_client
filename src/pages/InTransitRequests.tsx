import React, { useState, useEffect } from 'react';
import RequestsTable from '../components/Requests/RequestsTable';
import { RequestData, requestService } from '../services/requestService';
import { useAuth } from '../contexts/AuthContext';
import StatCards from '../components/Dashboard/StatCards';
import { MapPin } from 'lucide-react';
import LocationModal from '../components/Requests/LocationModal';

const InTransitRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const fetchRequests = async () => {
    if (!user?.id) return;
    
    try {
      // Fetch requests with myStatus = 2 (in transit)
      const data = await requestService.getRequests({ myStatus: 2 });
      // Filter requests to only show those belonging to the current user
      const userRequests = data.filter(request => request.userId === user.id);
      setRequests(userRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.id]); // Re-fetch when user ID changes

  const handleViewLocation = (request: RequestData) => {
    console.log('Button clicked for request:', request); // Debug log
    console.log('Current latitude:', request.current_latitude); // Debug log
    console.log('Current longitude:', request.current_longitude); // Debug log
    setSelectedRequest(request);
    setIsLocationModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <StatCards />
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">In-Transit Requests</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pickup Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dropoff Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{request.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.service_type_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.pickupLocation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.dropoff_location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      In Transit
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleViewLocation(request)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      View Location
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => {
            console.log('Closing modal'); // Debug log
            setIsLocationModalOpen(false);
            setSelectedRequest(null);
          }}
          latitude={selectedRequest.current_latitude}
          longitude={selectedRequest.current_longitude}
          requestId={selectedRequest.id}
        />
      )}
    </div>
  );
};

export default InTransitRequestsPage; 