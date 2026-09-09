import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, 
  User, 
  Award, 
  LogOut, 
  Menu, 
  X, 
  BookOpen,
  Bell,
  Megaphone,
  Calendar,
  Download,
  CalendarCheck,
  Link as LinkIcon,
  MessageSquare,
  ChevronDown,
  UserPlus,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Code
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useMobileSidebar } from '../../hooks/useMobileSidebar';

export default function StudentLayout() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isSidebarOpen, setIsSidebarOpen, closeSidebarSafely } = useMobileSidebar(false, 1024);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [circularIds, setCircularIds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  
  // Multi-Account State
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [addIdentifier, setAddIdentifier] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  
  const dropdownRef = useRef(null);
  const { isInstallable, installApp } = usePWAInstall();

  useEffect(() => {
    const fetchStudentData = async () => {
      const token = localStorage.getItem('studentToken');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.linkedAccounts) {
          setLinkedAccounts(payload.linkedAccounts);
        }
      } catch (e) {
        console.error('Failed to parse token payload:', e);
      }

      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${baseURL}/student-portal/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudent(response.data);
      } catch (error) {
        console.error('Error fetching student data:', error);
        localStorage.removeItem('studentToken');
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [navigate]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('studentToken');
      if (!token) return;
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const [circRes, hwRes] = await Promise.all([
          axios.get(`${baseURL}/student-portal/circulars`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${baseURL}/student-portal/homework`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const circulars = (circRes.data.data || []).map(c => ({
          ...c,
          notificationType: 'circular',
          dateField: new Date(c.createdAt || Date.now())
        }));

        const homework = (hwRes.data.data || []).map(h => ({
          ...h,
          notificationType: 'homework',
          dateField: new Date(h.createdAt || Date.now())
        }));

        const combined = [...circulars, ...homework].sort((a, b) => b.dateField - a.dateField);
        setNotifications(combined);
        
        const ids = combined.map(c => c._id);
        setCircularIds(ids);
        
        const readIds = JSON.parse(localStorage.getItem('studentReadCirculars') || '[]');
        const unread = combined.filter(c => !readIds.includes(c._id));
        setUnreadCount(unread.length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  // Handle outside click for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const handleNotificationClick = () => {
    localStorage.setItem('studentReadCirculars', JSON.stringify(circularIds));
    setUnreadCount(0);
    setIsNotificationPanelOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    navigate('/login', { replace: true });
  };

  const switchAccount = async (targetStudentId) => {
    if (targetStudentId === student._id) {
      setIsProfileDropdownOpen(false);
      return;
    }
    
    setIsSwitching(true);
    setIsProfileDropdownOpen(false);
    try {
      const token = localStorage.getItem('studentToken');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${baseURL}/student-portal/accounts/switch`, {
        targetStudentId
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.data.token) {
        localStorage.setItem('studentToken', response.data.token);
        window.location.reload(); // Reload context for new student
      }
    } catch (error) {
      console.error('Error switching account:', error);
      alert(error.response?.data?.message || 'Error switching account');
      setIsSwitching(false);
    }
  };

  const removeAccount = async (targetStudentId, e) => {
    e.stopPropagation(); // prevent triggering switch
    if (!window.confirm('Remove this linked account from your current session?')) return;
    
    setIsSwitching(true);
    try {
      const token = localStorage.getItem('studentToken');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${baseURL}/student-portal/accounts/remove`, {
        targetStudentId
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.data.requireLogout) {
        handleLogout();
      } else if (response.data.token) {
        localStorage.setItem('studentToken', response.data.token);
        window.location.reload(); 
      }
    } catch (error) {
      console.error('Error removing account:', error);
      alert(error.response?.data?.message || 'Error removing account');
      setIsSwitching(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setAddError('');
    setIsAdding(true);

    try {
      const token = localStorage.getItem('studentToken');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${baseURL}/student-portal/accounts/add`, {
        identifier: addIdentifier,
        password: addPassword
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.data.token) {
        localStorage.setItem('studentToken', response.data.token);
        setIsAddAccountModalOpen(false);
        setAddIdentifier('');
        setAddPassword('');
        window.location.reload(); 
      }
    } catch (error) {
      console.error('Error adding account:', error);
      setAddError(error.response?.data?.message || 'Failed to add student account');
    } finally {
      setIsAdding(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Homework', path: '/homework', icon: BookOpen },
    { name: 'Materials', path: '/materials', icon: LinkIcon },
    { name: 'Marks', path: '/marks', icon: Award },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Feedback', path: '/feedback', icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-gray-50/50 flex font-sans overflow-hidden">
      {/* Loading Overlay when switching */}
      {isSwitching && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-lg font-bold text-gray-900">Switching Student Profile...</p>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => closeSidebarSafely()}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-[100dvh] w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-white">
            <img src="/student rise.png" alt="Student Rise Logo" className="w-8 h-8 mr-2 object-contain" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Student Rise
            </span>
            <button 
              onClick={() => closeSidebarSafely()}
              className="ml-auto lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={(e) => {
                    if (window.innerWidth < 1024) {
                      e.preventDefault();
                      closeSidebarSafely(() => navigate(item.path, { replace: true }));
                    }
                  }}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                  {item.name}
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100 space-y-2">
            {isInstallable && (
              <button
                onClick={installApp}
                className="flex items-center w-full px-4 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors group shadow-sm"
              >
                <Download className="w-5 h-5 mr-3 flex-shrink-0" />
                Install App
              </button>
            )}
            <button
              onClick={() => closeSidebarSafely(handleLogout)}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group"
            >
              <LogOut className="w-5 h-5 mr-3 flex-shrink-0 opacity-80 group-hover:opacity-100" />
              Logout
            </button>
            <NavLink
              to="/developer-profile"
              onClick={(e) => {
                if (window.innerWidth < 1024) {
                  e.preventDefault();
                  closeSidebarSafely(() => navigate('/developer-profile', { replace: true }));
                }
              }}
              className={({ isActive }) =>
                `flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                }`
              }
            >
              <Code className="w-5 h-5 mr-3 flex-shrink-0 opacity-80 group-hover:opacity-100" />
              Developer Profile
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        {/* Top Header */}
        <header className="relative z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-700 lg:hidden rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 lg:hidden">Student Rise</h1>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {isInstallable && (
              <button 
                onClick={installApp}
                className="lg:hidden p-1.5 px-3 text-xs font-bold bg-indigo-600 text-white rounded-lg shadow-sm flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
            )}
            <button 
              onClick={handleNotificationClick}
              className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>
            
            {/* Multi-Account Profile Dropdown */}
            <div className="relative z-50" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 p-1 pr-2 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-900">{student.name}</span>
                  <span className="text-xs font-medium text-gray-500">Std {student.standard} - {student.section}</span>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-indigo-100 overflow-hidden bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-indigo-300" />
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Switch Student</p>
                      
                      <div className="space-y-1">
                        {linkedAccounts.length > 0 ? (
                          linkedAccounts.map(acc => (
                            <button
                              key={acc.studentId}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                switchAccount(acc.studentId);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left ${
                                acc.studentId === student._id 
                                  ? 'bg-indigo-50 text-indigo-700' 
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="font-bold text-sm truncate">{acc.name}</p>
                                <p className="text-xs opacity-80 truncate">Std {acc.standard} - {acc.section} • {acc.emisNumber}</p>
                              </div>
                              {acc.studentId === student._id ? (
                                <Check className="w-5 h-5 shrink-0 text-indigo-600" />
                              ) : (
                                <span 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeAccount(acc.studentId, e);
                                  }}
                                  className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                  title="Remove account from session"
                                >
                                  <X className="w-4 h-4" />
                                </span>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                            <p className="font-bold text-sm truncate">{student.name}</p>
                            <p className="text-xs opacity-80 truncate">Std {student.standard} - {student.section}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsProfileDropdownOpen(false);
                          setIsAddAccountModalOpen(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add Student Account
                      </button>
                      
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsProfileDropdownOpen(false);
                          navigate('/developer-profile');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Code className="w-4 h-4" />
                        Developer Profile
                      </button>
                      
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar relative z-0">
          <Outlet context={{ student }} />
        </main>
      </div>

      {/* Notification Panel Overlay */}
      {isNotificationPanelOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[60]"
          onClick={() => setIsNotificationPanelOpen(false)}
        />
      )}

      {/* Notification Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-white shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col ${
        isNotificationPanelOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            Notifications
          </h2>
          <button 
            onClick={() => setIsNotificationPanelOpen(false)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No new notifications</p>
            </div>
          ) : (
            notifications.map(n => (
              <div 
                key={n._id} 
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-indigo-200"
                onClick={() => {
                  setIsNotificationPanelOpen(false);
                  navigate(n.notificationType === 'circular' ? '/dashboard' : '/homework');
                }}
              >
                {n.notificationType === 'circular' ? (
                  <div className="flex gap-3">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0 h-fit">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{n.title}</h4>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{n.description}</p>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        {n.postedBy || 'Admin'} • {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 h-fit">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                          {n.subject}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm">{n.title}</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{n.description}</p>
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-red-500 uppercase tracking-wider">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(n.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" 
            onClick={() => !isAdding && setIsAddAccountModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Account</h2>
              <p className="text-sm text-gray-500 mb-6">Link another student profile to your current session.</p>
              
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Login ID</label>
                  <input 
                    type="text" 
                    required
                    disabled={isAdding}
                    placeholder="EMIS / Mobile Number"
                    value={addIdentifier}
                    onChange={(e) => setAddIdentifier(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input 
                      type={showAddPassword ? "text" : "password"}
                      required
                      disabled={isAdding}
                      placeholder="DDMMYYYY (DOB)"
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all disabled:opacity-50 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showAddPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {addError && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">
                    {addError}
                  </div>
                )}
                
                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddAccountModalOpen(false)}
                    disabled={isAdding}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isAdding ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      'Add Account'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
