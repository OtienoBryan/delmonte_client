// Financial System TypeScript Interfaces

export interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: 'admin' | 'manager' | 'accountant' | 'user';
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface ChartOfAccount {
    id: number;
    account_code: string;
    account_name: string;
    account_type: number; // 1=asset, 2=liability, 13=equity, 17=depreciation, etc.
    parent_account_id?: number;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    parent_account?: ChartOfAccount;
  }
  
  export interface Supplier {
    id: number;
    supplier_code: string;
    company_name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    payment_terms: number;
    credit_limit: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface Customer {
    id: number;
    customer_code: string;
    company_name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    payment_terms: number;
    credit_limit: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    name?: string; // Added for Clients table compatibility
    tax_pin?: string; // Added for Clients table compatibility
    contact?: string; // Added for Clients table compatibility
    route_name_update?: string; // Added for Clients table compatibility
    balance?: string; // Added for Clients table compatibility
    status?: number; // Added for Clients table compatibility
  }
  
  // Tax type definitions
  export type TaxType = '16%' | 'zero_rated' | 'exempted';
  
  export interface Product {
    id: number;
    product_code: string;
    product_name: string;
    description?: string;
    category?: string;
    unit_of_measure: string;
    cost_price: number;
    selling_price: number;
    reorder_level: number;
    current_stock: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    tax_type?: TaxType; // Default tax type for the product
  }
  
  export interface PurchaseOrder {
    id: number;
    po_number: string;
    supplier_id: number;
    order_date: string;
    expected_delivery_date?: string;
    status: 'draft' | 'sent' | 'received' | 'cancelled';
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    notes?: string;
    created_by: number;
    created_at: string;
    updated_at: string;
    supplier_name?: string;
    supplier_code?: string;
    created_by_name?: string;
    items?: PurchaseOrderItem[];
    created_by_user?: User;
  }
  
  export interface PurchaseOrderItem {
    id: number;
    purchase_order_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    received_quantity: number;
    product?: Product;
  }
  
  export interface SalesOrder {
    id: number;
    so_number: string;
    lpo_number?: string | null;
    customer_id: number;
    client_id?: number; // Added for database compatibility
    sales_rep_id?: number; // Added for sales rep relationship
    order_date: string;
    expected_delivery_date?: string;
    status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'in payment' | 'paid';
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    notes?: string;
    my_status?: number; // Added for order approval status (0=draft, 1=approved, 2=assigned, 3=in transit, 4=delivered)
    created_by: number;
    created_at: string;
    updated_at: string;
    customer?: Customer;
    items?: SalesOrderItem[];
    created_by_user?: User;
    salesrep?: string; // Added for sales rep display from SalesRep table
    customer_name?: string;
    country_id?: number;
    countryId?: number;
    country_name?: string;
    region_id?: number;
    region_name?: string;
    client_type_name?: string;
    outlet_account_name?: string;
    rider_name?: string;
    rider_contact?: string;
    assigned_at?: string;
    delivery_image?: string;
    delivery_notes?: string;
    customer_balance?: string;
    received_by?: number;
    returned_at?: string;
    received_by_name?: string;
  }
  
  export interface SalesOrderItem {
    id: number;
    sales_order_id: number;
    product_id: number;
    product_name?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    shipped_quantity: number;
    product?: Product;
    net_price?: number;
    tax_amount?: number;
    tax_type?: TaxType;
    tax_rate?: number; // 0.16 for 16%, 0 for zero_rated, 0 for exempted
  }
  
  export interface Receipt {
    id: number;
    receipt_number: string;
    customer_id: number;
    receipt_date: string;
    payment_method: 'cash' | 'check' | 'bank_transfer' | 'credit_card';
    reference_number?: string;
    amount: number;
    notes?: string;
    created_by: number;
    created_at: string;
    updated_at: string;
    customer?: Customer;
    created_by_user?: User;
  }
  
  export interface Payment {
    id: number;
    payment_number: string;
    supplier_id: number;
    payment_date: string;
    payment_method: 'cash' | 'check' | 'bank_transfer' | 'credit_card';
    reference_number?: string;
    amount: number;
    notes?: string;
    created_by: number;
    created_at: string;
    updated_at: string;
    supplier?: Supplier;
    created_by_user?: User;
  }
  
  export interface JournalEntry {
    id: number;
    entry_number: string;
    entry_date: string;
    reference?: string;
    description?: string;
    total_debit: number;
    total_credit: number;
    status: 'draft' | 'posted' | 'cancelled';
    created_by: number;
    created_at: string;
    updated_at: string;
    lines?: JournalEntryLine[];
    created_by_user?: User;
  }
  
  export interface JournalEntryLine {
    id: number;
    journal_entry_id: number;
    account_id: number;
    debit_amount: number;
    credit_amount: number;
    description?: string;
    account?: ChartOfAccount;
  }
  
  export interface InventoryTransaction {
    id: number;
    transaction_number: string;
    product_id: number;
    transaction_type: 'purchase' | 'sale' | 'adjustment' | 'transfer';
    quantity: number;
    unit_cost?: number;
    total_cost?: number;
    reference_id?: number;
    reference_type?: string;
    transaction_date: string;
    notes?: string;
    created_by: number;
    created_at: string;
    product?: Product;
    created_by_user?: User;
  }
  
  // API Response Types
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
  }

  // Stock Transfer Error Response (for insufficient quantities)
  export interface StockTransferErrorResponse {
    success: false;
    error: string;
    message: string;
    details: Array<{
      product_id: string | number;
      product_name: string;
      product_code: string;
      requested: number;
      available: number;
      shortfall: number;
    }>;
    summary: {
      total_products_affected: number;
      total_shortfall: number;
    };
  }
  
  export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
  }
  
  // Dashboard Types
  export interface DashboardStats {
    totalSales: number;
    totalPurchases: number;
    totalReceivables: number;
    totalPayables: number;
    lowStockItems: number;
    pendingOrders: number;
    totalAssets: number;
  }
  
  export interface FinancialSummary {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    netIncome: number;
    grossProfit: number;
    operatingExpenses: number;
  }
  
  // Form Types
  export interface CreatePurchaseOrderForm {
    supplier_id: number;
    order_date: string;
    expected_delivery_date?: string;
    notes?: string;
    items: {
      product_id: number;
      quantity: number;
      unit_price: number;
      tax_type?: TaxType;
    }[];
  }
  
  export interface CreateSalesOrderForm {
    client_id: number;
    sales_rep_id?: number;
    order_date: string;
    expected_delivery_date?: string;
    notes?: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    items: {
      product_id: number;
      quantity: number;
      unit_price: number;
      tax_type?: TaxType;
      tax_amount: number;
    }[];
  }
  
  export interface CreateReceiptForm {
    customer_id: number;
    receipt_date: string;
    payment_method: 'cash' | 'check' | 'bank_transfer' | 'credit_card';
    reference_number?: string;
    amount: number;
    notes?: string;
  }
  
  export interface CreatePaymentForm {
    supplier_id: number;
    payment_date: string;
    payment_method: 'cash' | 'check' | 'bank_transfer' | 'credit_card';
    reference_number?: string;
    amount: number;
    notes?: string;
  }
  
  export interface CreateJournalEntryForm {
    entry_date: string;
    reference?: string;
    description?: string;
    lines: {
      account_id: number;
      debit_amount: number;
      credit_amount: number;
      description?: string;
    }[];
  }
  
  // Store and Inventory Types
  export interface Store {
    id: number;
    store_code: string;
    store_name: string;
    address?: string;
    phone?: string;
    manager_name?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface StoreInventory {
    id: number;
    store_id: number;
    product_id: number;
    quantity: number;
    last_updated: string;
    product_name?: string;
    product_code?: string;
    category?: string;
    unit_of_measure?: string;
    cost_price?: number;
    selling_price?: number;
    inventory_value?: number;
  }
  
  export interface InventoryReceipt {
    id: number;
    purchase_order_id: number;
    product_id: number;
    store_id: number;
    received_quantity: number;
    unit_cost: number;
    total_cost: number;
    received_at: string;
    received_by: number;
    notes?: string;
    product_name?: string;
    product_code?: string;
    store_name?: string;
    received_by_name?: string;
  }
  
  export interface StoreInventorySummary {
    id: number;
    store_name: string;
    store_code: string;
    total_products: number;
    total_items: number;
    total_inventory_value: number;
  }
  
  export interface ReceiveItemsForm {
    storeId: number;
    items: {
      product_id: number;
      received_quantity: number;
      unit_cost: number;
    }[];
    notes?: string;
  }
  
  export interface AssetType {
    id: number;
    name: string;
  }
  
  export interface Asset {
    id: number;
    asset_type_id: number;
    name: string;
    purchase_date: string;
    purchase_value: number;
    description?: string;
    created_at: string;
    updated_at: string;
    asset_type_name?: string;
  }
  
  export interface GeneralLedgerEntry {
    id: number;
    date: string;
    account_code: string;
    account_name: string;
    description?: string;
    reference?: string;
    debit: number;
    credit: number;
    balance: number;
  }
  
  export interface StockTransferItem {
    product_id: string | number;
    quantity: number;
  }
  
  export interface StockTransferForm {
    from_store_id: string | number;
    to_store_id: string | number;
    transfer_date: string;
    staff_id: number;
    reference?: string;
    notes?: string;
    items: StockTransferItem[];
  }

  export interface DeliveryNote {
    id: number;
    dn_number: string;
    customer_id: number;
    sales_order_id?: number;
    delivery_date: string;
    status: 'draft' | 'prepared' | 'in_transit' | 'delivered' | 'cancelled';
    my_status?: number; // Added for delivery progress status (0=draft, 1=prepared, 2=in transit, 3=delivered, 4=cancelled)
    rider_id?: number;
    notes?: string;
    total_amount?: number; // Added for delivery note total amount
    tax_amount?: number; // Added for tax amount
    subtotal?: number; // Added for subtotal
    created_by: number;
    created_at: string;
    updated_at: string;
    customer?: Customer;
    customer_name?: string;
    rider_name?: string;
    rider_contact?: string; // Added for rider contact information
    items?: DeliveryNoteItem[];
  }

  export interface DeliveryNoteItem {
    id: number;
    delivery_note_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    tax_amount?: number; // Added for item tax amount
    net_price?: number; // Added for net price after tax
    delivered_quantity?: number; // Added for tracking delivered quantities
    product?: Product;
    product_name?: string;
    product_code?: string;
  }

  export interface MerchandiseCategory {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface Merchandise {
  id: number;
  name: string;
  category_id: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: MerchandiseCategory;
}

export interface MerchandiseStock {
  id: number;
  merchandise_id: number;
  store_id: number;
  quantity: number;
  received_date: string;
  received_by?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  merchandise?: Merchandise;
  store?: {
    id: number;
    store_name: string;
    store_code: string;
  };
}

export interface MerchandiseStockItem {
  merchandise_id: number;
  quantity: number;
  notes?: string;
}

export interface MerchandiseStockReceipt {
  store_id: number;
  items: MerchandiseStockItem[];
  general_notes?: string;
}

export interface MerchandiseLedger {
  id: number;
  merchandise_id: number;
  store_id: number;
  transaction_type: 'RECEIVE' | 'ISSUE' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  balance_after: number;
  reference_id?: number;
  reference_type: 'STOCK_RECEIPT' | 'STOCK_ISSUE' | 'ADJUSTMENT' | 'TRANSFER';
  notes?: string;
  created_by: number;
  created_at: string;
  merchandise?: Merchandise;
  store?: {
    id: number;
    store_name: string;
    store_code: string;
  };
}

export interface MerchandiseAssignment {
  id: number;
  merchandise_id: number;
  staff_id: number;
  quantity_assigned: number;
  date_assigned: string;
  comment?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  merchandise?: Merchandise;
  staff?: {
    id: number;
    name: string;
    empl_no: string;
  };
}

export interface CreateMerchandiseAssignment {
  merchandise_id: number;
  staff_id: number;
  quantity_assigned: number;
  date_assigned: string;
  comment?: string;
}

export interface UpliftSaleItem {
  id: number;
  upliftSaleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
  product?: Product;
  product_name?: string;
  product_code?: string;
}

export interface OutletAccount {
  id: number;
  account_name: string;
  description?: string;
}

export interface SalesRep {
  id: number;
  name: string;
}

export interface UpliftSale {
  id: number;
  clientId: number;
  userId: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  totalAmount: number;
  createdAt: string;
  client?: Customer;
  salesRep?: {
    id: number;
    name: string;
  };
  client_name?: string;
  user_name?: string;
  username?: string;
  items?: UpliftSaleItem[];
}