import React, { useState, useEffect, useRef } from 'react';
import { Staff, staffService } from '../services/staffService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PhotoListPage: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get current date in format: DD MMMM YYYY
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const data = await staffService.getStaffList();
        setStaff(data);
        setError(null);
      } catch (err) {
        setError('Failed to load staff list');
        console.error('Error fetching staff:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const exportToPDF = async () => {
    if (!contentRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 297; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`cit-photo-list-${currentDate.replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading staff list...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              
            </h3>
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isExporting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-900 hover:bg-red-700'
              }`}
            >
              {isExporting ? 'Exporting...' : 'Export to PDF'}
            </button>
          </div>
          <div className="p-4" ref={contentRef}>
            <h3 className="text-lg leading-6 font-medium text-gray-900 m-4">
              Staff Photo List - {currentDate}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-lg shadow overflow-hidden border border-gray-300"
                >
                  <div className="aspect-w-1 aspect-h-1">
                    <img
                      src={member.photo_url}
                      alt={member.name}
                      className="w-40 h-30 object-cover rounded-md"
                    />
                  </div>
                  <div className="p-2">
                    <h4 className="text-lg font-medium text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-500 font-bold">{member.role}</p>
                    <p className="text-sm text-gray-500 font-bold">{member.empl_no}</p>
                    <p className="text-sm text-gray-500 font-bold">{member.id_no}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoListPage;