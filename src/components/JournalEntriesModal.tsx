import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { journalEntriesService } from '../services/financialService';

interface JournalEntryLine {
  journal_entry_id: number;
  entry_number: string;
  entry_date: string;
  reference: string;
  journal_description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  created_at: string;
  line_id: number;
  account_id: number;
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  line_description: string;
}

interface JournalEntriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: {
    id: number;
    account_code: string;
    account_name: string;
    balance: number;
  } | null;
}

const JournalEntriesModal: React.FC<JournalEntriesModalProps> = ({ isOpen, onClose, account }) => {
  const [entries, setEntries] = useState<JournalEntryLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && account) {
      fetchJournalEntries();
    }
  }, [isOpen, account]);

  const fetchJournalEntries = async () => {
    if (!account) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching journal entries for account:', account);
      console.log('Account ID:', account.id);
      console.log('Account Code:', account.account_code);
      
      // First, try to get all journal entries to see if the API is working
      try {
        const allEntriesResponse = await journalEntriesService.getAll();
        console.log('All entries response:', allEntriesResponse);
        console.log('Total entries available:', allEntriesResponse.data?.length || 0);
        
        // Check if any entries have the same account_id as our account
        if (allEntriesResponse.data) {
          const matchingEntries = allEntriesResponse.data.filter((entry: any) => 
            entry.account_id === account.id
          );
          console.log('Entries matching account ID:', matchingEntries.length);
          console.log('Matching entries:', matchingEntries);
          
          // Also check by account_code
          const matchingByCode = allEntriesResponse.data.filter((entry: any) => 
            entry.account_code === account.account_code
          );
          console.log('Entries matching account code:', matchingByCode.length);
          console.log('Matching by code:', matchingByCode);
        }
      } catch (allEntriesError) {
        console.log('Could not fetch all entries:', allEntriesError);
      }
      
                    // Use the getByAccount method with account ID from chart_of_accounts table
       console.log('Calling getByAccount with ID:', account.id);
       const response = await journalEntriesService.getByAccount(account.id);
       console.log('API response by ID:', response);
       console.log('Response success:', response.success);
       console.log('Response data length:', response.data?.length || 0);
      
      if (response.success && response.data) {
        setEntries(response.data);
        console.log('Journal entries set:', response.data);
        console.log('Entries count:', response.data.length);
      } else {
        setError(response.error || 'Failed to fetch journal entries');
        console.error('API error:', response.error);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch journal entries');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate running balance for each entry
  const calculateRunningBalance = (entries: JournalEntryLine[]) => {
    // Sort entries by ID in descending order (highest ID first)
    const sortedEntries = [...entries].sort((a, b) => b.line_id - a.line_id);
    
    // For running balance calculation, we need to reverse the order to calculate from oldest to newest
    const chronologicalEntries = [...sortedEntries].reverse();
    
    let runningBalance = 0;
    const entriesWithBalance = chronologicalEntries.map(entry => {
      // For asset accounts: debits increase, credits decrease
      // For liability/equity accounts: credits increase, debits decrease
      // We'll use the current account balance as a reference to determine account type
      const isAssetAccount = (account?.balance || 0) >= 0; // Simple heuristic
      
      if (isAssetAccount) {
        runningBalance += (entry.debit_amount || 0) - (entry.credit_amount || 0);
      } else {
        runningBalance += (entry.credit_amount || 0) - (entry.debit_amount || 0);
      }
      
      return {
        ...entry,
        runningBalance
      };
    });
    
    // Return in descending order (highest ID first) for display
    return entriesWithBalance.reverse();
  };

  const entriesWithBalance = calculateRunningBalance(entries);

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
             <div className="bg-white rounded-lg shadow-xl max-w-8xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Journal Entries</h2>
            <p className="text-gray-600 mt-1">
              {account.account_code} - {account.account_name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Current Balance: <span className="font-semibold">{formatCurrency(account.balance)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-600">Loading journal entries...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-medium">Error loading journal entries:</p>
              <p>{error}</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No journal entries found for this account</p>
              <p className="text-sm text-gray-400 mt-2">Account: {account.account_code} - {account.account_name}</p>
            </div>
          ) : (
            <div className="space-y-4">
                             {/* Summary */}
               <div className="bg-gray-50 rounded-lg p-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                   <div className="text-center">
                     <p className="text-sm font-medium text-gray-600">Total Entries</p>
                     <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
                   </div>
                   <div className="text-center">
                     <p className="text-sm font-medium text-gray-600">Total Debits</p>
                     <p className="text-2xl font-bold text-green-600">
                       {formatCurrency(entries.reduce((sum, entry) => sum + entry.debit_amount, 0))}
                     </p>
                   </div>
                   <div className="text-center">
                     <p className="text-sm font-medium text-gray-600">Total Credits</p>
                     <p className="text-2xl font-bold text-red-600">
                       {formatCurrency(entries.reduce((sum, entry) => sum + entry.credit_amount, 0))}
                     </p>
                   </div>
                   <div className="text-center">
                     <p className="text-sm font-medium text-gray-600">Starting Balance</p>
                     <p className="text-2xl font-bold text-blue-600">
                       {formatCurrency(account.balance - entries.reduce((sum, entry) => {
                         const isAssetAccount = (account.balance || 0) >= 0;
                         if (isAssetAccount) {
                           return sum + (entry.debit_amount || 0) - (entry.credit_amount || 0);
                         } else {
                           return sum + (entry.credit_amount || 0) - (entry.debit_amount || 0);
                         }
                       }, 0))}
                     </p>
                   </div>
                   <div className="text-center">
                     <p className="text-sm font-medium text-gray-600">Current Balance</p>
                     <p className="text-2xl font-bold text-gray-900">
                       {formatCurrency(account.balance)}
                     </p>
                   </div>
                 </div>
               </div>

              {/* Entries Table */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entry #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Debit
                        </th>
                                                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Credit
                         </th>
                         <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Running Balance
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Status
                         </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {entriesWithBalance.map((entry) => (
                        <tr key={entry.line_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              {formatDate(entry.entry_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                            {entry.entry_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {entry.reference || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                            <div className="truncate" title={entry.line_description || entry.journal_description}>
                              {entry.line_description || entry.journal_description || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {entry.debit_amount > 0 ? (
                              <span className="text-green-600 font-medium flex items-center justify-end">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                {formatCurrency(entry.debit_amount)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {entry.credit_amount > 0 ? (
                              <span className="text-red-600 font-medium flex items-center justify-end">
                                <TrendingDown className="w-4 h-4 mr-1" />
                                {formatCurrency(entry.credit_amount)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span className={`font-medium ${
                              (entry as any).runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency((entry as any).runningBalance)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              entry.status === 'posted' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalEntriesModal;
