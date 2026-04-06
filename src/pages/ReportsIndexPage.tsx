import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Package, 
  Eye, 
  Calendar,
  TrendingUp,
  DollarSign,
  Megaphone,
  ArrowRight
} from 'lucide-react';

interface ReportLink {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const ReportsIndexPage: React.FC = () => {
  const navigate = useNavigate();

  const reports: ReportLink[] = [
    {
      id: 'availability',
      title: 'Availability Report',
      description: 'View product availability reports across outlets',
      path: '/availability-reports',
      icon: <Package className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      id: 'visibility',
      title: 'Visibility Report',
      description: 'View product visibility and placement reports',
      path: '/visibility-report',
      icon: <Eye className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      id: 'short-expiry',
      title: 'Short Expiry Report',
      description: 'View products with short expiry dates',
      path: '/short-expiry-report',
      icon: <Calendar className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    },
    {
      id: 'competitor-activity',
      title: 'Competitor Activity Report',
      description: 'View competitor activity and market intelligence',
      path: '/competitor-activity-report',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100'
    },
    {
      id: 'price-compliance',
      title: 'Price Compliance Report',
      description: 'Monitor pricing compliance and shelf prices',
      path: '/price-compliance-report',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      id: 'promotions',
      title: 'Promotions Report',
      description: 'Track product activations and sampling outcomes',
      path: '/promotions-report',
      icon: <Megaphone className="w-6 h-6" />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100'
    }
  ];

  const handleReportClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Access and view various reports for your business operations
          </p>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => handleReportClick(report.path)}
              className={`
                ${report.bgColor}
                border-2 border-transparent hover:border-gray-300
                rounded-lg p-6 cursor-pointer transition-all duration-200
                shadow-sm hover:shadow-md
                group
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${report.color} p-3 rounded-lg bg-white shadow-sm`}>
                  {report.icon}
                </div>
                <ArrowRight 
                  className={`w-5 h-5 ${report.color} opacity-0 group-hover:opacity-100 transition-opacity`} 
                />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {report.title}
              </h3>
              
              <p className="text-gray-600 text-sm">
                {report.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            About Reports
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            These reports provide insights into product availability, visibility, and expiry information 
            across your network of outlets. Use these reports to make informed decisions about inventory 
            management and product placement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsIndexPage;
