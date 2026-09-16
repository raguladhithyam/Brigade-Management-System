import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FirebaseProvider } from './contexts/FirebaseContext';
import HomePage from './pages/HomePage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import StudentsPage from './pages/StudentsPage';
import BrigadesPage from './pages/BrigadesPage';
import StudentUpload from './pages/StudentUpload';
import BrigadeUpload from './pages/BrigadeUpload';
import UserManagement from './pages/UserManagement';
import PopupManagement from './pages/PopupManagement';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

function AdminIndexRedirect() {
  const { currentUser } = useAuth();
  return <Navigate to={currentUser ? '/admin/dashboard' : '/admin/login'} replace />;
}

function App() {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<AdminIndexRedirect />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <ProtectedRoute>
                    <StudentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students/upload"
                element={
                  <ProtectedRoute>
                    <StudentUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/brigades"
                element={
                  <ProtectedRoute>
                    <BrigadesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/brigades/upload"
                element={
                  <ProtectedRoute>
                    <BrigadeUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/popup"
                element={
                  <ProtectedRoute>
                    <PopupManagement />
                  </ProtectedRoute>
                }
              />
              {/* Legacy paths → new locations */}
              <Route path="/admin/data" element={<Navigate to="/admin/students" replace />} />
              <Route path="/admin/add-students-brigades" element={<Navigate to="/admin/students" replace />} />
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </FirebaseProvider>
  );
}

export default App;
