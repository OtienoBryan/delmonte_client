import React, { useState, useEffect } from 'react';
import { Upload, Save, X, FileText, Calendar, MessageSquare, User, ArrowLeft, Eye } from 'lucide-react';
import { suppliersService, receiptsService } from '../services/financialService';
import { Link } from 'react-router-dom';

interface Supplier {
  id: number;
  supplier_code?: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: number;
  created_at?: string;
  updated_at?: string;
}

interface ReceiptForm {
  supplier_id: number;
  comment: string;
  receipt_date: string;
  document?: File;
}

const PostReceiptPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [document, setDocument] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await suppliersService.getAll();
      if (response.success && response.data) {
        setSuppliers(response.data);
      } else {
        setError('Failed to load suppliers');
      }
    } catch (err) {
      setError('Failed to load suppliers');
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocument(file);
      
      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setDocumentPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setDocumentPreview(null);
      }
    }
  };

  const validateForm = () => {
    if (!selectedSupplier) {
      setError('Please select a supplier');
      return false;
    }

    if (!receiptDate) {
      setError('Please select a receipt date');
      return false;
    }

    if (!document) {
      setError('Please upload a document');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('supplier_id', selectedSupplier.toString());
      formData.append('comment', comment);
      formData.append('receipt_date', receiptDate);
      if (document) {
        formData.append('document', document);
      }

      const response = await receiptsService.postReceipt(formData);
      
      if (response.success) {
        setSuccess('Receipt posted successfully!');
        
        // Reset form
        setSelectedSupplier(0);
        setComment('');
        setReceiptDate(new Date().toISOString().split('T')[0]);
        setDocument(null);
        setDocumentPreview(null);
      } else {
        setError(response.error || 'Failed to post receipt');
      }
      
    } catch (err) {
      setError('Failed to post receipt');
      console.error('Error posting receipt:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Post Receipt</h1>
            </div>
            <div className="flex items-center space-x-4">
                          <Link
              to="/inventory-staff-dashboard"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <Link
              to="/financial/view-receipts"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-3"
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Receipts
            </Link>
            <Link
              to="/financial/suppliers"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-3"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Manage Suppliers
            </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Supplier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Supplier *
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                    </option>
                  ))}
                </select>
                {selectedSupplier > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {(() => {
                      const supplier = suppliers.find(s => s.id === selectedSupplier);
                      return supplier ? (
                        <div>
                          {supplier.contact_person && <div>Contact: {supplier.contact_person}</div>}
                          {supplier.phone && <div>Phone: {supplier.phone}</div>}
                          {supplier.email && <div>Email: {supplier.email}</div>}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              {/* Receipt Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Receipt Date *
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="inline h-4 w-4 mr-1" />
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any additional comments about this receipt..."
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Upload className="inline h-4 w-4 mr-1" />
                  Upload Document *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    id="document-upload"
                    required
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">
                        Click to upload
                      </span>
                      <span className="text-gray-500"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      PDF, DOC, DOCX, JPG, JPEG, PNG up to 10MB
                    </p>
                  </label>
                </div>

                {/* Document Preview */}
                {document && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{document.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(document.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDocument(null);
                          setDocumentPreview(null);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Image Preview */}
                    {documentPreview && (
                      <div className="mt-3">
                        <img
                          src={documentPreview}
                          alt="Document preview"
                          className="max-w-full h-32 object-contain rounded border"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Receipt Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-medium">
                      {selectedSupplier > 0 
                        ? suppliers.find(s => s.id === selectedSupplier)?.company_name || 'Not selected'
                        : 'Not selected'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{receiptDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Document:</span>
                    <span className="font-medium">
                      {document ? document.name : 'Not uploaded'}
                    </span>
                  </div>
                  {comment && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Comment:</span>
                      <span className="font-medium text-gray-900 max-w-xs truncate">
                        {comment}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => {
                setSelectedSupplier(0);
                setComment('');
                setReceiptDate(new Date().toISOString().split('T')[0]);
                setDocument(null);
                setDocumentPreview(null);
                setError(null);
                setSuccess(null);
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Form
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Posting Receipt...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Post Receipt
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostReceiptPage; 