import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, ArrowRight, Loader2, User, Users, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [dob, setDob] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresSelection, setRequiresSelection] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem('studentToken');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  React.useEffect(() => {
    if (import.meta.env.VITE_APP_MODE === 'demo') {
      setIdentifier('DEMO001');
      setDob('15052012');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!identifier) {
      setError('Please enter your EMIS Number or Mobile Number');
      return;
    }

    setLoading(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${baseURL}/student-portal/login`, {
        identifier
      });
      
      if (response.data.requiresSelection) {
        setStudentsList(response.data.students);
        setRequiresSelection(true);
      } else if (response.data.requiresPassword) {
        setRequiresPassword(true);
        setSelectedStudentId(response.data.studentId);
        setSelectedStudentName(response.data.studentName);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your number.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudentId(student._id);
    setSelectedStudentName(student.name);
    setRequiresSelection(false);
    setRequiresPassword(true);
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!dob) {
      setError('Please enter your Date of Birth');
      return;
    }

    if (!dob || dob.length !== 8 || !/^\d+$/.test(dob)) {
      setError('Password must be exactly 8 digits.');
      return;
    }

    setLoading(true);
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      const response = await axios.post(`${baseURL}/student-portal/login-verify`, {
        studentId: selectedStudentId,
        password: dob
      });
      
      if (response.data.token) {
        localStorage.setItem('studentToken', response.data.token);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform origin-left transition-transform duration-500 scale-x-0 group-hover:scale-x-100"></div>
          
          {requiresSelection ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2 mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-inner">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Select Student</h2>
                <p className="text-gray-500 text-sm">Multiple students found for {identifier}</p>
              </div>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {studentsList.map((student) => (
                  <button
                    key={student._id}
                    onClick={() => handleStudentSelect(student)}
                    disabled={loading}
                    className="w-full flex items-center p-4 bg-white/60 hover:bg-white/90 border border-gray-100 hover:border-indigo-200 rounded-xl transition-all group text-left shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mr-4 group-hover:bg-indigo-100 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{student.name}</h3>
                      <p className="text-xs text-gray-500">Class {student.standard} - {student.section} | EMIS: {student.emisNumber}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => {
                  setRequiresSelection(false);
                  setStudentsList([]);
                  setError('');
                }}
                disabled={loading}
                className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back to Login
              </button>
            </div>
          ) : requiresPassword ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2 mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Enter Password</h2>
                <p className="text-gray-500 text-sm">Welcome, <span className="font-semibold text-indigo-700">{selectedStudentName}</span>. Please verify your identity.</p>
              </div>
              
              <form onSubmit={handleVerifyPassword} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="dob" className="text-sm font-medium text-gray-700 block">
                    Enter Password
                  </label>
                  <div className="relative">
                    <input
                      id="dob"
                      type={showPassword ? 'text' : 'password'}
                      value={dob}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                        setDob(val);
                      }}
                      inputMode="numeric"
                      maxLength={8}
                      minLength={8}
                      placeholder="e.g., 15082010"
                      className="w-full px-4 py-3 pr-12 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none placeholder:text-gray-400"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors p-1"
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {error && (
                    <p className="text-red-500 text-sm mt-2 animate-bounce">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </form>

              <button
                onClick={() => {
                  setRequiresPassword(false);
                  setSelectedStudentId(null);
                  setSelectedStudentName('');
                  setDob('');
                  setError('');
                }}
                disabled={loading}
                className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back
              </button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-24 h-24 mb-2">
                  <img src="/student rise.png" alt="Student Rise Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Student Login</h1>
                <p className="text-gray-500 text-sm">Sign in to view your academic progress</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="identifier" className="text-sm font-medium text-gray-700 block">
                    Phone Number or EMIS Number
                  </label>
                  <div className="relative">
                    <input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter Phone Number or EMIS Number"
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none placeholder:text-gray-400"
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <p className="text-red-500 text-sm mt-2 animate-bounce">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
          
          <div className="text-center text-xs text-gray-400 mt-6">
            EduPulse © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
