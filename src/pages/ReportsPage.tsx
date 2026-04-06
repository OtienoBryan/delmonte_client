import React from 'react';
import { BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sample data for charts
const revenueData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 2780 },
  { name: 'May', revenue: 1890 },
  { name: 'Jun', revenue: 2390 },
  { name: 'Jul', revenue: 3490 },
];

const policyDistributionData = [
  { name: 'Life Insurance', value: 400 },
  { name: 'Health Insurance', value: 300 },
  { name: 'Property Insurance', value: 200 },
  { name: 'Retirement Plan', value: 100 },
];

const claimsData = [
  { name: 'Jan', claims: 4 },
  { name: 'Feb', claims: 2 },
  { name: 'Mar', claims: 5 },
  { name: 'Apr', claims: 3 },
  { name: 'May', claims: 6 },
  { name: 'Jun', claims: 4 },
  { name: 'Jul', claims: 2 },
];

// Modern purple gradient shades
const CHART_COLORS = {
  purple: {
    light: '#F5F0FF',
    medium: '#D6BCFA',
    dark: '#9F7AEA',
    darker: '#6B46C1',
    gradient: 'url(#purpleGradient)'
  },
  background: '#F9FAFB',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280'
  }
};

// Custom label component
const CustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <text
        x={x}
        y={y}
        fill={CHART_COLORS.text.primary}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

const growthData = [
  { name: 'Jan', newClients: 45, renewals: 32 },
  { name: 'Feb', newClients: 52, renewals: 34 },
  { name: 'Mar', newClients: 48, renewals: 38 },
  { name: 'Apr', newClients: 55, renewals: 42 },
  { name: 'May', newClients: 60, renewals: 45 },
  { name: 'Jun', newClients: 65, renewals: 48 },
  { name: 'Jul', newClients: 70, renewals: 52 },
];

const dashboardStats = {
  monthlyRevenue: 12500,
  activePolicies: 1245,
  totalClaims: 32,
  averageProcessingTime: 2.5,
  newClientsThisMonth: 70,
  renewalRate: 85.5,
  claimsProcessed: 28,
  claimsPending: 4,
};
const ReportsPage: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  return <div className="px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Reports & Analytics
        </h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          View detailed reports and analytics
        </p>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Report */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Revenue Overview
            </h4>
            <BarChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                KES {dashboardStats.monthlyRevenue.toLocaleString()}
              </p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`KES ${value}`, 'Revenue']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Monthly Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        {/* Policy Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Policy Distribution
            </h4>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Active Policies</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardStats.activePolicies.toLocaleString()}
              </p>
            </div>
            <div className="h-[500px] -mt-6 -mb-6 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.purple.light} />
                      <stop offset="100%" stopColor={CHART_COLORS.purple.darker} />
                    </linearGradient>
                  </defs>
                  
                  <Pie
                    data={policyDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    paddingAngle={1}
                    dataKey="value"
                    labelLine={false}
                    label={CustomLabel}
                    animationBegin={0}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  >
                    {policyDistributionData.map((entry, index) => {
                      const shade = [
                        CHART_COLORS.purple.light,
                        CHART_COLORS.purple.medium,
                        CHART_COLORS.purple.dark,
                        CHART_COLORS.purple.darker
                      ][index % 4];
                      
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={shade}
                          stroke="#fff"
                          strokeWidth={2}
                          style={{
                            filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            opacity: hoveredIndex === index ? 0.9 : 1,
                            transform: hoveredIndex === index ? 'scale(1.02)' : 'scale(1)'
                          }}
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        />
                      );
                    })}
                  </Pie>
                  
                  <Tooltip 
                    contentStyle={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      padding: '12px',
                      color: CHART_COLORS.text.primary
                    }}
                    itemStyle={{
                      padding: '4px 0',
                      fontSize: '14px',
                      color: CHART_COLORS.text.primary
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      <span key="value" className="font-semibold">
                        {value} policies
                      </span>,
                      <span key="name" className="text-xs text-gray-500">
                        {props.payload.name}
                      </span>
                    ]}
                  />
                  
                  <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    className="text-2xl font-bold fill-gray-800"
                  >
                    {policyDistributionData.reduce((sum, item) => sum + item.value, 0)}
                  </text>
                  
                  <text 
                    x="50%" 
                    y="57%" 
                    textAnchor="middle" 
                    className="text-sm fill-gray-500"
                  >
                    Total Policies
                  </text>
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-6">
                {policyDistributionData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{
                        backgroundColor: [
                          CHART_COLORS.purple.light,
                          CHART_COLORS.purple.medium,
                          CHART_COLORS.purple.dark,
                          CHART_COLORS.purple.darker
                        ][index % 4]
                      }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Claims Analysis */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Claims Analysis
            </h4>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Claims Processed</p>
                <p className="text-xl font-semibold text-gray-900">
                  {dashboardStats.claimsProcessed}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Claims Pending</p>
                <p className="text-xl font-semibold text-gray-900">
                  {dashboardStats.claimsPending}
                </p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={claimsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="claims" 
                    name="Monthly Claims"
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                  >
                    {claimsData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.claims > 4 ? '#EF4444' : '#3B82F6'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        {/* Growth Metrics */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Growth Metrics
            </h4>
            <LineChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">New Clients</p>
                <p className="text-xl font-semibold text-gray-900">
                  {dashboardStats.newClientsThisMonth}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Renewal Rate</p>
                <p className="text-xl font-semibold text-gray-900">
                  {dashboardStats.renewalRate}%
                </p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="newClients" 
                    stroke="#8B5CF6" 
                    strokeWidth={2} 
                    name="New Clients"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="renewals" 
                    stroke="#D8B4FE" 
                    strokeWidth={2} 
                    name="Renewals"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default ReportsPage;