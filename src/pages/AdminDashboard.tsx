import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Database, TrendingUp, Activity } from 'lucide-react';
import { 
  collection, 
  getDocs, 
  DocumentData, 
  QueryDocumentSnapshot 
} from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalStudents: number;
  totalBrigades: number;
  recentUploads: number;
  systemHealth: 'good' | 'warning' | 'error';
}

interface BrigadeChartData {
  brigade: string;
  students: number;
}

interface StudentData {
  stdbg?: string;
  [key: string]: any;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalBrigades: 0,
    recentUploads: 0,
    systemHealth: 'good'
  });
  const [loading, setLoading] = useState(true);
  const [brigadeData, setBrigadeData] = useState<BrigadeChartData[]>([]);
  const { db } = useFirebase();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch students count
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const totalStudents = studentsSnapshot.size;

      // Fetch brigades count and data
      const brigadesSnapshot = await getDocs(collection(db, 'brigades'));
      const totalBrigades = brigadesSnapshot.size;

      // Process brigade data for charts
      const brigadeStats: { [key: string]: number } = {};
      studentsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const student = doc.data() as StudentData;
        if (student.stdbg) {
          brigadeStats[student.stdbg] = (brigadeStats[student.stdbg] || 0) + 1;
        }
      });

      const chartData: BrigadeChartData[] = Object.entries(brigadeStats)
        .map(([brigade, count]) => ({ brigade, students: count }))
        .sort((a, b) => b.students - a.students)
        .slice(0, 10);

      setBrigadeData(chartData);

      setStats({
        totalStudents,
        totalBrigades,
        recentUploads: Math.floor(Math.random() * 50) + 10, // Mock data
        systemHealth: 'good'
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats(prev => ({ ...prev, systemHealth: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Total Brigades',
      value: stats.totalBrigades,
      icon: Shield,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Recent Activity',
      value: stats.recentUploads,
      icon: Activity,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'System Health',
      value: stats.systemHealth === 'good' ? 'Excellent' : 'Issues',
      icon: TrendingUp,
      color: stats.systemHealth === 'good' ? 'bg-emerald-500' : 'bg-red-500',
      bgColor: stats.systemHealth === 'good' ? 'bg-emerald-50' : 'bg-red-50',
      textColor: stats.systemHealth === 'good' ? 'text-emerald-700' : 'text-red-700'
    }
  ];

  const pieData = [
    { name: 'Active Students', value: stats.totalStudents, color: '#3B82F6' },
    { name: 'Available Brigades', value: stats.totalBrigades, color: '#10B981' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold font-montserrat text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to the Ignite Brigade Management System</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card ${stat.bgColor}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.textColor}`}>
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Brigades by Student Count</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brigadeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="brigade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="students" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/students"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Upload Students</h4>
                <p className="text-sm text-gray-600">Add student data from Excel</p>
              </div>
            </a>
            <a
              href="/admin/brigades"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Shield className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Upload Brigades</h4>
                <p className="text-sm text-gray-600">Add brigade information</p>
              </div>
            </a>
            <a
              href="/admin/data"
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Database className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Manage Data</h4>
                <p className="text-sm text-gray-600">View and delete records</p>
              </div>
            </a>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;