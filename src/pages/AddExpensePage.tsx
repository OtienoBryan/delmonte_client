import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: number;
}

interface Supplier {
  id: number;
  supplier_code: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
}

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  unit_price: number;
  tax_type: '16%' | 'zero_rated' | 'exempted';
  expense_account_id: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AddExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<Account[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<Account | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isPaid, setIsPaid] = useState(true);

  useEffect(() => {
    fetchAccounts();
    fetchSuppliers();
    // Add initial empty item
    addExpenseItem();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/accounts`);
      if (res.data.success) {
        setExpenseAccounts(res.data.data.filter((a: Account) => a.account_type === 16));
        setPaymentAccounts(res.data.data.filter((a: Account) => a.account_type === 9));
      }
    } catch {
      setError('Failed to load accounts');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/suppliers`);
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch {
      setError('Failed to load suppliers');
    }
  };



  const handlePaymentAccountChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const accountId = e.target.value;
    if (!accountId) {
      setSelectedPaymentAccount(null);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/accounts/${accountId}`);
      if (res.data.success) {
        setSelectedPaymentAccount(res.data.data);
      } else {
        setSelectedPaymentAccount(null);
      }
    } catch {
      setSelectedPaymentAccount(null);
    }
  };

  const handleSupplierChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supplierId = e.target.value;
    if (!supplierId) {
      setSelectedSupplier(null);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/suppliers/${supplierId}`);
      if (res.data.success) {
        setSelectedSupplier(res.data.data);
      } else {
        setSelectedSupplier(null);
      }
    } catch {
      setSelectedSupplier(null);
    }
  };

  const addExpenseItem = () => {
    // Check if reference is provided
    if (!reference.trim()) {
      setError('Please enter a reference before adding expense items');
      return;
    }
    
    // Check if supplier is selected
    if (!selectedSupplier) {
      setError('Please select a supplier before adding expense items');
      return;
    }
    
    // Check if current items are valid before adding new one
    const hasIncompleteItems = expenseItems.some(item => 
      !item.description.trim() || item.unit_price <= 0 || item.expense_account_id <= 0
    );
    
    if (hasIncompleteItems) {
      setError('Please complete the current expense item (description, unit price, and expense type) before adding a new one');
      return;
    }
    
    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      description: '',
      amount: 0,
      quantity: 1,
      unit_price: 0,
      tax_type: '16%',
      expense_account_id: 0
    };
    setExpenseItems([...expenseItems, newItem]);
    setError(''); // Clear any previous errors
  };

  const removeExpenseItem = (id: string) => {
    if (expenseItems.length > 1) {
      setExpenseItems(expenseItems.filter(item => item.id !== id));
    }
  };

  const updateExpenseItem = (id: string, field: keyof ExpenseItem, value: string | number) => {
    setExpenseItems(expenseItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate amount if quantity, unit_price, or tax_type changed
        if (field === 'quantity' || field === 'unit_price' || field === 'tax_type') {
          const subtotal = updatedItem.quantity * updatedItem.unit_price;
          if (updatedItem.tax_type === '16%') {
            updatedItem.amount = subtotal * 1.16; // Add 16% VAT
          } else {
            updatedItem.amount = subtotal; // No tax for zero_rated and exempted
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const getTotalAmount = () => {
    return expenseItems.reduce((total, item) => total + item.amount, 0);
  };

  const isItemComplete = (item: ExpenseItem) => {
    return item.description.trim() !== '' && item.unit_price > 0 && item.expense_account_id > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Validate required fields
    if (!reference.trim()) {
      setError('Please enter a reference');
      setSubmitting(false);
      return;
    }

    if (!selectedSupplier) {
      setError('Please select a supplier');
      setSubmitting(false);
      return;
    }

    if (isPaid && !selectedPaymentAccount) {
      setError('Please select a payment account');
      setSubmitting(false);
      return;
    }

    if (expenseItems.length === 0 || expenseItems.some(item => !item.description || item.amount <= 0 || item.expense_account_id <= 0)) {
      setError('Please add at least one expense item with description, amount, and expense type');
      setSubmitting(false);
      return;
    }

    try {
      const totalAmount = getTotalAmount();
      const description = expenseItems.map(item => 
        `${item.description} (${item.quantity} x ${item.unit_price.toFixed(2)})`
      ).join('; ');

      // Use the first item's expense account as a fallback (for backward compatibility)
      // The backend will now create separate journal entry lines for each expense type
      const mainExpenseAccountId = expenseItems[0]?.expense_account_id;
      
      const res = await axios.post(`${API_BASE_URL}/financial/expenses`, {
        expense_account_id: mainExpenseAccountId,
        payment_account_id: isPaid && selectedPaymentAccount ? selectedPaymentAccount.id : '',
        amount: totalAmount,
        date,
        description: `${description}${notes ? ` - ${notes}` : ''}`,
        reference: reference,
        is_paid: isPaid,
        supplier_id: selectedSupplier.id,
        expense_items: expenseItems
      });

      if (res.data.success) {
        setSuccess('Expense posted successfully!');
        // Redirect to expense-summary page after a short delay to show success message
        setTimeout(() => {
          navigate('/expense-summary');
        }, 1500);
      } else {
        setError(res.data.error || 'Failed to post expense');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to post expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4">
      <div className="mb-3">
        <h1 className="text-sm font-bold text-gray-900">Add Expense</h1>
        <p className="text-xs text-gray-600 mt-1">Record business expenses with multiple items and supplier details</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mb-3">
          <div className="flex">
            <svg className="w-4 h-4 mr-1.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md mb-3">
          <div className="flex">
            <svg className="w-4 h-4 mr-1.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">{success}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-sm p-3">
        {/* Header Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Reference *</label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="EXP-001"
              className={`w-full border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                !reference.trim() ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Payment Status</label>
          <select
              value={isPaid ? 'paid' : 'unpaid'}
              onChange={e => setIsPaid(e.target.value === 'paid')}
              className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid (Accrued)</option>
          </select>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Total Amount</label>
            <div className="text-base font-bold text-gray-900">
              {getTotalAmount().toFixed(2)}
            </div>
          </div>
        </div>

        {/* Supplier and Account Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Supplier *</label>
          <select
              value={selectedSupplier ? String(selectedSupplier.id) : ''}
              onChange={handleSupplierChange}
              className={`w-full border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                !selectedSupplier ? 'border-red-300' : 'border-gray-300'
              }`}
            required
          >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.company_name} ({supplier.supplier_code})
                </option>
              ))}
          </select>
        </div>

        {isPaid && (
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Payment Account *</label>
            <select
              value={selectedPaymentAccount ? String(selectedPaymentAccount.id) : ''}
              onChange={handlePaymentAccountChange}
                className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              required={isPaid}
            >
              <option value="">Select Payment Account</option>
              {paymentAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name} ({acc.account_code})
                  </option>
              ))}
            </select>
          </div>
        )}
        </div>

        {/* Expense Items */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-900">Expense Items</h3>
            <button
              type="button"
              onClick={addExpenseItem}
              disabled={!reference.trim() || !selectedSupplier || expenseItems.some(item => !item.description.trim() || item.unit_price <= 0 || item.expense_account_id <= 0)}
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {expenseItems.map((item, index) => (
              <div key={item.id} className={`bg-gray-50 rounded-md p-3 border ${isItemComplete(item) ? 'border-gray-200' : 'border-red-300'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-700">
                    Item {index + 1}
                    {!isItemComplete(item) && (
                      <span className="ml-2 text-[9px] text-red-600">(Incomplete)</span>
                    )}
                  </h4>
                  {expenseItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExpenseItem(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-6 gap-2.5">
                  <div className="lg:col-span-2">
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Description *</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateExpenseItem(item.id, 'description', e.target.value)}
                      placeholder="Enter item description"
                      className={`w-full border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                        item.description.trim() === '' ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Expense Type *</label>
                    <select
                      value={item.expense_account_id > 0 ? String(item.expense_account_id) : ''}
                      onChange={e => updateExpenseItem(item.id, 'expense_account_id', e.target.value ? parseInt(e.target.value) : 0)}
                                              className={`w-full border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                          item.expense_account_id <= 0 ? 'border-red-300' : 'border-gray-300'
                        }`}
                      required
                    >
                      <option value="">Select Type</option>
                      {expenseAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.account_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={e => {
                        const value = e.target.value;
                        updateExpenseItem(item.id, 'quantity', value === '' ? 0 : parseInt(value) || 1);
                      }}
                      onBlur={e => {
                        if (e.target.value === '' || parseInt(e.target.value) < 1) {
                          updateExpenseItem(item.id, 'quantity', 1);
                        }
                      }}
                      className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Unit Price (Tax Excl.) *</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
                      value={item.unit_price === 0 ? '' : item.unit_price}
                      onChange={e => {
                        const value = e.target.value;
                        updateExpenseItem(item.id, 'unit_price', value === '' ? 0 : parseFloat(value) || 0);
                      }}
                      onBlur={e => {
                        if (e.target.value === '' || parseFloat(e.target.value) < 0.01) {
                          updateExpenseItem(item.id, 'unit_price', 0);
                        }
                      }}
                      className={`w-full border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                        item.unit_price <= 0 ? 'border-red-300' : 'border-gray-300'
                      }`}
            required
          />
        </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Tax Type</label>
                    <select
                      value={item.tax_type}
                      onChange={e => updateExpenseItem(item.id, 'tax_type', e.target.value as '16%' | 'zero_rated' | 'exempted')}
                      className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="16%">16% VAT</option>
                      <option value="zero_rated">Zero Rated</option>
                      <option value="exempted">Exempted</option>
                    </select>
                  </div>
                </div>

                <div className="mt-2 text-right">
                  <div className="text-xs text-gray-500">
                    <div>Subtotal: {(item.quantity * item.unit_price).toFixed(2)}</div>
                    {item.tax_type === '16%' && (
                      <div>VAT (16%): {(item.quantity * item.unit_price * 0.16).toFixed(2)}</div>
                    )}
                    <div className="text-xs font-semibold text-gray-900">
                      Total: {item.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Summary */}
        <div className="mb-3 bg-gray-50 rounded-md p-3">
          <h3 className="text-xs font-semibold text-gray-900 mb-2">Expense Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <h4 className="text-[10px] font-medium text-gray-700 mb-1.5">Tax Breakdown</h4>
              <div className="space-y-1 text-xs">
                {(() => {
                  const vatItems = expenseItems.filter(item => item.tax_type === '16%');
                  const vatSubtotal = vatItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
                  const vatAmount = vatItems.reduce((sum, item) => sum + (item.quantity * item.unit_price * 0.16), 0);
                  
                  const zeroRatedItems = expenseItems.filter(item => item.tax_type === 'zero_rated');
                  const zeroRatedTotal = zeroRatedItems.reduce((sum, item) => sum + item.amount, 0);
                  
                  const exemptedItems = expenseItems.filter(item => item.tax_type === 'exempted');
                  const exemptedTotal = exemptedItems.reduce((sum, item) => sum + item.amount, 0);
                  
                  return (
                    <>
                      {vatItems.length > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span>VAT Items Subtotal:</span>
                            <span>{vatSubtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>VAT (16%):</span>
                            <span>{vatAmount.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      {zeroRatedItems.length > 0 && (
                        <div className="flex justify-between">
                          <span>Zero Rated Items:</span>
                          <span>{zeroRatedTotal.toFixed(2)}</span>
                        </div>
                      )}
                      {exemptedItems.length > 0 && (
                        <div className="flex justify-between">
                          <span>Exempted Items:</span>
                          <span>{exemptedTotal.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-medium text-gray-700 mb-1.5">Total Summary</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span>Total Amount:</span>
                  <span className="text-xs font-semibold text-gray-900">{getTotalAmount().toFixed(2)}</span>
                </div>
                <div className="text-[9px] text-gray-500">
                  {expenseItems.length} item{expenseItems.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-3">
          <label className="block text-[10px] font-medium text-gray-700 mb-1">Additional Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Enter any additional notes or comments..."
            className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Posting Expense...
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Post Expense
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddExpensePage; 