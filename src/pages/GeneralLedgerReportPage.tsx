import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generalLedgerService, chartOfAccountsService } from '../services/financialService';
import { GeneralLedgerEntry, ChartOfAccount } from '../types/financial';

function calculatePerAccountRunningBalance(entries: GeneralLedgerEntry[]): GeneralLedgerEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (a.account_code !== b.account_code) {
      return a.account_code.localeCompare(b.account_code);
    }
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.id - b.id;
  });
  const balances: Record<string, number> = {};
  return sorted.map(entry => {
    const acc = entry.account_code;
    if (!(acc in balances)) balances[acc] = 0;
    balances[acc] += (entry.debit || 0) - (entry.credit || 0);
    return { ...entry, balance: balances[acc] };
  });
}

const GeneralLedgerReportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [entries, setEntries] = useState<GeneralLedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set selected account from URL parameter on mount
  useEffect(() => {
    const accountFromUrl = searchParams.get('account');
    if (accountFromUrl) {
      setSelectedAccount(accountFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchEntries();
    fetchAccounts();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await generalLedgerService.getEntries();
      if (response.success && response.data) {
        setEntries(calculatePerAccountRunningBalance(response.data));
      } else {
        setError(response.error || 'Failed to fetch general ledger entries');
      }
    } catch (err) {
      setError('Failed to fetch general ledger entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await chartOfAccountsService.getAll();
      if (response.success && response.data) {
        setAccounts(response.data);
      }
    } catch (err) {
      // ignore for now
    }
  };

  // Filter entries by selected account, date range, and search term
  const accountFilteredEntries = selectedAccount
    ? entries.filter(e => e.account_code === selectedAccount)
    : entries;

  const dateFilteredEntries = accountFilteredEntries.filter(e => {
    if (!startDate && !endDate) return true;
    const entryDate = e.date;
    if (startDate && entryDate < startDate) return false;
    if (endDate && entryDate > endDate) return false;
    return true;
  });

  const searchFilteredEntries = dateFilteredEntries.filter(e => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (e.description && e.description.toLowerCase().includes(term)) ||
      (e.reference && e.reference.toLowerCase().includes(term)) ||
      (e.account_code && e.account_code.toLowerCase().includes(term)) ||
      (e.account_name && e.account_name.toLowerCase().includes(term))
    );
  });

  // Recalculate running balance for filtered entries to ensure accuracy
  const recalculateBalance = (entriesToCalc: GeneralLedgerEntry[]) => {
    const sorted = [...entriesToCalc].sort((a, b) => {
      if (a.account_code !== b.account_code) {
        return a.account_code.localeCompare(b.account_code);
      }
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.id - b.id;
    });
    const balances: Record<string, number> = {};
    return sorted.map(entry => {
      const acc = entry.account_code;
      if (!(acc in balances)) balances[acc] = 0;
      balances[acc] += (entry.debit || 0) - (entry.credit || 0);
      return { ...entry, balance: balances[acc] };
    });
  };

  // Sort descending by date and id for display
  const filteredEntries = recalculateBalance(searchFilteredEntries).sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date); // descending by date
    }
    return b.id - a.id; // descending by id
  });

  const selectedAccountDetails = accounts.find(acc => acc.account_code === selectedAccount);

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-2">General Ledger Report</h1>
        {selectedAccount && selectedAccountDetails && (
          <div className="mb-3 flex items-center gap-2">
            <div className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg">
              <span className="text-xs font-semibold">Viewing Account: </span>
              <span className="ml-2 text-xs">{selectedAccount} - {selectedAccountDetails.account_name}</span>
              <button
                onClick={() => setSelectedAccount('')}
                className="ml-2 text-blue-600 hover:text-blue-800 font-bold text-xs"
                title="Clear filter"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {/* Filters */}
        <div className="mb-3 flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label htmlFor="account-select" className="text-xs font-medium text-gray-700">Account:</label>
            <select
              id="account-select"
              className="border border-gray-300 rounded px-2 py-1.5 text-xs"
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
            >
              <option value="">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.account_code} value={acc.account_code}>
                  {acc.account_code} - {acc.account_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="start-date" className="text-xs font-medium text-gray-700">Start Date:</label>
            <input
              id="start-date"
              type="date"
              className="border border-gray-300 rounded px-2 py-1.5 text-xs"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="end-date" className="text-xs font-medium text-gray-700">End Date:</label>
            <input
              id="end-date"
              type="date"
              className="border border-gray-300 rounded px-2 py-1.5 text-xs"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="search-input" className="text-xs font-medium text-gray-700">Search:</label>
            <input
              id="search-input"
              type="text"
              className="border border-gray-300 rounded px-2 py-1.5 text-xs"
              placeholder="Description, reference, account..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Dates
            </button>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-xs text-red-600 text-center">
              <div className="mb-2">{error}</div>
              <button onClick={fetchEntries} className="bg-blue-600 text-white px-3 py-1.5 text-xs rounded-lg hover:bg-blue-700">Retry</button>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-xs text-gray-500 text-center">No general ledger entries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Account Code</th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Account Name</th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-green-700 uppercase">Debit</th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-red-700 uppercase">Credit</th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-indigo-700 uppercase bg-indigo-50">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredEntries.map(entry => (
                    <tr key={entry.id}>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{entry.date}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{entry.account_code}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{entry.account_name}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{entry.description || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{entry.reference || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-green-700 text-right font-medium">{entry.debit ? entry.debit.toLocaleString() : '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-red-700 text-right font-medium">{entry.credit ? entry.credit.toLocaleString() : '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-indigo-900 font-bold text-right bg-indigo-50">{entry.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralLedgerReportPage; 