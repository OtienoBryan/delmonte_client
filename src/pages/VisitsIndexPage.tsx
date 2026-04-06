import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  MessageSquare, 
  Package,
  FileText,
  Calendar,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Target,
  MapPin,
  BarChart3,
  Layout,
  Search,
  Megaphone
} from 'lucide-react';

interface VisitLink {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  headerColor: string;
  features: string[];
}

const VisitsIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const visits: VisitLink[] = [
    {
      id: 'my-visibility',
      title: 'My Visibility',
      description: 'View your own visibility reports and visit records from your sales activities. Track product placement and visibility metrics.',
      path: '/my-visibility',
      icon: <Eye className="w-4 h-4" />,
      headerColor: 'bg-purple-500',
      features: [
        'Personal visibility reports',
        'Visit date tracking',
        'Product placement metrics',
        'Image uploads and comments',
        'Date range filtering'
      ]
    },
    {
      id: 'feedback-reports',
      title: 'Feedback Reports',
      description: 'View detailed feedback reports and client insights from visits. Understand client needs and preferences.',
      path: '/feedback-reports',
      icon: <MessageSquare className="w-4 h-4" />,
      headerColor: 'bg-green-500',
      features: [
        'Client feedback collection',
        'Visit comments and notes',
        'Sales rep performance',
        'Date and outlet filtering',
        'Search functionality',
        'Report export'
      ]
    },
    {
      id: 'availability-reports',
      title: 'Availability Reports',
      description: 'Track product availability and inventory status from visit reports. Monitor stock levels across outlets.',
      path: '/availability-reports',
      icon: <Package className="w-4 h-4" />,
      headerColor: 'bg-orange-500',
      features: [
        'Product availability tracking',
        'Quantity reporting',
        'Category-based filtering',
        'Country and outlet filters',
        'Date range selection',
        'CSV export support'
      ]
    },
    {
      id: 'short-expiry-report',
      title: 'Short Expiry Report',
      description: 'View products with short expiry dates from visit reports. Monitor batch numbers and expiry tracking.',
      path: '/short-expiry-report',
      icon: <Calendar className="w-4 h-4" />,
      headerColor: 'bg-red-500',
      features: [
        'Expiry date tracking',
        'Batch number monitoring',
        'Product quantity reporting',
        'Outlet and sales rep filters',
        'Date range selection',
        'CSV export support'
      ]
    },
    {
      id: 'price-compliance-report',
      title: 'Price Compliance Report',
      description: 'Monitor pricing compliance, RRP vs shelf price, and promotional pricing across outlets.',
      path: '/price-compliance-report',
      icon: <DollarSign className="w-4 h-4" />,
      headerColor: 'bg-emerald-500',
      features: [
        'RRP vs shelf price comparison',
        'Price correctness tracking',
        'Promotion flag visibility',
        'Outlet and sales rep filters',
        'Date range selection',
        'CSV export support'
      ]
    },
    {
      id: 'sos-report',
      title: 'SOS Report',
      description: 'Analyze Share of Shelf (SOS) performance by outlet, brand, and rep to track execution against targets.',
      path: '/sos-report',
      icon: <Target className="w-4 h-4" />,
      headerColor: 'bg-indigo-600',
      features: [
        'Brand vs total facings per outlet',
        'SOS% calculation and comparison',
        'Outlet target tracking',
        'Outlet and rep filters',
        'Date range selection',
        'CSV export support'
      ]
    },
    {
      id: 'planogram-compliance-report',
      title: 'Planogram Compliance Report',
      description: 'Compare planogram compliance targets with actual quantities from ProductReport to track execution against targets.',
      path: '/planogram-compliance-report',
      icon: <Layout className="w-4 h-4" />,
      headerColor: 'bg-green-600',
      features: [
        'Target vs actual quantity comparison',
        'Product-level compliance tracking',
        'Outlet account filtering',
        'Date range selection',
        'Report count and last report date',
        'CSV export support'
      ]
    },
    {
      id: 'competitor-activity-report',
      title: 'Competitor Activity Report',
      description: 'View competitor activity and market intelligence from visit reports. Track competing products and mechanisms.',
      path: '/competitor-activity-report',
      icon: <TrendingUp className="w-4 h-4" />,
      headerColor: 'bg-indigo-500',
      features: [
        'Competitor product tracking',
        'Market mechanism analysis',
        'Product comparison',
        'Outlet and merchandiser filters',
        'Date range selection',
        'CSV export support'
      ]
    },
    {
      id: 'promotions-report',
      title: 'Promotions Report',
      description: 'Track promotion activations such as Price off, Sampling, and BOGO from field visits.',
      path: '/promotions-report',
      icon: <Megaphone className="w-4 h-4" />,
      headerColor: 'bg-pink-600',
      features: [
        'Promotion activity tracking',
        'Activation type filtering',
        'Qty before and after comparison',
        'Sales rep and outlet filters',
        'Date range selection',
        'Search by product and comments'
      ]
    },
    {
      id: 'outlet-visits',
      title: 'Outlet Visits',
      description: 'View how many visits have been made to each outlet over the selected period.',
      path: '/dashboard/reports/outlet-visits',
      icon: <MapPin className="w-4 h-4" />,
      headerColor: 'bg-lime-600',
      features: [
        'Total visits per outlet',
        'Year and date range filters',
        'Outlet account filter',
        'Lightweight tabular view'
      ]
    },
    {
      id: 'outlet-visits-summary',
      title: 'Outlet Visits Summary',
      description: 'View monthly visit summaries by outlet with aggregated visit counts across months.',
      path: '/dashboard/reports/outlet-visits-summary',
      icon: <BarChart3 className="w-4 h-4" />,
      headerColor: 'bg-teal-600',
      features: [
        'Monthly visit breakdown',
        'Year and date range filters',
        'Outlet account filter',
        'Full-width detailed view'
      ]
    },
    {
      id: 'outlet-coverage',
      title: 'Outlet Coverage',
      description: 'View weekly outlet coverage by sales representative. Track expected vs actual coverage for weeks 1-5.',
      path: '/outlet-coverage',
      icon: <TrendingUp className="w-4 h-4" />,
      headerColor: 'bg-blue-600',
      features: [
        'Weekly coverage tracking',
        'Expected vs actual comparison',
        'Sales rep performance',
        'Month and year filters',
        'CSV export support'
      ]
    }
  ];

  const handleVisitClick = (path: string) => {
    navigate(path);
  };

  const handleViewClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigate(path);
  };

  const filteredVisits = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return visits;
    return visits.filter((visit) => {
      return (
        visit.title.toLowerCase().includes(q) ||
        visit.description.toLowerCase().includes(q) ||
        visit.features.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [searchTerm, visits]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Visits Reports</h1>
              <p className="text-sm text-gray-600 mt-1">Choose a report to analyze field execution and outlet activity.</p>
            </div>
            <button
              onClick={() => navigate('/sales-dashboard')}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">Total Reports</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{visits.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">Matching Reports</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{filteredVisits.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">Quick Search</p>
              <div className="relative mt-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search reports..."
                  className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredVisits.map((visit) => (
            <div
              key={visit.id}
              onClick={() => handleVisitClick(visit.path)}
              className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 hover:border-gray-300 transition-all duration-200 cursor-pointer"
            >
              {/* Header Bar */}
              <div className={`${visit.headerColor} px-3 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className="text-white bg-white/15 rounded-md p-1">
                    {visit.icon}
                  </div>
                  <h3 className="text-white font-semibold text-sm leading-tight">
                    {visit.title}
                  </h3>
                </div>
                <button
                  onClick={(e) => handleViewClick(e, visit.path)}
                  className="px-2 py-0.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-md transition-colors"
                >
                  View
                </button>
              </div>

              {/* Card Content */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                    {visit.features.length} features
                  </span>
                  <span className="text-[10px] text-gray-400 group-hover:text-gray-500 transition-colors">
                    {visit.id.replace(/-/g, ' ')}
                  </span>
                </div>
                <p className="text-gray-600 text-xs mb-3 leading-relaxed line-clamp-3 min-h-[48px]">
                  {visit.description}
                </p>

                {/* Key Features */}
                <div className="mb-3">
                  <ul className="space-y-1.5">
                    {visit.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="text-xs text-gray-700 flex items-start">
                        <span className="text-blue-500 mr-1.5 mt-[1px]">•</span>
                        <span className="line-clamp-1">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* View Full Report Link */}
                <div
                  onClick={(e) => handleViewClick(e, visit.path)}
                  className="mt-3 inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:text-blue-800 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>View Full Report</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVisits.length === 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-sm font-medium text-gray-900">No reports matched your search.</p>
            <p className="text-xs text-gray-500 mt-1">Try a different keyword like availability, visits, or summary.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitsIndexPage;
