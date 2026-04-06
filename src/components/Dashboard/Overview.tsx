import React from 'react';
import ClientsTable from './ClientsTable';
import RecentActivity from './RecentActivity';
const Overview: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Clients
            </h3>
          </div>
          <div className="p-2">
            <ClientsTable />
          </div>
        </div>
      </div>
      <div>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Activity
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Overview;