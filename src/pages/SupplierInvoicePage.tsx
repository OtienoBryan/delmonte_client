import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { purchaseOrdersService, suppliersService } from '../services/financialService';
import { PurchaseOrder, Supplier } from '../types/financial';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const formatCurrency = (amount: number) =>
  (amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SupplierInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await purchaseOrdersService.getById(Number(id));
        if (res.success && res.data) {
          setPo(res.data);
          if (res.data.supplier_id) {
            try {
              const sres = await suppliersService.getById(res.data.supplier_id);
              if (sres.success && sres.data) setSupplier(sres.data as Supplier);
            } catch {
              // ignore supplier fetch failure; page will still render
            }
          }
        }
        else setError(res.error || 'Failed to load invoice');
      } catch (e) {
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleExportPDF = async () => {
    if (!invoiceRef.current) return;
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth * 0.8;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    const xOffset = (pageWidth - pdfWidth) / 2;
    pdf.addImage(imgData, 'PNG', xOffset, 0, pdfWidth, pdfHeight);
    pdf.save(`supplier_invoice_${po?.invoice_number || id}.pdf`);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error || !po) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">{error || 'Invoice not found'}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top bar with actions */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supplier Invoice #{po.invoice_number || po.po_number}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={handleExportPDF} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-900">Export as PDF</button>
            <Link to={`/purchase-orders/${po.id}`} className="text-blue-600 hover:underline">Back to Purchase Order</Link>
          </div>
        </div>

        {/* Printable area */}
        <div ref={invoiceRef} className="a4-invoice-print m-2 relative">
          {/* Header */}
          <div className="invoice-header mb-6">
            <div className="flex justify-between items-start">
              {/* Company info */}
              {/* <div className="company-info">
                <img src="/woosh.jpg" alt="Company Logo" className="h-20 w-auto object-contain mb-2" style={{ maxWidth: '120px' }} />
                <h1 className="company-name">Moonsun Trade International Limited</h1>
                <p className="company-address">P.O Box 15470, Nairobi Kenya</p>
                <p className="company-tax">Tax PIN: P051904794X</p>
              </div> */}

              {/* Invoice details */}
              <div className="invoice-details text-right">
                <h2 className="invoice-title">SUPPLIER INVOICE</h2>
                <div className="invoice-meta">
                  <p><strong>Invoice No:</strong> {po.invoice_number || 'N/A'}</p>
                  <p><strong>PO No:</strong> {po.po_number}</p>
                  <p><strong>Date:</strong> {new Date(po.order_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

        {/* Parties */}
        <div className="bill-to-section mb-6">
          <div className="flex justify-between">
            <div className="bill-to">
              <h3 className="section-title">Supplier:</h3>
              <p className="customer-name">{supplier?.company_name || po.supplier?.company_name || 'N/A'}</p>
              <p className="customer-address">{supplier?.address || po.supplier?.address || 'N/A'}</p>
              <p className="customer-tax">Tax PIN: {supplier?.tax_id || po.supplier?.tax_id || 'N/A'}</p>
              <p className="customer-address">{supplier?.email || ''}</p>
              <p className="customer-address">{supplier?.phone || ''}</p>
            </div>
            <div className="ship-to">
              <h3 className="section-title">Bill To:</h3>
              <p className="customer-name">Moonsun Trade International Limited</p>
              <p className="customer-address">P.O Box 15470, Nairobi Kenya</p>
              <p className="customer-tax">Tax PIN: P051904794X</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="items-section mb-6">
          {po.items && po.items.length > 0 ? (
            <table className="invoice-table">
              <thead>
                <tr>
                  <th className="item-col">Item</th>
                  <th className="qty-col">Qty</th>
                  <th className="price-col">Unit Price (incl.)</th>
                  <th className="tax-col">Tax</th>
                  <th className="total-col">Total (incl.)</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="item-col">{it.product?.product_name || it.product_id}</td>
                    <td className="qty-col">{it.quantity}</td>
                    <td className="price-col">{formatCurrency(it.unit_price)}</td>
                    <td className="tax-col">{formatCurrency((it as any).tax_amount || 0)}</td>
                    <td className="total-col">{formatCurrency(it.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No items found for this purchase order.</p>
          )}
        </div>

        {/* Totals */}
        <div className="totals-section">
          <div className="flex justify-end">
            <table className="totals-table">
              <tbody>
                <tr>
                  <td className="label">Subtotal:</td>
                  <td className="amount">{formatCurrency(po.subtotal)}</td>
                </tr>
                <tr>
                  <td className="label">Tax:</td>
                  <td className="amount">{formatCurrency(po.tax_amount)}</td>
                </tr>
                <tr className="total-row">
                  <td className="label">Total:</td>
                  <td className="amount">{formatCurrency(po.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        {/* <div className="invoice-footer">
          <div className="footer-content">
            <div className="grid grid-cols-2 gap-8 mb-4">
              <div className="payment-info">
                <h4 className="section-subtitle">Payment Information</h4>
                <p><strong>Bank:</strong> Diamond Trust Bank</p>
                <p><strong>Branch:</strong> Westgate</p>
                <p><strong>Account:</strong> 0035504001 (KES)</p>
                <p><strong>Swift:</strong> DTKEKENA</p>
                <p><strong>M-Pesa:</strong> Paybill 516600</p>
              </div>
              <div className="terms">
                <h4 className="section-subtitle">Terms & Conditions</h4>
                <p>• Payment due within 30 days</p>
                <p>• Late payment may incur additional charges</p>
                <p>• Goods remain property until payment is received</p>
                <p>• Strictly no cash payments</p>
              </div>
            </div>
            <div className="footer-message">
              <p>Thank you for your business!</p>
              <p>For any queries, please contact us at info@moonsun.com</p>
            </div>
          </div>
        </div> */}
        </div>
      </div>
    </div>
  );
};

export default SupplierInvoicePage;

<style>{`
  .a4-invoice-print {
    width: 1200px;
    min-height: 1123px;
    background: #fff;
    margin: 0 auto;
    padding: 16px 12px;
    box-sizing: border-box;
    position: relative;
  }
  .invoice-footer { position: absolute; bottom: 0; left: 0; width: 100%; }
  .invoice-title { font-size: 24px; font-weight: 700; }
  .invoice-table { width: 100%; border-collapse: collapse; }
  .invoice-table th, .invoice-table td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
  .item-col { width: 50%; }
  .qty-col { width: 10%; }
  .price-col, .tax-col, .total-col { width: 13.3%; text-align: right; }
  .totals-table { min-width: 300px; }
  .totals-table .label { padding: 6px 10px; text-align: right; }
  .totals-table .amount { padding: 6px 10px; text-align: right; font-weight: 600; }
  .totals-table .total-row .amount { font-size: 16px; }
  @media print {
    body { background: #fff !important; }
    .a4-invoice-print { box-shadow: none !important; }
    .a4-invoice-print table { table-layout: fixed; width: 100%; }
    .a4-invoice-print th, .a4-invoice-print td { word-break: break-word; overflow-wrap: break-word; padding: 4px 6px; font-size: 12px; }
    .a4-invoice-print tr, .a4-invoice-print table { page-break-inside: avoid; }
  }
`}</style>

