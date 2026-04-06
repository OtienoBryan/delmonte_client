import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const MyAccountPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="text-center text-gray-500 py-16">No user is logged in.</div>;
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600 mb-4">
          {user.username[0]}
        </div>
        <h2 className="text-2xl font-bold mb-2">{user.username}</h2>
        <div className="text-gray-500 mb-4">{user.role}</div>
        <div className="w-full">
          <div className="mb-2 flex justify-between text-gray-700">
            <span className="font-medium">Username:</span>
            <span>{user.username}</span>
          </div>
          <div className="mb-2 flex justify-between text-gray-700">
            <span className="font-medium">Email:</span>
            <span>{user.email}</span>
          </div>
          <div className="mb-2 flex justify-between text-gray-700">
            <span className="font-medium">Role:</span>
            <span className="capitalize">{user.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccountPage; 