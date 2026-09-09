import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Marks from './pages/Marks';
import Homework from './pages/Homework';
import Attendance from './pages/Attendance';
import Materials from './pages/Materials';
import Feedback from './pages/Feedback';
import StudentLayout from './components/layout/StudentLayout';
import { DeveloperProfile } from './components/ui/DeveloperProfile';
import { DeploymentUpdateBanner } from './components/ui/DeploymentUpdateBanner';
import { appState } from './lib/appState';
import axios from 'axios';

axios.interceptors.request.use(config => {
  if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    appState.incrementMutation();
  }
  return config;
});

axios.interceptors.response.use(
  response => {
    if (response.config.method && ['post', 'put', 'patch', 'delete'].includes(response.config.method.toLowerCase())) {
      appState.decrementMutation();
    }
    return response;
  },
  error => {
    if (error.config && error.config.method && ['post', 'put', 'patch', 'delete'].includes(error.config.method.toLowerCase())) {
      appState.decrementMutation();
    }
    return Promise.reject(error);
  }
);

function App() {
  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('studentToken');
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <DeploymentUpdateBanner />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          element={
            <ProtectedRoute>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/marks" element={<Marks />} />
          <Route path="/homework" element={<Homework />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/developer-profile" element={<DeveloperProfile />} />
        </Route>
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
