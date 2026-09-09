import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClassConfigProvider } from './context/ClassConfigContext';
import { TeacherLayout } from './components/layout/TeacherLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Students } from './pages/Students';
import { Gradebook } from './pages/Gradebook';
import { Homework } from './pages/Homework';
import { Materials } from './pages/Materials';
import { Circulars } from './pages/Circulars';
import { Leaderboard } from './pages/Leaderboard';
import { Certificates } from './pages/Certificates';
import { Profile } from './pages/Profile';
import { AiDashboard } from './pages/AiDashboard';
import { Attendance } from './pages/Attendance';

import { Register } from './pages/Register';
import { PendingApproval } from './pages/PendingApproval';
import { AdminUsers } from './pages/AdminUsers';
import { AdminClasses } from './pages/AdminClasses';
import { AdminReports } from './pages/AdminReports';
import StudentFeedback from './pages/StudentFeedback';
import { DeveloperProfile } from './components/ui/DeveloperProfile';
import { DeploymentUpdateBanner } from './components/ui/DeploymentUpdateBanner';

import { DataSync } from './pages/DataSync';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { currentUser, dbUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If we have a user but they haven't synced with DB yet, wait for it
  if (currentUser && !dbUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FA7848] mb-4"></div>
        <p className="text-[#CDD3C6]">Verifying profile...</p>
      </div>
    );
  }

  // If we have a user but they haven't synced with DB yet or are pending, show PendingApproval page
  // (unless we are just waiting for the network request to finish)
  if (dbUser && dbUser.status === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (requireAdmin && dbUser && dbUser.role !== 'admin') {
    return <Navigate to="/teacher" replace />; // Or to a 'Not Authorized' page
  }
  
  return children;
};

const RootRoute = () => {
  const { currentUser, dbUser } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;
  
  if (currentUser && !dbUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FA7848] mb-4"></div>
        <p className="text-[#CDD3C6]">Loading dashboard...</p>
      </div>
    );
  }

  if (dbUser?.status === 'pending') return <Navigate to="/pending-approval" replace />;
  if (dbUser?.role === 'admin') return <Navigate to="/admin" replace />;
  
  return <Navigate to="/teacher" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      
      {/* Teacher Routes */}
      <Route path="/teacher" element={
        <ProtectedRoute>
          <TeacherLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="gradebook" element={<Gradebook />} />
        <Route path="homework" element={<Homework />} />
        <Route path="materials" element={<Materials />} />
        <Route path="circulars" element={<Circulars />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="profile" element={<Profile />} />
        <Route path="ai" element={<AiDashboard />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="developer-profile" element={<DeveloperProfile />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="classes" element={<AdminClasses />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="profile" element={<Profile />} />
        <Route path="students" element={<Students />} />
        <Route path="gradebook" element={<Gradebook />} />
        <Route path="homework" element={<Homework />} />
        <Route path="materials" element={<Materials />} />
        <Route path="circulars" element={<Circulars />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="data-sync" element={<DataSync />} />
        <Route path="ai" element={<AiDashboard />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="feedback" element={<StudentFeedback />} />
        <Route path="developer-profile" element={<DeveloperProfile />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ClassConfigProvider>
        <DeploymentUpdateBanner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ClassConfigProvider>
    </AuthProvider>
  );
}

export default App;
