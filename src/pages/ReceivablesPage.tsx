import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AgingReceivable {
  customer_id: number;
  client_name: string;
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
  total_receivable: number;
}

interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: number;
}

interface Receipt {
  id: number;
  customer_id: number;
  receipt_number: string;
  receipt_date: string;
  amount: number;
  payment_method: string;
  account_id: number;
  reference: string;
  notes: string;
  status: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ReceivablesPage: React.FC = () => {
  const [receivables, setReceivables] = useState<AgingReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Summary state
  const [summary, setSummary] = useState({
    current: 0,
    days_1_30: 0,
    days_31_60: 0,
    days_61_90: 0,
    days_90_plus: 0,
    total_receivable: 0
  });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchReceivables();
  }, [currentPage, itemsPerPage, searchTerm]);

  const fetchReceivables = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (itemsPerPage === 'all') {
        // When "All" is selected, set a very large limit to fetch all records
        params.append('page', '1');
        params.append('limit', '999999');
      } else {
        params.append('page', currentPage.toString());
        params.append('limit', itemsPerPage.toString());
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const res = await axios.get(`${API_BASE_URL}/financial/receivables/aging?${params.toString()}`);
      if (res.data.success) {
        // Validate and clean the data
        const validatedData = res.data.data.map((item: any) => ({
          ...item,
          current: Number(item.current) || 0,
          days_1_30: Number(item.days_1_30) || 0,
          days_31_60: Number(item.days_31_60) || 0,
          days_61_90: Number(item.days_61_90) || 0,
          days_90_plus: Number(item.days_90_plus) || 0,
          total_receivable: Number(item.total_receivable) || 0
        }));
        
        console.log('Receivables data:', validatedData);
        setReceivables(validatedData);
        
        // Update pagination info
        if (res.data.pagination) {
          setTotalRecords(res.data.pagination.total);
          setTotalPages(res.data.pagination.totalPages);
        }
        
        // Update summary from server
        if (res.data.summary) {
          setSummary({
            current: Number(res.data.summary.current) || 0,
            days_1_30: Number(res.data.summary.days_1_30) || 0,
            days_31_60: Number(res.data.summary.days_31_60) || 0,
            days_61_90: Number(res.data.summary.days_61_90) || 0,
            days_90_plus: Number(res.data.summary.days_90_plus) || 0,
            total_receivable: Number(res.data.summary.total_receivable) || 0
          });
        }
      } else {
        setError(res.data.error || 'Failed to fetch receivables');
      }
    } catch (err: any) {
      console.error('Error fetching receivables:', err);
      setError(err.message || 'Failed to fetch receivables');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(amount);

  // Reset to first page when itemsPerPage changes (search reset is handled in search debounce)
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    
    try {
      setGeneratingPdf(true);
      const element = pdfRef.current;
      
      // Create canvas from the element with higher quality
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
      
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10; // 10mm margin on all sides
      const imgWidth = pageWidth - (margin * 2); // Leave margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = margin; // Top margin
      
      // Add first page
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - (margin * 2)); // Subtract page height minus margins
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - (margin * 2));
      }
      
      const filename = `aging_receivables_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-3">
        <div className="max-w-8xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-2.5">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2">
                <h3 className="text-xs font-medium text-red-800">Error</h3>
                <div className="mt-1 text-xs text-red-700">{error}</div>
              </div>
              </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm font-bold text-gray-900">Aging Receivables</h1>
          <button
            onClick={handleExportPDF}
            disabled={generatingPdf || receivables.length === 0}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="Export to PDF"
          >
            <Download className="w-3 h-3 mr-1.5" />
            {generatingPdf ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
        
        {/* Summary Cards - Visible on screen */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-3">
          <div className="bg-white rounded-md shadow-sm p-2.5">
            <div className="text-[9px] font-medium text-gray-500">Total Receivables</div>
            <div className="text-xs font-bold text-blue-600">
              {formatCurrency(summary.total_receivable)}
            </div>
          </div>
          <div className="bg-white rounded-md shadow-sm p-2.5">
            <div className="text-[9px] font-medium text-gray-500">Current (0 days)</div>
            <div className="text-xs font-bold text-green-600">
              {formatCurrency(summary.current)}
            </div>
          </div>
          <div className="bg-white rounded-md shadow-sm p-2.5">
            <div className="text-[9px] font-medium text-gray-500">1-30 Days</div>
            <div className="text-xs font-bold text-yellow-600">
              {formatCurrency(summary.days_1_30)}
            </div>
          </div>
          <div className="bg-white rounded-md shadow-sm p-2.5">
            <div className="text-[9px] font-medium text-gray-500">31-60 Days</div>
            <div className="text-xs font-bold text-orange-600">
              {formatCurrency(summary.days_31_60)}
            </div>
          </div>
          <div className="bg-white rounded-md shadow-sm p-2.5">
            <div className="text-[9px] font-medium text-gray-500">61-90 Days</div>
            <div className="text-xs font-bold text-red-600">
              {formatCurrency(summary.days_61_90)}
            </div>
          </div>
          <div className="bg-white rounded-md shadow-sm p-2.5">
            <div className="text-[9px] font-medium text-gray-500">90+ Days</div>
            <div className="text-xs font-bold text-red-700">
              {formatCurrency(summary.days_90_plus)}
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="bg-white rounded-md shadow-sm p-3 mb-3">
          <div className="max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search customers..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            </div>
            {searchTerm && (
              <div className="mt-1.5 text-[10px] text-gray-600">
                Found {totalRecords} customer{totalRecords !== 1 ? 's' : ''} matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
       
        {/* No Data Message */}
        {receivables.length === 0 && !loading && (
          <div className="bg-white shadow-sm rounded-md p-6 text-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-8 w-8 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xs font-medium text-gray-900 mb-1.5">
                {searchTerm ? 'No Customers Found' : 'No Receivables Found'}
              </h3>
              <p className="text-xs text-gray-500">
                {searchTerm 
                  ? `No customers found matching "${searchTerm}". Try adjusting your search.`
                  : 'There are currently no outstanding receivables to display.'
                }
              </p>
            </div>
          </div>
        )}
        
        {/* PDF Content - This is what will be exported (hidden on screen) */}
        <div ref={pdfRef} className="bg-white" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm', padding: '12mm', fontFamily: 'Arial, sans-serif' }}>
          {/* Professional Header */}
          <div className="border-b-2 border-blue-600 pb-3 mb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-base font-bold text-gray-900 mb-1" style={{ fontSize: '16px', marginBottom: '4px' }}>Moonsun Trade International Limited</h1>
                <p className="text-gray-600" style={{ fontSize: '9px', lineHeight: '1.3' }}>P.O Box 15470, Nairobi Kenya</p>
                <p className="text-gray-600" style={{ fontSize: '9px', lineHeight: '1.3' }}>Tax PIN: P051904794X</p>
              </div>
              <div className="text-right">
                <h2 className="text-blue-600 font-bold mb-2" style={{ fontSize: '14px', marginBottom: '6px' }}>AGING RECEIVABLES REPORT</h2>
                <div className="bg-gray-50 p-2 border border-gray-300" style={{ padding: '6px', borderRadius: '4px' }}>
                  <p className="text-gray-700" style={{ fontSize: '8px', marginBottom: '2px' }}>
                    Generated: {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {searchTerm && (
                    <p className="text-gray-700" style={{ fontSize: '8px' }}>
                      Filter: "{searchTerm}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        
          {/* Summary Section - Compact */}
          <div className="mb-3" style={{ marginBottom: '10px' }}>
            <h3 className="font-bold text-gray-900 mb-2 uppercase border-b border-gray-300 pb-1" style={{ fontSize: '10px', marginBottom: '6px', paddingBottom: '3px' }}>Summary</h3>
            <div className="grid grid-cols-6 gap-1.5" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
              <div className="bg-gray-50 p-2 border border-gray-300 text-center" style={{ padding: '6px', borderRadius: '3px' }}>
                <div className="text-gray-600 font-medium mb-1" style={{ fontSize: '7px', marginBottom: '2px' }}>Total</div>
                <div className="font-bold text-blue-600" style={{ fontSize: '9px' }}>{formatCurrency(summary.total_receivable)}</div>
              </div>
              <div className="bg-green-50 p-2 border border-green-200 text-center" style={{ padding: '6px', borderRadius: '3px' }}>
                <div className="text-gray-600 font-medium mb-1" style={{ fontSize: '7px', marginBottom: '2px' }}>Current</div>
                <div className="font-bold text-green-700" style={{ fontSize: '9px' }}>{formatCurrency(summary.current)}</div>
              </div>
              <div className="bg-yellow-50 p-2 border border-yellow-200 text-center" style={{ padding: '6px', borderRadius: '3px' }}>
                <div className="text-gray-600 font-medium mb-1" style={{ fontSize: '7px', marginBottom: '2px' }}>1-30</div>
                <div className="font-bold text-yellow-700" style={{ fontSize: '9px' }}>{formatCurrency(summary.days_1_30)}</div>
              </div>
              <div className="bg-orange-50 p-2 border border-orange-200 text-center" style={{ padding: '6px', borderRadius: '3px' }}>
                <div className="text-gray-600 font-medium mb-1" style={{ fontSize: '7px', marginBottom: '2px' }}>31-60</div>
                <div className="font-bold text-orange-700" style={{ fontSize: '9px' }}>{formatCurrency(summary.days_31_60)}</div>
              </div>
              <div className="bg-red-50 p-2 border border-red-200 text-center" style={{ padding: '6px', borderRadius: '3px' }}>
                <div className="text-gray-600 font-medium mb-1" style={{ fontSize: '7px', marginBottom: '2px' }}>61-90</div>
                <div className="font-bold text-red-700" style={{ fontSize: '9px' }}>{formatCurrency(summary.days_61_90)}</div>
              </div>
              <div className="bg-red-100 p-2 border border-red-300 text-center" style={{ padding: '6px', borderRadius: '3px' }}>
                <div className="text-gray-700 font-medium mb-1" style={{ fontSize: '7px', marginBottom: '2px' }}>90+</div>
                <div className="font-bold text-red-800" style={{ fontSize: '9px' }}>{formatCurrency(summary.days_90_plus)}</div>
              </div>
            </div>
          </div>
        
          {/* Receivables Table for PDF - Compact */}
          {receivables.length > 0 && (
            <div className="overflow-hidden">
              <h3 className="font-bold text-gray-900 mb-2 uppercase border-b border-gray-300 pb-1" style={{ fontSize: '10px', marginBottom: '6px', paddingBottom: '3px', marginTop: '8px' }}>Customer Receivables</h3>
              <table className="min-w-full border border-gray-400" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '8px' }}>
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-800 uppercase" style={{ padding: '4px 6px', fontSize: '8px', fontWeight: 'bold' }}>Customer</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-right font-bold text-gray-800 uppercase" style={{ padding: '4px 6px', fontSize: '8px', fontWeight: 'bold' }}>Current</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-right font-bold text-gray-800 uppercase" style={{ padding: '4px 6px', fontSize: '8px', fontWeight: 'bold' }}>1-30</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-right font-bold text-gray-800 uppercase" style={{ padding: '4px 6px', fontSize: '8px', fontWeight: 'bold' }}>31-60</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-right font-bold text-gray-800 uppercase" style={{ padding: '4px 6px', fontSize: '8px', fontWeight: 'bold' }}>61-90</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-right font-bold text-gray-800 uppercase" style={{ padding: '4px 6px', fontSize: '8px', fontWeight: 'bold' }}>90+</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-right font-bold text-gray-800 uppercase" style={{ padding: '4px 6px', fontSize: '8px', fontWeight: 'bold' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((r, index) => (
                    <tr key={r.customer_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-400 px-2 py-1 text-gray-900" style={{ padding: '3px 6px', fontSize: '8px' }}>{r.client_name}</td>
                      <td className="border border-gray-400 px-2 py-1 text-right text-green-700" style={{ padding: '3px 6px', fontSize: '8px' }}>{formatCurrency(r.current)}</td>
                      <td className="border border-gray-400 px-2 py-1 text-right text-yellow-700" style={{ padding: '3px 6px', fontSize: '8px' }}>{formatCurrency(r.days_1_30)}</td>
                      <td className="border border-gray-400 px-2 py-1 text-right text-orange-700" style={{ padding: '3px 6px', fontSize: '8px' }}>{formatCurrency(r.days_31_60)}</td>
                      <td className="border border-gray-400 px-2 py-1 text-right text-red-700" style={{ padding: '3px 6px', fontSize: '8px' }}>{formatCurrency(r.days_61_90)}</td>
                      <td className="border border-gray-400 px-2 py-1 text-right text-white bg-red-700" style={{ padding: '3px 6px', fontSize: '8px' }}>{formatCurrency(r.days_90_plus)}</td>
                      <td className="border border-gray-400 px-2 py-1 text-right font-bold text-gray-900" style={{ padding: '3px 6px', fontSize: '8px', fontWeight: 'bold' }}>{formatCurrency(r.total_receivable)}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-gray-200 font-bold">
                    <td className="border border-gray-400 px-2 py-1.5 text-gray-900" style={{ padding: '4px 6px', fontSize: '8px', fontWeight: 'bold' }}>TOTAL</td>
                    <td className="border border-gray-400 px-2 py-1.5 text-right text-green-800" style={{ padding: '4px 6px', fontSize: '8px', fontWeight: 'bold' }}>{formatCurrency(summary.current)}</td>
                    <td className="border border-gray-400 px-2 py-1.5 text-right text-yellow-800" style={{ padding: '4px 6px', fontSize: '8px', fontWeight: 'bold' }}>{formatCurrency(summary.days_1_30)}</td>
                    <td className="border border-gray-400 px-2 py-1.5 text-right text-orange-800" style={{ padding: '4px 6px', fontSize: '8px', fontWeight: 'bold' }}>{formatCurrency(summary.days_31_60)}</td>
                    <td className="border border-gray-400 px-2 py-1.5 text-right text-red-800" style={{ padding: '4px 6px', fontSize: '8px', fontWeight: 'bold' }}>{formatCurrency(summary.days_61_90)}</td>
                    <td className="border border-gray-400 px-2 py-1.5 text-right text-white bg-red-800" style={{ padding: '4px 6px', fontSize: '8px', fontWeight: 'bold' }}>{formatCurrency(summary.days_90_plus)}</td>
                    <td className="border border-gray-400 px-2 py-1.5 text-right text-blue-800" style={{ padding: '4px 6px', fontSize: '9px', fontWeight: 'bold' }}>{formatCurrency(summary.total_receivable)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          
          {/* Footer */}
          <div className="mt-4 pt-2 border-t border-gray-300 text-center" style={{ marginTop: '12px', paddingTop: '6px', fontSize: '7px', color: '#666' }}>
            <p>This report was generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>Page 1 of 1</p>
          </div>
        </div>
        
        {/* Receivables Table - Screen view only (clickable) */}
        {receivables.length > 0 && (
          <div className="bg-white shadow-sm overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                  <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-3 py-2 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">Current</th>
                  <th className="px-3 py-2 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">1-30 Days</th>
                  <th className="px-3 py-2 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">31-60 Days</th>
                  <th className="px-3 py-2 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">61-90 Days</th>
                  <th className="px-3 py-2 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">90+ Days</th>
                  <th className="px-3 py-2 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {receivables.map((r) => (
                <tr key={r.customer_id} onClick={() => navigate(`/receivables/customer/${r.customer_id}`)} className="cursor-pointer hover:bg-blue-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{r.client_name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-green-700 text-right">{formatCurrency(r.current)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-yellow-700 bg-yellow-50 text-right">{formatCurrency(r.days_1_30)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-orange-700 bg-orange-50 text-right">{formatCurrency(r.days_31_60)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-red-700 bg-red-50 text-right">{formatCurrency(r.days_61_90)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-white bg-red-700 text-right">{formatCurrency(r.days_90_plus)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 font-bold text-right">{formatCurrency(r.total_receivable)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
            {(totalPages > 1 || itemsPerPage === 'all') && (
              <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] text-gray-600">Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                          const value = e.target.value;
                          if (value === 'all') {
                            setItemsPerPage('all');
                          } else {
                            setItemsPerPage(Number(value));
                          }
                        setCurrentPage(1);
                      }}
                        className="border border-gray-300 rounded-md px-2 py-0.5 text-[10px] focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                        <option value="all">All</option>
                    </select>
                      <span className="text-[10px] text-gray-600">per page</span>
                    </div>
                    
                    <div className="text-[10px] text-gray-600">
                      {itemsPerPage === 'all' 
                        ? `Showing all ${totalRecords} customers`
                        : `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalRecords)} of ${totalRecords} customers`
                      }
                    </div>
                  </div>
                  
                  {/* Only show pagination buttons if not showing all records */}
                  {itemsPerPage !== 'all' && totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                        className={`p-1 rounded-md transition-colors ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                  >
                        <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                            page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                              page === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                            return <span key={page} className="px-1.5 text-gray-400 text-[10px]">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`p-1 rounded-md transition-colors ${
                          currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                  >
                        <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default ReceivablesPage; 