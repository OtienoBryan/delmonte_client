const fs = require('fs');
const path = require('path');

// Files that need API_URL -> API_BASE_URL replacement
const filesToUpdate = [
  'src/pages/ChatRoomPage.tsx',
  'src/pages/HrDashboardPage.tsx',
  'src/pages/AddAssetPage.tsx',
  'src/pages/AddExpensePage.tsx',
  'src/pages/AddEquityPage.tsx',
  'src/pages/AllOrdersPage.tsx',
  'src/pages/AssetsPage.tsx',
  'src/pages/BalanceSheetReportPage.tsx',
  'src/pages/AssetDepreciationPage.tsx',
  'src/pages/CashAccountDetailsPage.tsx',
  'src/pages/CashAndEquivalentsPage.tsx',
  'src/pages/CashFlowReportPage.tsx',
  'src/pages/CreateCreditNotePage.tsx',
  'src/pages/CreateInvoicePage.tsx',
  'src/pages/DeliveryNoteDetailsPage.tsx',
  'src/pages/DeliveryNote.tsx',
  'src/pages/DepreciationManagementPage.tsx',
  'src/pages/EquityEntryPage.tsx',
  'src/pages/ExpensesPage.tsx',
  'src/pages/JournalEntriesPage.tsx',
  'src/pages/PendingPaymentsPage.tsx',
  'src/pages/OverallAttendancePage.tsx',
  'src/pages/PayablesPage.tsx',
  'src/pages/PostFaultyProductsPage.tsx',
  'src/pages/ProfitLossReportPage.tsx',
  'src/pages/ReceivablesPage.tsx',
  'src/pages/ReceivablesCustomerPage.tsx',
  'src/pages/SalesRepAttendancePage.tsx',
  'src/pages/SalesOrderDetailsPage.tsx',
  'src/pages/SalesRepWorkingDaysPage.tsx'
];

console.log('Updating API URL references to use centralized config...');

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace API URL definitions with import
    content = content.replace(
      /const\s+API_BASE_URL\s*=\s*import\.meta\.env\.VITE_API_URL\s*\|\|\s*['"]http:\/\/localhost:5000\/api['"];?/g,
      "import { API_BASE_URL } from '../config/api';"
    );
    
    // Replace API_URL with API_BASE_URL
    content = content.replace(/API_URL/g, 'API_BASE_URL');
    
    // Replace SOCKET_URL definitions
    content = content.replace(
      /const\s+SOCKET_URL\s*=\s*import\.meta\.env\.VITE_API_URL\?\.replace\(['"]\/api['"],\s*['"]['"]\)\s*\|\|\s*['"]http:\/\/localhost:5000['"];?/g,
      "import { SOCKET_URL } from '../config/api';"
    );
    
    // Replace direct fetch calls
    content = content.replace(
      /\$\{import\.meta\.env\.VITE_API_URL\s*\|\|\s*['"]http:\/\/localhost:5000\/api['"]\}/g,
      '${API_BASE_URL}'
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated ${filePath}`);
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('\n🎉 API URL centralization complete!');
console.log('\nNext steps:');
console.log('1. Create a .env file with: VITE_API_URL=http://localhost:5000/api');
console.log('2. Start your server on port 5000');
console.log('3. Test the application');
