import React from 'react';
import ClientsTable from '../components/Dashboard/ClientsTable';

const ClientsWithBalancesPage: React.FC = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Clients & Balances</h1>
          <p className="mt-2 text-sm text-gray-700">View all clients and their current receivable balances.</p>
        </div>
      </div>
      <div className="mt-8">
        <ClientsTable showBalances={true} />
      </div>
    </div>
  );
};

export default ClientsWithBalancesPage; 