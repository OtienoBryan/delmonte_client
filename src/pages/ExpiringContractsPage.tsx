import React, { useEffect, useState } from 'react';
import { staffService } from '../services/staffService';

interface ExpiringContract {
  id: number;
  staff_id: number;
  staff_name: string;
  file_name: string;
  file_url: string;
  end_date: string;
}

const ExpiringContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<ExpiringContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await staffService.getExpiringContracts();
        setContracts(data);
      } catch (err) {
        setError('Failed to fetch expiring contracts.');
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow rounded-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Expiring Employee Contracts</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 text-left">Employee</th>
              <th className="px-2 py-1 text-left">Contract File</th>
              <th className="px-2 py-1 text-left">End Date</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(contract => (
              <tr key={contract.id} className="border-t">
                <td className="px-2 py-1">{contract.staff_name}</td>
                <td className="px-2 py-1">
                  <a href={contract.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {contract.file_name}
                  </a>
                </td>
                <td className="px-2 py-1">{new Date(contract.end_date).toLocaleDateString()}</td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr><td colSpan={3} className="text-center text-gray-400 py-2">No expiring contracts found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ExpiringContractsPage; 