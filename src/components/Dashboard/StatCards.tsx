import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from './StatCard';
import { TrendingUpIcon, BookCheck, LayoutList, BadgeCheck, BadgeInfo, HotelIcon, User2Icon, UsersIcon } from 'lucide-react';
import { requestService } from '../../services/requestService';
import { useAuth } from '../../contexts/AuthContext';

const StatCards: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    unscheduled: 0,
    pending: 0,
    inTransit: 0,
    completed: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        // Fetch requests for each status
        const [unscheduled, pending, inTransit] = await Promise.all([
          requestService.getRequests({ myStatus: 0 }),
          requestService.getRequests({ myStatus: 1 }),
          requestService.getRequests({ myStatus: 2 })
        ]);

        // Filter requests for the current user
        const userUnscheduled = unscheduled.filter(request => request.userId === user.id);
        const userPending = pending.filter(request => request.userId === user.id);
        const userInTransit = inTransit.filter(request => request.userId === user.id);

        setStats({
          unscheduled: userUnscheduled.length,
          pending: userPending.length,
          inTransit: userInTransit.length,
          completed: 0 // You can add completed requests if needed
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div onClick={() => navigate('/dashboard/unscheduled')} className="cursor-pointer">
        <StatCard 
          position={1} 
          title="Guards" 
          value={isLoading ? '...' : stats.unscheduled} 
          icon={<UsersIcon className="h-6 w-6 text-red-600" aria-hidden="true" />} 
          change={{
            value: 0,
            positive: true
          }} 
        />
      </div>
      <div onClick={() => navigate('/dashboard/pending')} className="cursor-pointer">
        <StatCard 
          position={2} 
          title="Supervisers" 
          value={isLoading ? '...' : stats.pending} 
          icon={<UsersIcon className="h-6 w-6 text-red-600" aria-hidden="true" />} 
          change={{
            value: 0,
            positive: true
          }} 
        />
      </div>
      <div onClick={() => navigate('/dashboard/in-transit')} className="cursor-pointer">
        <StatCard 
          position={3} 
          title="Premises" 
          value={isLoading ? '...' : stats.inTransit} 
          icon={<HotelIcon className="h-6 w-6 text-red-600" aria-hidden="true" />} 
          change={{
            value: 0,
            positive: true
          }} 
        />
      </div>

    </div>
  );
};

export default StatCards;