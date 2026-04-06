import React, { useState, useEffect } from 'react';
import RequestFormModal from '../components/Requests/RequestFormModal';
import JourneyTable from '../components/Requests/JourneyTable';
import { JourneyPlan, journeyService } from '../services/journeyService';
import { useAuth } from '../contexts/AuthContext';
import StatCards from '../components/Dashboard/StatCards';

const UnscheduledRequestsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [journeyPlans, setJourneyPlans] = useState<JourneyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchJourneyPlans = async () => {
    if (!user?.id) return;
    
    try {
      // Fetch journey plans with status = pending
      const data = await journeyService.getJourneyPlans({ status: 'pending' });
      setJourneyPlans(data);
    } catch (error) {
      console.error('Error fetching journey plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneyPlans();
  }, [user?.id]); // Re-fetch when user ID changes

  const handleSuccess = () => {
    fetchJourneyPlans(); // Refresh the table data after successful submission
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-8">
        <StatCards/>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Round Reports
            </h3>
          </div>
          <div className="p-2">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <JourneyTable
                journeyPlans={journeyPlans}
              />
            )}
          </div>
        </div>
      </div>

      <RequestFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default UnscheduledRequestsPage;