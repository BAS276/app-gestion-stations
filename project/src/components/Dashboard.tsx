import React, { useState, useEffect } from 'react';
import { Fuel, DollarSign, Users, Package, ShoppingCart, Fuel as FuelIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import axios from 'axios';
import { useAuth } from './forms/AuthContext';
import { ClipLoader } from 'react-spinners';

// Register Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels,
  ArcElement
);

interface DashboardProps {
  onNewSale: () => void;
}

interface SalesData {
  labels: string[];
  values: number[];
}

interface TankData {
  labels: string[];
  levels: number[];
  capacities: number[];
  currentLevels: number[];
}

interface EmployeePerStation {
  stationId: string;
  stationName: string;
  employeeCount: number;
}

interface Stats {
  fuelSales: number;
  revenue: number;
  productsInStock: number;
  productsToReorder: number;
}

interface Activity {
  time: string;
  event: string;
  category?: string;
}

interface SalesDistribution {
  labels: string[];
  values: number[];
}

interface Employee {
  _id: string;
  nomEmploye: string;
  prenomEmploye: string;
  station: {
    _id: string;
    nomStation: string;
  };
  position: string;
}

const StatCard = ({ icon: Icon, label, value, change, isLoading }: { icon: React.ElementType; label: string; value: string; change: string; isLoading?: boolean }) => (
  <div className="relative bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold mt-2 text-white">
          {isLoading ? '...' : value}
        </p>
      </div>
      <div className="h-12 w-12 bg-gradient-to-br from-pink-900 to-pink-800 rounded-full flex items-center justify-center">
        <Icon className="h-6 w-6 text-pink-500" />
      </div>
    </div>
    <p className="text-sm font-medium text-green-400 mt-3">{isLoading ? 'Loading...' : change}</p>
  </div>
);

// Chart Options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#d1d5db',
        font: {
          size: 12,
          weight: 'bold',
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(31, 41, 55, 0.9)',
      titleColor: '#fff',
      bodyColor: '#d1d5db',
      borderColor: 'rgba(209, 213, 219, 0.1)',
      borderWidth: 1,
    },
    datalabels: {
      color: '#fff',
      font: {
        weight: 'bold',
      },
      formatter: (value: number) => `${value.toFixed(1)}DH`,
      display: true,
      anchor: 'end' as const,
      align: 'top' as const,
    },
  },
  scales: {
    x: {
      ticks: { color: '#d1d5db' },
      grid: { color: 'rgba(75, 85, 99, 0.1)' },
    },
    y: {
      ticks: { color: '#d1d5db' },
      grid: { color: 'rgba(75, 85, 99, 0.1)' },
      beginAtZero: true,
    },
  },
};

// Pie Chart Options
const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#d1d5db',
        font: {
          size: 12,
          weight: 'bold',
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(31, 41, 55, 0.9)',
      titleColor: '#fff',
      bodyColor: '#d1d5db',
      borderColor: 'rgba(209, 213, 219, 0.1)',
      borderWidth: 1,
      callbacks: {
        label: (context: any) => {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
          return `${label}: ${value} L (${percentage}%)`;
        },
      },
    },
    datalabels: {
      color: '#fff',
      font: {
        weight: 'bold',
      },
      formatter: (value: number, context: any) => {
        const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        return `${percentage}%`;
      },
      display: true,
    },
  },
};

// Mock data as fallback
const mockSalesData: SalesData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  values: [5200, 4800, 5100, 5500, 6000, 5800, 6200],
};

const mockTankData: TankData = {
  labels: ['Unleaded 95', 'Unleaded 98', 'Diesel'],
  levels: [75, 60, 85],
  capacities: [1000, 1500, 2000],
  currentLevels: [750, 900, 1700],
};

const mockStats: Stats = {
  fuelSales: 12543,
  revenue: 8234,
  productsInStock: 1234,
  productsToReorder: 23,
};

const mockRecentActivity: Activity[] = [
  { time: '14:30', event: 'New Sale - Pump 13', category: 'Fuel' },
  { time: '13:45', event: 'New Sale - Pump 11', category: 'Fuel' },
  { time: '12:15', event: 'Product Sale', category: 'Product' },
  { time: '11:00', event: 'Product Sale', category: 'Product' },
];

const mockSalesDistribution: SalesDistribution = {
  labels: ['Unleaded 95', 'Unleaded 98', 'Diesel'],
  values: [500, 300, 700],
};

const Dashboard: React.FC<DashboardProps> = ({ onNewSale }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [salesData, setSalesData] = useState<SalesData>(mockSalesData);
  const [tankData, setTankData] = useState<TankData>(mockTankData);
  const [stats, setStats] = useState<Stats>(mockStats);
  const [employeesPerStation, setEmployeesPerStation] = useState<EmployeePerStation[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>(mockRecentActivity);
  const [salesDistribution, setSalesDistribution] = useState<SalesDistribution>(mockSalesDistribution);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [stationName, setStationName] = useState<string>('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const params: any = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      let currentStationId: string | null = null;
      if (user?.role !== 'admin' && user?.station) {
        console.log('User station:', user.station);
        const stationId = user.station?._id?.toString() || user.station?.toString();
        if (!stationId || !/^[0-9a-fA-F]{24}$/.test(stationId)) {
          console.warn('Invalid station ID:', stationId);
          setError('Invalid station ID');
          setSalesData(mockSalesData);
          setTankData(mockTankData);
          setStats(mockStats);
          setEmployeesPerStation([]);
          setRecentActivity(mockRecentActivity);
          setSalesDistribution(mockSalesDistribution);
          setLoading(false);
          return;
        }
        params.station = stationId;
        currentStationId = stationId;
      }

      if (user?.role !== 'admin' && user?.station) {
        try {
          const stationResponse = await axios.get(`http://localhost:5000/api/stations/${params.station}`);
          console.log('Station response:', stationResponse.data);
          setStationName(stationResponse.data.nomStation || 'Unknown Station');
        } catch (err: any) {
          console.error('Error fetching station name:', err);
          setStationName('Unknown Station');
        }
      } else {
        setStationName('');
      }

      // Fetch employees
      const employesParams: any = {};
      if (user?.role !== 'admin' && currentStationId) {
        employesParams.station = currentStationId;
      }
      const employesResponse = await axios.get('http://localhost:5000/api/employes', { params: employesParams }).catch(err => {
        console.error('Employes endpoint failed:', err.message, err.response?.status, err.response?.data);
        throw err;
      });
      console.log('Employees response:', employesResponse.data);

      let employeesPerStationData: EmployeePerStation[] = [];
      if (user?.role === 'admin') {
        // For admin: Fetch all employees across all stations and calculate the total
        const employesByStation: { [key: string]: Employee[] } = {};
        employesResponse.data.forEach((employe: Employee) => {
          if (employe.station) {
            const stationId = employe.station._id;
            if (!employesByStation[stationId]) {
              employesByStation[stationId] = [];
            }
            employesByStation[stationId].push(employe);
          }
        });

        employeesPerStationData = Object.keys(employesByStation).map(stationId => {
          const stationEmployees = employesByStation[stationId];
          return {
            stationId,
            stationName: stationEmployees[0]?.station?.nomStation || 'Unknown Station',
            employeeCount: stationEmployees.length,
          };
        });
      } else if (currentStationId) {
        // For manager: Filter employees for the manager's station using stationId
        const stationEmployees = employesResponse.data.filter((employe: Employee) =>
          employe.station && employe.station._id === currentStationId
        );
        console.log('Filtered station employees:', stationEmployees);
        employeesPerStationData = [
          {
            stationId: currentStationId,
            stationName: stationName || 'Unknown Station',
            employeeCount: stationEmployees.length,
          },
        ];
      }

      console.log('Employees per station data:', employeesPerStationData);
      setEmployeesPerStation(employeesPerStationData);

      // Fetch other dashboard data
      const salesPromise = axios.get('http://localhost:5000/api/dashboard/sales', { params }).catch(err => {
        console.error('Sales endpoint failed:', err.message, err.response?.status, err.response?.data);
        throw err;
      });
      const tankPromise = axios.get('http://localhost:5000/api/dashboard/tanks', { params }).catch(err => {
        console.error('Tanks endpoint failed:', err.message, err.response?.status, err.response?.data);
        throw err;
      });
      const statsPromise = axios.get('http://localhost:5000/api/dashboard/stats', { params }).catch(err => {
        console.error('Stats endpoint failed:', err.message, err.response?.status, err.response?.data);
        throw err;
      });
      const activityPromise = axios.get('http://localhost:5000/api/dashboard/recent-activity', { params }).catch(err => {
        console.error('Recent Activity endpoint failed:', err.message, err.response?.status, err.response?.data);
        throw err;
      });
      const distributionPromise = axios.get('http://localhost:5000/api/dashboard/sales-distribution', { params }).catch(err => {
        console.error('Sales Distribution endpoint failed:', err.message, err.response?.status, err.response?.data);
        throw err;
      });

      const [salesResponse, tankResponse, statsResponse, activityResponse, distributionResponse] = await Promise.all([
        salesPromise,
        tankPromise,
        statsPromise,
        activityPromise,
        distributionPromise,
      ]);

      console.log('Tank data received:', tankResponse.data);
      console.log('Stats data received:', statsResponse.data);
      console.log('Sales data received:', salesResponse.data);
      console.log('Activity data received:', activityResponse.data);
      console.log('Distribution data received:', distributionResponse.data);

      setSalesData({
        labels: salesResponse.data.labels || mockSalesData.labels,
        values: salesResponse.data.values || mockSalesData.values,
      });
      setTankData({
        labels: tankResponse.data.labels || mockTankData.labels,
        levels: tankResponse.data.levels || mockTankData.levels,
        capacities: tankResponse.data.capacities || mockTankData.capacities,
        currentLevels: tankResponse.data.currentLevels || mockTankData.currentLevels,
      });
      setStats({
        fuelSales: statsResponse.data.fuelSales || 0,
        revenue: statsResponse.data.revenue || 0,
        productsInStock: statsResponse.data.productsInStock || 0,
        productsToReorder: statsResponse.data.productsToReorder || 0,
      });
      setRecentActivity(activityResponse.data || []);
      setSalesDistribution({
        labels: distributionResponse.data.labels || mockSalesDistribution.labels,
        values: distributionResponse.data.values || mockSalesDistribution.values,
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      let errorMessage = 'Error loading data';
      if (err.response?.status === 404) {
        errorMessage = 'Error: Server endpoints not found (404)';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'Error: CORS issue';
      }
      setError(errorMessage);
      setSalesData(mockSalesData);
      setTankData(mockTankData);
      setStats(mockStats);
      setEmployeesPerStation([]);
      setRecentActivity(mockRecentActivity);
      setSalesDistribution(mockSalesDistribution);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('User on mount:', user);
    fetchDashboardData();
  }, [dateRange, user]);

  const lineChartData = {
    labels: salesData.labels.length > 0 ? salesData.labels : ['No Data'],
    datasets: [
      {
        label: 'Revenue (DH)',
        data: salesData.values.length > 0 ? salesData.values : [0],
        borderColor: 'rgb(207, 8, 154)',
        backgroundColor: 'rgba(207, 8, 154, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: 'rgb(207, 8, 154)',
      },
    ],
  };

  const barChartData = {
    labels: tankData.labels.length > 0 ? tankData.labels : ['No Data'],
    datasets: [
      {
        label: 'Level (%)',
        data: tankData.levels.length > 0 ? tankData.levels : [0],
        backgroundColor: tankData.levels.length > 0
          ? tankData.levels.map(level =>
              level < 20 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)'
            )
          : ['rgba(59, 130, 246, 0.6)'],
        borderColor: tankData.levels.length > 0
          ? tankData.levels.map(level =>
              level < 20 ? 'rgba(239, 68, 68, 1)' : 'rgba(59, 130, 246, 1)'
            )
          : ['rgba(59, 130, 246, 1)'],
        borderWidth: 1,
        capacities: tankData.capacities.length > 0 ? tankData.capacities : [0],
        currentLevels: tankData.currentLevels.length > 0 ? tankData.currentLevels : [0],
      },
    ],
  };

  const pieChartData = {
    labels: salesDistribution.labels.length > 0 ? salesDistribution.labels : ['No Data'],
    datasets: [
      {
        label: 'Sales by Fuel Type (L)',
        data: salesDistribution.values.length > 0 ? salesDistribution.values : [1],
        backgroundColor: salesDistribution.values.length > 0
          ? ['rgba(59, 130, 246, 0.6)', 'rgba(34, 197, 94, 0.6)', 'rgba(234, 179, 8, 0.6)']
          : ['rgba(59, 130, 246, 0.6)'],
        borderColor: salesDistribution.values.length > 0
          ? ['rgba(59, 130, 246, 1)', 'rgba(34, 197, 94, 1)', 'rgba(234, 179, 8, 1)']
          : ['rgba(59, 130, 246, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
        },
        formatter: (value: number, context: any) => {
          const index = context.dataIndex;
          const currentLevels = context.dataset.currentLevels || [];
          const capacities = context.dataset.capacities || [];
          const currentLevel = currentLevels[index] !== undefined ? currentLevels[index] : 0;
          const capacity = capacities[index] !== undefined ? capacities[index] : 1;
          return `${value.toFixed(1)}%`;
        },
        display: true,
        anchor: 'end' as const,
        align: 'top' as const,
      },
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const index = context.dataIndex;
            const currentLevels = context.dataset.currentLevels || [];
            const capacities = context.dataset.capacities || [];
            const currentLevel = currentLevels[index] !== undefined ? currentLevels[index] : 0;
            const capacity = capacities[index] !== undefined ? capacities[index] : 1;
            return `${label}: ${value.toFixed(1)}% (${currentLevel.toLocaleString()} L / ${capacity.toLocaleString()} L)`;
          },
        },
      },
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        max: 100,
        ticks: {
          ...chartOptions.scales.y.ticks,
          callback: (value: number) => `${value}%`,
        },
      },
    },
  };

  // Calculate total employees for admin or manager
  const totalEmployees = user?.role === 'admin'
    ? employeesPerStation.reduce((sum, station) => sum + station.employeeCount, 0)
    : employeesPerStation[0]?.employeeCount || 0;

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-gray-200">
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <ClipLoader color="#ec4899" size={50} />
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          {(user?.role === 'manager' || user?.role === 'mainManager') && (
            <p className="text-gray-400 mt-2">Station: <span className="text-white font-semibold">{stationName}</span></p>
          )}
        </div>
        <div className="flex gap-4">
          {/* <button
            onClick={() => fetchDashboardData()}
            className="px-5 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-all duration-200"
          >
            Refresh
          </button> */}
          <button
            onClick={() => navigate('/sales')}
            className="px-5 py-2.5 bg-pink-600 rounded-lg text-sm font-semibold text-white hover:bg-pink-700 transition-all duration-200"
          >
            New Sale
          </button>
        </div>
      </div>

      {error && <div className="text-pink-500 text-center mb-6">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          icon={Fuel}
          label="Fuel Sales"
          value={`${stats.fuelSales.toLocaleString()} L`}
          change={stats.fuelSales > 0 ? `+12.3% since yesterday` : 'No sales'}
          isLoading={loading}
        />
        <StatCard
          icon={DollarSign}
          label="Revenue"
          value={`${stats.revenue.toLocaleString()} DH`}
          change={stats.revenue > 0 ? `+8.1% since yesterday` : 'No sales'}
          isLoading={loading}
        />
        <div className="relative bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Employees per Station</p>
              {loading ? (
                <p className="text-3xl font-bold mt-2 text-white">...</p>
              ) : error && employeesPerStation.length === 0 ? (
                <p className="text-lg font-semibold mt-2 text-pink-500">Failed to load employees</p>
              ) : totalEmployees === 0 ? (
                <p className="text-lg font-semibold mt-2 text-gray-400">No employees found</p>
              ) : (
                <p className="text-3xl font-bold mt-2 text-white">
                  {totalEmployees}
                </p>
              )}
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-pink-900 to-pink-800 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-pink-500" />
            </div>
          </div>
        </div>
        <StatCard
          icon={Package}
          label="Products in Stock"
          value={`${stats.productsInStock.toLocaleString()}`}
          change={stats.productsToReorder > 0 ? `${stats.productsToReorder} to reorder` : 'Stock sufficient'}
          isLoading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Tank Levels</h2>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="text-center text-gray-400">Loading...</div>
            ) : (
              <Bar data={barChartData} options={barChartOptions} />
            )}
          </div>
          <div className="mt-4 text-center">
            <p className="text-gray-400">
              Total Capacity: {tankData.capacities.reduce((sum, val) => sum + val, 0).toLocaleString()} L
            </p>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Sales Trends</h2>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="bg-gray-700 text-gray-200 border border-gray-600 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="bg-gray-700 text-gray-200 border border-gray-600 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="text-center text-gray-400">Loading...</div>
            ) : (
              <Line data={lineChartData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            {recentActivity.length > 4 && (
              <button
                onClick={() => navigate('/activity-log')}
                className="text-sm text-pink-500 hover:text-pink-400 transition-colors duration-200"
              >
                See More
              </button>
            )}
          </div>
          {recentActivity.length === 0 ? (
            <div className="text-center text-gray-400 py-4">
              No recent activity
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 4).map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-700/30 border border-gray-600 rounded-lg hover:bg-gray-600/50 transition-all duration-200"
                >
                  <div className="flex-shrink-0">
                    {activity.category === 'Fuel' ? (
                      <FuelIcon className="h-5 w-5 text-blue-400" />
                    ) : (
                      <ShoppingCart className="h-5 w-5 text-green-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-100">{activity.event}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{activity.time}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span
                        className={`text-xs font-medium ${
                          activity.category === 'Fuel' ? 'text-blue-300' : 'text-green-300'
                        }`}
                      >
                        {activity.category === 'Fuel' ? 'Fuel' : 'Product'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Additional Stats</h2>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="bg-gray-700 text-gray-200 border border-gray-600 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="bg-gray-700 text-gray-200 border border-gray-600 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="text-center text-gray-400">Loading...</div>
            ) : (
              <Pie data={pieChartData} options={pieChartOptions} />
            )}
          </div>
          <div className="mt-4 text-center">
            <p className="text-gray-400">
              Total Sales: {salesDistribution.values.reduce((sum, val) => sum + val, 0).toLocaleString()} L
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;