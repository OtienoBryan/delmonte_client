const fs = require('fs');
const path = require('path');

// Files that need API_BASE_URL import and replacement
const filesToUpdate = [
  'src/pages/AddAssetPage.tsx',
  'src/pages/AddEquityPage.tsx',
  'src/pages/AddExpensePage.tsx',
  'src/pages/AssetsPage.tsx',
  'src/pages/AssetDepreciationPage.tsx',
  'src/pages/BalanceSheetReportPage.tsx',
  'src/pages/CashAccountDetailsPage.tsx',
  'src/pages/CashAndEquivalentsPage.tsx',
  'src/pages/CashFlowReportPage.tsx',
  'src/pages/CreateCreditNotePage.tsx',
  'src/pages/CreateInvoicePage.tsx',
  'src/pages/DeliveryNote.tsx',
  'src/pages/DeliveryNoteDetailsPage.tsx',
  'src/pages/DepreciationManagementPage.tsx',
  'src/pages/EquityEntryPage.tsx',
  'src/pages/ExpensesPage.tsx',
  'src/pages/JournalEntriesPage.tsx',
  'src/pages/OverallAttendancePage.tsx',
  'src/pages/PayablesPage.tsx',
  'src/pages/PendingPaymentsPage.tsx',
  'src/pages/ProfitLossReportPage.tsx',
  'src/pages/ReceivablesCustomerPage.tsx',
  'src/pages/ReceivablesPage.tsx',
  'src/pages/SalesOrderDetailsPage.tsx',
  'src/pages/SalesRepAttendancePage.tsx',
  'src/pages/SalesRepWorkingDaysPage.tsx'
];

// Files that need SOCKET_URL import and replacement
const socketFilesToUpdate = [
  'src/pages/HrDashboardPage.tsx'
];

// Files that need special handling
const specialFilesToUpdate = [
  'src/pages/AllOrdersPage.tsx',
  'src/pages/PostFaultyProductsPage.tsx'
];

console.log('Starting API URL centralization...');

// Update regular API_BASE_URL files
filesToUpdate.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`Skipping ${filePath} - file not found`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add import if not already present
    if (!content.includes("import { API_BASE_URL } from '../config/api'")) {
      // Find the last import statement
      const importMatch = content.match(/(import.*from.*['"];?\s*)/g);
      if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1];
        const importIndex = content.lastIndexOf(lastImport) + lastImport.length;
        content = content.slice(0, importIndex) + 
                 "\nimport { API_BASE_URL } from '../config/api';" + 
                 content.slice(importIndex);
      } else {
        // If no imports, add at the beginning
        content = "import { API_BASE_URL } from '../config/api';\n" + content;
      }
    }
    
    // Replace hardcoded API_BASE_URL definition
    content = content.replace(
      /const API_BASE_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000\/api';?/g,
      ''
    );
    
    // Clean up any double newlines
    content = content.replace(/\n\n\n/g, '\n\n');
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

// Update SOCKET_URL files
socketFilesToUpdate.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`Skipping ${filePath} - file not found`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add import if not already present
    if (!content.includes("import { SOCKET_URL } from '../config/api'")) {
      // Find the last import statement
      const importMatch = content.match(/(import.*from.*['"];?\s*)/g);
      if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1];
        const importIndex = content.lastIndexOf(lastImport) + lastImport.length;
        content = content.slice(0, importIndex) + 
                 "\nimport { SOCKET_URL } from '../config/api';" + 
                 content.slice(importIndex);
      } else {
        // If no imports, add at the beginning
        content = "import { SOCKET_URL } from '../config/api';\n" + content;
      }
    }
    
    // Replace hardcoded SOCKET_URL definition
    content = content.replace(
      /const SOCKET_URL = import\.meta\.env\.VITE_API_URL\?\.replace\('\/api', ''\) \|\| 'http:\/\/localhost:5000';?/g,
      ''
    );
    
    // Clean up any double newlines
    content = content.replace(/\n\n\n/g, '\n\n');
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

// Update special files
specialFilesToUpdate.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`Skipping ${filePath} - file not found`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add import if not already present
    if (!content.includes("import { API_BASE_URL } from '../config/api'")) {
      // Find the last import statement
      const importMatch = content.match(/(import.*from.*['"];?\s*)/g);
      if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1];
        const importIndex = content.lastIndexOf(lastImport) + lastImport.length;
        content = content.slice(0, importIndex) + 
                 "\nimport { API_BASE_URL } from '../config/api';" + 
                 content.slice(importIndex);
      } else {
        // If no imports, add at the beginning
        content = "import { API_BASE_URL } from '../config/api';\n" + content;
      }
    }
    
    // Replace inline API URL usage
    content = content.replace(
      /\`\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000\/api'\}/g,
      '`${API_BASE_URL}'
    );
    
    // Clean up any double newlines
    content = content.replace(/\n\n\n/g, '\n\n');
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

// Fix ChatRoomPage.tsx specifically
try {
  const chatRoomPath = path.join(__dirname, 'src/pages/ChatRoomPage.tsx');
  if (fs.existsSync(chatRoomPath)) {
    let content = fs.readFileSync(chatRoomPath, 'utf8');
    
    // Replace API_URL with API_BASE_URL
    content = content.replace(/API_URL/g, 'API_BASE_URL');
    
    fs.writeFileSync(chatRoomPath, content);
    console.log(`✅ Updated ChatRoomPage.tsx`);
  }
} catch (error) {
  console.error(`❌ Error updating ChatRoomPage.tsx:`, error.message);
}

// Clean up commented API_URL in journeyPlanService.ts
try {
  const journeyPlanPath = path.join(__dirname, 'src/services/journeyPlanService.ts');
  if (fs.existsSync(journeyPlanPath)) {
    let content = fs.readFileSync(journeyPlanPath, 'utf8');
    
    // Remove commented API_URL line
    content = content.replace(/\/\/const API_URL = 'http:\/\/64\.226\.66\.235'; \/\/ Add your backend URL here\n?/g, '');
    
    fs.writeFileSync(journeyPlanPath, content);
    console.log(`✅ Cleaned up journeyPlanService.ts`);
  }
} catch (error) {
  console.error(`❌ Error cleaning up journeyPlanService.ts:`, error.message);
}

console.log('\n🎉 API URL centralization complete!');
console.log('All files now use the centralized configuration from src/config/api.ts');
