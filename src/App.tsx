import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { FirebaseProvider } from './contexts/FirebaseContext';
import HomePage from './pages/HomePage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import StudentUpload from './pages/StudentUpload';
import BrigadeUpload from './pages/BrigadeUpload';
import DataManagement from './pages/DataManagement';
import ProtectedRoute from './components/ProtectedRoute';
import StudBrigManagement from './pages/StudBrigManagement';

function App() {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<HomePage />} />
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
                    <StudentUpload />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/brigades" 
                element={
                  <ProtectedRoute>
                    <BrigadeUpload />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/data" 
                element={
                  <ProtectedRoute>
                    <DataManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/add-students-brigades" 
                element={
                  <ProtectedRoute>
                    <StudBrigManagement />
                  </ProtectedRoute>
                } 
              />
            </Routes>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  fontSize: '14px',
                  fontFamily: 'Poppins, sans-serif',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </FirebaseProvider>
  );
}

export default App;