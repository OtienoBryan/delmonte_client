import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExpenseInvoice {
  id: number;
  journal_entry_id: number;
  supplier_id: number;
  amount: number;
  created_at: string;
  supplier_name: string;
  supplier_contact_person: string;
  supplier_email: string;
  supplier_phone: string;
  supplier_address: string;
  supplier_tax_id: string;
  entry_date: string;
  reference: string;
  description: string;
  entry_number: string;
  items: ExpenseItem[];
  subtotal: number;
  tax_amount: number;
  total: number;
}

interface ExpenseItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_type: string;
  total_amount: number;
  tax_amount: number;
  expense_account_name: string;
  expense_account_code: string;
}

const ExpenseInvoicePage: React.FC = () => {
  const { journal_entry_id } = useParams<{ journal_entry_id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<ExpenseInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (journal_entry_id) {
      fetchExpenseInvoice();
    }
  }, [journal_entry_id]);

  const fetchExpenseInvoice = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/financial/expenses/${journal_entry_id}/invoice`);
      setInvoice(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching expense invoice:', err);
      setError('Failed to fetch expense invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate('/expense-summary');
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !invoice) return;
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const filename = `Supplier_Invoice_${invoice.entry_number || invoice.journal_entry_id}.pdf`;
    pdf.save(filename);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expense invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{error || 'Expense invoice not found'}</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Expense Summary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Expense Summary
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Supplier Invoice</h1>
              <p className="text-gray-600 mt-1">Reference: {invoice.reference}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
              <button onClick={handleDownloadPdf} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
          {/* Invoice Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">SUPPLIER INVOICE</h2>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Invoice Number:</strong> {invoice.entry_number}</p>
                  <p><strong>Date:</strong> {formatDate(invoice.entry_date)}</p>
                  <p><strong>Reference:</strong> {invoice.reference}</p>
                  <p><strong>Description:</strong> {invoice.description}</p>
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Supplier Information</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p className="font-medium">{invoice.supplier_name}</p>
                  {invoice.supplier_contact_person && (
                    <p>Contact: {invoice.supplier_contact_person}</p>
                  )}
                  {invoice.supplier_email && (
                    <p>Email: {invoice.supplier_email}</p>
                  )}
                  {invoice.supplier_phone && (
                    <p>Phone: {invoice.supplier_phone}</p>
                  )}
                  {invoice.supplier_address && (
                    <p>Address: {invoice.supplier_address}</p>
                  )}
                  {invoice.supplier_tax_id && (
                    <p>Tax ID: {invoice.supplier_tax_id}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="px-8 py-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.expense_account_name} ({item.expense_account_code})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        
                          {item.tax_type === '16%' ? '16%' : 
                           item.tax_type === 'zero_rated' ? 'Zero Rated' : 'Exempted'}
                        
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(item.tax_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(item.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Totals */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax Amount:</span>
                  <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          {/* <div className="px-8 py-4 bg-gray-100 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              <p>This is an expense invoice generated on {formatDate(invoice.created_at)}</p>
              <p>Journal Entry ID: {invoice.journal_entry_id}</p>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ExpenseInvoicePage;
