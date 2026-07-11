import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Shield, UserCog, BarChart3, ArrowRight, Layers } from 'lucide-react';
import { collection, getCountFromServer, getDocs, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface BrigadeChartData {
  brigade: string;
  students: number;
}

interface StudentData {
  stdbg?: string;
  [key: string]: any;
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalBrigades, setTotalBrigades] = useState(0);
  const [brigadeData, setBrigadeData] = useState<BrigadeChartData[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [studentCount, brigadeCount] = await Promise.all([
        getCountFromServer(collection(db, 'students')),
        getCountFromServer(collection(db, 'brigades')),
      ]);
      setTotalStudents(studentCount.data().count);
      setTotalBrigades(brigadeCount.data().count);

      // Distribution chart still needs per-student brigade data.
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const brigadeStats: Record<string, number> = {};
      studentsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const student = doc.data() as StudentData;
        if (student.stdbg) brigadeStats[student.stdbg] = (brigadeStats[student.stdbg] || 0) + 1;
      });

      const chartData = Object.entries(brigadeStats)
        .map(([brigade, count]) => ({ brigade, students: count }))
        .sort((a, b) => b.students - a.students)
        .slice(0, 10);
      setBrigadeData(chartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const avgPerBrigade = totalBrigades > 0 ? Math.round(totalStudents / totalBrigades) : 0;

  const statCards = [
    { title: 'Total Students', value: totalStudents, icon: Users, tone: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Total Brigades', value: totalBrigades, icon: Shield, tone: 'text-success', bg: 'bg-success/10' },
    { title: 'Avg / Brigade', value: avgPerBrigade, icon: Layers, tone: 'text-violet-600', bg: 'bg-violet-100' },
    {
      title: 'Assigned Brigades',
      value: brigadeData.length,
      icon: BarChart3,
      tone: 'text-amber-600',
      bg: 'bg-amber-100',
    },
  ];

  const pieData = [
    { name: 'Students', value: totalStudents, color: '#2563eb' },
    { name: 'Brigades', value: totalBrigades, color: '#16a34a' },
  ];

  const quickActions = [
    { to: '/admin/students', icon: Users, title: 'Manage Students', desc: 'View, add, edit & upload', bg: 'bg-primary/10', tone: 'text-primary' },
    { to: '/admin/brigades', icon: Shield, title: 'Manage Brigades', desc: 'View, add, edit & upload', bg: 'bg-success/10', tone: 'text-success' },
    { to: '/admin/users', icon: UserCog, title: 'User Management', desc: 'Admin accounts & access', bg: 'bg-violet-100', tone: 'text-violet-600' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" text="Loading dashboard…" className="text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of the Ignite Brigade Management System</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <Card>
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg}`}>
                      <Icon className={`h-6 w-6 ${stat.tone}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Brigades by Student Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {brigadeData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No student assignments yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={brigadeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="brigade" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                        cursor={{ fill: 'rgba(37,99,235,0.06)' }}
                      />
                      <Bar dataKey="students" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex justify-center gap-6">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.bg}`}>
                      <Icon className={`h-6 w-6 ${action.tone}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">{action.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
