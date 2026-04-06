import React from 'react';
import { Outlet } from 'react-router-dom';
import StatCards from './StatCards';

const DashboardLayout: React.FC = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
       
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;