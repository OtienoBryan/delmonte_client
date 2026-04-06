/**
 * Utility functions for CSV export functionality
 */
import { DateTime } from 'luxon';

export interface CSVExportOptions {
  filename?: string;
  includeHeaders?: boolean;
}

export interface CSVColumn<T = any> {
  key: keyof T;
  label: string;
  formatter?: (value: any, row?: T) => string;
}

/**
 * Converts an array of objects to CSV format
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns: CSVColumn<T>[],
  options: CSVExportOptions = {}
): string {
  const { includeHeaders = true } = options;
  
  if (!data || data.length === 0) {
    return '';
  }

  const csvRows: string[] = [];

  // Add headers if requested
  if (includeHeaders) {
    const headers = columns.map(col => `"${col.label}"`).join(',');
    csvRows.push(headers);
  }

  // Add data rows
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col.key];
      const formattedValue = col.formatter ? col.formatter(value, row) : value;
      // Escape quotes and wrap in quotes
      return `"${String(formattedValue || '').replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Downloads CSV content as a file
 */
export function downloadCSV(csvContent: string, filename: string = 'export.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Formats currency for CSV export
 */
export function formatCurrencyForCSV(amount: number): string {
  return (amount || 0).toFixed(2);
}

/**
 * Formats date for CSV export
 */
export function formatDateForCSV(date: string): string {
  if (!date) return 'N/A';
  
  // Try different parsing methods for different date formats
  let dt = DateTime.fromISO(date);
  
  if (!dt.isValid) {
    // Try parsing as SQL datetime format
    dt = DateTime.fromSQL(date);
  }
  
  if (!dt.isValid) {
    // Try parsing as regular date
    dt = DateTime.fromJSDate(new Date(date));
  }
  
  return dt.isValid ? dt.toLocaleString(DateTime.DATE_SHORT) : 'Invalid Date';
}

/**
 * Formats status for CSV export
 */
export function formatStatusForCSV(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
